/* ==========================================================
   Tareas y archivos en Supabase.

   tabla   public.tareas   -> datos de cada tarea (curso, unidad, semana, ruta...)
   bucket  portafolio-archivos (Storage, publico) -> el archivo en si
   ========================================================== */
import { supabase } from "./supabase.js";
import { BUCKET, MAX_MB } from "./config.js";

const COLUMNAS = "id, curso, unidad, semana, titulo, nombre_original, tipo_mime, tamano, ruta, fecha_subida";

function aTarea(f) {
    return {
        id: f.id,
        curso: f.curso,
        unidad: f.unidad,
        semana: f.semana,
        titulo: f.titulo,
        nombreOriginal: f.nombre_original,
        tipoMime: f.tipo_mime,
        tamano: f.tamano,
        ruta: f.ruta,
        fechaSubida: f.fecha_subida
    };
}

function datosDe({ data, error }) {
    if (error) throw error;
    return data;
}

export async function listarPorCurso(slug) {
    const filas = datosDe(await supabase.from("tareas").select(COLUMNAS)
        .eq("curso", slug)
        .order("unidad").order("semana").order("fecha_subida", { ascending: false }));
    return filas.map(aTarea);
}

export async function listarTodas() {
    const filas = datosDe(await supabase.from("tareas").select(COLUMNAS)
        .order("curso").order("unidad").order("semana").order("fecha_subida", { ascending: false }));
    return filas.map(aTarea);
}

/** Sube el archivo a Storage y despues registra la tarea en la tabla. */
export async function subirArchivo(archivo, datos) {
    if (archivo.size > MAX_MB * 1024 * 1024) {
        throw new Error(`"${archivo.name}" pesa más de ${MAX_MB} MB.`);
    }
    if (archivo.size === 0) {
        throw new Error(`"${archivo.name}" está vacío.`);
    }

    // Ruta segura (sin tildes ni espacios); el nombre real se guarda en la tabla.
    const ext = (archivo.name.match(/\.([A-Za-z0-9]{1,8})$/) || [])[1];
    const ruta = `${datos.curso}/unidad-${datos.unidad}/semana-${datos.semana}/`
        + crypto.randomUUID() + (ext ? "." + ext.toLowerCase() : "");

    const subida = await supabase.storage.from(BUCKET).upload(ruta, archivo, {
        contentType: archivo.type || "application/octet-stream",
        upsert: false
    });
    if (subida.error) throw subida.error;

    const { data, error } = await supabase.from("tareas").insert({
        curso: datos.curso,
        unidad: datos.unidad,
        semana: datos.semana,
        titulo: datos.titulo || archivo.name,
        nombre_original: archivo.name,
        tipo_mime: archivo.type || "application/octet-stream",
        tamano: archivo.size,
        ruta
    }).select("id").single();

    if (error) {
        await supabase.storage.from(BUCKET).remove([ruta]);   // no dejar archivos huerfanos
        throw error;
    }
    return data.id;
}

/** Borra la tarea (desaparece del portafolio) y despues su archivo. */
export async function eliminarTarea(tarea) {
    const { data, error } = await supabase.from("tareas").delete().eq("id", tarea.id).select("id");
    if (error) throw error;
    if (!data || data.length === 0) {
        // Con RLS, un borrado sin permiso no da error: simplemente no borra nada.
        const sinPermiso = new Error("row-level security: no se borró ninguna fila");
        sinPermiso.code = "42501";
        throw sinPermiso;
    }
    const r = await supabase.storage.from(BUCKET).remove([tarea.ruta]);
    if (r.error) console.warn("La tarea se borró, pero no su archivo:", r.error.message);
}

/** Enlace para ver el archivo en el navegador (el bucket es publico). */
export function urlDeVista(tarea) {
    return supabase.storage.from(BUCKET).getPublicUrl(tarea.ruta).data.publicUrl;
}

/** Enlace que fuerza la descarga con el nombre original. */
export function urlDeDescarga(tarea) {
    return supabase.storage.from(BUCKET).getPublicUrl(tarea.ruta, { download: tarea.nombreOriginal }).data.publicUrl;
}
