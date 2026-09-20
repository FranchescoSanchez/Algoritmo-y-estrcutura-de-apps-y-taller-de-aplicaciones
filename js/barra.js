/* ==========================================================
   Barra superior compartida.
   - Tu nombre y tu foto salen de js/config.js y se ven SIEMPRE, sin sesion.
   - "Subir tareas" / "Salir" solo aparecen si hay sesion iniciada;
     si no, aparece "Iniciar sesión". Ver el portafolio es publico.
   ========================================================== */
import { PERFIL } from "./config.js";
import { alCambiarSesion, cerrarSesion, supabaseListo } from "./supabase.js";
import { escapar } from "./util.js";

const contenedor = document.getElementById("barra");

if (contenedor) {
    const nombre = PERFIL.nombre || "Mi Portafolio";
    const inicial = nombre.trim().substring(0, 1).toUpperCase() || "?";

    contenedor.innerHTML = `
      <header class="barra">
        <a class="marca" href="index.html">
          <img src="img/upla-logo.png" alt="Universidad Peruana Los Andes">
          <span class="marca-texto">
            <span class="marca-titulo">Mi Portafolio</span>
            <span class="marca-sub">Universidad Peruana Los Andes</span>
          </span>
        </a>
        <nav>
          <a href="index.html">Portafolio</a>
          <span class="chip-usuario" title="Dueño del portafolio">
            <img src="${escapar(PERFIL.foto || "img/perfil.jpg")}" alt="" class="avatar avatar-foto" id="barra-foto">
            <span class="nombre">${escapar(nombre)}</span>
          </span>
          <span id="barra-sesion"></span>
        </nav>
      </header>`;

    document.getElementById("barra-foto").addEventListener("error", (ev) => {
        const avatar = document.createElement("span");
        avatar.className = "avatar";
        avatar.textContent = inicial;
        ev.target.replaceWith(avatar);
    });

    const zonaSesion = document.getElementById("barra-sesion");

    alCambiarSesion((usuario) => {
        if (usuario) {
            zonaSesion.innerHTML = '<a href="dashboard.html">Subir tareas</a> <a href="#" id="barra-salir">Salir</a>';
            document.getElementById("barra-salir").addEventListener("click", async (ev) => {
                ev.preventDefault();
                await cerrarSesion();
                window.location.href = "index.html";
            });
        } else {
            zonaSesion.innerHTML = supabaseListo ? '<a href="login.html">Iniciar sesión</a>' : "";
        }
    });
}
