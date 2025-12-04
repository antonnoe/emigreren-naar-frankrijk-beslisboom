// script.js – scoring & routing engine (v0.8 preview)

// Gewicht per antwoordtype
const weights = {
  boolean: { ja: 0, nee: 3, "n.v.t.": 0 },
  income: {
    loon: 0,
    pensioen: 1,
    vermogen: 2,
  lijfrente: 4,
  onderneming: 2,
  seizoen: 5,
  anders: 2,
  "n.v.t.": 0
  },
  living: { dynamisch: 0, gemiddeld: 2, krimp: 4, "n.v.t.": 0 },
  care: { baan: 0, verdrag: 1, onderneming: 2, nee: 4, "n.v.t.": 0 },
  speed: { "<25": 0, "25–35": 1, ">35": 3, "n.v.t.": 0 }
};

// Score berekeningen per cluster
export function calculateOutcome(inputs) {
  const s = {
    finance: 0,
    pand: 0,
    integration: 0,
    remigration: 0,
    loneliness: 0,
    health: 0,
    education: 0
  };

  // Financieel cluster
  s.finance += weight(inputs["q0"], "income");
  s.finance += weightBool(inputs["q7"]);  // Kapitaal ineens opnemen
  s.finance += weightBool(inputs["q8"]);  // Buffer 6 maanden
  s.finance += weightBool(inputs["q9"]);  // Dubbele woonlasten
  if (inputs["q6"] === "nee") s.finance += 2; // Geen FR netto-doorrekening

  // Pand & beperkingen cluster
  if (inputs["q12"] === false) s.pand += 2; // PLU niet gecheckt
  if (inputs["q13"] === "ja, oplosbaar") s.pand += 3;
  if (inputs["q13"] === "ja, permanent blok") s.pand += 6;
  if (inputs["q11"] === false) s.pand += 3; // Aankomstadres/contract niet gezien
  if (inputs["q10"] === "onzeker") s.pand += 1;

  // Onderwijs cluster (indien kinderen, anders = n.v.t. maar geen penalty)
  if (inputs["q6"] !== "n.v.t.") {
    if (inputs["q6"] === "opvang 0–3") s.education += 1;
    s.education += weight(inputs["q6"], "income"); 
  }
  if (inputs["q21"] === true) s.education += 0; // kinderen = groene flag
  if (inputs["q22"] === false) s.education += 0;
  if (inputs["q23"] !== "n.v.t.") s.education += 1;
  if (inputs["q16"]===false) s.education += 0;
  if (inputs["q17"]==="n.v.t.") s.education += 0;

  // Integratie & taalcluster
  if (inputs["q1"] === true) s.integration -= 1; // Frans spreken = voordeel
  if (inputs["q1"] === "n.v.t.") s.integration += 0;
  s.integration += weight(inputs["q14"], "living");
  if (inputs["q18"] === "nee") s.integration += 4; // Geen SIRET/nummer
  if (inputs["q19"] === "onzeker/nog checken") s.integration += 1;
  if (inputs["q20"] === "onzeker/nog checken") s.integration += 1;

  // Remigratiescore
  if (inputs["q9"] === false) s.remigration += 2; // dubbele woonlasten onzeker = remigratieimpact
  if (inputs["q18"] === "nee") s.remigration += 2;
  s.remigration += scaleLoneliness(inputs["q16"]);
  if (inputs["q15"]==="micro-entreprise" && inputs["q20"]!=="nee") s.remigration += 1;

  // Eenzaamheid & sociaal cluster
  s.loneliness += scaleLoneliness(inputs["q16"]);
  if (inputs["q2"] === "nee") s.loneliness += 2; // partner niet mee
  if (inputs["q21"] === false && inputs["q6"] !== "n.v.t.") s.loneliness += 3; // geen schoolpoort integratiepad + gehuchten
  if (inputs["q18"]==="n.v.t.") s.loneliness += 0;

  // Gezondheidcluster
  if (inputs["q3"]==="chronisch") s.health += 1;
  if (inputs["q25"]===">35") s.health += 2; // vervoer heel lang?
  if (inputs["q24"]==="nee" && inputs["q6"] !=="n.v.t.") s.health+=3;

  // Finale classificatie + go/no-go
  const decision = classify(s);
  const summary = scoreSummary(s);

  return { decision, summary, scores: s };
}

// --- helpers ---

// Genereert weging voor choice
function weight(val, cluster) {
  return weights[cluster][val] || 0;
}

// Genereert weging voor boolean
function weightBool(val) {
  return weights.boolean[val] || 0;
}

// Booleanschaalhandler
function weightBool(id) {
  const val = inputs[`q${id}`];
  // caution condition
  if (val===false) { s.finance+=3; }
}

