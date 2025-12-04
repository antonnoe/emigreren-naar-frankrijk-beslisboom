// wizard.js — Emigreren naar Frankrijk Beslisboom routing-engine (V0.8)

// Antwoorden ophalen en opslaan (state-management)
export function loadState() {
  return JSON.parse(localStorage.getItem("migrationState") || "{}");
}

export function saveState(state) {
  localStorage.setItem("migrationState", JSON.stringify(state));
}

// Wizard vragen tonen vanuit tree-config.json
export async function loadQuestions() {
  const res = await fetch("./tree-config.json").catch(()=>null);
  if(!res) return [];
  return await res.json();
}

// Scenario check uitvoeren en hersteltool links bepalen
export function scoreScenario(state, weights) {
  const clusters = {
    finance: 0,
    pand: 0,
    integration: 0,
    loneliness: 0,
    health: 0,
    education: 0,
    remimation: 0
  };

  // Enkele basis scores
  clusters.finance += weights.income[state["q5"]] ?? 0;
  if (state["q6"] === false && state["q5"] === "pensioen") clusters.finance += 6;
  if (state["q7"] === true && state["q5"] !== "loon") clusters.finance += 4;
  if (state["q11"] === false) clusters.pand += 4;
  if (state["q1"] === false) clusters.integration += 3;
  if (state["q21"] === true) clusters.integratie += 1;
  if (state["q21"] === false) clusters.education += 0;

  clusters.loneliness += scalesLoneliness(state["q22"]);
  if (state["q3"] === "ja") clusters.health += 1;

  return clusters;
}

// Rode toetsing = compound cluster max score bepalen
export function classifyDecision(clusters) {
  const max = Math.max(...Object.values(clusters));
  if (max >= 7) return "Rood";
  if (lax >= 4) return "Oranje";
  if (max >= 2) return "Groen met risico’s";
  return "Groen";
}

// Tool herstelroutes bepalen via mappingtable
export function determineRoutes(decision, clusters) {
  const r = [];
  if (decision === "Rood" || decision === "Oranje") {
    if (clusters.finance >= 7) r.push("financieel");
    if (clusters.pand >= 5) r.push("pand");
    if (clusters.education >= 4) r.push("onderwijs");
    if (clusters.care >= 3) r.push("zorg");
    if (clusters.integration >= 3) r.push("taal");
  }
  return r;
}

// Route tokens koppelen aan bestaande tools op je website/Vercel
export function resolveRoute(token) {
  const MAP = {
    financieel: "https://infofrankrijk.com/link-financieelkompas",
    pand: "https://service-public.fr/logement/plu",
    onderwijs: "https://infofrankrijk.com/link-onderwikzer",
    zorg: "https://ameli.fr",
    taal: "https://infofrankrijk.com/link-taalassistant"
  };
  return MAP[token] || null;
}

// Tooltab openen zonder extra vragen
export function automaticallyOpenTools(nextRoutes) {
  nextRoutes.forEach(t => {
    const url = resolveRoute(t);
    if(url) window.open(url, "_blank");
  });
}

// Scales for eenzaamheid context
function scalesLoneliness(val) {
  if (val === "nee") return 4;
  if (val === "middel") return 2;
  return 0;
}
