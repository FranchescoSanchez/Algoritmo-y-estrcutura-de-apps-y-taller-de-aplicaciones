/* ==========================================================
   Panel privado: subir y borrar tareas.
   Si no hay sesion iniciada, te lleva a login.html.
   ========================================================== */
import { CURSOS, UNIDADES, SEMANAS_POR_UNIDAD, semanaMostrada, PERFIL, MAX_MB } from "./config.js";
import { supabaseListo, alCambiarSesion, explicarError } from "./supabase.js";
import { listarTodas, compararOrdenTareas, subirArchivo, guardarEnlace, eliminarTarea, actualizarTituloTarea, reemplazarImagenTarea, actualizarOrdenTareas, urlDeVista, urlDeDescarga } from "./archivos.js?v=imagen-reemplazo-1";
import { escapar, pesoLegible, nombreDeCurso, ponerAnio } from "./util.js";
import { guardarNombreSemana, listarNombresSemanas } from "./semanas.js";
import "./barra.js";

const misTareas = new Map();
let panelIniciado = false;
const aviso = document.getElementById("aviso-contenedor");

ponerAnio();

if (!supabaseListo) {
    window.location.href = "login.html";
} else {
    alCambiarSesion((usuario) => {
        if (!usuario) {
            window.location.href = "login.html";
            return;
        }
        iniciarPanel(usuario);
    });
}

function iniciarPanel(usuario) {
    document.getElementById("panel").style.display = "";
    document.getElementById("panel-nombre").textContent = PERFIL.nombre || "";
    document.getElementById("panel-correo").textContent = usuario.email || "";
    document.getElementById("panel-presentacion").textContent = PERFIL.presentacion || "";
    document.getElementById("panel-foto").src = PERFIL.foto || "img/perfil.jpg";
    document.getElementById("max-mb").textContent = MAX_MB;

    if (panelIniciado) return;
    panelIniciado = true;

    llenarSelects();
    llenarSelectsNombresSemana();
    document.getElementById("form-nombre-semana").addEventListener("submit", guardarNombreSemanaDesdePanel);
    document.getElementById("form-subir").addEventListener("submit", alSubir);
    document.getElementById("tipo-recurso").addEventListener("change", cambiarTipoRecurso);
    cambiarTipoRecurso();
    document.getElementById("lista-mis-tareas").addEventListener("click", alPulsarBoton);
    cargarMisTareas();
}

function llenarSelects() {
    document.getElementById("curso").innerHTML = CURSOS
        .map((c) => `<option value="${escapar(c.slug)}">${escapar(c.nombre)}</option>`).join("");

    const unidad = document.getElementById("unidad");
    const semana = document.getElementById("semana");
    for (let u = 1; u <= UNIDADES; u++) {
        unidad.insertAdjacentHTML("beforeend", `<option value="${u}">Unidad ${u}</option>`);
    }
    function actualizarSemanasDeUnidad() {
        const unidadSeleccionada = Number(unidad.value) || 1;
        semana.innerHTML = Array.from({ length: SEMANAS_POR_UNIDAD }, (_, i) => {
            const semanaLocal = i + 1;
            const semanaGlobal = (unidadSeleccionada - 1) * SEMANAS_POR_UNIDAD + semanaLocal;
            return `<option value="${semanaLocal}">Semana ${semanaGlobal}</option>`;
        }).join("");
    }
    actualizarSemanasDeUnidad();
    unidad.addEventListener("change", actualizarSemanasDeUnidad);
}

function llenarSelectsNombresSemana() {
    const curso = document.getElementById("nombre-curso");
    const unidad = document.getElementById("nombre-unidad");
    const semana = document.getElementById("nombre-semana-numero");
    curso.innerHTML = CURSOS.map((c) => `<option value="${escapar(c.slug)}">${escapar(c.nombre)}</option>`).join("");
    unidad.innerHTML = Array.from({ length: UNIDADES }, (_, i) => i + 1)
        .map((n) => `<option value="${n}">Unidad ${n}</option>`).join("");
    actualizarOpcionesSemanaNombre();
    unidad.addEventListener("change", actualizarOpcionesSemanaNombre);
}
function actualizarOpcionesSemanaNombre() {
    const unidad = Number(document.getElementById("nombre-unidad").value);
    document.getElementById("nombre-semana-numero").innerHTML =
        Array.from({ length: SEMANAS_POR_UNIDAD }, (_, i) => i + 1)
            .map((n) => `<option value="${n}">Semana ${(unidad - 1) * SEMANAS_POR_UNIDAD + n}</option>`).join("");
}
async function guardarNombreSemanaDesdePanel(ev) {
    ev.preventDefault();
    const boton = document.getElementById("btn-guardar-semana");
    boton.disabled = true;
    try {
        await guardarNombreSemana({
            curso: document.getElementById("nombre-curso").value,
            unidad: Number(document.getElementById("nombre-unidad").value),
            semana: Number(document.getElementById("nombre-semana-numero").value),
            nombre: document.getElementById("nombre-semana-texto").value
        });
        mostrar("exito", "Nombre de la semana guardado. Ya se mostrará en la página pública.");
    } catch (e) {
        mostrar("error", "No se pudo guardar el nombre. Ejecuta primero sql/nombres-semanas.sql en Supabase. " + explicarError(e));
    } finally {
        boton.disabled = false;
    }
}

