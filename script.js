// script.js — Emigreren naar Frankrijk compound impact scoring engine V0.8

const SCORE_LIMITS = { red: 7, orange: 4, caution: 2 };

// Gewichten voor enkele antwoorden
const WEIGHTS = {
  income: { loon: 0, pensioen: 2, vermogen: 3, lijfrente: 4, onderneming: 2, seizoen: 5, anders: 2, "n.v.t.": 0 },
  rib: { ja: 0, nee: 2, "n.v.t.": 0 },
  plu: { ja: 0, nee: 3, "n.v.t.": 0 },
  housing: { "huren": 1, "kopen": 2, "eerst huren→kopen": 3, "onzeker": 2, "n.v.t.": 0 },
  care: { "via baan": 1, "via verdrag": 2, "via onderneming": 3, "nee": 4, "n.v.t.": 0 },
  distance: { "ja <25": 0, "ja 25–35": 1, "nee >35": 3, "n.v.t.": 0 }
};

// Combinatie-impactscore
function comboImpact(...vals) {
  return vals.reduce((a,v)=>a+(v||0),0);
}

// Compound wegingregels per cluster
export function calculateOutcome(inputs) {
  const c = { finance: 0, pand: 0, education: 0, care: 0, integration: 0 };

  // Basisweging
  c.finance += WEIGHTS.income[inputs.q5] ?? 0;
  c.pand += WEIGHTS.plu[inputs.q11] ?? 0;
  c.education += WEIGHTS.distance[inputs.q14] ?? 0;
  c.care += WEIGHTS.care[inputs.q17] ?? 0;
  if (inputs.q3 === false) c.integration += 2;

  // --- Compound combinaties (silent, geen extra UI, geen duplicatie) ---
  // 1. Pensioen-zonder-FR-doorrekening paradox
  if (inputs.q5 === "pensioen" && inputs.q6 === false) {
    c.finance += 6;
    c.integration += 1;
  }

  // 2. Dubbele woonlasten + hoofdbeslissing + buffer
  if (inputs.q9 === false) {
    c.remigration = comboImpact(
      WEIGHTS.housing[inputs.q9],
      inputs.q7 === true ? 2 : 0
    );
    c.pand += 2;
  }

  // 3. PLU niet gecheckt + ondernemen ambitie
  if (inputs.q11 === false && inputs.q15 === "micro-entreprise") {
    c.pand += 4;
    c.finance += 1;
  }

  // 4. Integratie lastig + afstanden >35m winter-proof?
  if (inputs.q14 === "nee >35") {
    c.education += 2;
    c.integration += 3;
  }

  // 5. Zorgpad zorgelijk + inkomen onzeker + geen remigratie-buffer
  if (c.care >= 3 && c.finance >= 5 && inputs.q24 === "nee") {
    c.finance += 2;
    c.remignation += 2;
  }

  // 6. Kapitaal ineens opnemen *zonder* woonlasten draagbaar
  if (inputs.q7 === true && inputs.q9 === false) {
    c.finance += 5;
    c.pand += 1;
    c.integration += 1;
  }

  // 7. Kinderen n.v.t. → onderwijs score dempen (niet afstraffen)
  if (inputs.q21 === false || inputs.q21 === "n.v.t.") {
    c.education = Math.max(0, c.education - 2);
  }

  // 8. Remigratie vraag specifiek
  let remigration_penalty = 0;
  if (inputs.q24 === "nee" && inputs.q21 === true) remigration_penalty = 2;
  if (inputs.q24 === "nee" && inputs.q21 === false) remigration_penalty = 1;
  c.remigration += remigration_penalty;

  // --- Classificatie ---
  const maxCluster = Math.max(...Object.values(c));
  const decision = classify(maxCluster);

  // --- Herstelroutes naar instrumenten op basis van flags ---
  const restoreRoutes = restoreToolRoutes(decision, c);

  return { decision, clusters: c, restoreRoutes };
}

// Score classificatie op basis van compound combinaties
function classify(maxScore) {
  if (maxScore >= SCORE_LIMITS.red) return "Rood – use correctietools";
  if (maxScore >= SCORE_LIMITS.orange) return "Oranje – use correctietools";
  if (maxScore >= SCORE_LIMITS.caution) return "Groen met risico’s";
  return "Groen";
}

// Tool-routing (herstelpad) mappingtable
function restoreToolRoutes(decision, clusters) {
  const r = [];

  if (decision.includes("Rood") || decision.includes("Oranje")) {
    if (clusters.finance >= 7) r.push("Financieel Kompas");
    if (clusters.pand >= 5) r.push("PLU scanner");
    if (clusters.education >= 4) r.push("Schooltijden & afstand");
    if (clusters.integration >= 3) r.push("Taalassistent");
    if (clusters.loneliness >= 2) r.push("NederFr Relais verenigingen");
    if (clusters.care >= 3) r.push("France Service locale");
  }

  return r;
}

// Silent inventory updater (voor missing-tools.json in V0.8)
export function updateMissingToolsInventory(inputs, clusters) {
  const file = "/missing-tools.json";
  let inv = {};
  try { inv = JSON.parse(localStorage.getItem("missingTools")||"{}"); } catch {}
  if (!inputs.q12) inv["Pandbestemming-scan"] = "planned-v2";
  if (clusters.care >= 3) inv["Specialist-spoed afstand-calculator"] = "missing";
  localStorage.setItem("missingTools", JSON.stringify(inv));
}
