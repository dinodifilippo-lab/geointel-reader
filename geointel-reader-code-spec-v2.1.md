# GeoIntel Reader - Frontend Update Spec

## For Claude Code - v3.0 (scenario projection)

——

## TL;DR

Upgrade the Reader from “per-dossier browser with mock chat” to a scenario-projection tool. The chat drives generation of a dynamic Report and a subgraph highlight on demand. Atlas and UI stay the same.

Two changes on the backend side (already done by the user, you do not need to redo them):

- data.js now contains a `window.CHESS_DATA.kg` block with entities and relations
- Edge Function `geointel-reader-chat` now has a new request/response contract (v2.0)

Your job: rewire the frontend to call the new contract and render the scenario output dynamically.

——

## What to preserve

- Atlas view on page load (no changes)
- Chat panel on the right (same position, same styling)
- Report panel center (same container, different content source)
- Graph panel (same container, existing click/scroll/expand behaviour)
- Intel panel (can stay with static dossier-level confidence/arcs for now, or become dynamic - see Section 7)
- “New chat” button (preserved, now resets scenario state too)
- All existing CSS and layout

——

## What changes

1. No dossier-brief-based chat. The chat now calls a two-phase backend that returns typed responses.
1. Welcome message rendered in the chat at session start.
1. The Report panel is EMPTY on first load. Content is generated only when the backend returns a `scenario` response.
1. The Graph panel highlights a subset (entities + arcs) after a scenario is generated. Non-highlighted nodes/arcs are dimmed.
1. Follow-up questions extend the current scenario state and may re-generate.

——

## Section 1 - New Edge Function contract

### 1.1 Request (POST)

```
POST https://chuvfdbpwiszjuoyhvlw.supabase.co/functions/v1/geointel-reader-chat
Headers:
  Content-Type: application/json
  Authorization: Bearer <SUPABASE_ANON_KEY>   (already in the code)

Body JSON:
{
  “question”: “user’s new message as string”,
  “history”: [ { “role”: “user”|”assistant”, “content”: “...” }, ... ],
  “kg”: window.CHESS_DATA.kg,
  “dossier_index”: [ { “id”: “...”, “title”: “...”, “description”: “...” } ],
  “current_scenario”: null or {
    “question”: “the question that generated current report”,
    “entity_ids”: [...],
    “relation_keys”: [...]
  }
}
```

**`dossier_index`** is built by the frontend from `window.CHESS_DATA.dossiers`: for each dossier extract `id`, `title`, `description` (NOT brief_text).

**`current_scenario`** is the client-side state tracking what is currently rendered in the Report + subgraph. Initialize null. When a scenario response arrives, store { question, entity_ids, relation_keys } and pass it in subsequent calls.

### 1.2 Response (200)

```
{
  “type”: “welcome” | “clarification” | “ready_to_generate” | “scenario” | “out_of_scope” | “acknowledge” | “scenario_followup”,
  “message”: “text to append to the chat (in Italian)”,
  “scenario”: {           // only when type === “scenario”
    “title”: “...”,
    “report_html”: “<div class=‘scenario-report’>...</div>”,
    “entity_ids”: [“iran”, “israel”, ...],
    “relation_keys”: [“israel|iran|coercive-preventive”, ...]
  },
  “debug”: {...}
}
```

Error responses (non-2xx): `{ “error”: “...”, “detail”: “...” }`

### 1.3 Behaviour by type

|type               |What the frontend does                                                                                                                                                                                                                          |
|-——————|————————————————————————————————————————————————————————————————————————————————|
|`welcome`          |Append `message` as assistant bubble in chat. Report stays empty. Graph stays global.                                                                                                                                                           |
|`clarification`    |Append `message` as assistant bubble. No Report update. No graph update.                                                                                                                                                                        |
|`ready_to_generate`|Append `message` as assistant bubble. No Report update yet. No graph update yet. Waits for user confirmation (“si”, “ok”, “procedi” etc.)                                                                                                       |
|`scenario_followup`|Same as ready_to_generate (also awaits confirmation)                                                                                                                                                                                            |
|`acknowledge`      |(this type is not typically returned alone - see below)                                                                                                                                                                                         |
|`scenario`         |Append `message` as assistant bubble (“Procedo con la generazione” or similar). Render `scenario.report_html` in the Report panel. Highlight `scenario.entity_ids` and `scenario.relation_keys` in the graph. Store as `current_scenario` state.|
|`out_of_scope`     |Append `message` as assistant bubble. No Report update. No graph update.                                                                                                                                                                        |

The backend merges `acknowledge` and generation internally. A single POST returns `type: “scenario”` when the user has confirmed after a `ready_to_generate` turn. You do not need to split the call client-side - just send the user’s confirmation as a normal question, the backend will recognize it from history and return `scenario` directly.

——

## Section 2 - Welcome message on page load

On page load (and on “New chat” click), trigger a request with `question: “”` (empty string). The backend will return `type: “welcome”` with a message. Append it to the chat as the first assistant message.

Alternative simpler implementation: hardcode the welcome message in the frontend. If you prefer this, use:

```
Ciao. Questa e una demo di GeoIntel Reader. Posso costruire proiezioni di scenario su 6 aree: Russia-Ucraina, Iran (Hormuz e rivalita con USA), Taiwan, AI US-Cina, Mar Rosso-Houthi.

Fai una domanda di scenario. Se mancano elementi per rispondere bene, te li chiedo. Quando lo scenario e chiaro, genero report e sotto-grafo.
```

Either approach is fine. Hardcoding saves one API call per session.

——

## Section 3 - Report panel rendering

