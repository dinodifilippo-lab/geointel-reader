# GeoIntel Reader - Frontend Update Spec

## For Claude Code - v2.3 (graph fixes + evidence strength unification + question rendering)

——

## TL;DR

Iteration on v2.2. Five frontend fixes:

1. Every node in the graph (and subgraph) MUST have a visible label. Some nodes currently render without one.
1. Expand on the graph panel must preserve the subgraph filter (currently expand shows the full graph regardless of active scenario).
1. Evidence strength: unify naming and source. Remove the “Confidence” widget from the Intel panel. Display “Evidence strength” only, computed client-side, in BOTH the Report headline block AND the Intel panel. Same number in both places.
1. Render the user original question inside the Report (the backend now returns it as user_question and emits a blockquote in report_html, but you also need CSS for the new blockquote class).
1. Subgraph readability: when a scenario is active, recompute the layout for the highlighted subgraph using a force-directed approach so nodes and arcs do not overlap. The full-graph (Atlas / no-scenario) layout remains as today.

No changes to data.js. No changes to Edge Function (already deployed v2.2).

——

## Section 1 - New Edge Function response shape (v2.2)

The response now includes:

- `scenario.user_question` (string): the user original question verbatim, in the language they typed it
- `scenario.report_html` includes a new blockquote with class `scenario-question` rendering the question inline

The field `evidence_strength` is NO LONGER in the backend response. You compute it entirely client-side as the mean of the `confidence` field of the relations in `relation_keys`, rounded to 2 decimals.

Insert the computed value into the headline block of the rendered report. The backend emits the headline block with Likelihood only; you must inject Evidence strength as a sibling `.headline-item` after rendering.

Pseudo-code:

```javascript
function computeEvidenceStrength(relationKeys, kgRelations) {
  if (!relationKeys || relationKeys.length === 0) return null;
  const confs = relationKeys.map(key => {
    const rel = kgRelations.find(r => `${r.from}|${r.to}|${r.type}` === key);
    return rel ? rel.confidence : null;
  }).filter(c => c !== null);
  if (confs.length === 0) return null;
  const mean = confs.reduce((a,b) => a+b, 0) / confs.length;
  return Math.round(mean * 100) / 100;
}

function evidenceStrengthLabel(value) {
  if (value < 0.55) return “weak”;
  if (value < 0.70) return “moderate”;
  if (value < 0.80) return “moderate-high”;
  return “high”;
}
```

After injecting the report_html into the Report panel, find the `.scenario-headline` element and append:

```html
<div class=“headline-item”>
  <span class=“headline-label”>Evidence strength</span>
  <span class=“headline-value”>[value] <span class=“headline-range”>[label]</span></span>
</div>
```

CSS for the question blockquote (add to existing scenario-report CSS):

```css
.scenario-report .scenario-question {
  margin: 1rem 0 1.25rem 0;
  padding: 0.6rem 1rem;
  border-left: 3px solid var(—accent, #0d7a6e);
  background: rgba(13, 122, 110, 0.04);
  font-style: italic;
  color: var(—text, #1a1a1a);
  font-size: 0.95rem;
  line-height: 1.5;
}
.scenario-report .scenario-question .question-label {
  display: block;
  font-style: normal;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(—accent, #0d7a6e);
  margin-bottom: 0.3rem;
}
```

——

## Section 2 - Intel panel: replace Confidence with Evidence strength

The Intel panel currently shows a “Confidence” widget (e.g., “0.79 - Moderate-high confidence - Averaged over 12 arc(s)”). Rename and recompute:

- Label: “Evidence strength” (not “Confidence”)
- Value: same number as in the Report headline block (use the same `computeEvidenceStrength` function output)
- Description: “[label] - Mean confidence across [N] arcs in this scenario”
- Same visual style (gauge or number + caption)

This guarantees the Report and Intel show the same number. No more drift.

When no scenario is active, the Intel panel shows a placeholder: “Generate a scenario to see evidence strength.”

——

## Section 3 - Node labels: every node must have a label

Bug: in the current rendering, some nodes appear as colored circles without a text label. All nodes must have a label visible at all times.

Fix: in the graph render function, for every node in `window.CHESS_DATA.kg.entities`, render both:

- the circle/marker
- the label (using `entity.name` or the human-readable field used today)

If labels are positioned outside the circle (offset), make sure the offset is computed even for nodes that currently lack one. If certain nodes are excluded from labeling because of a filter, remove that filter for entities present in the graph render set.

