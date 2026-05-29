# STATUS.md — GeoIntel · Reader

Stato corrente del Reader e prossimi step concordati. Questo file cambia ad
ogni release.

**Ultima versione deployata**: v2.4.5
**Ultimo aggiornamento**: 2026-05-29

---

## 1. Versione corrente — v2.4.5

Demo live integrata con backend Supabase + Claude. Quattro file di codice
(`index.html`, `app.js`, `data.js`, `world-110m.json`) + Edge Function su
Supabase Dashboard. Sei dossier mock, KG globale (77 entities + 77 relations),
subgraph engine v2.4 con force-directed layout, password gate SHA-256.

### 1.1 Architettura file

- **3 file di codice + 1 asset dati in root**:
  - `index.html` — shell HTML + CSS completo.
  - `data.js` — KG globale + 6 dossier con `brief_text` per LLM context.
  - `app.js` — logica routing/rendering/chat/subgraph/auth.
  - `world-110m.json` — basemap Natural Earth 110m countries (~150 KB).
- Backend: Edge Function `geointel-reader-chat` su Supabase (source vive
  solo sulla dashboard, NON nel repo).
- Nessun framework, nessun build step. Vercel zero-config.

### 1.2 Routing

- Hash-based:
  - `#` (default) — home con Atlas mappa cliccabile.
  - `#report/<N>` — scenario N rendered (snapshot in `scenarioHistory`).
- Alias legacy: `#atlas`, `#home`, `#atlas-full`, `#dossier/<id>`.

### 1.3 Backend chat (live)

Endpoint: `https://chuvfdbpwiszjuoyhvlw.supabase.co/functions/v1/geointel-reader-chat`.
Modelli: Haiku 4.5 classifier (max_tokens 800), Sonnet 4.5 generator (max_tokens 5000).

- **Fase classifier** (~5 s): `Content-Type: application/json` buffered,
  body tipizzato (`welcome`, `clarification`, `ready_to_generate`,
  `out_of_scope`, `acknowledge`, `scenario_followup`).
- **Fase generator** (~50 s): `Content-Type: application/x-ndjson` streaming.
  Frame per riga: `{"type":"start"}`, `{"type":"heartbeat","t":<ms>}` ogni
  ~15 s, `{"type":"done","payload":{type,message,scenario,debug}}` al
  termine. Scenario porta `{title, report_html, entity_ids, relation_keys,
  critical_edges, question}`.

`readNdjsonDone` discrimina sul Content-Type: NDJSON → drain ReadableStream,
ignora start/heartbeat, restituisce payload del done.

### 1.4 Working surface (schermata unica)

- **Chat panel** (340px, sinistra): `GLOBAL_CHAT[]` con bubble user/ai/
  scenario-card. Scenario-card è chip cliccabile per recall senza nuova
  fetch backend. Bottoni in header: **New** (archivia + reset), **Archive**.
- **Right area**:
  - Empty/home → Atlas ambient cliccabile.
  - Loading → skeleton report durante generator.
  - Populated → subgraph upper + report panel bottom.

### 1.5 Atlas

Natural Earth 110m countries, proiezione Equal Earth. Cluster markers +
orbital ring per trans-geographic. Click su cluster apre info card (mai
naviga al report). Zoom-and-reveal per cluster N≥2 dossier (oggi attivo su
`middle-east` con 3 dossier). Pulse rosso per cluster vuoti.

### 1.6 Subgraph engine v2.4

- `renderSubgraph(container, scenario, fullscreen)` con force-directed
  `computeForceLayoutV24`.
- Callout numerati per `critical_edges` con mechanism + volatility.
- Label inline per archi ordinari.
- **Polarity color granulare** (v2.4.4): `pos`/`pos-*` verde, esatto `neg`
  rosso, `neg-*`/`variable`/`systemic`/`commercial` grigio. I `neg-West`,
  `neg-China`, ecc. sono allineamenti contro terzi, non antagonismi bilaterali.
- **Orphan entity filter** (v2.4.4): strip di `entity_ids` non referenziati
  in alcun `relation_key`.
- Legenda spaziata flex + divider, presente inline e in overlay fullscreen.
- Bottone "Expand" → fullscreen overlay (Esc to close).

### 1.7 Report

- `renderScenarioReport(scenario)` renderizza `scenario.report_html` raw.
- Chip in body cliccabili: `.chip.actor/.asset/.event` → highlight nodo.
- Filtri grafo (Full/Actors/Assets/Events) attivi via `[data-graph-filter]`.
- PDF: bottone in header → `window.print()` con stylesheet print dedicato.

### 1.8 Archive drawer

`localStorage["gir_chat_archive"]` — array `{startedAt, messages}`. Drawer
laterale con titolo derivato dalla prima query, timestamp, msg count. Click
ripristina GLOBAL_CHAT e ricostruisce scenarios dai chip. Delete singolo +
Clear all. Al click su "New" si archivia automaticamente.

### 1.9 Password gate (v2.4.5)

Overlay fullscreen all'avvio. SHA-256 della password vs 2 hash autorizzati
(user + emergency) via `crypto.subtle.digest`. Match → flag `gir_auth_ok` in
`sessionStorage`. Idempotente contro render asincroni concorrenti.