The Report panel currently renders `dossier.reports[current_report_id]`. Replace this with:

- On load / new chat / out_of_scope / clarification / welcome: **empty state** with a subtle placeholder (“Chiedi qualcosa nella chat a destra per generare uno scenario.”)
- On `type: “scenario”` response: render `scenario.report_html` directly inside the Report panel container. The HTML is pre-structured with the classes expected by the CSS.

Add minimal CSS for the scenario report classes (add to existing stylesheet, keep the visual language):

```css
.scenario-report {
  /* reuse existing report container spacing */
}
.scenario-report .scenario-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(—muted, #888);
  margin-bottom: 0.75rem;
}
.scenario-report .scenario-label {
  font-weight: 600;
}
.scenario-report .scenario-subtitle {
  font-style: italic;
  color: var(—muted, #666);
  font-size: 1.05rem;
  margin-bottom: 1.5rem;
}
.scenario-report h3 {
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  color: var(—accent, #0d7a6e);
}
.scenario-report .arc-ref {
  font-family: var(—font-mono, monospace);
  font-size: 0.9em;
  background: rgba(13, 122, 110, 0.08);
  padding: 0.05em 0.3em;
  border-radius: 3px;
}
```

PDF export: if there’s already a PDF button in the Reader, make it export the Report panel’s current content. Use html2pdf.js or browser print-to-PDF. Low priority - skip if not trivial.

——

## Section 4 - Graph subgraph highlighting

The graph currently renders the full KG (or per-dossier subsets via the Atlas). After a `type: “scenario”` response, the graph should:

1. Dim all nodes and arcs to ~30% opacity.
1. Restore full opacity for nodes whose id is in `scenario.entity_ids`.
1. Restore full opacity for arcs whose key matches an entry in `scenario.relation_keys`.

Arc key format: `from|to|type` (exactly three pipe-separated fields, matching exactly the relation’s from, to, type in `window.CHESS_DATA.kg.relations`).

Implementation hint: if the graph rendering uses D3 or similar, filter on data. If it uses static SVG with class names, add an `active-subgraph` CSS class to the panel, and give each node/arc a `data-id` / `data-key` attribute, then CSS does the dimming:

```css
.graph-panel.active-subgraph [data-node-id]:not(.highlighted),
.graph-panel.active-subgraph [data-relation-key]:not(.highlighted) {
  opacity: 0.25;
}
```

Then add the `highlighted` class to the matching elements via JS.

Click/scroll/expand must continue to work normally on both highlighted and dimmed elements. The highlight is visual only.

On “New chat” or when `current_scenario` becomes null, remove the subgraph highlighting (full opacity everywhere).

——

## Section 5 - Chat UI

Minimal changes. The chat already handles user input and assistant bubbles. Just:

1. Remove any per-dossier context (the chat is global, not tied to a specific dossier).
1. Ensure each user message triggers one POST to the new endpoint.
1. Append the assistant `message` from the response as a bubble. If `type === “scenario”`, the chat bubble is short (“Procedo con la generazione.”) - the actual analysis goes into the Report panel, NOT the chat.
1. Show the loading state: (a) in the chat during all requests, (b) ALSO in the Report panel when you detect `ready_to_generate` followed by confirmation (or simpler: whenever a request is in flight after a ready_to_generate, put a loader in the Report panel too). Easiest implementation: when you send a request and the last assistant bubble was `type: “ready_to_generate”` or `scenario_followup`, show a Report loader.

### 5.1 State to track in the frontend

```javascript
let currentScenario = null;  // { question, entity_ids, relation_keys } or null
let chatHistory = [];         // array of { role, content }
let lastAssistantType = null; // the `type` field from last assistant response
```

Reset all three on “New chat”.

——

## Section 6 - SUPABASE_ANON_KEY

Already in the code from v1. No change needed.

——

## Section 7 - Intel panel (optional)

The Intel panel currently shows per-dossier confidence / top_arcs / events. Two options:

**Option A (simpler, recommended):** leave it as-is. It shows the dossier that the Atlas is focused on, static.

**Option B:** make it reflect the current scenario. After a `scenario` response, rebuild the panel:

- Confidence: average of the arc confidences in `scenario.relation_keys`
- Top arcs: the arcs with the highest `weight * confidence` in the subgraph
- Events: skip (events are not in the KG)

Do Option A unless you have time. The panel is not critical to the scenario story.

——

## Section 8 - Non-regression checks

Before declaring done:

- Atlas still renders with all 6 dossiers.
- Cluster map still clickable, Atlas still the default.
- New chat button resets chat, Report, graph highlight, and currentScenario state.
- No JS errors in console at load.
- Welcome message visible at session start.
- User can ask “che succede a Taiwan” and get a clarification back (not a report).
- User can ask “quale e la finestra migliore per un’azione cinese su Taiwan” and get a ready_to_generate proposal, then say “si” and see a Report rendered with subgraph highlighted.
- `brief_text` is still never rendered in the DOM.
- PDF export (if implemented) exports the Report panel.

——

## Section 9 - Commit message

```
feat: scenario projection mode (chat -> dynamic report + subgraph)

- Rewire chat to new Edge Function v2.0 contract (two-phase reasoning)
- Report panel now empty at load, populated on scenario response
- Graph highlights subgraph after scenario generation, dims the rest
- Welcome message on session start
- current_scenario state tracked client-side for follow-ups
- New chat resets scenario state
```

——

## Section 10 - If something is ambiguous

Match existing patterns in the repo. If the graph uses D3, keep D3. If it’s plain SVG, keep plain SVG. Minimal surgical change. Do not introduce new libraries except html2pdf.js (optional, for PDF export).