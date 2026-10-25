/* ==========================================================
   Chatbot lateral del portafolio.
   Habla con la Edge Function "chat" de Supabase (la clave de la IA
   nunca esta en esta pagina).
   ========================================================== */
import { SUPABASE_URL, SUPABASE_KEY } from "./config.js";
import { escapar } from "./util.js";

const URL_CHAT = SUPABASE_URL + "/functions/v1/chat";
const historial = [];
let ocupado = false;

const raiz = document.createElement("div");
raiz.innerHTML = `
  <button class="chat-abrir" id="chat-abrir" type="button" aria-label="Abrir asistente">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-5.4A8 8 0 1 1 21 12z"/></svg>
    <span>Pregúntame</span>
  </button>
  <aside class="chat-panel" id="chat-panel" aria-hidden="true">
    <header class="chat-cab">
      <strong>Asistente del portafolio</strong>
      <button type="button" id="chat-cerrar" aria-label="Cerrar">✕</button>
    </header>
    <div class="chat-msgs" id="chat-msgs"></div>
    <div class="chat-sugerencias" id="chat-sug">
      <button type="button">¿Qué tareas hay subidas?</button>
      <button type="button">¿Qué semanas faltan?</button>
      <button type="button">Explícame qué es una pila</button>
    </div>
    <div class="chat-form">
      <textarea id="chat-texto" rows="1" maxlength="1500" placeholder="Escribe tu pregunta..."></textarea>
      <button type="button" id="chat-enviar" class="btn">Enviar</button>
    </div>
  </aside>`;
document.body.appendChild(raiz);

const panel = document.getElementById("chat-panel");
const msgs = document.getElementById("chat-msgs");
const texto = document.getElementById("chat-texto");

function abrir(estado) {
    panel.classList.toggle("abierto", estado);
    document.body.classList.toggle("chat-activo", estado);
    panel.setAttribute("aria-hidden", String(!estado));
    if (estado) texto.focus();
}
document.getElementById("chat-abrir").addEventListener("click", () => abrir(true));
document.getElementById("chat-cerrar").addEventListener("click", () => abrir(false));

function pintar(rol, contenido) {
    const burbuja = document.createElement("div");
    burbuja.className = "chat-burbuja " + rol;
    // escapar() evita inyectar HTML; luego solo permitimos **negrita** y saltos de linea
    burbuja.innerHTML = escapar(contenido)
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\n/g, "<br>");
    msgs.appendChild(burbuja);
    msgs.scrollTop = msgs.scrollHeight;
    return burbuja;
}

pintar("bot", "¡Hola! ¿En qué te puedo ayudar?");
async function enviar(pregunta) {
    pregunta = (pregunta || texto.value).trim();
    if (!pregunta || ocupado) return;
    ocupado = true;
    texto.value = "";
    document.getElementById("chat-sug").style.display = "none";

    pintar("yo", pregunta);
    historial.push({ role: "user", content: pregunta });
    const espera = pintar("bot", "Pensando...");

    try {
        const r = await fetch(URL_CHAT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": SUPABASE_KEY
            },
            body: JSON.stringify({ messages: historial })
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Error del servidor");
        historial.push({ role: "assistant", content: d.respuesta });
        espera.innerHTML = escapar(d.respuesta)
            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
            .replace(/\n/g, "<br>");
    } catch (e) {
        historial.pop();
        espera.textContent = "No pude responder: " + e.message;
        espera.classList.add("error");
    } finally {
        ocupado = false;
        msgs.scrollTop = msgs.scrollHeight;
    }
}

document.getElementById("chat-enviar").addEventListener("click", () => enviar());
texto.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" && !ev.shiftKey) { ev.preventDefault(); enviar(); }
});
document.querySelectorAll("#chat-sug button").forEach((b) =>
    b.addEventListener("click", () => enviar(b.textContent)));