function mostrar(tipo, mensaje) {
    aviso.innerHTML = `<div class="aviso aviso-${tipo}">${escapar(mensaje)}</div>`;
}

function cambiarTipoRecurso() {
    const esEnlace = document.getElementById("tipo-recurso").value === "enlace";
    document.getElementById("campo-archivo").style.display = esEnlace ? "none" : "";
    document.getElementById("campo-enlace").style.display = esEnlace ? "" : "none";
    document.getElementById("archivo").required = !esEnlace;
    document.getElementById("recurso-url").required = esEnlace;
}

async function alSubir(ev) {
    ev.preventDefault();
    aviso.innerHTML = "";
    const curso = document.getElementById("curso").value;
    const unidad = Number(document.getElementById("unidad").value);
    const semana = Number(document.getElementById("semana").value);
    const titulo = document.getElementById("titulo").value.trim();
    const boton = document.getElementById("btn-subir");
    boton.disabled = true;
    if (document.getElementById("tipo-recurso").value === "enlace") {
        try {
            await guardarEnlace({ curso, unidad, semana, titulo, url: document.getElementById("recurso-url").value });
            document.getElementById("form-subir").reset();
            cambiarTipoRecurso();
            await cargarMisTareas();
            mostrar("exito", `Se agregó el enlace a la Unidad ${unidad}, Semana ${semana}.`);
        } catch (e) { mostrar("error", explicarError(e)); }
        finally { boton.disabled = false; boton.textContent = "Subir tarea"; }
        return;
    }
    const archivos = Array.from(document.getElementById("archivo").files);
    if (!archivos.length) {
        mostrar("error", "Elige al menos un archivo para subir.");
        boton.disabled = false;
        return;
    }
    let subidos = 0;
    const fallidos = [];
    for (let i = 0; i < archivos.length; i++) {
        const archivo = archivos[i];
        boton.textContent = `Subiendo ${i + 1}/${archivos.length}…`;
        try {
            await subirArchivo(archivo, { curso, unidad, semana,
                titulo: titulo ? (archivos.length > 1 ? titulo + " – " + archivo.name : titulo) : archivo.name });
            subidos++;
        } catch (e) { fallidos.push(archivo.name + " (" + explicarError(e) + ")"); }
    }
    boton.disabled = false;
    boton.textContent = "Subir tarea";
    if (subidos > 0) {
        document.getElementById("form-subir").reset();
        cambiarTipoRecurso();
        await cargarMisTareas();
    }
    if (!fallidos.length) mostrar("exito", `Se subió ${subidos} archivo(s) a la Unidad ${unidad}, Semana ${semana}.`);
    else mostrar("error", (subidos ? `Se subieron ${subidos}. ` : "") + "No se pudo subir: " + fallidos.join("; "));
}

