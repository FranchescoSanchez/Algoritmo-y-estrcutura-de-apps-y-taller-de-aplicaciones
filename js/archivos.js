/* ==========================================================
   Tareas y archivos en Supabase.

   tabla   public.tareas   -> datos de cada tarea (curso, unidad, semana, ruta...)
   bucket  portafolio-archivos (Storage, publico) -> el archivo en si
   ========================================================== */
import { supabase } from "./supabase.js";
import { BUCKET, MAX_MB } from "./config.js";

const COLUMNAS = "id, curso, unidad, semana, titulo, nombre_original, tipo_mime, tamano, ruta, fecha_subida, tipo_recurso, recurso_url, orden";

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
        fechaSubida: f.fecha_subida,
        tipoRecurso: f.tipo_recurso || "archivo",
        recursoUrl: f.recurso_url || "",
        orden: Number(f.orden) || 0
    };
}

function datosDe({ data, error }) {
    if (error) throw error;
    return data;
}

/** Criterio único de orden para la página pública y el administrador. */
export function compararOrdenTareas(a, b) {
    const ordenA = Number(a.orden) || 0;
    const ordenB = Number(b.orden) || 0;
    if (ordenA > 0 && ordenB > 0 && ordenA !== ordenB) return ordenA - ordenB;
    if (ordenA > 0 && ordenB === 0) return -1;
    if (ordenA === 0 && ordenB > 0) return 1;

    // Si todavía no se ha usado el movimiento manual, conserva el orden público:
    // primero los recursos subidos más recientemente.
    const fecha = String(b.fechaSubida || "").localeCompare(String(a.fechaSubida || ""));
    if (fecha) return fecha;
    return String(a.titulo || a.nombreOriginal || "").localeCompare(
        String(b.titulo || b.nombreOriginal || ""), "es",
        { numeric: true, sensitivity: "base" }
    );
}

export async function listarPorCurso(slug) {
    const filas = datosDe(await supabase.from("tareas").select(COLUMNAS)
        .eq("curso", slug)
        .order("unidad").order("semana").order("fecha_subida", { ascending: false }));
    return filas.map(aTarea).sort((a, b) => {
        if (Number(a.unidad) !== Number(b.unidad)) return Number(a.unidad) - Number(b.unidad);
        if (Number(a.semana) !== Number(b.semana)) return Number(a.semana) - Number(b.semana);
        return compararOrdenTareas(a, b);
    });
}

export async function listarTodas() {
    const filas = datosDe(await supabase.from("tareas").select(COLUMNAS)
        .order("curso", { ascending: true })
        .order("unidad", { ascending: true })
        .order("semana", { ascending: true }));
    return filas.map(aTarea).sort((a, b) => {
        const curso = String(a.curso || "").localeCompare(String(b.curso || ""));
        if (curso) return curso;
        if (Number(a.unidad) !== Number(b.unidad)) return Number(a.unidad) - Number(b.unidad);
        if (Number(a.semana) !== Number(b.semana)) return Number(a.semana) - Number(b.semana);
        return compararOrdenTareas(a, b);
    });
}

/** Sube el archivo a Storage y despues registra la tarea en la tabla. */
export async function subirArchivo(archivo, datos) {
    if (archivo.size > MAX_MB * 1024 * 1024) {
        throw new Error(`"${archivo.name}" pesa más de ${MAX_MB} MB.`);
    }
    if (archivo.size === 0) {
        throw new Error(`"${archivo.name}" está vacío.`);
    }
    const ext = (archivo.name.match(/\.([A-Za-z0-9]{1,8})$/) || [])[1];
    const ruta = `${datos.curso}/unidad-${datos.unidad}/semana-${datos.semana}/`
        + crypto.randomUUID() + (ext ? "." + ext.toLowerCase() : "");
    const subida = await supabase.storage.from(BUCKET).upload(ruta, archivo, {
        contentType: archivo.type || "application/octet-stream", upsert: false
    });
    if (subida.error) throw subida.error;
    const { data, error } = await supabase.from("tareas").insert({
        curso: datos.curso, unidad: datos.unidad, semana: datos.semana,
        titulo: datos.titulo || archivo.name, nombre_original: archivo.name,
        tipo_mime: archivo.type || "application/octet-stream", tamano: archivo.size, ruta
    }).select("id").single();
    if (error) {
        await supabase.storage.from(BUCKET).remove([ruta]);
        throw error;
    }
    return data.id;
}

/** Registra un enlace externo como una tarea, sin subir archivos a Storage. */
export async function guardarEnlace(datos) {
    let url;
    try { url = new URL(String(datos.url || "").trim()); }
    catch (_) { throw new Error("Escribe un enlace válido que comience con https:// o http://."); }
    if (!["https:", "http:"].includes(url.protocol)) {
        throw new Error("Solo se permiten enlaces http:// o https://.");
    }
    const { data, error } = await supabase.from("tareas").insert({
        curso: datos.curso, unidad: datos.unidad, semana: datos.semana,
        titulo: datos.titulo || url.hostname, nombre_original: url.hostname,
        tipo_mime: "text/uri-list", tamano: 0, ruta: "",
        tipo_recurso: "enlace", recurso_url: url.href
    }).select("id").single();
    if (error) throw error;
    return data.id;
}

/** Guarda el orden manual de los recursos de una misma semana. */
export async function actualizarOrdenTareas(tareas) {
    for (let i = 0; i < tareas.length; i++) {
        const { data, error } = await supabase.from("tareas")
            .update({ orden: (i + 1) * 10 })
            .eq("id", tareas[i].id)
            .select("id");
        if (error) throw error;
        if (!data || data.length === 0) {
            const sinPermiso = new Error("No tienes permiso para cambiar el orden de esta tarea.");
            sinPermiso.code = "42501";
            throw sinPermiso;
        }
    }
}

/** Actualiza solo el título visible de una tarea; conserva el archivo y su ruta. */
export async function actualizarTituloTarea(id, titulo) {
    const { data, error } = await supabase.from("tareas")
        .update({ titulo: titulo.trim() })
        .eq("id", id)
        .select("id, titulo");
    if (error) throw error;
    if (!data || data.length === 0) {
        const sinPermiso = new Error("row-level security: no se actualizó ninguna fila");
        sinPermiso.code = "42501";
        throw sinPermiso;
    }
    return data[0];
}

/** Borra la tarea (desaparece del portafolio) y despues su archivo. */
export async function eliminarTarea(tarea) {
    const { data, error } = await supabase.from("tareas").delete().eq("id", tarea.id).select("id");
    if (error) throw error;
    if (!data || data.length === 0) {
        const sinPermiso = new Error("row-level security: no se borró ninguna fila");
        sinPermiso.code = "42501";
        throw sinPermiso;
    }
    if (tarea.ruta) {
        const r = await supabase.storage.from(BUCKET).remove([tarea.ruta]);
        if (r.error) console.warn("La tarea se borró, pero no su archivo:", r.error.message);
    }
}

/** Enlace para ver el archivo en el navegador (el bucket es publico). */
export function urlDeVista(tarea) {
    if (tarea.tipoRecurso === "enlace") return tarea.recursoUrl;
    return supabase.storage.from(BUCKET).getPublicUrl(tarea.ruta).data.publicUrl;
}

/** Enlace que fuerza la descarga con el nombre original. */
export function urlDeDescarga(tarea) {
    if (tarea.tipoRecurso === "enlace") return tarea.recursoUrl;
    return supabase.storage.from(BUCKET).getPublicUrl(tarea.ruta, { download: tarea.nombreOriginal }).data.publicUrl;
}
