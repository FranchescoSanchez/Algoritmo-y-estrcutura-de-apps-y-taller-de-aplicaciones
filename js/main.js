/* ==========================================================
   Portafolio publico: curso -> 4 unidades -> 4 semanas -> tareas.
   No pide iniciar sesion: cualquiera con el enlace lo ve.
   ========================================================== */
import { CURSOS, UNIDADES, SEMANAS_POR_UNIDAD, PERFIL } from "./config.js";
import { supabaseListo, explicarError, avisoConfiguracion } from "./supabase.js";
import { listarPorCurso, urlDeVista, urlDeDescarga } from "./archivos.js";
import { escapar, pesoLegible, extension, ponerAnio } from "./util.js";
import "./barra.js";

ponerAnio();

const presentacion = document.getElementById("portada-presentacion");
if (presentacion && PERFIL.presentacion) {
    presentacion.textContent = PERFIL.presentacion;
}

if (!supabaseListo) {
    document.getElementById("cursos").innerHTML = avisoConfiguracion();
    document.getElementById("unidades").innerHTML = "";
} else {
    dibujarCursos();
}

function dibujarCursos() {
    const destino = document.getElementById("cursos");
    destino.innerHTML = CURSOS.map((curso, i) => `
        <button class="curso-btn${i === 0 ? " activo" : ""}" type="button" data-curso="${escapar(curso.slug)}">
            <span class="curso-nombre">${escapar(curso.nombre)}</span>
            <span class="curso-meta">${UNIDADES} unidades · ${UNIDADES * SEMANAS_POR_UNIDAD} semanas</span>
        </button>`).join("");

    const botones = destino.querySelectorAll(".curso-btn");
    botones.forEach((boton) => {
        boton.addEventListener("click", () => {
            botones.forEach((b) => b.classList.remove("activo"));
            boton.classList.add("activo");
            cargarCurso(boton.dataset.curso);
        });
    });

    cargarCurso(CURSOS[0].slug);
}

async function cargarCurso(slug) {
    const destino = document.getElementById("unidades");
    destino.innerHTML = '<div class="vacio">Cargando el curso...</div>';

    try {
        const tareas = await listarPorCurso(slug);
        const porSemana = {};
        tareas.forEach((t) => {
            (porSemana[t.unidad + "-" + t.semana] ||= []).push(t);
        });

        let semanasEntregadas = 0;
        let html = "";
        for (let u = 1; u <= UNIDADES; u++) {
            const semanas = [];
            let entregadasEnUnidad = 0;
            for (let s = 1; s <= SEMANAS_POR_UNIDAD; s++) {
                const archivos = porSemana[u + "-" + s] || [];
                if (archivos.length > 0) entregadasEnUnidad++;
                semanas.push({ numero: s, archivos });
            }
            semanasEntregadas += entregadasEnUnidad;
            html += dibujarUnidad({ numero: u, semanasEntregadas: entregadasEnUnidad, semanas });
        }

        const curso = CURSOS.find((c) => c.slug === slug);
        document.getElementById("curso-titulo").textContent = curso ? curso.nombre : slug;
        document.getElementById("avance").textContent =
            semanasEntregadas + "/" + UNIDADES * SEMANAS_POR_UNIDAD;
        destino.innerHTML = html;
        activarAcordeon();
    } catch (e) {
        destino.innerHTML = '<div class="vacio"><strong>No se pudo cargar el curso</strong>'
            + escapar(explicarError(e)) + "</div>";
    }
}

function dibujarUnidad(unidad) {
    const completa = unidad.semanasEntregadas === SEMANAS_POR_UNIDAD;
    const hexClase = unidad.semanasEntregadas > 0 ? "hexagono" : "hexagono vacio";
    const resumen = unidad.semanasEntregadas === 0
        ? "Sin tareas subidas todavía"
        : unidad.semanasEntregadas + " de " + SEMANAS_POR_UNIDAD + " semanas con tareas";

    return `
      <section class="unidad${completa ? " abierta" : ""}">
        <button class="unidad-cabecera" type="button" aria-expanded="${completa}">
          <span class="${hexClase}">${unidad.numero}</span>
          <span class="unidad-titulo">
            <strong>Unidad ${unidad.numero}</strong>
            <span>${resumen}</span>
          </span>
          <svg class="flecha" width="18" height="18" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2.4" aria-hidden="true">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </button>
        <div class="unidad-cuerpo">
          ${unidad.semanas.map(dibujarSemana).join("")}
        </div>
      </section>`;
}

function dibujarSemana(semana) {
    const tiene = semana.archivos.length > 0;
    const contenido = tiene
        ? `<div class="lista-tareas">${semana.archivos.map(dibujarTarea).join("")}</div>`
        : `<div class="semana-vacia">Aún no hay tareas subidas en esta semana.</div>`;
    const insignia = tiene
        ? `<span class="pin pin-ok">${semana.archivos.length} ${semana.archivos.length === 1 ? "tarea" : "tareas"}</span>`
        : `<span class="pin pin-pendiente">Pendiente</span>`;

    return `
      <div class="semana">
        <div class="semana-cabecera">
          <span class="semana-numero">Semana ${semana.numero}</span>
          ${insignia}
        </div>
        ${contenido}
      </div>`;
}

function dibujarTarea(t) {
    return `
      <div class="tarea">
        <span class="tarea-icono">${escapar(extension(t.nombreOriginal))}</span>
        <span class="tarea-info">
          <span class="titulo">${escapar(t.titulo || t.nombreOriginal)}</span>
          <span class="meta">${escapar(t.nombreOriginal)} &middot; ${pesoLegible(t.tamano)}</span>
        </span>
        <span class="tarea-acciones">
          <a class="btn btn-linea btn-mini" href="${escapar(urlDeVista(t))}" target="_blank" rel="noopener">Ver</a>
          <a class="btn btn-mini" href="${escapar(urlDeDescarga(t))}">Descargar</a>
        </span>
      </div>`;
}

function activarAcordeon() {
    document.querySelectorAll(".unidad-cabecera").forEach((cabecera) => {
        cabecera.addEventListener("click", () => {
            const abierta = cabecera.closest(".unidad").classList.toggle("abierta");
            cabecera.setAttribute("aria-expanded", abierta);
        });
    });
}
