const MAGIC_LOOPS_API_URL = "https://magicloops.dev/api/loop/bb5e450d-b63a-4d19-afc4-42deb1ce1ebd/run";

/* ----------------------------------------------------------
   PREGUNTAS DE LA ENTREVISTA (fijas, definidas en el código)
---------------------------------------------------------- */
const PREGUNTAS = [
  "Contame algo que se te dé especialmente bien y que creas que podría ser útil en una empresa.",
  "Imaginá que estás trabajando en un proyecto y descubrís que la idea original no va a funcionar. Faltan solamente tres días para presentarlo. ¿Qué harías?",
  "Rodá necesita conseguir mucha atención en redes sociales, pero no tiene presupuesto para publicidad. ¿Qué harías?",
  "Un compañero de equipo no está cumpliendo con su parte del trabajo y el proyecto está atrasado. ¿Cómo actuarías?",
  "Un cliente está enojado porque tuvo un problema con el producto. ¿Qué le responderías?",
  "Rodá te da $20.000 para hacer crecer la empresa. ¿En qué los invertirías y por qué?",
  "Inventá una idea para promocionar Rodá que pueda hacerse sin gastar dinero."
];

const ANALYSIS_MESSAGES = [
  "Analizando tus respuestas...",
  "Buscando tus fortalezas...",
  "Conociendo tu forma de pensar...",
  "Preparando tu devolución..."
];

/* ----------------------------------------------------------
   ESTADO
---------------------------------------------------------- */
let nombreUsuario = "";
let preguntaActual = 0;
const entrevista = []; // [{ pregunta, respuesta }]
let resultadoTexto = ""; // guarda el resultado para no perderlo

/* ----------------------------------------------------------
   REFERENCIAS DOM
---------------------------------------------------------- */
const screens = {
  start: document.getElementById("screen-start"),
  name: document.getElementById("screen-name"),
  interview: document.getElementById("screen-interview"),
  analysis: document.getElementById("screen-analysis"),
  error: document.getElementById("screen-error"),
  result: document.getElementById("screen-result")
};

const progressTrack = document.getElementById("progressTrack");
const progressFill = document.getElementById("progressFill");

const inputName = document.getElementById("inputName");
const nameError = document.getElementById("nameError");

const chatLog = document.getElementById("chatLog");
const questionCounter = document.getElementById("questionCounter");
const inputAnswer = document.getElementById("inputAnswer");
const answerError = document.getElementById("answerError");

const analysisMessage = document.getElementById("analysisMessage");
const resultText = document.getElementById("resultText");

/* ----------------------------------------------------------
   NAVEGACIÓN ENTRE PANTALLAS
---------------------------------------------------------- */
function goToScreen(name) {
  Object.values(screens).forEach((el) => {
    if (el.classList.contains("is-active")) {
      el.classList.remove("is-active");
    }
  });
  const target = screens[name];
  target.classList.add("is-active");

  progressTrack.hidden = name !== "interview";

  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
}

/* ----------------------------------------------------------
   PANTALLA 1 → PANTALLA 2
---------------------------------------------------------- */
document.getElementById("btnStart").addEventListener("click", () => {
  goToScreen("name");
  setTimeout(() => inputName.focus(), 350);
});

/* ----------------------------------------------------------
   PANTALLA 2 → PANTALLA 3
---------------------------------------------------------- */
document.getElementById("btnStartInterview").addEventListener("click", () => {
  const valor = inputName.value.trim();
  if (!valor) {
    nameError.hidden = false;
    inputName.focus();
    return;
  }
  nameError.hidden = true;
  nombreUsuario = valor;

  goToScreen("interview");
  renderPregunta();
});

inputName.addEventListener("input", () => {
  if (inputName.value.trim()) nameError.hidden = true;
});

inputName.addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("btnStartInterview").click();
});

/* ----------------------------------------------------------
   PANTALLA 3 — ENTREVISTA
---------------------------------------------------------- */
function updateProgress() {
  const pct = (preguntaActual / PREGUNTAS.length) * 100;
  progressFill.style.width = pct + "%";
}

function renderPregunta() {
  updateProgress();
  questionCounter.textContent = `Pregunta ${preguntaActual + 1} de ${PREGUNTAS.length}`;

  const bubble = document.createElement("div");
  bubble.className = "bubble bubble--bot";
  bubble.innerHTML = `<span class="bubble--bot__tag">🤖 Entrevistador Rodá</span>${escapeHtml(PREGUNTAS[preguntaActual])}`;
  chatLog.appendChild(bubble);

  inputAnswer.value = "";
  answerError.hidden = true;

  scrollChatToBottom();
  setTimeout(() => inputAnswer.focus(), 300);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function scrollChatToBottom() {
  requestAnimationFrame(() => {
    chatLog.scrollTop = chatLog.scrollHeight;
  });
}

document.getElementById("btnContinue").addEventListener("click", handleContinue);
inputAnswer.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleContinue();
  }
});

