# STATUS.md — GeoIntel · Reader

Stato corrente del Reader e prossimi step concordati. Questo file cambia ad
ogni release.

**Ultima versione deployata**: v0.7.0
**Ultimo aggiornamento**: 2026-04-20

---

## 1. Versione corrente — v0.7.0

Release deployata su Vercel e funzionante. Sintesi di cosa include.

### 1.1 Architettura file

- **3 file in root**:
  - `index.html` — shell HTML + CSS completo.
  - `data.js` — mock data (dossier, entità, archi, eventi, report).
  - `app.js` — logica di routing, rendering, interazioni.
- Nessun framework, nessun build step. Pubblicato staticamente.

### 1.2 Routing

- Hash-based:
  - `#atlas` (default, home).
  - `#dossier/<id>` (vista di un dossier specifico).

### 1.3 Vista Atlas (home)

- Mappa mondiale in proiezione Equal Earth.
- 5 macro-cluster geografici:
  - Middle East
  - East Asia
  - Sahel
  - Arctic
  - Eastern Europe
- Orbital ring esterno per dossier trans-geografici.

### 1.4 Vista Dossier

Layout a 4 pannelli:

- **Chat panel** (340px, sinistra): bubble in stile WhatsApp — navy per
  l'utente, bianco con bordo nero per l'AI.
- **Graph panel** (upper-strip, 360px): grafo SVG pre-renderizzato.
- **Intel panel** (upper-strip, accanto al grafo): confidence gauge, top arcs,
  timeline eventi.
- **Report panel** (full-width, bottom): report editoriale con byline,
  executive summary, body, sources.

### 1.5 Dossier mock implementati

Tre dossier hardcoded in `data.js`:

- `iran-hormuz` (Middle East).
- `taiwan-strait` (East Asia).
- `ai-us-china` (trans-geografico, orbital ring).

### 1.6 Topbar

- Brand.
- Breadcrumb contestuale (Atlas / cluster / dossier).
- Bottone "← Atlas" per tornare alla home.
- Icon-buttons: export, share, settings.

---

## 2. Cosa è implementato e cosa no

### 2.1 Implementato

- Routing hash-based tra Atlas e Dossier.
- Rendering statico di mappa, cluster, orbital ring.
- Layout dossier a 4 pannelli completo.
- Chat con bubble stilizzate (contenuto mock).
- Grafo SVG pre-renderizzato per ciascun dossier.
- Intel sidebar con confidence, top arcs, timeline.
- Report editoriale con struttura completa (byline, summary, body, sources).
- Design system applicato: Fraunces / Inter / JetBrains Mono, palette light
  editoriale, bordi hairline.
- Deploy Vercel zero-config funzionante.

### 2.2 Non implementato (per design, arriva nei prossimi step)

- Zoom e pan sulla mappa Atlas, nessun LOD dinamico.
- Chat input non funzionante (nemmeno mock con delay).
- Nessun link attivo tra chip del report e nodi del grafo.
- Filtri grafo (Full / Actors / Assets / Events) non attivi.
- Grafo non apribile fullscreen.
- Export PDF del report non presente.
- Integrazione reale con KB non ancora progettata — tutto è mock in `data.js`.

---

## 3. Prossimi step

### 3.1 v0.8.0 — Zoom/pan Atlas con LOD

Scope:

- Zoom e pan sulla mappa Atlas.
- 3 livelli di LOD (Level of Detail):
  - `world` — cluster aggregati, orbital ring visibile.
  - `region` — focus su un singolo macro-cluster, dossier rappresentati come
    marker individuali.
  - `dossier-detail` — vista pre-ingresso al dossier con highlight e preview.
- Breadcrumb di ritorno che rispecchia il LOD corrente.
- Clustering pre-calcolato **hardcoded a 2 livelli** per il mockup. Il
  clustering dinamico vero arriverà in v1.1+.

### 3.2 v0.9.0 — Chat, link grafo-report, filtri

Scope:

- **Chat input finto-funzionante** nei dossier: accetta input dell'utente,
  genera risposte mock con delay simulato.
- **Link chip ↔ grafo**: click su una chip nel report evidenzia il nodo
  corrispondente nel grafo.
- **Filtri grafo attivi**: toggle Full / Actors / Assets / Events che
  applicano effettivamente il filtro al rendering SVG.

### 3.3 v1.0.0 — Fullscreen, PDF, polish

Scope:

- **Grafo fullscreen overlay**: apertura del grafo a schermo intero con
  controlli dedicati.
- **Generazione PDF del report** (mock o reale).
- **Polish finale**: micro-interazioni, accessibilità, performance, audit
  visivo completo.
- **Eventuale documentazione per handoff** ai primi tester.

---

## 4. Problemi aperti / note importanti

- **Dati mock**: il Reader mostra attualmente dati hardcoded in `data.js`.
  L'integrazione reale con KB (via API Supabase o export statici) non è
  ancora progettata — sarà affrontata dopo v1.0.0.
- **iPad workflow**: le modifiche vanno fatte direttamente nel repo, niente
  workflow copia-incolla dal chat. Claude Codice scrive, Working Copy pusha,
  Vercel deploya.
- **Modifiche complete**: poiché si sviluppa da iPad, ogni modifica deve
  essere completa e testata. Niente snippet o patch parziali in sospeso.
- **Non rimettere in discussione le decisioni architetturali** già prese
  (vedi `CLAUDE.md` §7): 3 file separati, vanilla JS, palette light, Fraunces
  per i titoli, dossier come partizioni del KG, orbital ring per i
  trans-geografici.
