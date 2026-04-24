# CLAUDE.md — GeoIntel · Reader

Memoria permanente del progetto. Questo file cambia raramente: contiene le
informazioni stabili su cosa è GeoIntel, dove si colloca il Reader nel sistema,
come si sviluppa e quali decisioni architetturali sono già state prese.

---

## 1. Cos'è GeoIntel

GeoIntel è un sistema interno di analisi geopolitica strutturata. Produce
dossier tematici che combinano un Knowledge Graph (entità + relazioni) con
report editoriali in tre registri: stato attuale (AS IS), proiezioni (WHAT IF),
analisi di sensibilità (Sensitivity Analysis).

Il sistema è composto da due applicativi distinti ma collegati:

### 1.1 GeoIntel · KB (repository separato, NON questo)

Piattaforma backend di ingestione, processing, embedding e RAG query di
articoli da think tank e policy publications.

- App v5.9.2, job-worker v2.1.0.
- 4 sources onboardate: ISPI, ECFR, MERICS, Bruegel — circa 27'500 articoli
  embedded.
- Pipeline deterministica: discover → process → embed → extract-kg.
- Schema Knowledge Graph deployato: `kg_entities`, `kg_relations`,
  `kg_entity_articles`, `kg_extraction_log`.
- RPC disponibili: `resolve_entity`, `navigate_kg`.
- Stack: Supabase + PostgreSQL + pgvector + Edge Functions + OpenAI embeddings
  + Claude Haiku (decomposition, KG extraction) + Claude Sonnet (analytical
  responses).

### 1.2 GeoIntel · Reader (QUESTO repo)

Frontend client-facing statico che visualizza il KG e le analisi prodotte dal
KB, organizzate in dossier tematici. Consuma dati che il KB espone.

---

## 2. Il framework CHESS

CHESS — Causal History and Evolutionary Scenario System — è il framework
metodologico che definisce come si costruisce e si interroga il grafo. Non è
un prodotto: è metodologia, implementata dentro KB (per la costruzione del
grafo) e mostrata da Reader (per la fruizione).

Elementi chiave di CHESS:

- **Two-node graph**: solo due tipi di nodo — Entities e Dossiers.
- **Actor / Asset**: distinzione derivata topologicamente dalla posizione nel
  grafo, non dichiarata a priori.
- **Archi direzionali asimmetrici** con 5 proprietà: Weight, Polarity,
  Volatility, Reversibility, Confidence.
- **Context Factors**: testo sugli archi, non nodi.
- **Events**: trigger di transizione, non nodi.
- **Output**: AS IS (stato attuale), WHAT IF (proiezioni), Sensitivity
  Analysis.

---

## 3. Ruolo del Reader

Il Reader è la webapp statica client-facing dove un utente (analista, advisor,
cliente) pone domande geopolitiche in una chat unica e persistente, e riceve
come risposta report editoriali (AS IS / WHAT IF / Sensitivity) e la porzione
di Knowledge Graph rilevante. Il dossier viene individuato automaticamente dal
sistema in base alla domanda — l'utente non lo seleziona mai esplicitamente.

