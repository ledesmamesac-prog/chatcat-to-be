import {
  regexPresentAffirmative,
  regexPresentNegative,
  regexPresentQuestion,
  regexPastAffirmative,
  regexPastNegative,
  regexPastQuestion
} from './regex.js';

const chatbox = document.getElementById("chatbox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const reactionTense = document.getElementById("reaction-tense");
const reactionType = document.getElementById("reaction-type");
const mascotText = document.getElementById("mascotText");
const chatCat = document.getElementById("chatCat");

let chosenTense = null;
let chosenType = null;
let userName = null;

// Cambiar la expresión del gato
function changeCat(expression) {
  const expressions = {
    happy: "./assets/cat_happy.png",
    sad: "./assets/cat_sad.png",
    thinking: "./assets/cat_thinking.png"
  };
  chatCat.src = expressions[expression];
}

// Al iniciar el chat pedimos el nombre
window.addEventListener("DOMContentLoaded", () => {
  mascotText.innerText = "👋 Hi! What's your name?";
  userInput.disabled = false;
  sendBtn.disabled = false;
});

// === Añadir mensajes al chat ===
function addMessage(message, sender) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add(sender === "bot" ? "bot-message" : "user-message");
  msgDiv.innerText = message;
  chatbox.appendChild(msgDiv);
  chatbox.scrollTop = chatbox.scrollHeight;
}

// === Validación con tus regex (sin cambios a regex.js) ===
function validateSentence(sentence) {
  if (chosenTense === "present") {
    if (chosenType === "affirmative" && regexPresentAffirmative.test(sentence)) return "✅ Correct present affirmative sentence.";
    if (chosenType === "negative" && regexPresentNegative.test(sentence)) return "✅ Correct present negative sentence.";
    if (chosenType === "question" && regexPresentQuestion.test(sentence)) return "✅ Correct present question.";
  } else if (chosenTense === "past") {
    if (chosenType === "affirmative" && regexPastAffirmative.test(sentence)) return "✅ Correct past affirmative sentence.";
    if (chosenType === "negative" && regexPastNegative.test(sentence)) return "✅ Correct past negative sentence.";
    if (chosenType === "question" && regexPastQuestion.test(sentence)) return "✅ Correct past question.";
  }
  return "❌ Invalid sentence.";
}

// === Selección de tiempo ===
reactionTense.addEventListener("click", (e) => {
  if (e.target.tagName === "BUTTON") {
    chosenTense = e.target.dataset.tense;
    mascotText.innerText = `Great! You chose ${chosenTense.toUpperCase()}.\nNow select the type of sentence:`;
    reactionTense.style.display = "none";
    reactionType.style.display = "flex";
  }
});

// === Selección de tipo ===
reactionType.addEventListener("click", (e) => {
  if (e.target.tagName === "BUTTON") {
    chosenType = e.target.dataset.type;
    mascotText.innerText = `Perfect! You chose ${chosenType.toUpperCase()}.\nNow write a ${chosenTense} ${chosenType} sentence in the chat.`;
    reactionType.style.display = "none";
    userInput.disabled = false;
    sendBtn.disabled = false;
  }
});

// === Envío de mensaje ===
function sendMessage() {
  const sentence = userInput.value.trim();
  if (!sentence) return;

  addMessage(sentence, "user");

  // Si no tenemos nombre aún, lo pedimos primero
  if (!userName) {
    userName = sentence.charAt(0).toUpperCase() + sentence.slice(1);
    addMessage(`Nice to meet you, ${userName}! 😃`, "bot");
    mascotText.innerText = `${userName}, do you want to practice Present or Past sentences?`;
    reactionTense.style.display = "flex";
    userInput.disabled = true;
    sendBtn.disabled = true;
    userInput.value = "";

    // Cambiar sprite a feliz al saludar
    changeCat("happy");
    return;
  }

  // --- Flujo normal después de tener nombre ---
  let response = validateSentence(sentence);

  if (response.includes("❌")) {
    response = analyzeErrors(sentence);
  }

  // ⬇️ Aquí decides la expresión del gato según la respuesta
  if (response.includes("✅")) {
    changeCat("happy");
  } else if (response.includes("❌")) {
    changeCat("sad");
  } else {
    changeCat("thinking");
  }

  // Personalizar respuesta con el nombre
  addMessage(`${userName}, ${response}`, "bot");

  setTimeout(() => {
    mascotText.innerText = `Do you want to try again, ${userName}? Choose Present or Past:`;
    reactionTense.style.display = "flex";
    chosenTense = null;
    chosenType = null;
    userInput.disabled = true;
    sendBtn.disabled = true;

    // Mientras espera al usuario → expresión "pensando"
    changeCat("thinking");
  }, 2000);

  userInput.value = "";
}


sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});


