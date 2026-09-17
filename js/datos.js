/* ==========================================================
   Mi Portafolio UPLA - version estatica (GitHub Pages)
   Reemplaza el backend Java: usa localStorage del navegador
   para guardar usuarios, sesion y tareas.
   ========================================================== */

const CATALOGO_CURSOS = [
    { slug: "taller-aplicaciones-1", nombre: "Taller de Aplicaciones 1" },
    { slug: "algoritmos-estructura-datos", nombre: "Algoritmo y Estructura de Datos" }
];

const UNIDADES = 4;
const SEMANAS_POR_UNIDAD = 4;

const DB = {
    USUARIOS: "mp_usuarios",
    SESION: "mp_sesion",
    ARCHIVOS: "mp_archivos"
};

/* ---------- utilidades de almacenamiento ---------- */

function leer(clave, porDefecto) {
    try {
        const valor = localStorage.getItem(clave);
        return valor ? JSON.parse(valor) : porDefecto;
    } catch (e) {
        return porDefecto;
    }
}

function guardar(clave, valor) {
    localStorage.setItem(clave, JSON.stringify(valor));
}

function nombreCurso(slug) {
    const curso = CATALOGO_CURSOS.find((c) => c.slug === slug);
    return curso ? curso.nombre : slug;
}

/* ---------- usuarios y sesion ---------- */

function obtenerUsuarios() {
    return leer(DB.USUARIOS, []);
}

function obtenerSesion() {
    return leer(DB.SESION, null);
}

function iniciarSesion(usuario) {
    guardar(DB.SESION, { id: usuario.id, nombre: usuario.nombre, email: usuario.email });
}

function cerrarSesion() {
    localStorage.removeItem(DB.SESION);
}

/* ---------- archivos ---------- */

function obtenerArchivos() {
    return leer(DB.ARCHIVOS, []);
}

function guardarArchivos(lista) {
    guardar(DB.ARCHIVOS, lista);
}

function pesoLegible(bytes) {
    if (!bytes) return "0 KB";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return Math.round(bytes / 1024) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
}

function escapar(texto) {
    const div = document.createElement("div");
    div.textContent = texto == null ? "" : texto;
    return div.innerHTML;
}

/* ---------- barra de navegacion comun ---------- */

function pintarBarra() {
    const usuario = obtenerSesion();
    const marcaTexto = `
        <span class="marca-texto">
            <span class="marca-titulo">Mi Portafolio</span>
            <span class="marca-sub">Universidad Peruana Los Andes</span>
        </span>`;

    let nav = `<a href="index.html">Portafolio</a>`;
    if (usuario) {
        nav += `
            <a href="dashboard.html">Subir tareas</a>
            <span class="chip-usuario">
                <img src="img/perfil.jpg" alt="" class="avatar avatar-foto">
                <span class="nombre">${escapar(usuario.nombre)}</span>
            </span>
            <a href="#" id="btn-salir">Salir</a>`;
    } else {
        nav += `
            <a href="login.html">Iniciar sesión</a>
            <a class="btn btn-mini" href="registro.html">Crear cuenta</a>`;
    }

    const barra = document.getElementById("barra");
    if (!barra) return;
    barra.innerHTML = `
        <a class="marca" href="index.html">
            <img src="img/upla-logo.png" alt="Universidad Peruana Los Andes">
            ${marcaTexto}
        </a>
        <nav>${nav}</nav>`;

    const btnSalir = document.getElementById("btn-salir");
    if (btnSalir) {
        btnSalir.addEventListener("click", (e) => {
            e.preventDefault();
            cerrarSesion();
            window.location.href = "index.html";
        });
    }
}

document.addEventListener("DOMContentLoaded", pintarBarra);
