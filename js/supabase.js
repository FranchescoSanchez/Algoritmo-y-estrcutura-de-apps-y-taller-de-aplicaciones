/* Conexion con Supabase (Authentication + base de datos + Storage). */
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_KEY } from "./config.js";

/** true si la clave pegada es la SECRETA (sb_secret_... o un JWT con role service_role). */
function esClaveSecreta(clave) {
    if (clave.startsWith("sb_secret_")) return true;
    try {
        const carga = clave.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        return JSON.parse(atob(carga)).role === "service_role";
    } catch (e) {
        return false;
    }
}

export const claveSecreta = esClaveSecreta(SUPABASE_KEY);

/** true cuando ya pegaste tus datos reales en config.js (y no la clave secreta). */
export const supabaseListo = !claveSecreta
    && SUPABASE_URL.startsWith("https://") && !SUPABASE_URL.includes("PEGA_AQUI")
    && !SUPABASE_KEY.includes("PEGA_AQUI") && SUPABASE_KEY.length > 10;

export const supabase = supabaseListo ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

/** Aviso (HTML) para cuando falta configurar la conexion. */
export function avisoConfiguracion() {
    if (claveSecreta) {
        return '<div class="aviso aviso-error"><strong>Pusiste la clave SECRETA de Supabase en js/config.js.</strong> '
            + 'Bórrala de ahí y cámbiala por la clave <em>publishable</em> (o <em>anon</em>). '
            + 'Como ya quedó escrita en un archivo, resetéala en Supabase (Project Settings → API Keys).</div>';
    }
    return '<div class="aviso aviso-error"><strong>Falta conectar Supabase.</strong> '
        + 'Pega la URL y la clave publishable de tu proyecto en <code>js/config.js</code> (README, paso 4).</div>';
}

/**
 * Llama a `callback(usuario)` con el usuario actual (o null) al cargar la pagina
 * y cada vez que se inicia o cierra sesion.
 */
export function alCambiarSesion(callback) {
    if (!supabase) {
        callback(null);
        return;
    }
    supabase.auth.getSession().then(({ data }) => callback(data.session ? data.session.user : null));
    supabase.auth.onAuthStateChange((evento, sesion) => {
        if (evento === "INITIAL_SESSION") return;   // ya lo cubre getSession()
        // setTimeout evita bloqueos al usar Supabase dentro de este callback
        setTimeout(() => callback(sesion ? sesion.user : null), 0);
    });
}

export async function iniciarSesion(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
}

export async function cerrarSesion() {
    await supabase.auth.signOut();
}

/** Mensaje entendible para los errores mas comunes. */
export function explicarError(e) {
    const mensaje = String((e && e.message) || "");
    const codigo = String((e && (e.code || e.error_code)) || "");

    if (codigo === "invalid_credentials" || /invalid login credentials/i.test(mensaje)) {
        return "El correo o la contraseña no coinciden.";
    }
    if (/email not confirmed/i.test(mensaje)) {
        return "Ese correo aún no está confirmado. Confírmalo en Supabase (Authentication → Users).";
    }
    if (codigo === "over_request_rate_limit" || /rate limit/i.test(mensaje)) {
        return "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.";
    }
    if (codigo === "42501" || /row-level security|not authorized|unauthorized/i.test(mensaje)) {
        return "Esta cuenta no tiene permiso para subir o borrar. Usa la cuenta del dueño del portafolio "
            + "y revisa que su UID esté en supabase.sql.";
    }
    if (/maximum allowed size|payload too large|too large/i.test(mensaje)) {
        return "El archivo supera el tamaño máximo permitido.";
    }
    if (/failed to fetch|networkerror|load failed/i.test(mensaje)) {
        return "No hay conexión con Supabase. Revisa tu internet (o si el proyecto gratis está pausado, reactívalo en supabase.com).";
    }
    return mensaje || "Ocurrió un error inesperado.";
}
