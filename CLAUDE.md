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

Il Reader è la webapp statica client-facing che permette a un utente
(analista, advisor, cliente) di esplorare i dossier geopolitici costruiti da
KB:

- Navigare il Knowledge Graph.
- Leggere report AS IS / WHAT IF / Sensitivity.
- Vedere fonti e timeline degli eventi.
- Interagire tramite chat conversazionale con il dossier.

Deve essere elegante, editoriale, leggibile su iPad e desktop.

---

## 4. Stack tecnologico

- **Frontend**: HTML + CSS + JavaScript vanilla, no framework.
- **Hosting**: Vercel (static site, zero-config).
- **Dev environment**: iPad (Working Copy per git, Safari per preview, Claude
  Codice per sviluppo).
- **Struttura file**: 3 file in root — `index.html` (shell + CSS), `data.js`
  (mock data), `app.js` (logica). Il monolite iniziale è stato splittato per
  gestibilità: non tornare indietro.

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
- Layout a pannelli nella vista Dossier: chat panel (340px, sinistra), graph
  panel + intel panel nella upper-strip (360px di altezza), report panel
  full-width in basso.
- Topbar con brand, breadcrumb contestuale (Atlas / cluster / dossier),
  bottone "← Atlas" per tornare alla home, icon-buttons
  (export / share / settings).
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

1. **Dossier = partizioni del KG, non cartelle pre-esistenti.** La struttura
   è: KG globale → dossier tematici (partizioni configurate a priori
   dall'admin) → risposta (subset dalla query utente).
2. **Chat fluida, una per dossier.** Le versioni storiche di grafo e report
   restano accessibili via chip `↗ Report #N` / `↗ Graph #N` dentro i
   messaggi.
3. **Mappa Atlas con LOD dinamico.** Mostra cluster aggregati a zoom out,
   singoli dossier a zoom in.
4. **Dossier trans-geografici su orbital ring esterno.** I dossier non
   riconducibili a una macro-regione vivono su un anello orbitale attorno
   alla mappa.
5. **3 file, non 1.** Il file singolo è stato splittato in `index.html` +
   `data.js` + `app.js`. Mai più tornare al monolite.
6. **Vanilla, sempre.** Niente framework, niente build step.
7. **Palette light editoriale definitiva.** Non dark, non si discute.
8. **Fraunces obbligatorio per i titoli.**

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