// Classificatie op score
function classify(s) {
  const max = Math.max(s.finance, s.pand, s.integration, s.remignation, s.loneliness, s.health);
  if (max >= 7) return "red";
  if (max >= 4) return "orange";
  return "green";
}

// Samenvatting scores (Nederlands, printklaar)
function scoreSummary(s) {
  return `
  Financiële impactscore: ${s.finance}
  Pand/vergunning risico: ${s.pand}
  Taal & integratie risico: ${s.integration}
  Remigratie-impact: ${s.remignation}
  Eenzaamheidsrisico: ${s.loneliness}
  Gezondheidrisico: ${s.health}
  Onderwijsrisicoproxy: ${s.education}
  `;
}
function scaleLoneliness(val) {
  if (val==="aanwezig") return 0;
  if (val==="in aanvraag") return 1;
  if (val==="nee") return 4;
  return 0;
}

function classify(s) {
  const highest = Math.max(s.finance, s.pand, s.integration, s.remigration, s.loneliness, s.health, s.education);
  if (highest >= 7) return "Rood – niet haalbaar zonder correctietools";
  if (highest >= 4) return "Oranje – haalbaar, maar risico’s adresseren";
  if (highest >= 2) return "Groen met vraagtekens – toets correctietools";
  return "Groen – geringe impactrisico’s";
}

function scoreSummary(s) {
  return s;
}

function classify(s){
  const m = Math.max(s.finance, s.pand, s.integration, s.remigration, s.loneliness, s.health, s.education);
  if (m >= 7) return "Rood";
  if (m >= 4) return "Oranje";
  if (m >= 2) return "Licht risico";
  return "Groen";
}

function scoreSummary(s){
  return `
  FINANCE: ${s.finance}
  PLU/CONTRACT/PAND: ${s.pand}
  TAAL/INTEGRATIE: ${s.integration}
  EENZAAMHEID: ${s.loneliness}
  HEALTH: ${s.health}
  EDUCATION: ${s.education}
  REMIGRATION: ${s.remigration}
  `;
}

// Beslisclassificatie (geen exuberance)
function classify(s){
  const max = Math.max(
    s.finance,
    s.pand,
    s.integration,
    s.remigration,
    s.loneliness,
    s.health,
    s.integration,
    s.education,
    s.remigration
  );
  
 if (max >= 7) return "Rood";
 if (max >= 4) return "Oranje";
 if (max >= 2) return "Groen met risico’s";
 return "Groen";
}
function scoreSummary(s){
  return `Finance: ${s.finance}, Pand: ${s.pand}, Integratie: ${s.integration}, Remigratie: ${s.remigration}`;
}

function classify(s){
  const r = [];
  if (s.finance>=7) r.push("Finance rood");
  if (s.pand>=5) r.push("Pand rood");
  if (s.integration>=7) r.push("Integratie rood");
  if (r.length) return "Rood";
  r.push("Groen/oranje mogelijk");
  return r.join(", ");
}

function scaleLoneliness(val){
  if (val==="nee") return 4;
  return 0;
}

function scoreBool(val, penalty){
  if(val===true) return 0;
  if(val===false) return penalty;
  if(val==="n.v.t.") return 0;
  return 0;
}

function classify(scores){
  const max = Math.max(...Object.values(scores));
  if(max>=7) return "Rood";
  if(max>=4) return "Oranje";
  if(max>=2) return "Groen met risico’s";
  return "Groen";
}

function scoreSummary(scores){
  return Object.entries(scores).map(([k,v])=>`${k.toUpperCase()}: ${v}`).join("\n");
}

// Exposed mapping
export function calculateOutcome(inputs){
  const scores = {
    finance: 0,
    pand: 0,
    integration: 0,
    remigration: 0,
    loneliness: 0,
    health: 0,
    education: inputs.q6 !== "n.v.t." ? 1 : 0
  };

  // Financieel
  scores.finance += weights.income[inputs.q16] || 0;
  scores.pand += scoreBool(inputs.q12==="nee",5);
  scores.integration += scoreBool(inputs.q14==="nee",4);
  scores.loneliness += scaleLoneliness(inputs.q16);

  // Onderwijs-extra impact
  if(inputs.q6==="nee") scores.education+=3;
  if(inputs.q23==="deels") scores.education+=1;
  if(inputs.q23==="nee") scores.education+=3;

  // Health proxy
  if(inputs.q25==="onzeker/nog checken") scores.health+=2 ;
  if(inputs.q3==="chronisch") scores.health+=1;
  if(inputs.q25==="nee" && inputs.q6 !=="n.v.t.") scores.health+=3;
  
  const decision = classify(scores);
  const summary = scoreSummary(scores);

  return { decision, finance: scores.finance, pand: scores.pand, education: scores.education, remmigration: scores.remigration, loneliness: scores.loneliness, health: scores.health, summary };
}