async function cargarMisTareas() {
    const destino = document.getElementById("lista-mis-tareas");
    try {
        const tareas = await listarTodas();
        misTareas.clear();
        tareas.forEach((t) => misTareas.set(t.id, t));
        document.getElementById("panel-total").textContent = tareas.length;
        if (!tareas.length) {
            destino.innerHTML = `<div class="vacio"><strong>Todavía no has subido ninguna tarea</strong>Usa el formulario de arriba para subir la primera.</div>`;
            return;
        }

        // Misma estructura visual que la página pública: curso > unidades plegables > semanas.
        let nombresSemanas = [];
        try { nombresSemanas = await listarNombresSemanas(); } catch (_) { /* Los nombres personalizados son opcionales. */ }

        const cursos = new Map();
        for (const tarea of tareas) {
            const curso = tarea.curso || "sin-curso";
            if (!cursos.has(curso)) cursos.set(curso, new Map());
            const unidades = cursos.get(curso);
            const unidad = Number(tarea.unidad) || 1;
            if (!unidades.has(unidad)) unidades.set(unidad, new Map());
            const semanas = unidades.get(unidad);
            const semana = Number(tarea.semana) || 1;
            if (!semanas.has(semana)) semanas.set(semana, []);
            semanas.get(semana).push(tarea);
        }

        let html = '<div class="lista-tareas lista-tareas-agrupada">';
        for (const [curso, unidades] of cursos) {
            html += `<section style="margin:24px 0 30px">
                <h3 style="margin:0 0 14px;font-size:1.08rem;border-bottom:2px solid var(--linea);padding-bottom:10px">${escapar(nombreDeCurso(CURSOS, curso))}</h3>
                <div class="unidades-admin">`;
            for (let unidad = 1; unidad <= UNIDADES; unidad++) {
                const semanasConTareas = unidades.get(unidad) || new Map();
                const entregadas = Array.from({ length: SEMANAS_POR_UNIDAD }, (_, i) => i + 1)
                    .filter(s => (semanasConTareas.get(s) || []).length > 0).length;
                const completa = entregadas === SEMANAS_POR_UNIDAD;
                const hexClase = entregadas > 0 ? "hexagono" : "hexagono vacio";
                html += `<section class="unidad">
                    <button class="unidad-cabecera" type="button" aria-expanded="false">
                        <span class="${hexClase}">${unidad}</span>
                        <span class="unidad-titulo">
                            <strong>Unidad ${unidad}</strong>
                            <span>${entregadas} de ${SEMANAS_POR_UNIDAD} semanas con tareas</span>
                        </span>
                        <svg class="flecha" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true">
                            <path d="M6 9l6 6 6-6"/>
                        </svg>
                    </button>
                    <div class="unidad-cuerpo">`;
                for (let semana = 1; semana <= SEMANAS_POR_UNIDAD; semana++) {
                    const items = (semanasConTareas.get(semana) || []).sort(compararOrdenTareas);
                    const numero = semanaMostrada(unidad, semana);
                    const nombre = nombresSemanas.find(n => n.curso === curso && Number(n.unidad) === unidad && Number(n.semana) === semana)?.nombre || "";
                    const insignia = items.length
                        ? `<span class="pin pin-ok">${items.length} ${items.length === 1 ? "tarea" : "tareas"}</span>`
                        : '<span class="pin pin-pendiente">Pendiente</span>';
                    const contenido = items.length
                        ? `<div class="lista-tareas">${items.map(dibujarTarea).join("")}</div>`
                        : '<div class="semana-vacia">Aún no hay tareas subidas en esta semana.</div>';
                    html += `<div class="semana">
                        <div class="semana-cabecera">
                            <span class="semana-numero">Semana ${numero}${nombre ? ": " + escapar(nombre) : ""}</span>
                            ${insignia}
                        </div>
                        ${contenido}
                    </div>`;
                }
                html += '</div></section>';
            }
            html += '</div></section>';
        }
        html += '</div>';

    } catch (e) {
        destino.innerHTML = '<div class="vacio"><strong>No se pudieron leer tus tareas</strong>' + escapar(explicarError(e)) + '</div>';
    }
}

function dibujarTarea(t) {
    return `
      <div class="tarea">
        <span class="tarea-icono">${t.tipoRecurso === "enlace" ? "URL" : "U" + t.unidad + "S" + t.semana}</span>
        <span class="tarea-info">
          <span class="titulo">${escapar(t.titulo || t.nombreOriginal)}</span>
          <span class="meta">Unidad ${t.unidad} &middot; Semana ${t.semana} &middot; ${t.tipoRecurso === "enlace" ? "Enlace externo" : pesoLegible(t.tamano)}</span>
        </span>
        <span class="tarea-acciones">
          <a class="btn btn-linea btn-mini" href="${escapar(urlDeVista(t))}" target="_blank" rel="noopener">${t.tipoRecurso === "enlace" ? "Abrir enlace" : "Ver"}</a>
          ${t.tipoRecurso === "enlace" ? "" : `<a class="btn btn-linea btn-mini" href="${escapar(urlDeDescarga(t))}">Descargar</a>`}
          <button class="btn btn-linea btn-mini" type="button" data-accion="subir-orden" data-id="${escapar(t.id)}" title="Mover antes">↑</button>
          <button class="btn btn-linea btn-mini" type="button" data-accion="bajar-orden" data-id="${escapar(t.id)}" title="Mover después">↓</button>
          ${t.tipoRecurso !== "enlace" && String(t.tipoMime || "").startsWith("image/") ? `<button class="btn btn-linea btn-mini" type="button" data-accion="reemplazar-imagen" data-id="${escapar(t.id)}">Reemplazar imagen</button>` : ""}
          <button class="btn btn-linea btn-mini" type="button" data-accion="editar" data-id="${escapar(t.id)}">Editar nombre</button>
          <button class="btn btn-riesgo btn-mini" type="button" data-accion="eliminar" data-id="${escapar(t.id)}">Eliminar</button>
        </span>
      </div>`;
}

