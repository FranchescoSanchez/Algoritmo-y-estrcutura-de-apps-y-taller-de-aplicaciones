document.addEventListener("DOMContentLoaded", () => {
    const usuario = obtenerSesion();
    if (!usuario) {
        window.location.href = "login.html";
        return;
    }

    document.getElementById("anio").textContent = new Date().getFullYear();
    document.getElementById("saludo").textContent = "Hola, " + usuario.nombre;
    document.getElementById("correo-usuario").textContent = usuario.email;

    llenarSelect("curso", CATALOGO_CURSOS.map((c) => ({ valor: c.slug, texto: c.nombre })));
    llenarSelect("unidad", rango(1, UNIDADES).map((u) => ({ valor: u, texto: "Unidad " + u })));
    llenarSelect("semana", rango(1, SEMANAS_POR_UNIDAD).map((s) => ({ valor: s, texto: "Semana " + s })));

    pintarTareas();

    document.getElementById("form-subir").addEventListener("submit", subirTarea);
});

function llenarSelect(id, opciones) {
    const select = document.getElementById(id);
    select.innerHTML = opciones.map((o) => `<option value="${o.valor}">${o.texto}</option>`).join("");
}

function rango(inicio, fin) {
    const lista = [];
    for (let i = inicio; i <= fin; i++) lista.push(i);
    return lista;
}

function subirTarea(e) {
    e.preventDefault();
    const usuario = obtenerSesion();
    const curso = document.getElementById("curso").value;
    const unidad = parseInt(document.getElementById("unidad").value, 10);
    const semana = parseInt(document.getElementById("semana").value, 10);
    const tituloBase = document.getElementById("titulo").value.trim();
    const input = document.getElementById("archivo");
    const mensaje = document.getElementById("mensaje");

    if (!input.files.length) return;

    const lecturas = Array.from(input.files).map((archivo) => leerArchivo(archivo));

    Promise.all(lecturas)
        .then((leidos) => {
            const archivos = obtenerArchivos();
            leidos.forEach((leido, i) => {
                archivos.push({
                    id: "a_" + Date.now() + "_" + i,
                    usuarioId: usuario.id,
                    curso: curso,
                    unidad: unidad,
                    semana: semana,
                    titulo: tituloBase || null,
                    nombreOriginal: leido.nombre,
                    tamano: leido.tamano,
                    tipo: leido.tipo,
                    datos: leido.datos
                });
            });
            guardarArchivos(archivos);
            mensaje.innerHTML = `<div class="aviso aviso-exito">Tarea subida correctamente.</div>`;
            document.getElementById("form-subir").reset();
            pintarTareas();
        })
        .catch(() => {
            mensaje.innerHTML = `<div class="aviso aviso-error">No se pudo leer el archivo. Intenta con uno más liviano.</div>`;
        });
}

function leerArchivo(archivo) {
    return new Promise((resolve, reject) => {
        const lector = new FileReader();
        lector.onload = () => resolve({
            nombre: archivo.name,
            tamano: archivo.size,
            tipo: archivo.type || "application/octet-stream",
            datos: lector.result
        });
        lector.onerror = reject;
        lector.readAsDataURL(archivo);
    });
}

function pintarTareas() {
    const usuario = obtenerSesion();
    const propias = obtenerArchivos()
        .filter((a) => a.usuarioId === usuario.id)
        .sort((a, b) => (a.curso + a.unidad + a.semana).localeCompare(b.curso + b.unidad + b.semana));

    document.getElementById("total-tareas").textContent = propias.length;

    const destino = document.getElementById("lista-tareas");
    if (propias.length === 0) {
        destino.innerHTML = `
            <div class="vacio">
                <strong>Todavía no has subido ninguna tarea</strong>
                Usa el formulario de arriba para subir la primera.
            </div>`;
        return;
    }

    let html = `<div class="lista-tareas">`;
    let cursoAnterior = null;
    propias.forEach((archivo) => {
        if (archivo.curso !== cursoAnterior) {
            cursoAnterior = archivo.curso;
            html += `<h3 style="margin:22px 0 4px;font-size:1.02rem;color:var(--upla-profundo)">
                        ${escapar(nombreCurso(archivo.curso))}
                     </h3>`;
        }
        html += `
            <div class="tarea">
                <span class="tarea-icono">U${archivo.unidad}S${archivo.semana}</span>
                <span class="tarea-info">
                    <span class="titulo">${escapar(archivo.titulo || archivo.nombreOriginal)}</span>
                    <span class="meta">
                        Unidad ${archivo.unidad} &middot; Semana ${archivo.semana}
                        &middot; ${pesoLegible(archivo.tamano)}
                    </span>
                </span>
                <span class="tarea-acciones">
                    <a class="btn btn-linea btn-mini" href="${archivo.datos}"
                       target="_blank" rel="noopener" download="${escapar(archivo.nombreOriginal)}">Ver</a>
                    <a class="btn btn-linea btn-mini" href="${archivo.datos}"
                       download="${escapar(archivo.nombreOriginal)}">Descargar</a>
                    <button type="button" class="btn btn-riesgo btn-mini" data-id="${archivo.id}"
                            data-nombre="${escapar(archivo.nombreOriginal)}">Eliminar</button>
                </span>
            </div>`;
    });
    html += `</div>`;
    destino.innerHTML = html;

    destino.querySelectorAll("button[data-id]").forEach((boton) => {
        boton.addEventListener("click", () => {
            if (!confirm(`¿Eliminar "${boton.dataset.nombre}"? Esta acción no se puede deshacer.`)) return;
            const restantes = obtenerArchivos().filter((a) => a.id !== boton.dataset.id);
            guardarArchivos(restantes);
            pintarTareas();
        });
    });
}
