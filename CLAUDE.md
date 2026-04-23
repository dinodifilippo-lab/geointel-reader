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

Il Reader **non è un browser di dossier con report statici**: è un **motore di
proiezione dinamica**. L'utente pone una domanda in chat → un classifier
(Haiku 4.5) la tipa → se è una domanda di scenario ben formata, chiede
conferma all'utente → quando l'utente conferma ("sì, procedi"), un generator
(Sonnet 4.5) produce un report analitico + lista di entità/archi del
sottografo rilevante. Il frontend renderizza il report nel pannello centrale
e evidenzia il sottografo nel pannello grafo. Ogni scenario generato produce
una **scenario card cliccabile** in chat che lo richiama client-side, senza
nuove chiamate al backend.

Le versioni precedenti restano accessibili dentro la conversazione via le
scenario card e/o chip `↗ Report #N` / `↗ Graph #N`, senza dover uscire
dalla chat.

Deve essere elegante, editoriale, leggibile su iPad e desktop.

---

## 4. Stack tecnologico

- **Frontend**: HTML + CSS + JavaScript vanilla, no framework.
- **Hosting**: Vercel (static site, zero-config). Deploy automatico da `main`.
  Dominio: `geointel-reader.vercel.app`.
- **Dev environment**: iPad (Working Copy per git, Safari per preview, Claude
  Code app per sviluppo, Supabase dashboard per Edge Function).
- **Struttura file**: 3 file di codice in root — `index.html` (shell + CSS +
  CDN scripts), `data.js` (KG + dossier + brief per LLM context), `app.js`
  (logica). Il monolite iniziale è stato splittato per gestibilità: non
  tornare indietro. Asset dati (TopoJSON, GeoJSON, immagini, code spec)
  sono ammessi come file aggiuntivi: la regola vale sul codice, non sui
  dati.
- **CDN runtime deps** (in `index.html`, `defer`): d3-force, html2canvas,
  html2pdf — usati per subgraph force-directed layout e PDF snapshot.
- **Chat backend**: Supabase Edge Function `geointel-reader-chat` (progetto
  `chuvfdbpwiszjuoyhvlw.supabase.co`) esposta su
  `https://chuvfdbpwiszjuoyhvlw.supabase.co/functions/v1/geointel-reader-chat`.
  Il Reader la chiama con `Authorization: Bearer <SUPABASE_ANON_KEY>`. La
  chiave anon è un placeholder in `app.js` (`SUPABASE_ANON_KEY`) — è la
  chiave pubblica anon, safe per il frontend. Il source dell'Edge Function
  **vive solo in Supabase**, non nel repo (rimosso intenzionalmente).

### 4.1 Contract frontend ↔ Edge Function

**Request body** (POST JSON):

```
{
  question: string,                        // domanda utente appena inviata
  history: [{role, content}, ...],         // capped a CHAT_HISTORY_CAP turni, esclude la user msg corrente
  kg: { entities: [...77], relations: [...77] },   // da window.CHESS_DATA.kg
  dossier_index: [...],                    // built da buildDossierIndex()
  current_scenario: null | {               // scenario attivo (ridotto) per continuità follow-up
    question, entity_ids, relation_keys
  }
}
```

**Response body** (JSON tipizzato):

```
{
  type: "welcome" | "clarification" | "ready_to_generate" | "scenario"
      | "out_of_scope" | "acknowledge" | "scenario_followup",
  message: string,
  scenario?: {                             // solo se type === "scenario"
    title, likelihood_label, likelihood_range,
    user_question, report_html,
    entity_ids: [...], relation_keys: [...]
  },
  debug?: {...}
}
```

Note:

- Il campo `evidence_strength` **non** è nell'output del generator (rimosso
  in Edge v2.2). È calcolato client-side come media dei `confidence` dei
  relations in `relation_keys`, e mostrato sia in Report headline che in
  Intel panel (stesso numero, fonte unica).
- Il generator supporta *structure A* (scenario singolo) o *structure B*
  (biforcato tipo "base vs worst case") con selezione adattiva.
- Il `report_html` è generato in inglese; `user_question` è preservato nella
  lingua originale dell'utente.
- `scenarioHistory` client-side (in `app.js`) è la verità sugli scenari
  generati nella sessione; la recall da scenario card è 100% client-side
  e non tocca la Edge Function.

### 4.2 Dati (`data.js`)

`data.js` contiene:

- `window.CHESS_DATA.clusters`, `dossiers`, `trans_geographic_dossier_ids` —
  struttura d'Atlas.
- `window.CHESS_DATA.dossiers[<id>].brief_text` (~8–15 KB ciascuno) — memoria
  del dossier, context-only per l'LLM. **Non deve mai essere renderizzato
  nel DOM.**
