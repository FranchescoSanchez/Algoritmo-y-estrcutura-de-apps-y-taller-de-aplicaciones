/* ==========================================================
   CONFIGURACION DEL PORTAFOLIO
   Es el UNICO archivo que tienes que editar.
   ========================================================== */

/* 1) Tu proyecto Supabase.
   Los copias de: Supabase -> Project Settings -> API Keys
   (URL del proyecto + clave "publishable", o la "anon" en proyectos antiguos).

   ⚠️ NUNCA pongas aqui la clave "secret" (sb_secret_...) ni la "service_role":
   este archivo es publico y esas claves se saltan toda la seguridad.
   La clave publishable/anon SI puede ser publica: la seguridad la dan las
   politicas del archivo supabase.sql. */
export const SUPABASE_URL = "sb_publishable_PnSffM3RcyvrJMtxlqUqmA_ejf-FU0K";
export const SUPABASE_KEY = "sb_secret_XU6HFxWeTt9q2kMWNA628w_Fa1C34k8";

/* Nombre del bucket de Storage (lo crea supabase.sql). */
export const BUCKET = "portafolio-archivos";

/* 2) Tu perfil publico (se ve en la barra de todas las paginas). */
export const PERFIL = {
    nombre: "Franchesco Marchelo Sanchez Zuñiga",
    foto: "img/perfil.jpg",            // reemplaza img/perfil.jpg por tu foto
    presentacion: "Estudiante de Ingeniería de Sistemas y Computación — III Ciclo"
};

/* 3) Cursos del portafolio (cada uno con 4 unidades x 4 semanas). */
export const CURSOS = [
    { slug: "taller-aplicaciones-1", nombre: "Taller de Aplicaciones 1" },
    { slug: "algoritmos-estructura-datos", nombre: "Algoritmo y Estructura de Datos" }
];
export const UNIDADES = 4;
export const SEMANAS_POR_UNIDAD = 4;

/* 4) Tamano maximo por archivo. Debe coincidir con file_size_limit de
   supabase.sql (25 MB). El plan gratis de Supabase permite hasta 50 MB. */
export const MAX_MB = 25;
