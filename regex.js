// ====== SUJETOS ======
// Pronombres personales
const pronouns = "(I|You|He|She|It|We|They)";

// Sustantivos con artículo definido
const commonNouns = "(The [a-z]+)";

// Demostrativos + sustantivo
const demonstratives = "((This|That) [a-z]+|(These|Those) [a-z]+)";

// Nombre propio (primera letra mayúscula)
const properNouns = "([A-Z][a-z]+)";

// Unión de sujetos válidos
const subjects = `(${pronouns}|${commonNouns}|${demonstratives}|${properNouns})`;


// ====== VERBO TO BE ======
// Presente
const bePresent = "(am|is|are)";
const bePresentNeg = "(am not|is not|are not)";

// Pasado
const bePast = "(was|were)";
const bePastNeg = "(was not|were not)";


// ====== COMPLEMENTO ======
const complement = "([a-zA-Z]+( [a-zA-Z]+)*)"; // ej: happy, a good student


// ====== ORACIONES ======

// PRESENT
const regexPresentAffirmative = new RegExp(`^${subjects} ${bePresent} ${complement}\\.$`, "i");
const regexPresentNegative   = new RegExp(`^${subjects} ${bePresentNeg} ${complement}\\.$`, "i");
const regexPresentQuestion   = new RegExp(`^${bePresent} ${subjects} ${complement}\\?$`, "i");

// PAST
const regexPastAffirmative = new RegExp(`^${subjects} ${bePast} ${complement}\\.$`, "i");
const regexPastNegative   = new RegExp(`^${subjects} ${bePastNeg} ${complement}\\.$`, "i");
const regexPastQuestion   = new RegExp(`^${bePast} ${subjects} ${complement}\\?$`, "i");


export {
  regexPresentAffirmative,
  regexPresentNegative,
  regexPresentQuestion,
  regexPastAffirmative,
  regexPastNegative,
  regexPastQuestion
};