- `window.CHESS_DATA.kg = { entities: [...77], relations: [...77] }` — il
  Knowledge Graph globale. Ogni relation ha: `from, to, type, weight` (0–1),
  `polarity` (-1..+1), `volatility` (1–5), `reversibility` (1–5),
  `confidence` (0–1), `dossiers` (array di dossier_id).

**`data.js` è dato sorgente, non codice**: non va modificato nelle sessioni
di sviluppo frontend. Modifiche a `data.js` avvengono solo via
aggiornamento esplicito del dataset, versionate come bump di `data.js` (es.
v2.0.0 → v2.1.0), mai come side-effect di un refactor UI.

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

Questa sezione viene aggiornata a ogni milestone significativo. Contiene
versioni correnti, feature attive e bug aperti.

### 9.1 Versioni

- **Frontend**: `app.js` v2.3.5, `index.html` v2.3.5.
- **Dataset**: `data.js` v2.0.0 (KG 77 entities + 77 relations, brief_text
  per 6 dossier: russia-ukraine, iran-hormuz, iran-usa, taiwan-strait,
  ai-us-china, red-sea-houthi).
- **Edge Function** `geointel-reader-chat`: v2.2 (two-phase
  classifier+generator, non-streaming). Modelli:
  `claude-haiku-4-5-20251001` (classifier, max_tokens 800),
  `claude-sonnet-4-5-20250929` (generator, max_tokens 5000).

### 9.2 Feature attive lato frontend

1. **Scenario projection mode** — chat → classifier → conferma utente →
   generator → scenario (report + subgraph + scenario card).
2. **`scenarioHistory[]` client-side** con `currentScenarioIndex`. Ogni
   scenario produce una `.scenario-card` cliccabile in chat per recall
   senza backend call.
3. **Sottografo isolato** via `display: none` sugli elementi non
   highlighted (non più `opacity` dim). Force-directed layout d3-force
   sul sottografo attivo; Atlas / full-graph restano con il loro
   layout originale.
4. **PDF export** con snapshot del grafo: html2canvas + html2pdf, produce
   PDF 2 pagine (Report + Subgraph). Fallback `window.print()` se i CDN
   non si caricano.
5. **Evidence strength unificato**: rimosso widget "Confidence" dall'Intel
   panel, sostituito con "Evidence strength" calcolato client-side come
   media dei `confidence` dei relations in `relation_keys`. Stesso numero
   in Report headline e Intel panel.
6. **User question** renderizzata come blockquote `.scenario-question`
   dentro il Report.
7. **Expand** preserva il sottografo (prima mostrava il grafo intero).
8. **On-screen debug log** (v2.3.2): ring buffer di 40 entry mostrato in
   un `<details>` nella chat panel, auto-apre quando `CHAT_ERROR` fa
   fire. Necessario su iPad dove Web Inspector è off.
9. **Fetch robustness** (v2.3.1): `AbortController` con timeout client-side
   180 s; gestione response non-ok con body text surfaced nel chat; JSON
   malformato trattato come EarlyDrop con errore visibile.
10. **Debug log copy button** (v2.3.4): bottone `copy` a fianco di `clear`
    nel summary del pannello debug. Serializza `DEBUG_LOG` in TSV e usa
    `navigator.clipboard.writeText` con fallback `execCommand`. Necessario
    su iPad dove la selezione di testo dentro `<details>` è scomoda.
11. **NDJSON streaming parser** (v2.3.5): il fetch handler in `app.js`
    discrimina sul response `Content-Type`. Se `application/x-ndjson`,
    legge `resp.body` come `ReadableStream`, splitta per `\n`, ignora i
    frame `start` e `heartbeat`, risolve col `payload` del frame `done`
    (stesso shape della response buffered, `handleResponse` non vede
    differenza). Altrimenti path legacy: `resp.text()` + `JSON.parse`.
    Fallback non-streaming via `resp.text()` + iterazione righe per
    ambienti senza `getReader`. Frame `type` sconosciuti loggati e
    ignorati (forward-compatible). Helper: `readNdjsonDone`,
    `parseNdjsonLine`, `parseNdjsonText` (app.js:854-929). Il frontend
    è quindi pronto a consumare una Edge Function streaming senza
    rompere il path attuale.

### 9.3 Bug aperto — Generator timeout (edge-proxy TTFB)

**Sintomo**: dall'UI `vercel.app`, il flusso scenario si interrompe
**solo sulla seconda chiamata** (conferma "Procedi" → generator). La
prima chiamata (classifier) va regolarmente a buon fine. Il lato
Supabase registra `reason: "EarlyDrop"` con ~9 ms di CPU usata; il
frontend mostra `TypeError: Load failed` dopo esattamente **30 s**.

**Fatti accertati** (dal pannello debug on-screen, v2.3.3, ses. 22 apr
17:03 UTC):

