# STATUS.md — GeoIntel · Reader

Stato corrente del Reader e prossimi step concordati. Questo file cambia ad
ogni release.

**Ultima versione deployata**: v1.0.0
**Ultimo aggiornamento**: 2026-04-21

---

## 1. Versione corrente — v1.0.0

Release di chiusura del mockup. Rispetto a v0.9.0 aggiunge: **grafo
fullscreen overlay** (Expand button), **export PDF via print** (print
stylesheet dedicato che isola il report), e **polish**: Esc globale
chiude overlay/drawer/info-card, aria-label sui bottoni, focus ring
consistente, basemap loading state nella subtitle.

### 1.1 Architettura file

- **3 file di codice + 1 asset dati in root**:
  - `index.html` — shell HTML + CSS completo.
  - `data.js` — mock data (dossier, entità, archi, eventi, report,
    descrizioni cluster/dossier).
  - `app.js` — logica di routing, rendering, interazioni, chat mock.
  - `world-110m.json` — basemap (Natural Earth 110m admin_0 countries,
    288 polygons con border interni, minified ~150 KB).
- Nessun framework, nessun build step. Pubblicato staticamente.

### 1.2 Routing

- Hash-based, due route:
  - `#` (default) — working surface home: chat + Atlas cliccabile a destra.
  - `#report/<N>` — working surface popolata sullo snapshot N generato
    dalla chat. `<N>` è un indice globale numerico.
  - `#report/<dossier-id>` — fallback/bookmark: apre il dossier statico
    senza snapshot (usato solo se la URL è condivisa fuori sessione).
- Alias legacy gestiti: `#atlas`, `#home`, `#atlas-full`, `#dossier/<id>`.

### 1.3 Working surface (schermata unica)

Layout a 2 zone:

- **Chat panel** (340px, sinistra, sempre presente): una sola
  conversazione globale `GLOBAL_CHAT`, identica fra home e report. Parte
  dal greeting. Input operativo: Run accetta query, dispatch keyword →
  dossier, append user+pending alla chat globale, naviga a
  `#report/<id>`, risoluzione AI dopo ~900ms con chip `↗ Report #N`
  cliccabile. Bottone **"New"** in header salva la conversazione in
  localStorage e resetta a home + greeting.
- **Right area** (flex 1, destra): Atlas cliccabile in stato home;
  graph/intel upper-strip + report panel in stato report.

### 1.4 Atlas in home (cliccabile, apre info card)

**Nessun click sulla mappa naviga al report**. Il report è raggiungibile
solo dalla chat. La mappa serve a informare, non a navigare. Interazioni:

- Click su **cluster con 1 dossier** → info card del dossier (descrizione
  + actors + meta).
- Click su **cluster con N dossier** (≥2) → **zoom-and-reveal**: viewBox
  zooma sulla regione, i dossier appaiono come marker individuali ai
  loro lat/lon reali. Oggi attivo su `middle-east` (iran-hormuz +
  red-sea-houthis).
- Click su **dossier marker** (in region view) → info card.
- Click su **cluster vuoto** → pulse rosso del ring per feedback visivo
  + no-op.
- Click su **orbital dossier** (trans-geografici) → info card.
- In stato zoomed, bottone **"← World"** nell'header riporta al world
  level.
- Info card: overlay in alto a destra della mappa, chiusura con ×.

### 1.5 Ritorno ad Atlas dalla schermata report

Topbar-left mostra **"← Atlas"** quando la route è `#report/<id>`.
Cliccando si torna alla home con Atlas resettato a world level.

### 1.6 Basemap più leggibile — countries con border interni

Dataset sostituito: ora usiamo Natural Earth 110m **admin_0 countries**
(288 polygons) invece di land (127). I border interni — UK separata dal
continente, Italia delineata, Iberia/Scandinavia divise, ecc. — rendono
Europa visivamente distinguibile. Palette: water `#f4eee0`, land
`#d8cfb6`, stroke `#6a6358`. Proiezione Equal Earth invariata. Polygons
che attraversano l'antimeridiano vengono ancora skippati.

### 1.7 Dossier mock implementati

Quattro dossier in `data.js`:

- `iran-hormuz` (Middle East).
- `red-sea-houthis` (Middle East) — nuovo in v0.8.2, abilita il test
  end-to-end del zoom-and-reveal sul cluster.
- `taiwan-strait` (East Asia).
- `ai-us-china` (trans-geografico, orbital ring).

Ogni dossier ha ora il campo `actors: [...]` usato dall'info card.

### 1.8 Topbar

- Brand — link a `#` (home).
- Home: topbar minimale (solo brand + icon-buttons).
- Report view: "← Atlas" a sinistra + pill "DOSSIER · TITLE" centrale.
- Icon-buttons: export, share, settings (non funzionanti).