function handleContinue() {
  const respuesta = inputAnswer.value.trim();

  if (!respuesta) {
    answerError.hidden = false;
    return;
  }
  answerError.hidden = true;

  // 1-2-3. Guardar pregunta y respuesta
  entrevista.push({
    pregunta: PREGUNTAS[preguntaActual],
    respuesta
  });

  // 4. Mostrar visualmente la respuesta del usuario
  const bubble = document.createElement("div");
  bubble.className = "bubble bubble--user";
  bubble.textContent = respuesta;
  chatLog.appendChild(bubble);
  scrollChatToBottom();

  inputAnswer.value = "";

  // 5. Pasar a la siguiente pregunta
  preguntaActual++;

  if (preguntaActual < PREGUNTAS.length) {
    setTimeout(renderPregunta, 350);
  } else {
    updateProgress();
    setTimeout(startAnalysis, 500);
  }
}

/* ----------------------------------------------------------
   PANTALLA 4 — ANÁLISIS + LLAMADA A MAGIC LOOPS
---------------------------------------------------------- */
let analysisInterval = null;

function startAnalysis() {
  goToScreen("analysis");
  runAnalysisMessages();
  callMagicLoops();
}

function runAnalysisMessages() {
  let i = 0;
  analysisMessage.textContent = ANALYSIS_MESSAGES[0];
  clearInterval(analysisInterval);
  analysisInterval = setInterval(() => {
    i = (i + 1) % ANALYSIS_MESSAGES.length;
    analysisMessage.style.opacity = 0;
    setTimeout(() => {
      analysisMessage.textContent = ANALYSIS_MESSAGES[i];
      analysisMessage.style.opacity = 1;
    }, 300);
  }, 1800);
}

async function callMagicLoops() {
  try {
    const response = await fetch(MAGIC_LOOPS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        nombre: nombreUsuario,
        entrevista: entrevista
      })
    });

    if (!response.ok) {
      throw new Error("Respuesta no válida de ML");
    }

    // La API devuelve JSON con la devolución dentro del campo "feedback".
    const data = await response.json();
    const resultado = (data && data.feedback) ? data.feedback : "";

    if (!resultado) {
      throw new Error("La respuesta no contiene el campo feedback");
    }

    clearInterval(analysisInterval);
    resultadoTexto = resultado;
    showResult(resultado);
  } catch (err) {
    clearInterval(analysisInterval);
    goToScreen("error");
  }
}

/* ----------------------------------------------------------
   PANTALLA 6 — RESULTADO
---------------------------------------------------------- */
function showResult(texto) {
  resultText.textContent = texto;
  goToScreen("result");
}

/* ----------------------------------------------------------
   REINTENTAR TRAS ERROR (sin perder respuestas)
---------------------------------------------------------- */
document.getElementById("btnRetry").addEventListener("click", () => {
  startAnalysis();
});

/* ----------------------------------------------------------
   COMPARTIR
---------------------------------------------------------- */
document.getElementById("btnShare").addEventListener("click", async () => {
  const texto = "Acabo de probar el nuevo juego de Rodá 🚀 ¿Rodá me contrataría?";

  if (navigator.share) {
    try {
      await navigator.share({ text: texto, url: window.location.href });
    } catch (err) {
      // el usuario canceló el share, no hacer nada
    }
  } else {
    try {
      await navigator.clipboard.writeText(`${texto} ${window.location.href}`);
      flashShareButton();
    } catch (err) {
      flashShareButton("No se pudo copiar");
    }
  }
});

function flashShareButton(customText) {
  const btn = document.getElementById("btnShare");
  const original = btn.textContent;
  btn.textContent = customText || "¡COPIADO!";
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = original;
    btn.disabled = false;
  }, 1800);
}

/* ----------------------------------------------------------
   VOLVER A INTENTAR (reinicia toda la experiencia)
---------------------------------------------------------- */
document.getElementById("btnRestart").addEventListener("click", () => {
  nombreUsuario = "";
  preguntaActual = 0;
  entrevista.length = 0;
  resultadoTexto = "";

  inputName.value = "";
  chatLog.innerHTML = "";
  progressFill.style.width = "0%";

  goToScreen("start");
});