Ogni domanda (o gruppo di domande correlate) produce una coppia (report #N,
grafo #N). Le versioni precedenti restano accessibili dentro la conversazione
via chip `↗ Report #N` / `↗ Graph #N`, senza dover uscire dalla chat.

Deve essere elegante, editoriale, leggibile su iPad e desktop.

---

## 4. Stack tecnologico

- **Frontend**: HTML + CSS + JavaScript vanilla, no framework.
- **Hosting**: Vercel (static site, zero-config).
- **Dev environment**: iPad (Working Copy per git, Safari per preview, Claude
  Codice per sviluppo).
- **Struttura file**: 3 file di codice in root — `index.html` (shell + CSS),
  `data.js` (dossier + brief per LLM context), `app.js` (logica). Il monolite
  iniziale è stato splittato per gestibilità: non tornare indietro. Asset
  dati (TopoJSON, GeoJSON, immagini) sono ammessi come file aggiuntivi: la
  regola vale sul codice, non sui dati.
- **Chat backend**: Supabase Edge Function `geointel-reader-chat` esposta su
  `https://chuvfdbpwiszjuoyhvlw.supabase.co/functions/v1/geointel-reader-chat`.
  Il Reader la chiama con `Authorization: Bearer <SUPABASE_ANON_KEY>` e body
  `{dossier_id, dossier_title, brief_text, question, history}`. La history
  è capped a 20 turni, esclude il messaggio user appena inviato. La chiave
  anon è un placeholder in `app.js` (`SUPABASE_ANON_KEY`) da incollare prima
  di ogni deploy — è la chiave pubblica anon, safe per il frontend.
- **Dataset dossier**: dalla v2.0.0 di `data.js` ogni dossier include un
  campo `brief_text` (~8–15 KB) che è la memoria del dossier passata come
  contesto all'LLM. Questo campo **non deve mai essere renderizzato nel
  DOM**: è context-only.

---

## 5. Design system

### 5.1 Tipografia

- **Fraunces** (serif): titoli e prose editoriale. Obbligatoria per i titoli.
- **Inter** (sans): UI, etichette, controlli.
- **JetBrains Mono** (monospace): dati, timestamp, identificatori.

### 5.2 Palette

Light editorial, non dark.

- Background bianco, testi nero.
- Accenti:
  - Teal `#0d7a6e`
  - Amber `#a8570f`
  - Violet `#5b21b6`
  - Sage `#15803d`
  - Coral `#b8203a`
  - Gold `#8b5a00`
- Bordi hairline 1px `#c4bfb1`.

### 5.3 Principi di layout

- Estetica editoriale, densità informativa alta ma respiro tipografico curato.
- **Schermata principale (working surface)**: chat panel a sinistra (340px,
  sempre attiva, globale, persistente), area di lavoro a destra con graph
  panel + intel panel nella upper-strip (360px di altezza) e report panel
  full-width in basso.
- **Empty state**: all'apertura — o ogni volta che non c'è ancora un report
  generato — la metà destra mostra Atlas (mappa + cluster + orbital ring).
  **Atlas è cliccabile** come scorciatoia visuale ai dossier, ma non è
  l'entrypoint primario: la chat lo è. Alla prima domanda risolta, Atlas
  dissolve e lascia il posto a graph + intel + report generati.
- **Interazione sull'Atlas (zoom-and-reveal)**: click su un cluster con un
  solo dossier → navigazione diretta alla schermata report. Click su un
  cluster con N dossier → zoom-in in place sulla regione, i dossier
  appaiono come marker individuali, click sul marker → navigazione. Click
  su cluster vuoto → micro-feedback (pulse del ring), no-op. Click su
  orbital dossier → navigazione diretta. Un bottone "← World" torna al
  livello world.
- **Ritorno dalla schermata report**: topbar mostra un bottone "← Atlas"
  che porta alla home (Atlas world-level).
- **Topbar**: brand, breadcrumb/contextual, icon-buttons (export / share /
  settings).
- Mai usare emoji nell'UI.

---

## 6. Regole di sviluppo

- **Versioning**: SemVer — incrementare minor per feature, patch per fix,
  major per breaking changes.
- **iPad workflow**: le modifiche vanno fatte direttamente nel repo, niente
  copia-incolla dal chat. Claude Codice scrive, Working Copy pusha, Vercel
  deploya.
- **No framework**: vanilla JS per tutto il ciclo di vita del Reader.
- **No monolite**: mantenere la separazione `index.html` / `data.js` /
  `app.js`.
- **Modifiche complete**: ogni cambiamento deve essere completo e testato, mai
  snippet o patch parziali lasciate in sospeso.
- **No emoji nei file UI** e — salvo richiesta esplicita — anche nei file
  sorgente.

---

## 7. Decisioni architetturali (non rimettere in discussione)

1. **Chat = entrypoint globale e unico.** L'utente pone qualsiasi domanda
   geopolitica in una conversazione singola e persistente. Non esiste una
   selezione manuale del dossier: il sistema lo individua dalla domanda.
2. **Report e grafo = output emergenti, non contenuti pre-esistenti.** Ogni
   domanda (o gruppo di domande correlate) produce una coppia (report #N,
   grafo #N). Versioni precedenti accessibili via chip `↗ Report #N` /
   `↗ Graph #N` dentro la chat, senza uscire dalla conversazione.
3. **Dossier = partizioni del KG.** KG globale → dossier tematici
   (partizioni configurate a priori dall'admin) → risposta (subset dalla
   query utente). Concetto interno al sistema, non esposto come primary nav.
4. **Atlas = mappa informativa, non router.** Occupa la metà destra
   nell'empty state. Click su cluster/dossier/orbital apre una **info
   card** (descrizione + actors + meta) — **non** naviga al report. Il
   report si raggiunge solo tramite chat. Zoom-and-reveal attivo su
   cluster con N≥2 dossier. Cluster vuoti: pulse rosso no-op. Nessuna
   vista Atlas full-screen separata. Chat resta l'entrypoint primario
   all'analisi; Atlas dà all'utente l'idea di quali tensioni sono
   attive. Dossier trans-geografici sull'orbital ring esterno.
5. **Basemap = TopoJSON world-110m (Natural Earth).** Dati geografici reali
   proiettati con la funzione Equal Earth esistente. Niente polilinee
   disegnate a mano.
6. **3 file di codice, non 1.** `index.html` + `data.js` + `app.js`. Mai più
   tornare al monolite. Asset dati separati sono ammessi.
7. **Vanilla, sempre.** Niente framework, niente build step.
8. **Palette light editoriale definitiva.** Non dark, non si discute.
9. **Fraunces obbligatorio per i titoli.**

---

## 8. Glossario

- **Dossier**: partizione tematica del KG, costruita dall'admin, che aggrega
  entità e relazioni rilevanti per un tema geopolitico specifico (es.
  `iran-hormuz`, `taiwan-strait`, `ai-us-china`).
- **Entity**: nodo del grafo. Rappresenta un soggetto (stato, organizzazione,
  persona, asset fisico o concettuale).
- **Actor**: entità con ruolo attivo nel dossier. Distinzione topologica
  (derivata dagli archi), non dichiarata.
- **Asset**: entità con ruolo passivo o di risorsa contesa. Anche questa
  distinzione è topologica.
- **Arc**: arco direzionale asimmetrico tra due entità. Ha 5 proprietà —
  Weight, Polarity, Volatility, Reversibility, Confidence — e può portare
  Context Factors testuali.
- **Event**: trigger di transizione. Non è un nodo, è un segnale temporale
  che attiva o modifica archi.
- **AS IS**: output che descrive lo stato attuale del dossier.
- **WHAT IF**: output che proietta scenari alternativi a partire dallo stato
  attuale.
- **Sensitivity Analysis**: output che misura la robustezza delle conclusioni
  al variare dei parametri degli archi.
- **LOD (Level of Detail)**: livello di dettaglio della mappa Atlas. Tre
  livelli previsti: world, region, dossier-detail.
- **Trans-geographic**: attributo di un dossier che non è riconducibile a una
  singola macro-regione geografica (es. `ai-us-china`).
- **Orbital ring**: anello esterno alla mappa Atlas dove vivono i dossier
  trans-geografici.
- **Context Factor**: testo annotato su un arco, che descrive condizioni o
  fattori che qualificano la relazione.

---

## 9. Stato corrente (aprile 2026)

Sezione operativa. Aggiornata a ogni milestone significativo.

### 9.1 Versioni

- **Frontend**: `app.js` v2.4.5, `index.html` v2.4.5.
- **Dataset**: `data.js` v2.0.0 (KG 77 entities + 77 relations,
  `brief_text` per 6 dossier: russia-ukraine, iran-hormuz, iran-usa,
  taiwan-strait, ai-us-china, red-sea-houthis).
- **Edge Function** `geointel-reader-chat`: streaming NDJSON
  (classifier buffered + generator streamed con frame start /
  heartbeat / done). Modelli: `claude-haiku-4-5-20251001`
  (classifier, max_tokens 800), `claude-sonnet-4-5-20250929`
  (generator, max_tokens 5000). Il source vive solo su Supabase
  dashboard, non nel repo.

### 9.2 Transport contract frontend - Edge Function

- **Fase classifier** (~5 s): `Content-Type: application/json`,
  buffered, body tipizzato (`welcome`, `clarification`,
  `ready_to_generate`, `out_of_scope`, `acknowledge`,
  `scenario_followup`).
- **Fase generator** (~50 s): `Content-Type: application/x-ndjson`,
  streaming. Frame per riga:
  - `{"type":"start"}` al boot.
  - `{"type":"heartbeat","t":<ms>}` ogni ~15 s.
  - `{"type":"done","payload":{type,message,scenario,debug}}` a
    fine generazione. `scenario` porta i campi v2.3 piu' il
    `critical_edges: [{src_id, dst_id, mechanism, volatility}]`
    aggiunto in v2.4 (3-5 archi citati dal report, subset di
    `relation_keys`).

Il frontend (`readNdjsonDone` in `app.js`) discrimina sul
Content-Type: NDJSON -> drain ReadableStream, ignora
start/heartbeat, restituisce il payload del done; altrimenti path
legacy buffered. `handleResponse` non vede la differenza.

### 9.3 Nota importante su Cloudflare buffering (non risolto lato frontend)

Il proxy Supabase davanti all'Edge Function a volte bufferizza lo
stream NDJSON invece di passarlo through, facendo morire il fetch
client-side con `TypeError: Load failed` dopo ~50 s. Sintomo: i log
Supabase mostrano start + heartbeat + done tutti emessi a tempo,
ma il browser vede solo headers e poi silenzio. **Fix richiesto
lato Edge Function**: aggiungere header `X-Accel-Buffering: no` (e
idealmente `Connection: keep-alive`) al Response del branch
streaming. Non tentare fix lato frontend - il parser NDJSON e' gia'
corretto, il problema e' che i chunk non arrivano.

### 9.4 Feature attive in frontend (per mappa mentale)

1. **Scenario projection mode** (chat -> classifier -> conferma ->
   generator -> report + subgraph + scenario card).
2. **`scenarioHistory[]`** client-side con `currentScenarioIndex`,
   scenario card cliccabile in chat per recall senza backend call.
3. **Subgraph SVG** con sg-svg filling parent via CSS (width/height
   100%, `preserveAspectRatio="xMidYMid meet"`), force-directed
   layout `computeForceLayoutV24`, con callout per critical edges
   e label inline per archi ordinari.
4. **Polarity color mapping granulare** (v2.4.4):
   `pos` / `pos-*` -> verde, esattamente `neg` -> rosso,
   `neg-*` / `variable` / `systemic` / `commercial` / altro ->
   grigio. I `neg-West`, `neg-China`, ecc. sono allineamenti
   contro terzi, non antagonismi bilaterali.
5. **Orphan entity filter** (v2.4.4, in `handleResponse`): a
   costruzione `scenarioObj`, filtra `entity_ids` tenendo solo
   quelli referenziati come `from` o `to` in almeno un
   `relation_key`. `debugLog("SCENARIO ORPHANS REMOVED", ...)`
   se Sonnet over-selecta.
6. **Legenda subgraph** spaziata con flex + divider, presente sia
   inline che nell'overlay fullscreen (renderSubgraphLegend(true)).
7. **PDF export** via `html2pdf.bundle.min.js` da jsdelivr, SVG-
   first snapshot con inline dei computed style sul clone, `.save()`
   unconditional. **Stato**: su iPad Safari `.save()` usa anchor
   `<a download>` che non e' supportato - il PDF si apre nella tab
   corrente sovrascrivendo l'app. Tema aperto, decisione utente
   attuale e' tornare al fallback `window.print()` (richiesta
   `typeof html2canvas === "function"` nel check, che fallisce
   perche' il bundle non espone html2canvas, e cade su
   `window.print()`). Il grafo in PDF non funziona ancora - tema
   aperto.
8. **On-screen debug log** (ring buffer 40 entry) con bottone
   `copy` (TSV), indispensabile su iPad (no DevTools). Render()
   si triggera da `debugLog` solo dove esplicitamente chiamato
   (es. PDF lifecycle).
9. **Password gate** (v2.4.5, nuovo): overlay fullscreen all'avvio.
   SHA-256 della password inserita confrontato con due hash
   autorizzati (user + emergency) via `crypto.subtle.digest`.
   Match -> flag `gir_auth_ok` in `sessionStorage`, gate saltato
   per il resto della tab session. No match -> "Password errata".
   Idempotente contro render asincroni concorrenti (check su
   `#auth-form` presente).

### 9.5 Temi aperti (in ordine di priorita')

- **PDF**: grafo non appare, `window.print()` e' il fallback
  attuale. Serve decisione strategica: (a) accettare print
  dialog nativo di Safari come UX, (b) rifare lato server con
  generazione PDF su Edge Function + share sheet, (c) altro.
- **Cloudflare buffering**: aggiungere `X-Accel-Buffering: no`
  nel Response streaming dell'Edge Function per eliminare il bug
  intermittente del fetch che muore a ~50 s.

### 9.6 Workflow iPad - memo

- Commit diretti su `main`. Vercel deploya in automatico a ogni
  push. Working Copy su iPad: `Pull` (non solo `Fetch`) per
  aggiornare i file dopo merge.
- Per debug isolato dell'Edge Function: Supabase Dashboard ->
  Edge Functions -> `geointel-reader-chat` -> Test panel.
- On-screen debug log in chat panel: ring buffer, bottone `copy`.
- iOS Safari: disattivare "Punteggiatura intelligente" prima di
  editare `.js` nel progetto (altrimenti autocorrect converte
  apostrofi dritti in curly quotes che rompono il parse).
