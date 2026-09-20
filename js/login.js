import { supabaseListo, alCambiarSesion, iniciarSesion, explicarError, avisoConfiguracion } from "./supabase.js";
import { escapar } from "./util.js";
import "./barra.js";

const aviso = document.getElementById("aviso-contenedor");
const formulario = document.getElementById("form-login");

if (!supabaseListo) {
    aviso.innerHTML = avisoConfiguracion();
    formulario.style.display = "none";
} else {
    // Si ya habias iniciado sesion, vas directo al panel
    alCambiarSesion((usuario) => {
        if (usuario) window.location.href = "dashboard.html";
    });

    formulario.addEventListener("submit", async (ev) => {
        ev.preventDefault();
        aviso.innerHTML = "";
        const boton = formulario.querySelector("button[type=submit]");
        boton.disabled = true;

        try {
            await iniciarSesion(
                document.getElementById("email").value.trim(),
                document.getElementById("password").value);
            window.location.href = "dashboard.html";
        } catch (e) {
            aviso.innerHTML = '<div class="aviso aviso-error">' + escapar(explicarError(e)) + "</div>";
            boton.disabled = false;
        }
    });
}