| | Turn 1 (classifier) | Turn 2 (generator) |
|---|---|---|
| PAYLOAD SIZE | 26.810 B | 27.195 B |
| HISTORY LENGTH | 0 | 2 |
| KG ENTITIES / RELATIONS | 77 / 77 | 77 / 77 |
| RESPONSE STATUS | **200 in ~5 s** | nessuna (fetch muore a 30 s) |
| FETCH FAILED | — | `TypeError: Load failed` |

Altri fatti:

- Test panel Supabase, KG minimo (5 + 3): ✅ 200, ~5–10 s.
- Test panel Supabase, KG vuoto: ✅ 200, ~5 s.
- Credito Anthropic OK (~36 USD). Sonnet 4.5 non rate-limited.
- `Max duration` dell'Edge Function non esposto nel dashboard Supabase
  Settings (solo Name + Verify JWT + Invoke function).

**Diagnosi corrente** (aggiornata dopo i log di v2.3.3):

Il bug **non è payload size** — il classifier spedisce lo stesso KG
(77 + 77) e torna in 5 s. La vera differenza è chi risponde lato Edge
Function: Haiku (classifier, max_tokens 800) è veloce; Sonnet
(generator, max_tokens 5000) impiega ben più di 30 s a produrre la
risposta completa. Il **proxy Supabase (Cloudflare-based) droppa la
connessione quando l'Edge Function non manda response headers entro
~30 s**. Safari, non ricevendo header, muore con `TypeError: Load
failed` dopo il suo timeout interno. Il `reason: "EarlyDrop"` a 9 ms
è coerente: misura solo la CPU di boot prima che la connessione
venga recisa; il lavoro effettivo (l'await su Anthropic) non conta.

**Fix prevista (lato frontend: FATTA in v2.3.5; lato Edge Function:
ancora da fare)**: convertire la chiamata Anthropic dentro l'Edge
Function in **streaming** (`stream: true` lato SDK) e restituire al
client un corpo `application/x-ndjson` con frame `start` / `heartbeat`
/ `done`. Così gli header HTTP partono al primo token, il proxy non
droppa, e gli heartbeat periodici tengono viva la connessione mentre
Sonnet lavora. Il frontend v2.3.5 già parsifica questo formato: quando
la Edge Function streaming va live, il path NDJSON si attiva da solo
via Content-Type, zero altre modifiche lato client. Workaround
temporaneo brittle (se si vuole guadagnare tempo prima del refactor
Edge): abbassare `MAX_TOKENS_GENERATOR` sotto la soglia che fa stare
la call in <30 s (es. 2000 token).

**Diagnosi ancora non verificata**: la TTFB theory (Sonnet >30 s,
proxy Supabase droppa) è plausibile ma non dimostrata. Serve ancora
la durata **wall-clock** dell'invocation fallita dai log Supabase
(non solo il CPU time, che è di 9 ms e non dice nulla sullo sleep in
`await`). Alternativa prima del lavoro grosso: una Edge Function
v2.2.1 con soli `console.log` di checkpoint a ingresso/uscita di
ogni fase (handler start, body parsed, classifier start/done,
generator start/done, return), per vedere esattamente dove muore.
Questa v2.2.1 è stata pianificata ma non ancora scritta.

**Diagnostica in place** (commit `c35db82`, `3ca6917`, `1fed845`,
`06e213b`, `97fe0ac` — tutti sul branch di sviluppo, in PR #10):

- `app.js:847–852` — pre-fetch: `PAYLOAD SIZE BYTES`, `PAYLOAD KEYS`,
  `KG ENTITIES/RELATIONS COUNT`, `HISTORY LENGTH`,
  `CURRENT_SCENARIO PRESENT`.
- `app.js:876–878` — post-fetch: `RESPONSE STATUS`, `RESPONSE OK`,
  `RESPONSE HEADERS`.
- `app.js:907–909` — catch: `FETCH FAILED name/message/stack`.
- Pannello debug on-screen (v2.3.2) con bottone `copy` (v2.3.4) per
  esportare in TSV e incollare altrove, leggibile da iPad senza
  DevTools.

**Prossimo step**: rifattorizzare l'Edge Function `geointel-reader-chat`
v2.2 → v2.3 introducendo streaming; adattare la `.then(resp => ...)`
in `app.js` a leggere il `ReadableStream` invece di `resp.text()`.
L'Edge Function source **vive solo in Supabase**, non nel repo — va
editata dal dashboard Functions.

### 9.4 Workflow iPad — memo

- Branch di sviluppo assegnato da Claude Code app; merge su `main` via PR.
- Working Copy: `Pull` (non solo `Fetch`) per aggiornare i file dopo merge.
- Vercel deploya in automatico ogni push su `main`.
- Per provare l'Edge Function in isolamento: Supabase Dashboard → Edge
  Functions → `geointel-reader-chat` → Test panel.
