# GeoIntel Reader - Frontend Update Spec

## For Claude Code - v2.2 (scenario history, cleaner subgraph, richer PDF)

——

## TL;DR

Iteration on v2.0 (scenario projection). Four targeted changes:

1. Multi-scenario history in chat: after each generation, append a clickable card in the chat. Clicking re-renders that scenario (Report + subgraph) without calling the backend again.
1. Subgraph isolation: entities and relations not in the current scenario are HIDDEN (display:none), not just dimmed.
1. PDF export includes a snapshot of the currently highlighted subgraph, placed after the Report body.
1. The backend now returns likelihood_label, likelihood_range, evidence_strength. Render these in the top of the report (the generator already produces the HTML with the new headline block).

No changes to Atlas, no changes to the welcome message, no changes to data.js, no changes to the cluster map.

——

## Section 1 - New Edge Function response fields (v2.1)

The response shape is unchanged at the top level. New fields live INSIDE scenario.report_html as a headline block rendered by the generator. You do not need to touch them; the HTML arrives ready.

What you need is to ADD CSS for the new headline block:

```css
.scenario-report .scenario-headline {
  display: flex;
  gap: 2rem;
  padding: 0.75rem 0;
  margin: 0.5rem 0 1.25rem 0;
  border-top: 1px solid var(—border, #e0ddd3);
  border-bottom: 1px solid var(—border, #e0ddd3);
}
.scenario-report .headline-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.scenario-report .headline-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(—muted, #888);
  font-weight: 600;
}
.scenario-report .headline-value {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(—accent, #0d7a6e);
}
.scenario-report .headline-range {
  font-size: 0.85rem;
  font-weight: 400;
  color: var(—muted, #888);
  margin-left: 0.35rem;
}
```

Add this block alongside the existing scenario-report CSS you already have.

——

## Section 2 - Scenario history in chat

### 2.1 State change

Replace the current single-state `currentScenario` with an array:

```javascript
let scenarioHistory = [];  // array of { id, title, question, report_html, entity_ids, relation_keys, created_at }
let currentScenarioIndex = -1;  // index of the scenario currently rendered, -1 if none
```

When a `type: “scenario”` response arrives:

1. Create a new scenario object with a unique id (timestamp is fine), the title, the question that generated it, the report HTML, the entity_ids, the relation_keys, and created_at.
1. Push to `scenarioHistory`.
1. Set `currentScenarioIndex = scenarioHistory.length - 1`.
1. Render it (Report panel + subgraph, as before).

On “New chat”: clear `scenarioHistory = []`, reset `currentScenarioIndex = -1`, empty Report panel, restore full graph.

### 2.2 Chat card for each scenario

When a scenario is generated, after the short confirmation assistant bubble (“Procedo con la generazione.”), append a SECOND element to the chat: a clickable “scenario card”.

HTML shape (add to chat message flow):

```html
<div class=“scenario-card” data-scenario-id=“[id]”>
  <div class=“scenario-card-label”>SCENARIO GENERATED</div>
  <div class=“scenario-card-title”>[title from response]</div>
  <div class=“scenario-card-hint”>Tap to recall this scenario</div>
</div>
```

CSS:

```css
.scenario-card {
  margin: 0.5rem 0;
  padding: 0.75rem 1rem;
  border: 1px solid var(—accent, #0d7a6e);
  border-radius: 6px;
  background: rgba(13, 122, 110, 0.04);
  cursor: pointer;
  transition: background 120ms ease;
}
.scenario-card:hover {
  background: rgba(13, 122, 110, 0.08);
}
.scenario-card-label {
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(—accent, #0d7a6e);
  text-transform: uppercase;
  margin-bottom: 0.25rem;
}
.scenario-card-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(—text, #1a1a1a);
  line-height: 1.3;
  margin-bottom: 0.2rem;
}
.scenario-card-hint {
  font-size: 0.75rem;
  color: var(—muted, #888);
  font-style: italic;
}
.scenario-card.active {
  background: rgba(13, 122, 110, 0.12);
  border-width: 2px;
}
```

### 2.3 Click behaviour on the card

On click:

1. Find the scenario in `scenarioHistory` by its `data-scenario-id`.
1. Set `currentScenarioIndex` to that scenario’s index.
1. Re-render Report panel with that scenario’s `report_html`.
1. Re-highlight graph with that scenario’s `entity_ids` and `relation_keys`.
1. Remove `.active` class from all scenario cards, add it to the clicked one.
1. Do NOT call the backend. Purely client-side recall.

When a new scenario is generated, it becomes the active card. Previously active card loses `.active`.

### 2.4 current_scenario in request payload

The Edge Function still expects a `current_scenario` field in the POST payload (for follow-ups). Pass the currently rendered one, i.e., `scenarioHistory[currentScenarioIndex]` reduced to `{ question, entity_ids, relation_keys }`, or `null` if `currentScenarioIndex === -1`.

——

## Section 3 - Subgraph isolation (hide, not dim)

Currently the subgraph highlight dims non-highlighted elements to 25% opacity. Change this to fully hide them.

Update the CSS you already added for `.active-subgraph`:

```css
/* BEFORE (current) */
.graph-panel.active-subgraph [data-node-id]:not(.highlighted),
.graph-panel.active-subgraph [data-relation-key]:not(.highlighted) {
  opacity: 0.25;
}

/* AFTER (new) */
.graph-panel.active-subgraph [data-node-id]:not(.highlighted),
.graph-panel.active-subgraph [data-relation-key]:not(.highlighted) {
  display: none;
}
```

Also hide labels and any decorations tied to hidden nodes (orphan labels would float otherwise). If your graph renders labels as children of node groups, `display: none` on the parent group handles it. If labels are separate elements, give them matching `data-node-id` attributes and include them in the selector.

On “New chat” or when `scenarioHistory` becomes empty, the `.active-subgraph` class is removed and everything reappears.

——

## Section 4 - PDF export with graph snapshot

Current behaviour: PDF export exports the Report panel content only.

New behaviour: PDF export produces a document containing:

1. The Report panel body (as today)
1. A page break
1. A page titled “Subgraph” containing a snapshot of the currently highlighted graph

### 4.1 Implementation approach

Use html2canvas (or equivalent) to capture the graph panel’s SVG as a PNG, then include that image in the html2pdf pipeline.

```javascript
async function exportScenarioPdf() {
  if (currentScenarioIndex < 0) return;
  const scenario = scenarioHistory[currentScenarioIndex];

  // 1. Snapshot the graph
  const graphEl = document.querySelector(“.graph-panel”);
  const graphCanvas = await html2canvas(graphEl, {
    backgroundColor: “#ffffff”,
    scale: 2,
    logging: false,
  });
  const graphPng = graphCanvas.toDataURL(“image/png”);

  // 2. Build the composite HTML for the PDF
  const reportBody = document.querySelector(“.scenario-report”).outerHTML;
  const composite = `
    <div class=“pdf-section”>${reportBody}</div>
    <div class=“pdf-page-break”></div>
    <div class=“pdf-section”>
      <h2 class=“pdf-section-title”>Subgraph</h2>
      <p class=“pdf-section-sub”>Entities and relations highlighted in this scenario.</p>
      <img src=“${graphPng}” style=“width:100%; height:auto;” />
    </div>
  `;

  // 3. Wrap and hand to html2pdf
  const wrapper = document.createElement(“div”);
  wrapper.innerHTML = composite;
  wrapper.style.padding = “20px”;
  wrapper.style.fontFamily = “’EB Garamond’, Georgia, serif”;

  html2pdf().from(wrapper).set({
    margin: [10, 10, 10, 10],
    filename: `geointel-scenario-${scenario.id}.pdf`,
    pagebreak: { mode: [“css”, “legacy”] },
    html2canvas: { scale: 2 },
    jsPDF: { unit: “mm”, format: “a4”, orientation: “portrait” },
  }).save();
}
```

CSS for page break:

```css
.pdf-page-break {
  page-break-after: always;
  break-after: page;
}
.pdf-section-title {
  margin-top: 0;
}
```

### 4.2 html2canvas SVG gotchas

If your graph is pure SVG, html2canvas can render it directly. If there are foreignObject elements or complex CSS-only animations, they may not render. Test by exporting after generating a scenario and confirm the PNG in the PDF shows the subgraph with labels.

If html2canvas produces empty output, fall back to serializing the SVG manually:

```javascript
const svgEl = graphEl.querySelector(“svg”);
const svgStr = new XMLSerializer().serializeToString(svgEl);
const svgBlob = new Blob([svgStr], { type: “image/svg+xml;charset=utf-8” });
const url = URL.createObjectURL(svgBlob);
const img = new Image();
img.src = url;
await new Promise(r => img.onload = r);
const canvas = document.createElement(“canvas”);
canvas.width = svgEl.clientWidth * 2;
canvas.height = svgEl.clientHeight * 2;
const ctx = canvas.getContext(“2d”);
ctx.scale(2, 2);
ctx.drawImage(img, 0, 0);
const graphPng = canvas.toDataURL(“image/png”);
URL.revokeObjectURL(url);
```

Add html2canvas library via CDN script tag if not already present:

```html
<script src=“https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js”></script>
```

——

## Section 5 - Non-regression checks

Before declaring done:

1. Welcome message appears at page load.
1. “New chat” clears scenario history, Report, graph highlight.
1. First scenario generation: Report renders with headline block (Likelihood + Evidence strength visible at top). Subgraph hides non-relevant nodes. A scenario card appears in chat.
1. Generate a second scenario (different question): second card appears in chat. Graph now shows the second subgraph. First scenario is still recallable.
1. Click the first scenario card: Report and graph switch back to first scenario. Card becomes active (visually distinct).
1. Click the second scenario card: Report and graph switch forward.
1. PDF export on the currently rendered scenario produces a 2-page PDF: Report + Subgraph snapshot.
1. brief_text still never appears in the DOM.
1. No JS errors in the console.

——

## Section 6 - Commit message

```
feat: scenario history, subgraph isolation, PDF snapshot

- Chat shows clickable cards for each generated scenario
- Clicking a card recalls that scenario (Report + subgraph) client-side
- Subgraph now hides non-relevant nodes/relations (display:none)
- PDF export includes subgraph snapshot on second page
- New headline block in Report: Likelihood + Evidence strength
- html2canvas added via CDN for graph-to-PNG capture
```

——

## Section 7 - If something is ambiguous

Match existing patterns. Keep minimal. Do not introduce new libraries besides html2canvas. If html2pdf is already present, reuse it.