Verify in console: after page load, count `<text>` elements vs node count - they should match.

——

## Section 4 - Expand preserves subgraph

Bug: tapping “Expand” on the graph panel shows the full graph, ignoring the current `active-subgraph` filter.

Fix: the Expand action should:

1. Open the expanded view of the graph panel (whatever it does today: modal, fullscreen, etc.)
1. Apply the same `.active-subgraph` class on the expanded container if a scenario is currently active
1. Apply the same `data-node-id` / `data-relation-key` selection logic in the expanded view

If the expanded view re-renders the graph from scratch, pass the current `currentScenarioIndex` and re-apply the filter on render.

When the user is in Atlas mode (no scenario active), Expand shows the full graph as today.

——

## Section 5 - Subgraph layout: force-directed when scenario is active

Current behavior: the graph uses geographic / hardcoded positions for all nodes. When a subgraph is filtered, the highlighted nodes stay in their original positions, leaving them sometimes overlapping or crowded.

New behavior: when a scenario is active and the subgraph filter is on, recompute the positions of the highlighted nodes using a force-directed simulation (d3-force or equivalent), constrained to the visible viewport of the graph panel. The full-graph layout (no scenario) remains unchanged.

### Implementation

Use d3-force (already shipped if d3 is in the project). Add to the graph render function:

```javascript
function applyForceLayoutToSubgraph(highlightedEntities, highlightedRelations, viewport) {
  const nodes = highlightedEntities.map(e => ({ id: e.id, name: e.name, ...e }));
  const links = highlightedRelations.map(r => ({ source: r.from, target: r.to, ...r }));

  const sim = d3.forceSimulation(nodes)
    .force(“link”, d3.forceLink(links).id(d => d.id).distance(120).strength(0.6))
    .force(“charge”, d3.forceManyBody().strength(-400))
    .force(“center”, d3.forceCenter(viewport.width / 2, viewport.height / 2))
    .force(“collision”, d3.forceCollide().radius(40))
    .stop();

  // Run synchronously for ~300 ticks so layout settles before render
  for (let i = 0; i < 300; i++) sim.tick();

  return { nodes, links };
}
```

Then in the render:

- If `currentScenarioIndex >= 0` AND the rendering target is the subgraph:
  - Call `applyForceLayoutToSubgraph` to compute new positions
  - Render nodes and arcs using these positions
  - Hide all non-highlighted nodes and arcs (already today via display:none)
- Else:
  - Use existing geographic / hardcoded layout

### Constraints

- The force-directed layout MUST stay inside the visible panel (use `forceCenter` + viewport bounds clamping)
- Labels MUST be offset and not overlap nodes (either above or below based on available space)
- Arcs MUST NOT cross labels where avoidable (a higher charge strength helps)
- Labels in the force-directed view should use the entity short name if `entity.short_name` exists, else `entity.name`

### Apply to expanded view too

When Expand is open AND a scenario is active, the expanded view also uses the force-directed subgraph layout, scaled to the larger viewport.

——

## Section 6 - Non-regression checks

Before declaring done:

1. Welcome message at page load.
1. New chat clears scenario history, Report, graph highlight, Intel panel.
1. Generate first scenario:
- Report renders with question blockquote visible
- Headline block shows BOTH Likelihood AND Evidence strength
- Subgraph nodes are positioned by force layout, no overlap
- Every visible node has a label
- Intel panel shows “Evidence strength: [same number as Report]”
1. Tap Expand on graph: expanded view shows ONLY the subgraph (not the full graph), nodes still readable.
1. Generate a second scenario: new card in chat, graph re-flows with new force layout.
1. Tap first card: Report and graph switch back, force layout re-applied to first scenario subgraph.
1. PDF export: 2-page PDF (Report + Subgraph snapshot), snapshot uses the force-directed layout.
1. brief_text never appears in DOM.
1. No JS errors in console.
1. Confidence widget no longer present anywhere.

——

## Section 7 - Commit message

```
feat: graph readability + evidence strength unification + question render

- Force-directed layout for active subgraphs (d3-force)
- Expand preserves subgraph filter
- Every node renders with a label
- Confidence widget replaced with Evidence strength (single source: client-computed)
- Report renders user_question as inline blockquote
- New CSS for .scenario-question, force layout viewport bounds
```

——

## Section 8 - If something is ambiguous

Match existing patterns. If d3 is not yet in the project, add it via CDN. Keep the full-graph (Atlas) layout untouched.