### 1.10 On-screen debug log

Ring buffer 40 entry, `debugLog()`, bottone copy (TSV). Indispensabile su
iPad senza DevTools. Render() si triggera da debugLog solo dove esplicito.

### 1.11 Sei dossier mock

| ID | Cluster | Brief |
|---|---|---|
| `russia-ukraine` | eastern-europe | ~15 KB |
| `iran-hormuz` | middle-east | ~10 KB |
| `iran-usa` | middle-east | ~12 KB |
| `taiwan-strait` | east-asia | ~13 KB |
| `ai-us-china` | trans-geographic | ~14 KB |
| `red-sea-houthis` | middle-east | ~10 KB |

KG globale 77 entities + 77 relations, mandato per intero come `kg` nel
payload (Sonnet seleziona il sottografo).

---

## 2. Cosa è implementato e cosa no

### 2.1 Implementato

- Backend live Supabase + Haiku classifier + Sonnet generator con NDJSON
  streaming.
- Macchina a stati conversazionale: welcome → clarification (loop) →
  ready_to_generate → scenario → scenario_followup.
- Scenario history client-side con chip recall.
- Subgraph rendering v2.4 (force-directed, critical edges, orphan filter,
  polarity granulare).
- Atlas cliccabile (info card, zoom-and-reveal, orbital ring).
- Archive drawer con localStorage.
- Graph fullscreen overlay.
- Filtri grafo + chip↔grafo highlight.
- PDF via window.print() con stylesheet dedicato.
- Password gate SHA-256.
- Debug log on-screen.
- Sei dossier mock con brief_text + intel + reports + graph_svg statici.

### 2.2 Non implementato (rimane aperto)

- **Report strutturato Tesi/Evidenze/Implicazione/Fonti** (oggi è blob
  `report_html` libero — arriva in v2.5.0).
- **Deep-Think mode** con alberatura e distribuzione esiti (v2.5.0).
- **Auto-suggest DT** per query projection-heavy (v2.5.0).
- **Dossier+topic attivo display** in UI (v2.5.0).
- **Switch dossier confirmation** (v2.5.0).
- **Cloudflare buffering fix** sull'Edge Function (richiede deploy
  manuale di `X-Accel-Buffering: no` sul Response del branch streaming).
- **PDF con grafo dentro**: oggi `window.print()` non include il grafo
  correttamente. Tema aperto, decisione strategica futura.
- **Integrazione KB reale** (dati mock, KG hardcoded). Tema post-pilot.

---

## 3. Prossimi step

### 3.1 v2.5.0 — Report strutturato, Deep-Think, dossier attivo

Scope:

1. **Report RAG strutturato** con sezioni esplicite Tesi / Lettura evidenze
   / Implicazione / Sottografo / Fonti. Parsing client-side del
   `report_html` esistente (heuristics su `<h2>` / primo paragrafo /
   `<cite>`).
2. **Bottone "Approfondisci con Deep-Think"** sotto il report, con stima
   costo qualitativa (low/medium/high) calcolata da #entità + #archi +
   presenza di linguaggio proiettivo.
3. **Deep-Think mock client-side** (no nuova Edge Function): genera
   alberatura attori×mosse×probabilità + distribuzione esiti (bar chart)
   + caveat su incertezza, deterministicamente derivata dallo scenario
   corrente.
4. **Auto-suggest DT**: regex su query utente (orizzonte temporale, "se",
   "what if", "controfattuale", "scenario futuro") → hint sopra il bottone.
5. **Dossier+topic attivo**: pill in topbar/chat header con dossier
   corrente (dallo scenario) + topic (prima query utente del turno).
6. **Switch dossier confirmation**: modal "Vuoi cambiare dossier? Archivio
   la conversazione e parto con nuovo contesto" se classificatore
   identifica dossier diverso dal corrente. Default = archivia + procedi.

### 3.2 Edge Function — fix Cloudflare buffering (deploy manuale)

Aggiungere header `X-Accel-Buffering: no` (+ idealmente `Connection:
keep-alive`) al `Response` del branch streaming NDJSON. Snippet
ready-to-paste consegnato separatamente.

### 3.3 Beyond pilot

- Integrazione KB reale (dati live da pgvector + RAG vero).
- PDF server-side con grafo.
- Persistenza chat lato server (oggi solo localStorage).
- Autenticazione utenti reale (oggi password singola).

---

## 4. Problemi aperti

- **Cloudflare buffering** (vedi §3.2): fetch muore a ~50 s con
  `TypeError: Load failed`. Fix lato Edge Function richiesto.
- **PDF con grafo**: `window.print()` come fallback, grafo non incluso
  correttamente. Decisione strategica aperta.
- **iPad Safari** quirks: disattivare "Punteggiatura intelligente" prima
  di editare `.js` (curly quotes rompono parse).

---

## 5. Workflow di sviluppo

- Commit diretti su `main` via PR mergiate.
- Vercel deploy automatico su ogni push.
- iPad: Working Copy `Pull` (non solo `Fetch`) per aggiornare.
- Edge Function debug: Supabase Dashboard → Edge Functions →
  `geointel-reader-chat` → Test panel.
- On-screen debug log: ring buffer in chat panel, bottone `copy` TSV.
