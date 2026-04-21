# STATUS.md — GeoIntel · Reader

Stato corrente del Reader e prossimi step concordati. Questo file cambia ad
ogni release.

**Ultima versione deployata**: v0.8.1
**Ultimo aggiornamento**: 2026-04-20

---

## 1. Versione corrente — v0.8.1

Navigation rework a partire dal feedback su v0.8.0. Chat operativa dalla
home, Atlas cliccabile in place con zoom-and-reveal, via la vista Atlas
full, mappa più leggibile.

### 1.1 Architettura file

- **3 file di codice + 1 asset dati in root**:
  - `index.html` — shell HTML + CSS completo.
  - `data.js` — mock data (dossier, entità, archi, eventi, report,
    descrizioni cluster/dossier).
  - `app.js` — logica di routing, rendering, interazioni, chat mock.
  - `world-110m.json` — basemap (Natural Earth 110m land polygons,
    minified a array di ring, ~75 KB).
- Nessun framework, nessun build step. Pubblicato staticamente.

### 1.2 Routing

- Hash-based, due route:
  - `#` (default) — working surface home: chat + Atlas cliccabile a destra.
  - `#report/<dossier-id>` — working surface popolata: chat + graph + intel
    + report del dossier.
- Alias legacy gestiti: `#atlas`, `#home`, `#atlas-full`, `#dossier/<id>`
  → ridirette a `#` o `#report/<id>`.

### 1.3 Working surface (schermata unica)

Layout a 2 zone:

- **Chat panel** (340px, sinistra, sempre presente): greeting AI nello
  stato home; chat del dossier nello stato report. Input **operativo**:
  Run accetta qualsiasi query, il sistema fa dispatch keyword-based al
  dossier pertinente e naviga a `#report/<id>`, con user message + AI
  pending appended alla chat locale e risoluzione dopo ~900ms.
- **Right area** (flex 1, destra): Atlas cliccabile in stato home;
  graph/intel upper-strip + report panel in stato report.

### 1.4 Atlas in home (sempre cliccabile)

Non più "ambient non-cliccabile". Interazioni:

- Click su **cluster con 1 dossier** → navigazione diretta a
  `#report/<first-dossier-id>`.
- Click su **cluster con N dossier** (≥2) → **zoom-and-reveal**: viewBox
  zooma sulla regione, i dossier appaiono come marker individuali ai
  loro lat/lon reali. Click sul marker → naviga.
- Click su **cluster vuoto** → pulse rosso del ring per feedback visivo
  + no-op.
- Click su **orbital dossier** (trans-geografici) → naviga diretto.
- In stato zoomed, bottone **"← World"** nell'header riporta al world
  level.
- Nessuna vista Atlas full-screen separata. Il bottone "Expand" è stato
  rimosso.

### 1.5 Ritorno ad Atlas dalla schermata report

Topbar-left mostra **"← Atlas"** quando la route è `#report/<id>`.
Cliccando si torna alla home con Atlas resettato a world level.

### 1.6 Basemap più leggibile

Stroke width dei poligoni land passato da 0.4 → 0.9, stroke color da
`#d9d4c6` → `#9a9484` (più contrasto), fill da `#f0ece1` → `#ece7d6`
(leggermente più caldo). Europa e altre penisole sottili ora distinguibili.
Sempre 127 polygons Natural Earth 110m proiettati via Equal Earth.
Polygons che attraversano l'antimeridiano vengono skippati.

### 1.7 Dossier mock implementati

Tre dossier in `data.js` (invariati da v0.7):

- `iran-hormuz` (Middle East).
- `taiwan-strait` (East Asia).
- `ai-us-china` (trans-geografico, orbital ring).

Con `description` su cluster e dossier (usata in v0.8.0 per info sheet,
ora non renderizzata nell'UI — riserva per future feature).

### 1.8 Topbar

- Brand — link a `#` (home).
- Home: topbar minimale (solo brand + icon-buttons).
- Report view: "← Atlas" a sinistra + pill "DOSSIER · TITLE" centrale.
- Icon-buttons: export, share, settings (non funzionanti).

### 1.9 Chat mock dispatch

Keyword-based routing in `dispatchQuery()`:

- `hormuz | iran | gulf | persian | gcc` → `iran-hormuz`
- `taiwan | china sea | tsmc | south china | formosa | pla` →
  `taiwan-strait`
- `ai | semiconductor | chip | lithography | asml | nvidia | tech rivalry`
  → `ai-us-china`
- fallback → `iran-hormuz`

Su submit: append user+pending in `LOCAL_CHAT[dossierId]`, navigate a
`#report/<id>`, risoluzione del pending AI dopo ~900ms con un mock
response che cita stats del dossier.

---

## 2. Cosa è implementato e cosa no

### 2.1 Implementato

- Working surface unica con routing semplificato.
- Chat mock end-to-end (input → dispatch → navigate → risposta pending
  → risoluzione).
- Atlas home cliccabile con zoom-and-reveal per cluster multi-dossier,
  navigazione diretta per cluster mono-dossier e orbital.
- Micro-feedback (pulse) sui cluster vuoti.
- Bottone "← Atlas" dalla schermata report.
- Basemap Natural Earth 110m con contrasto rinforzato.
- Design system applicato: Fraunces / Inter / JetBrains Mono, palette
  light editoriale, bordi hairline.
- Deploy Vercel zero-config funzionante.

### 2.2 Non implementato (arriva nei prossimi step)

- **Dispatch "vero"**: attualmente keyword-based; v0.9.0 aggiunge un
  embedding/RAG-like mock più credibile.
- **Report/Graph #N multipli per dossier**: ogni submit produce solo
  user+pending appended, il report resta quello statico del mock. v0.9.0
  genera una coppia (report #N, grafo #N) per ogni query.
- Link chip-in-report ↔ grafo.
- Filtri grafo (Full / Actors / Assets / Events) non attivi.
- Grafo non apribile fullscreen.
- Export PDF del report non presente.
- Integrazione reale con KB non ancora progettata — tutto è mock in
  `data.js`.

---

## 3. Prossimi step

### 3.1 v0.9.0 — Report/grafi multipli per dossier, link chip-grafo, filtri

Scope (aggiornato dopo v0.8.1, che ha anticipato la parte "chat
funzionante"):

- **Coppie (report #N, grafo #N) generate per query**: invece di limitarsi
  ad appendere messaggi alla chat, ogni submit produce un nuovo
  report+grafo che sostituisce quello nell'area destra. Chip
  `↗ Report #N` / `↗ Graph #N` nei messaggi precedenti ripristinano
  versioni passate.
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

- **Design decisions già applicate** (v0.8.0 + v0.8.1):
  - Chat è entrypoint primario, globale, persistente; operativa in mock.
  - Dossier individuato dal sistema a partire dalla domanda, mai
    selezionato dall'utente via menu.
  - Atlas è **scorciatoia visuale cliccabile**, entrypoint secondario,
    non c'è più vista full-screen separata.
  - Cluster con N dossier: zoom-and-reveal in place.
  - Basemap Natural Earth 110m, con stroke rinforzato per leggibilità.
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