/* === analyzeErrors: detecta múltiples fallos y construye una sugerencia ===
   Heurística práctica: intenta detectar mayúscula, puntuación, estructura (pregunta vs afirmación),
   forma del verbo según sujeto y tiempo, presencia de "not" para negativos, existencia de complemento,
   y validez del sujeto (según las reglas que usaste en regex: pronombres, The + noun, demostrativos, nombres propios).
*/
function analyzeErrors(sentence) {
  const errors = [];
  let corrected = sentence.trim();

  if (!chosenTense || !chosenType) {
    return "❌ Choose tense and sentence type first (left panel).";
  }

  // 1) Mayúscula inicial
  if (corrected[0] && corrected[0] !== corrected[0].toUpperCase()) {
    errors.push("The sentence must start with a capital letter.");
    corrected = corrected[0].toUpperCase() + corrected.slice(1);
  }

  // 2) Puntuación final esperada según chosenType
  const endsQuestion = /[?]$/.test(sentence);
  const endsPeriod = /[.]$/.test(sentence);
  if (chosenType === "question") {
    if (!endsQuestion) {
      errors.push("A question must end with a question mark (?).");
      corrected = corrected.replace(/[.?]?$/, "?");
    }
  } else {
    if (!endsPeriod) {
      errors.push("An affirmative/negative sentence must end with a period (.).");
      corrected = corrected.replace(/[?.]?$/, ".");
    }
  }

  // 3) Tokenizar sin la puntuación final
  const stripped = corrected.replace(/[?.]$/, "").trim();
  const tokens = stripped.length ? stripped.split(/\s+/) : [];

  // be-verb list
  const beList = ["am", "is", "are", "was", "were"];
  // helper: primer token en minúsculas
  const firstLower = tokens[0] ? tokens[0].toLowerCase() : "";

  // 4) Determinar estructura y extraer sujeto, verbo y complemento (heurística)
  let subjectPhrase = "";
  let verbToken = "";
  let complementTokens = [];

  if (chosenType === "question") {
    // Esperamos: Verb Subject Complement -> e.g. "Is the cat happy"
    if (beList.includes(firstLower)) {
      // estructura pregunta real
      verbToken = tokens[0];
      // sujeto: si hay determinante como "the/a/an/this/that/these/those", incluir siguiente palabra
      if (tokens.length >= 3 && ["the", "a", "an", "this", "that", "these", "those"].includes(tokens[1].toLowerCase())) {
        subjectPhrase = tokens.slice(1, 3).join(" ");
        complementTokens = tokens.slice(3);
      } else {
        subjectPhrase = tokens[1] || "";
        complementTokens = tokens.slice(2);
      }
    } else {
      // El usuario escribió una afirmación pero eligió "question" — intentamos inferir sujeto/verb
      const verbIndex = tokens.findIndex(t => beList.includes(t.toLowerCase()));
      if (verbIndex >= 0) {
        subjectPhrase = tokens.slice(0, verbIndex).join(" ");
        verbToken = tokens[verbIndex];
        complementTokens = tokens.slice(verbIndex + 1);
      } else {
        // no encontramos verbo -> asumimos sujeto primer token
        subjectPhrase = tokens[0] || "";
        verbToken = "";
        complementTokens = tokens.slice(1);
      }
    }
  } else {
    // chosenType es affirmative o negative -> esperamos: Subject Verb Complement
    const verbIndex = tokens.findIndex(t => beList.includes(t.toLowerCase()));
    if (verbIndex >= 0) {
      subjectPhrase = tokens.slice(0, verbIndex).join(" ");
      // incluir "not" si está justo después del verbo en el token original
      verbToken = tokens[verbIndex] + (tokens[verbIndex + 1] && tokens[verbIndex + 1].toLowerCase() === "not" ? " not" : "");
      const startComp = tokens[verbIndex + 1] && tokens[verbIndex + 1].toLowerCase() === "not" ? verbIndex + 2 : verbIndex + 1;
      complementTokens = tokens.slice(startComp);
    } else {
      // no encontramos verbo -> posible estructura pregunta con verb al inicio
      if (beList.includes(firstLower)) {
        // ejemplo: "Is the car happy" (pregunta escrita aunque chosenType no es question)
        verbToken = tokens[0];
        if (tokens.length >= 3 && ["the", "a", "an", "this", "that", "these", "those"].includes(tokens[1].toLowerCase())) {
          subjectPhrase = tokens.slice(1, 3).join(" ");
          complementTokens = tokens.slice(3);
        } else {
          subjectPhrase = tokens[1] || "";
          complementTokens = tokens.slice(2);
        }
      } else {
        // no hay verbo — asumimos primer token sujeto
        subjectPhrase = tokens[0] || "";
        verbToken = "";
        complementTokens = tokens.slice(1);
      }
    }
  }

  // Helpers para decisión de verbo esperado según sujeto y tense
  const pronouns = ["I","You","He","She","It","We","They"];
  const subjFirstWord = subjectPhrase.split(" ")[0] || "";
  const subjFirstLower = subjFirstWord.toLowerCase();

  // decidir verbo esperado
  let expectedVerb = "";
  if (pronouns.map(p => p.toLowerCase()).includes(subjFirstLower)) {
    // map pronombres
    const subjCapital = subjFirstWord[0] ? subjFirstWord[0].toUpperCase() + subjFirstWord.slice(1).toLowerCase() : subjFirstWord;
    const presentMap = { I: "am", You: "are", He: "is", She: "is", It: "is", We: "are", They: "are" };
    const pastMap =    { I: "was", You: "were", He: "was", She: "was", It: "was", We: "were", They: "were" };
    expectedVerb = chosenTense === "present" ? (presentMap[subjCapital] || "is") : (pastMap[subjCapital] || "was");
  } else {
    // si sujeto empieza por demostrativo plural o el sustantivo final acaba en 's' -> plural heurístico
    const firstLower = subjFirstWord.toLowerCase();
    const lastWord = subjectPhrase.split(" ").slice(-1)[0] || "";
    const isPluralDemo = ["these","those"].includes(firstLower);
    const isPluralNoun = lastWord.toLowerCase().endsWith("s") && lastWord.length > 1;
    if (isPluralDemo || isPluralNoun) {
      expectedVerb = chosenTense === "present" ? "are" : "were";
    } else {
      expectedVerb = chosenTense === "present" ? "is" : "was";
    }
  }

  // 5) Comprobaciones concretas y acumulación de errores

  // 5.a Verbo presente en la frase (sin "not")
  const verbWithoutNot = (verbToken || "").split(" ")[0] || "";
  if (verbWithoutNot && verbWithoutNot.toLowerCase() !== expectedVerb.toLowerCase()) {
    errors.push(`Wrong verb form: expected "${expectedVerb}" for subject "${subjectPhrase.split(" ")[0] || subjectPhrase}".`);
  }

  // 5.b Si es negativo -> presencia de "not"
  if (chosenType === "negative") {
    // detectar si la frase tiene 'not' junto al verbo o en tokens posteriores
    const hasNot = /\bnot\b/i.test(sentence);
    if (!hasNot) {
      errors.push('Negative sentence must contain "not" after the verb (e.g., "is not").');
    }
  }

  // 5.c Existe complemento?
  if (!complementTokens || complementTokens.length === 0) {
    errors.push("Sentence should include a complement (e.g., 'happy', 'a teacher', 'from Cartagena').");
  }

    // 5.d Sujeto válido (según reglas mejoradas)
  const subjTrim = subjectPhrase.trim();

  // Listas aceptadas
  const validPronouns = ["I","You","He","She","It","We","They"];
  const validDeterminers = ["The","This","That","These","Those","A","An"];

  // Tokenizar el sujeto
  const subjParts = subjTrim.split(" ");
  const firstWord = subjParts[0] || "";

  let isValidSubject = false;

  // Caso 1: pronombre
  if (validPronouns.includes(firstWord)) {
    isValidSubject = true;
  }

  // Caso 2: determinante + sustantivo (acepta plurales y adjetivos intermedios)
  else if (validDeterminers.includes(firstWord) && subjParts.length > 1) {
    // Ejemplo válido: "The car", "The boys", "Those smart students"
    isValidSubject = /^[A-Za-z]+( [A-Za-z]+)*$/.test(subjParts.slice(1).join(" "));
  }

  // Caso 3: nombre propio (única palabra con mayúscula inicial, ej: "Diego")
  else if (/^[A-Z][a-z]+$/.test(subjTrim) && subjParts.length === 1) {
    isValidSubject = true;
  }

  if (!isValidSubject) {
    errors.push(`Subject "${subjTrim}" may be invalid. Use pronouns, "The + noun", demonstratives, or proper names.`);
  }


  // 6) Construir sugerencia corregida (aplica todas las correcciones detectadas)
  const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);
  const subjectForCorr = subjTrim ? capitalize(subjTrim) : "";
  const complementForCorr = (complementTokens || []).join(" ").trim() || "something";

  let suggested = "";
  if (chosenType === "question") {
    // pregunta: Verb Subject Complement?
    const verbCap = expectedVerb.charAt(0).toUpperCase() + expectedVerb.slice(1);
    suggested = `${verbCap} ${subjTrim} ${complementForCorr}`.trim() + "?";
  } else if (chosenType === "negative") {
    // negativo: Subject expectedVerb not Complement.
    // cuidado con "I am not" vs "He is not"
    suggested = `${subjectForCorr} ${expectedVerb} not ${complementForCorr}`.trim() + ".";
  } else {
    // afirmativo: Subject expectedVerb Complement.
    suggested = `${subjectForCorr} ${expectedVerb} ${complementForCorr}`.trim() + ".";
  }

  // limpiar espacios dobles
  suggested = suggested.replace(/\s+/g, ' ');

  // 7) Resultado final: lista de errores + sugerencia
  if (errors.length === 0) {
    // Raro: no hay errores pero la regex no validó. Aún así devolvemos una sugerencia.
    return `❌ Invalid sentence according to the rules. Suggested: ${suggested}`;
  }

  return `❌ Errors found:\n- ${errors.join("\n- ")}\n👉 Suggestion: ${suggested}`;
}
