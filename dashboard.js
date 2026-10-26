/* ==========================================================
   Panel privado: subir y borrar tareas.
   Si no hay sesion iniciada, te lleva a login.html.
   ========================================================== */
import { CURSOS, UNIDADES, SEMANAS_POR_UNIDAD, PERFIL, MAX_MB } from "./config.js";
import { supabaseListo, alCambiarSesion, explicarError } from "./supabase.js";
import { listarTodas, subirArchivo, eliminarTarea, urlDeVista, urlDeDescarga } from "./archivos.js";
import { escapar, pesoLegible, nombreDeCurso, ponerAnio } from "./util.js";
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
    document.getElementById("form-subir").addEventListener("submit", alSubir);
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
    for (let s = 1; s <= SEMANAS_POR_UNIDAD; s++) {
        semana.insertAdjacentHTML("beforeend", `<option value="${s}">Semana ${s}</option>`);
    }
}

function mostrar(tipo, mensaje) {
    aviso.innerHTML = `<div class="aviso aviso-${tipo}">${escapar(mensaje)}</div>`;
}

async function alSubir(ev) {
    ev.preventDefault();
    aviso.innerHTML = "";

    const archivos = Array.from(document.getElementById("archivo").files);
    if (archivos.length === 0) {
        mostrar("error", "Elige al menos un archivo para subir.");
        return;
    }

    const curso = document.getElementById("curso").value;
    const unidad = Number(document.getElementById("unidad").value);
    const semana = Number(document.getElementById("semana").value);
    const titulo = document.getElementById("titulo").value.trim();

    const boton = document.getElementById("btn-subir");
    boton.disabled = true;

    let subidos = 0;
    const fallidos = [];

    for (let i = 0; i < archivos.length; i++) {
        const archivo = archivos[i];
        boton.textContent = `Subiendo ${i + 1}/${archivos.length}…`;
        try {
            await subirArchivo(archivo, {
                curso, unidad, semana,
                titulo: titulo ? (archivos.length > 1 ? titulo + " – " + archivo.name : titulo) : archivo.name
            });
            subidos++;
        } catch (e) {
            fallidos.push(archivo.name + " (" + explicarError(e) + ")");
        }
    }

    boton.disabled = false;
    boton.textContent = "Subir tarea";

    if (subidos > 0) {
        document.getElementById("form-subir").reset();
        await cargarMisTareas();
    }
    if (fallidos.length === 0) {
        mostrar("exito", `Se subió ${subidos} archivo(s) a la Unidad ${unidad}, Semana ${semana}.`);
    } else {
        mostrar("error", (subidos ? `Se subieron ${subidos}. ` : "") + "No se pudo subir: " + fallidos.join("; "));
    }
}

async function cargarMisTareas() {
    const destino = document.getElementById("lista-mis-tareas");
    try {
        const tareas = await listarTodas();
        misTareas.clear();
        tareas.forEach((t) => misTareas.set(t.id, t));
        document.getElementById("panel-total").textContent = tareas.length;

        if (tareas.length === 0) {
            destino.innerHTML = `
              <div class="vacio">
                <strong>Todavía no has subido ninguna tarea</strong>
                Usa el formulario de arriba para subir la primera.
              </div>`;
            return;
        }

        let html = '<div class="lista-tareas">';
        let cursoAnterior = null;
        for (const t of tareas) {
            if (t.curso !== cursoAnterior) {
                cursoAnterior = t.curso;
                html += `<h3 style="margin:22px 0 4px;font-size:1.02rem;color:var(--upla-profundo)">
                            ${escapar(nombreDeCurso(CURSOS, t.curso))}</h3>`;
            }
            html += dibujarTarea(t);
        }
        destino.innerHTML = html + "</div>";
    } catch (e) {
        destino.innerHTML = '<div class="vacio"><strong>No se pudieron leer tus tareas</strong>'
            + escapar(explicarError(e)) + "</div>";
    }
}

function dibujarTarea(t) {
    return `
      <div class="tarea">
        <span class="tarea-icono">U${t.unidad}S${t.semana}</span>
        <span class="tarea-info">
          <span class="titulo">${escapar(t.titulo || t.nombreOriginal)}</span>
          <span class="meta">Unidad ${t.unidad} &middot; Semana ${t.semana} &middot; ${pesoLegible(t.tamano)}</span>
        </span>
        <span class="tarea-acciones">
          <a class="btn btn-linea btn-mini" href="${escapar(urlDeVista(t))}" target="_blank" rel="noopener">Ver</a>
          <a class="btn btn-linea btn-mini" href="${escapar(urlDeDescarga(t))}">Descargar</a>
          <button class="btn btn-riesgo btn-mini" type="button" data-accion="eliminar" data-id="${escapar(t.id)}">Eliminar</button>
        </span>
      </div>`;
}

async function alPulsarBoton(ev) {
    const boton = ev.target.closest("button[data-accion='eliminar']");
    if (!boton) return;
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