### 1.9 Chat mock dispatch

Keyword-based routing in `dispatchQuery()`:

- `hormuz | iran | gulf | persian | gcc` → `iran-hormuz`
- `houthi | red sea | bab | suez | ansar allah` → `red-sea-houthis`
- `taiwan | china sea | tsmc | south china | formosa | pla` →
  `taiwan-strait`
- `ai | semiconductor | chip | lithography | asml | nvidia | tech rivalry`
  → `ai-us-china`
- fallback → `iran-hormuz`

Su submit: append user+pending in `GLOBAL_CHAT`, navigate a
`#report/<id>`, risoluzione AI dopo ~900ms con chip `↗ Report #N`
cliccabile che riporta a quel report. `REPORT_COUNTER` incrementa ad
ogni query.

### 1.10 Archivio chat (localStorage-only, no UI)

Al click su "New", se la conversazione corrente ha più del solo greeting,
viene serializzata e append a `localStorage["gir_chat_archive"]` (array
di `{startedAt, messages}`). Nessuna UI di browse in v0.8.2 — arriva in
v0.8.3 come drawer laterale.

---

## 2. Cosa è implementato e cosa no

### 2.1 Implementato

- Working surface unica con routing `#` / `#report/<N>` / `#report/<id>`.
- **Chat globale unificata** (`GLOBAL_CHAT`), conversazione persistente
  attraverso home e report. Greeting iniziale, append user+pending su
  submit, risoluzione AI con chip `↗ Report #N` cliccabile che naviga
  allo snapshot indicizzato.
- **Snapshot report/grafo per query** (`GENERATED_REPORTS[N]`): ogni
  submit incrementa `REPORT_COUNTER` e produce uno snapshot
  `{ dossierId, query, timestamp, reportNum }`. La route `#report/<N>`
  risolve allo snapshot, il report panel mostra la byline "Triggered by"
  con la query originale.
- **Filtri grafo attivi**: Full/Actors/Assets/Events toggle filtrano il
  rendering SVG via classificazione dei nodi (data-type in base allo
  stroke color dei nodi: teal=actor, amber=asset, violet=event). CSS
  regole `[data-graph-filter]` fanno sbiadire i non-matching.
- **Link chip↔grafo**: click su una chip (`.chip.actor/.asset/.event`)
  nel body del report evidenzia (drop-shadow + stroke-width) il nodo
  corrispondente nel grafo via matching per label normalizzata.
- **Archivio chat (drawer UI)**: bottone icona in chat header apre un
  drawer a sinistra con la lista delle conversazioni archiviate
  (`localStorage["gir_chat_archive"]`). Ogni entry ha titolo derivato
  dalla prima user query, timestamp, contatore messaggi. Click su entry
  ripristina `GLOBAL_CHAT` e ricostruisce gli snapshot dai chip
  presenti. Delete singolo + "Clear all".
- Bottone **"New"** in chat header → archivia in localStorage e resetta
  a home + greeting.
- Atlas home cliccabile che **apre info card** (mai naviga al report):
  zoom-and-reveal per cluster multi-dossier, info card diretta per
  mono-dossier e orbital, pulse sui cluster vuoti.
- Info card overlay: descrizione, actor chips, meta.
- Bottone "← Atlas" dalla schermata report.
- Basemap Natural Earth 110m **countries** con border interni.
- Design system applicato: Fraunces / Inter / JetBrains Mono, palette
  light editoriale, bordi hairline.
- Deploy Vercel zero-config funzionante.

### 2.2 Non implementato (rimane oltre il mockup)

- **Contenuto report/grafo davvero nuovo per query**: lo snapshot
  aggiunge metadata (query + timestamp), ma il body del report e il
  grafo SVG restano quelli statici del dossier mock. La generazione
  reale arriva con l'integrazione KB.
- **Dispatch "vero"**: ancora keyword-based; evolverà con il back-end.
- **PDF reale**: oggi è `window.print()` con print stylesheet. Per un
  PDF server-side (impaginazione più controllata, watermark, ecc.)
  serve un back-end.
- **Integrazione reale con KB**: non ancora progettata — tutto mock in
  `data.js`. Prossimo grande tema post-1.0.

---

## 3. Prossimi step

### 3.1 Post-1.0 — Integrazione KB reale

Il mockup è chiuso con v1.0.0. Il prossimo salto è sostituire i dati
hardcoded in `data.js` con chiamate al back-end GeoIntel · KB:

- Endpoint query (RAG) che dato un testo restituisce dossier+report+grafo
  pertinenti invece del dispatch keyword mock.
- Persistenza lato server delle conversazioni (oggi solo localStorage).
- Autenticazione utente.
- Generazione PDF server-side per impaginazione controllata.

Da definire insieme a KB quando si aprirà il tema integrazione.

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
