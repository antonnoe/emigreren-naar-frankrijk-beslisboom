
// migration SQL pad placeholder
export function calculateOutcome(state) {
  const score = { leefbudget:0, pand:0, gezin:0, taal:0 };
  // voorbeeldscore:
  if (state.inkomen==="seizoen") score.leefbudget+=2;
  if (state.buffer===false) score.leefbudget+=5;
  if (state.taStart<"A2") score.taal+=3;
  if (state.pandBeperking==="ja, permanent blok") score.pand+=5;
  const decision = (score.leefbudget>7 || score.pand>3 || score.taal>4) ? "Rood" : "Groen/Oranje";
  return { score, decision };
}

export function generateActions(state, outcome) {
  return conditionalConnections[state.workStatue] || [];
}

export function conditionalConnections(state) {
  return {};
}
