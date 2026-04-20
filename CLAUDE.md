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
  `data.js` (mock data), `app.js` (logica). Il monolite iniziale è stato
  splittato per gestibilità: non tornare indietro. Asset dati (TopoJSON,
  GeoJSON, immagini) sono ammessi come file aggiuntivi: la regola vale sul
  codice, non sui dati.

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
  generato — la metà destra mostra Atlas come sfondo ambient (mappa + cluster
  + orbital ring), non cliccabile come router. Alla prima domanda, Atlas
  dissolve e lascia il posto a graph + intel + report generati.
- **Atlas full**: un bottone "Expand" su Atlas ambient apre una vista Atlas a
  schermo intero, navigabile (zoom/pan/LOD — world → region → dossier-detail).
  Un bottone "← Back" riporta alla working surface senza perdere la chat.
- **Atlas info sheet**: nel full Atlas, click su cluster/dossier apre un
  pannello laterale con descrizione + bottone "Ask about this" che chiude il
  full, torna alla working surface e pre-popola l'input della chat con una
  domanda generica sul cluster/dossier. Nessun suggerimento di domanda.
- **Topbar**: brand, breadcrumb contestuale, icon-buttons (export / share /
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
4. **Atlas = sfondo ambient + vista espandibile, mai router.** All'apertura
   Atlas riempie la metà destra della working surface per evitare l'empty
   state. Può essere espanso a schermo intero (zoom/pan/LOD) per
   esplorazione visuale. Nel full, click su cluster/dossier apre un info
   sheet con bottone "Ask about this" che seeda la chat; mai un routing
   diretto a un dossier. Dossier trans-geografici sull'orbital ring esterno.
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