async function moverTarea(tarea, direccion, boton) {
    const grupo = Array.from(misTareas.values()).filter(t =>
        t.curso === tarea.curso && Number(t.unidad) === Number(tarea.unidad) &&
        Number(t.semana) === Number(tarea.semana)
    ).sort(compararOrdenTareas);
    const indice = grupo.findIndex(t => String(t.id) === String(tarea.id));
    const destino = indice + direccion;
    if (indice < 0 || destino < 0 || destino >= grupo.length) return;
    [grupo[indice], grupo[destino]] = [grupo[destino], grupo[indice]];
    boton.disabled = true;
    try {
        await actualizarOrdenTareas(grupo);
        await cargarMisTareas();
        mostrar("exito", "Orden actualizado. Los archivos se conservaron.");
    } catch (e) {
        mostrar("error", explicarError(e));
        boton.disabled = false;
    }
}

async function alPulsarBoton(ev) {
    const boton = ev.target.closest("button[data-accion]");
    if (!boton) return;
    if (boton.dataset.accion === "subir-orden" || boton.dataset.accion === "bajar-orden") {
        const tarea = misTareas.get(boton.dataset.id);
        if (tarea) await moverTarea(tarea, boton.dataset.accion === "subir-orden" ? -1 : 1, boton);
        return;
    }
    if (boton.dataset.accion === "reemplazar-imagen") {
        const tarea = misTareas.get(boton.dataset.id);
        if (!tarea) return;
        const selector = document.createElement("input");
        selector.type = "file";
        selector.accept = "image/*";
        selector.addEventListener("change", async () => {
            const imagen = selector.files && selector.files[0];
            if (!imagen) return;
            if (!confirm(`¿Reemplazar la imagen de "${tarea.titulo || tarea.nombreOriginal}" por "${imagen.name}"? La imagen anterior dejará de mostrarse.`)) return;
            boton.disabled = true;
            boton.textContent = "Reemplazando…";
            try {
                await reemplazarImagenTarea(tarea, imagen);
                await cargarMisTareas();
                mostrar("exito", "Imagen reemplazada correctamente. Se conservaron el nombre y la ubicación de la actividad.");
            } catch (e) {
                mostrar("error", explicarError(e));
                boton.disabled = false;
                boton.textContent = "Reemplazar imagen";
            }
        }, { once: true });
        selector.click();
        return;
    }
    if (boton.dataset.accion === "editar") {
        const tarea = misTareas.get(boton.dataset.id);
        if (!tarea) return;
        const nuevo = prompt("Escribe el nuevo nombre de la actividad:", tarea.titulo || tarea.nombreOriginal);
        if (nuevo === null) return;
        if (!nuevo.trim()) {
            mostrar("error", "El nombre de la actividad no puede estar vacío.");
            return;
        }
        boton.disabled = true;
        try {
            await actualizarTituloTarea(tarea.id, nuevo);
            await cargarMisTareas();
            mostrar("exito", "Nombre de la actividad actualizado. El archivo original sigue intacto.");
        } catch (e) {
            mostrar("error", explicarError(e));
            boton.disabled = false;
        }
        return;
    }
    if (boton.dataset.accion !== "eliminar") return;
    const tarea = misTareas.get(boton.dataset.id);
    if (!tarea) return;

    if (!confirm('¿Eliminar "' + tarea.nombreOriginal + '"? Esta acción no se puede deshacer.')) return;

    boton.disabled = true;
    boton.textContent = "Eliminando…";
    try {
        await eliminarTarea(tarea);
        await cargarMisTareas();
        mostrar("exito", 'Se eliminó "' + tarea.nombreOriginal + '".');
    } catch (e) {
        mostrar("error", explicarError(e));
        boton.disabled = false;
        boton.textContent = "Eliminar";
    }
}
