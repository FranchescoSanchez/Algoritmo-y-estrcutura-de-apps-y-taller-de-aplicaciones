import { supabase } from "./supabase.js";

export async function listarNombresSemanas() {
    const { data, error } = await supabase.from("nombres_semanas").select("curso, unidad, semana, nombre");
    if (error) throw error;
    return data || [];
}

export async function guardarNombreSemana({ curso, unidad, semana, nombre }) {
    const { error } = await supabase.from("nombres_semanas").upsert(
        { curso, unidad, semana, nombre: nombre.trim(), actualizado_en: new Date().toISOString() },
        { onConflict: "curso,unidad,semana" }
    );
    if (error) throw error;
}
