# CLAUDE.md

Repo: emigreren-naar-frankrijk-beslisboom

## Wat dit is
Beslisboom en scenariocheck voor wie naar Frankrijk wil emigreren, met aanbevolen acties en tools en een dossier als pdf (bron: index.html, titel "Emigreren naar Frankrijk, Scenario Check", en de versie 0.8 in wizard.js en script.js).

## Live adres
Niet in de repo vastgelegd.

## Opbouw
- `index.html`: de werkende pagina, met de vragen (`vragen`) en de logica inline in een `<script>`-blok.
- `wizard.js`, `script.js`, `pdf.js`: losse modules (routing-engine, scoring-engine, pdf-export). `index.html` laadt ze niet; `pdf.js` is nog een plaatshouder die alleen een melding in de pdf zet.
- `tree-config.json`: vragenlijst voor de wizard (door `wizard.js` geladen).
- `missing-tools.json`: lijst met nog ontbrekende modules en hun status.
- `pdf-template.md`: sjabloon voor het emigratiedossier met velden als `{{Leeftijd}}`.

## Techniek
Statische pagina zonder buildstap. Antwoorden worden in de LocalStorage van de browser bewaard (sleutel `migrationState` in `wizard.js`). `pdf.js` importeert jsPDF, maar er is geen package.json.

## Externe diensten en namen van omgevingsvariabelen
- Verwijzingen naar tools op infofrankrijk.com (financieel kompas, onderwijs, taal), service-public.fr en ameli.fr.
- Geen sleutels en geen omgevingsvariabelen.

## Hoe het live gaat
Niet in de repo vastgelegd: geen workflow, geen configuratie voor Pages, Vercel of Netlify.

## Regels en besluiten
Alleen wat in pdf-template.md staat: het dossier heeft zeven delen (persoonlijk profiel, wonen en pand, werk en ondernemerschap, onderwijs en logistiek kinderen, zorg en verzekering, integratie en plan B, wat te doen bij onzekerheden) en noemt als bronankers INSEE, INED, Service-Public, Belastingdienst, URSSAF en CPAM.
Verder: nog geen vastgelegd.

## Laatst nagelopen
Laatst nagelopen: 5 november 2026
