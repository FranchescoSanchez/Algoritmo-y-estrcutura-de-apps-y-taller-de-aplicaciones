/* Funciones pequeñas compartidas por las paginas. */

export function escapar(texto) {
    const div = document.createElement("div");
    div.textContent = texto == null ? "" : texto;
    return div.innerHTML;
}

export function pesoLegible(bytes) {
    if (!bytes) return "0 KB";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return Math.round(bytes / 1024) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
}

export function extension(nombre) {
    if (!nombre || !nombre.includes(".")) return "DOC";
    return nombre.split(".").pop().slice(0, 4).toUpperCase();
}

export function nombreDeCurso(cursos, slug) {
    const curso = cursos.find((c) => c.slug === slug);
    return curso ? curso.nombre : slug;
}

export function ponerAnio() {
    const pie = document.getElementById("anio-actual");
    if (pie) pie.textContent = new Date().getFullYear();
}
