# STATUS.md — GeoIntel · Reader

Stato corrente del Reader e prossimi step concordati. Questo file cambia ad
ogni release.

**Ultima versione deployata**: v0.8.0
**Ultimo aggiornamento**: 2026-04-20

---

## 1. Versione corrente — v0.8.0

Release con IA rework. Deployata su Vercel via merge su `main`.

### 1.1 Architettura file

- **3 file di codice + 1 asset dati in root**:
  - `index.html` — shell HTML + CSS completo.
  - `data.js` — mock data (dossier, entità, archi, eventi, report,
    descrizioni cluster/dossier).
  - `app.js` — logica di routing, rendering, interazioni.
  - `world-110m.json` — basemap (Natural Earth 110m land polygons,
    minified a array di ring, ~75 KB).
- Nessun framework, nessun build step. Pubblicato staticamente.

### 1.2 Routing

- Hash-based, tre route:
  - `#` (default) — working surface, right side in Atlas ambient (empty
    state).
  - `#atlas-full` — vista Atlas a schermo intero.
  - `#report/<dossier-id>` — working surface, right side popolato con
    graph + intel + report del dossier.
- `#atlas` e `#dossier/<id>` (legacy v0.7) → alias gestiti dal router.

### 1.3 Working surface (schermata principale)

Layout a 2 zone:

- **Chat panel** (340px, sinistra, sempre presente): greeting AI nello
  stato vuoto; chat del dossier nello stato popolato. Input disabled
  con hint "Chat activation in v0.9.0".
- **Right area** (flex 1, destra): Atlas ambient nello stato vuoto;
  graph/intel upper-strip + report panel nello stato popolato.

### 1.4 Atlas ambient

Sfondo della right-area quando non c'è ancora un report. Mostra mappa
reale (Natural Earth), cluster markers, orbital ring per dossier
trans-geografici. Non cliccabile come router. Bottone "Expand" in header
porta a `#atlas-full`.

### 1.5 Atlas full

Vista a schermo intero accessibile da Expand. Caratteristiche:

- 3 stati LOD **discreti** (world / region / dossier-detail), commutabili
  da barra LOD in alto-sinistra.
- Click su cluster → apre info sheet laterale + zooma a region LOD.
- Click su dossier (orbital o region marker) → apre info sheet + zooma
  a dossier-detail LOD.
- Info sheet: descrizione, meta (stats), bottone "Ask about this" che
  chiude Atlas, torna a working surface e carica `#report/<dossier-id>`
  del dossier corrispondente (scorciatoia v0.8.0, sostituita in v0.9.0
  dal flusso chat-driven).
- Topbar: "← Back" torna a working surface.

### 1.6 Basemap reale

Natural Earth 110m land polygons, 127 polygons, ~5100 punti totali,
proiettati via Equal Earth esistente. Sostituisce i 6 poligoni
hand-drawn di v0.7. Polygons che attraversano l'antimeridiano (> 180°
di range longitudinale) vengono skippati per evitare artefatti.

### 1.7 Dossier mock implementati

Tre dossier in `data.js` (invariati da v0.7):

- `iran-hormuz` (Middle East).
- `taiwan-strait` (East Asia).
- `ai-us-china` (trans-geografico, orbital ring).

Ora con `description` sul cluster e sul dossier per l'info sheet.

### 1.8 Topbar

- Brand — link a `#` (working surface empty).
- Working surface: topbar minimale, opzionalmente "DOSSIER · TITLE" pill
  nel centro quando popolato.
- Atlas full: "← Back" a sinistra, "Atlas · LOD" breadcrumb centrale.
- Icon-buttons: export, share, settings (non funzionanti).

---

## 2. Cosa è implementato e cosa no

### 2.1 Implementato

- Working surface con stato vuoto (Atlas ambient) e popolato
  (graph/intel/report).
- Atlas full con 3 LOD states, markers cluster/dossier/orbital
  cliccabili, info sheet laterale animato, bottone "Ask about this" che
  popola il working surface.
- Basemap reale Natural Earth 110m con proiezione Equal Earth.
- Routing `#`, `#atlas-full`, `#report/<id>` con alias legacy.
- Design system applicato: Fraunces / Inter / JetBrains Mono, palette
  light editoriale, bordi hairline.
- Deploy Vercel zero-config funzionante.

### 2.2 Non implementato (arriva nei prossimi step)

- Chat input non funzionante (disabled con hint esplicito a v0.9.0).
- Nessun link attivo tra chip del report e nodi del grafo.
- Filtri grafo (Full / Actors / Assets / Events) non attivi.
- Grafo non apribile fullscreen.
- Export PDF del report non presente.
- Integrazione reale con KB non ancora progettata — tutto è mock in
  `data.js`.
- Zoom/pan free-form nell'Atlas full (solo 3 LOD discreti).

---

## 3. Prossimi step

### 3.1 v0.9.0 — Chat operativa, link grafo-report, filtri

Scope:

- **Chat finto-funzionante end-to-end**: input accetta domande, genera
  risposte mock con delay simulato, produce coppie (report #N, grafo #N)
  per ogni domanda. I chip `↗ Report #N` / `↗ Graph #N` dentro i messaggi
  sono attivi e ripristinano report/grafo precedenti nell'area di lavoro.
- **Link chip ↔ grafo**: click su una chip nel report evidenzia il nodo
  corrispondente nel grafo.
- **Filtri grafo attivi**: toggle Full / Actors / Assets / Events che
  applicano effettivamente il filtro al rendering SVG.

### 3.2 v1.0.0 — Fullscreen, PDF, polish

Scope:

- **Grafo fullscreen overlay**: apertura del grafo a schermo intero con
  controlli dedicati.
- **Generazione PDF del report** (mock o reale).
- **Polish finale**: micro-interazioni, accessibilità, performance, audit
  visivo completo.
- **Eventuale documentazione per handoff** ai primi tester.

---

## 4. Problemi aperti / note importanti

- **Design decisions del 2026-04-20 (applicate in v0.8.0)**: la sessione
  ha riscritto il modello di navigazione. Conseguenze applicate in
  `CLAUDE.md` (§3, §5.3, §7) e in §1 qui sopra. Punti fissati:
  - Chat è entrypoint globale e persistente, non scoped sul dossier.
  - Dossier è individuato dal sistema a partire dalla domanda, mai
    selezionato dall'utente.
  - Atlas è sfondo ambient + vista espandibile, mai router.
  - Basemap Atlas passa a TopoJSON world-110m reale.
  - Il click su cluster/dossier nel full Atlas apre info sheet con
    "Ask about this" che seeda la chat — nessun question suggestion.
- **Dati mock**: il Reader mostra attualmente dati hardcoded in `data.js`.
  L'integrazione reale con KB (via API Supabase o export statici) non è
  ancora progettata — sarà affrontata dopo v1.0.0.
- **iPad workflow**: le modifiche vanno fatte direttamente nel repo, niente
  workflow copia-incolla dal chat. Claude Codice scrive, Working Copy pusha,
  Vercel deploya.
- **Modifiche complete**: poiché si sviluppa da iPad, ogni modifica deve
  essere completa e testata. Niente snippet o patch parziali in sospeso.
- **Non rimettere in discussione le decisioni architetturali** già prese
  (vedi `CLAUDE.md` §7).
