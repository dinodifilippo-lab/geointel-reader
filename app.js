// CHESS Reader · app.js · v0.7.0
// Atlas view + Dossier view + simple routing

const APP_VERSION = "0.7.0";
console.log(`CHESS Reader ${APP_VERSION}`);

// ============ EQUAL EARTH PROJECTION ============
// Converts (lat, lon) to (x, y) in a unit-like space, then we scale to SVG viewBox
function equalEarth(lon, lat) {
const A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796;
const M = Math.sqrt(3) / 2;
const lonRad = lon * Math.PI / 180;
const latRad = lat * Math.PI / 180;
const theta = Math.asin(M * Math.sin(latRad));
const theta2 = theta * theta;
const theta6 = theta2 * theta2 * theta2;
const x = lonRad * Math.cos(theta) / (M * (A1 + 3 * A2 * theta2 + theta6 * (7 * A3 + 9 * A4 * theta2)));
const y = theta * (A1 + A2 * theta2 + theta6 * (A3 + A4 * theta2));
return { x, y };
}

// Map projection bounds (approximate for Equal Earth)
// x: roughly -2.7 to +2.7, y: roughly -1.3 to +1.3
function projectToSVG(lon, lat, viewBoxWidth, viewBoxHeight) {
const p = equalEarth(lon, lat);
const sx = (p.x + 2.7) / 5.4 * viewBoxWidth;
const sy = (1.3 - p.y) / 2.6 * viewBoxHeight;
return { x: sx, y: sy };
}

// ============ ROUTING ============
function getCurrentRoute() {
const hash = window.location.hash.replace(/^#/, ‘’);
if (!hash || hash === ‘atlas’) return { view: ‘atlas’ };
const m = hash.match(/^dossier/(.+)$/);
if (m) return { view: ‘dossier’, id: m[1] };
return { view: ‘atlas’ };
}

function navigate(route) {
if (route.view === ‘atlas’) window.location.hash = ‘atlas’;
else if (route.view === ‘dossier’) window.location.hash = `dossier/${route.id}`;
}

window.addEventListener(‘hashchange’, render);
window.addEventListener(‘DOMContentLoaded’, render);

// ============ RENDER ROOT ============
function render() {
const route = getCurrentRoute();
const root = document.getElementById(‘app-root’);
if (!root) return;

// Update topbar state
renderTopbar(route);

if (route.view === ‘atlas’) {
root.innerHTML = renderAtlasHTML();
wireAtlasInteractions();
} else if (route.view === ‘dossier’) {
const dossier = CHESS_DATA.dossiers[route.id];
if (!dossier) {
root.innerHTML = `<div class="empty-state">Dossier not found. <a href="#atlas">Back to Atlas</a></div>`;
return;
}
root.innerHTML = renderDossierHTML(dossier);
wireDossierInteractions(dossier);
}
}

// ============ TOPBAR ============
function renderTopbar(route) {
const centerEl = document.getElementById(‘topbar-center’);
const leftEl = document.getElementById(‘topbar-left-extra’);
if (!centerEl || !leftEl) return;

if (route.view === ‘atlas’) {
leftEl.innerHTML = ‘’;
centerEl.innerHTML = `<span class="breadcrumb-item">Atlas</span> <span class="dot"></span> <span class="breadcrumb-item">${CHESS_DATA.clusters.length} regions · ${Object.keys(CHESS_DATA.dossiers).length} dossiers</span>`;
} else if (route.view === ‘dossier’) {
const d = CHESS_DATA.dossiers[route.id];
if (!d) return;
const clusterLabel = d.trans_geographic ? ‘Trans-geographic’ :
(CHESS_DATA.clusters.find(c => c.id === d.cluster_id)?.label || ‘’);
leftEl.innerHTML = `<a class="back-to-atlas" href="#atlas">← Atlas</a>`;
centerEl.innerHTML = `<a class="breadcrumb-item breadcrumb-link" href="#atlas">Atlas</a> <span class="dot"></span> <span class="breadcrumb-item">${clusterLabel}</span> <span class="dot"></span> <span class="dossier-pill">DOSSIER · ${d.title.toUpperCase()}</span>`;
}
}

// ============ ATLAS VIEW ============
function renderAtlasHTML() {
const mapW = 1200, mapH = 600;

// Cluster markers
const clusterMarkers = CHESS_DATA.clusters.map(c => {
const p = projectToSVG(c.lon, c.lat, mapW, mapH);
const dossiers = c.dossier_ids.map(id => CHESS_DATA.dossiers[id]).filter(Boolean);
const count = dossiers.length;
const hasData = count > 0;
const firstDossierId = hasData ? dossiers[0].id : null;

```
return `
  <g class="cluster-marker ${hasData ? 'has-data' : 'empty'}"
     data-cluster-id="${c.id}"
     ${firstDossierId ? `data-first-dossier="${firstDossierId}"` : ''}
     transform="translate(${p.x} ${p.y})">
    <circle class="cluster-ring" r="36" fill="none" stroke="currentColor" stroke-width="1" opacity="0.25"/>
    <circle class="cluster-dot" r="${hasData ? 14 : 9}" />
    ${hasData ? `<text class="cluster-count" y="5" text-anchor="middle">${count}</text>` : ''}
    <text class="cluster-label" y="54" text-anchor="middle">${c.label}</text>
  </g>
`;
```

}).join(’’);

// Trans-geographic dossiers on orbital ring
const transIds = CHESS_DATA.trans_geographic_dossier_ids;
const orbitalItems = transIds.map((id, i) => {
const d = CHESS_DATA.dossiers[id];
if (!d) return ‘’;
// position on arc around top
const angle = -Math.PI / 2 + (i - (transIds.length - 1) / 2) * 0.4;
const cx = mapW / 2 + Math.cos(angle) * (mapW * 0.42);
const cy = mapH / 2 + Math.sin(angle) * (mapH * 0.55);
return `<g class="orbital-item" data-dossier-id="${d.id}" transform="translate(${cx} ${cy})"> <circle r="22" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3" stroke-dasharray="2,3"/> <circle class="orbital-dot" r="10"/> <text class="orbital-label" y="-32" text-anchor="middle">${d.title}</text> </g>`;
}).join(’’);

// Simple world continents outline -- minimal suggestive shape
// Uses a very simplified land mass path (not geographically perfect, editorial-light)
const continentsPath = getSimpleContinentsPath(mapW, mapH);

return `
<section class="atlas-view">
<div class="atlas-header">
<h1 class="atlas-title">Atlas</h1>
<p class="atlas-subtitle">Active dossiers, organised by region. Trans-geographic dossiers on the outer ring.</p>
</div>

```
  <div class="atlas-map-wrap">
    <svg class="atlas-map" viewBox="0 0 ${mapW} ${mapH}" preserveAspectRatio="xMidYMid meet">
      <!-- Orbital ring guide -->
      <ellipse cx="${mapW/2}" cy="${mapH/2}" rx="${mapW * 0.46}" ry="${mapH * 0.58}"
               fill="none" stroke="#d9d4c6" stroke-width="1" stroke-dasharray="3,4" opacity="0.5"/>

      <!-- Continents (simplified) -->
      <g class="continents">${continentsPath}</g>

      <!-- Clusters -->
      <g class="clusters">${clusterMarkers}</g>

      <!-- Orbital ring items -->
      <g class="orbital-ring">${orbitalItems}</g>
    </svg>
  </div>

  <div class="atlas-legend">
    <div class="legend-group">
      <span class="legend-dot" style="background:#0d7a6e"></span>
      <span>Active dossier</span>
    </div>
    <div class="legend-group">
      <span class="legend-dot" style="background:#c4bfb1"></span>
      <span>Region without dossiers</span>
    </div>
    <div class="legend-group">
      <span class="legend-dot" style="background:#5b21b6"></span>
      <span>Trans-geographic (orbital)</span>
    </div>
  </div>
</section>
```

`;
}

function wireAtlasInteractions() {
// Click on cluster with data → enter first dossier
document.querySelectorAll(’.cluster-marker.has-data’).forEach(el => {
el.addEventListener(‘click’, () => {
const id = el.getAttribute(‘data-first-dossier’);
if (id) navigate({ view: ‘dossier’, id });
});
});
// Click on orbital item → enter dossier
document.querySelectorAll(’.orbital-item’).forEach(el => {
el.addEventListener(‘click’, () => {
const id = el.getAttribute(‘data-dossier-id’);
if (id) navigate({ view: ‘dossier’, id });
});
});
}

// ============ DOSSIER VIEW ============
function renderDossierHTML(d) {
return `
<div class="dossier-view">
<aside class="chat-panel">
<div class="panel-header">
<span class="panel-title">Chat</span>
<span class="panel-meta">${d.chat.length} msg · Session</span>
</div>
<div class="chat-messages">
<div class="day-sep">Today · Apr 20</div>
${d.chat.map(m => renderMessage(m)).join(’’)}
</div>
<div class="chat-input-wrap">
<div class="chat-input-box">
<textarea placeholder="Ask a follow-up, or start a new analysis…"></textarea>
<div class="chat-input-actions">
<button class="send-btn">
Run
<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
</button>
</div>
</div>
</div>
</aside>

```
  <div class="right-area">

    <div class="upper-strip">
      <section class="graph-panel">
        <div class="panel-header">
          <span class="panel-title">Graph</span>
          <span class="panel-action">Expand</span>
        </div>
        <div class="graph-controls">
          <button class="graph-ctrl active">Full</button>
          <button class="graph-ctrl">Actors</button>
          <button class="graph-ctrl">Assets</button>
          <button class="graph-ctrl">Events</button>
        </div>
        <div class="graph-svg-wrap">
          <svg class="graph-svg" viewBox="0 0 720 360" preserveAspectRatio="xMidYMid meet">
            ${d.graph_svg}
          </svg>
        </div>
        <div class="legend">
          <div class="legend-item"><span class="legend-dot" style="background:#0d7a6e"></span>Actor</div>
          <div class="legend-item"><span class="legend-dot" style="background:#a8570f"></span>Asset</div>
          <div class="legend-item"><span class="legend-dot" style="background:#5b21b6"></span>Event</div>
          <div class="legend-item"><span class="legend-dot" style="background:#b8203a"></span>Negative arc</div>
          <div class="legend-item"><span class="legend-dot" style="background:#15803d"></span>Positive arc</div>
        </div>
      </section>

      <aside class="intel-panel">
        <div class="panel-header"><span class="panel-title">Intel</span></div>
        <div class="intel-body">
          ${renderIntel(d.intel)}
        </div>
      </aside>
    </div>

    <section class="report-panel">
      <div class="panel-header">
        <span class="panel-title">Report <span class="report-num">#${d.current_report_id}</span></span>
        <div class="report-header-right">
          <span class="panel-meta">${d.reports[d.current_report_id].timestamp}</span>
          <button class="download-btn" title="Download report">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            <span>PDF</span>
          </button>
        </div>
      </div>
      <div class="report-scroll">
        ${renderReport(d)}
      </div>
    </section>

  </div>
</div>
```

`;
}

function renderMessage(m) {
if (m.role === ‘user’) {
return `<div class="msg user"> <div class="msg-bubble">${m.text}</div> <div class="msg-time">${m.time}</div> </div>`;
}
const reportLink = m.report_id
? `<a class="msg-link">↗ Report #${m.report_id} →</a>` : ‘’;
return `<div class="msg ai ${m.pending ? 'pending' : ''}"> <div class="msg-bubble">${m.text}${m.pending ? '<span class="dots"></span>' : ''}</div> ${reportLink} <div class="msg-time">${m.time}</div> </div>`;
}

function renderIntel(intel) {
const C = intel.confidence;
const circumference = 2 * Math.PI * 23; // r=23
const offset = circumference * (1 - C.value);
return `
<div class="intel-section">
<div class="intel-header">
<span class="intel-sec-title">Confidence</span>
<span class="panel-action">Breakdown</span>
</div>
<div class="confidence-block">
<div class="gauge">
<svg width="58" height="58" viewBox="0 0 58 58">
<circle cx="29" cy="29" r="23" fill="none" stroke="#ebe8df" stroke-width="5"/>
<circle cx="29" cy="29" r="23" fill="none" stroke="#15803d" stroke-width="5" stroke-linecap="round"
stroke-dasharray="${circumference.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}"/>
</svg>
<div class="gauge-text">${C.value.toFixed(2)}</div>
</div>
<div class="confidence-meta">
<div class="big">${C.label}</div>
<div class="small">${C.note}</div>
</div>
</div>
</div>

```
<div class="intel-section">
  <div class="intel-header">
    <span class="intel-sec-title">Top arcs</span>
    <span class="panel-action">All ${intel.top_arcs.length > 3 ? intel.top_arcs.length : 28}</span>
  </div>
  <div class="arc-list">
    ${intel.top_arcs.map(a => `
      <div class="arc-item">
        <div class="arc-flow">
          <span class="arc-node">${a.from}</span>
          <span class="arc-arrow">━▶</span>
          <span class="arc-node">${a.to}</span>
        </div>
        <div class="arc-props">
          <span>${a.type}</span>
          <span><span class="weight">w ${a.weight.toFixed(2)}</span> · <span class="polarity ${a.polarity}">${a.polarity === 'neg' ? '−' : '+'}</span> · vol ${a.volatility}</span>
        </div>
        <div class="arc-bar"><div class="arc-bar-fill" style="width:${Math.round(a.weight*100)}%${a.polarity === 'pos' ? ';background:linear-gradient(90deg,#15803d 0%,#0d7a6e 100%)' : ''}"></div></div>
      </div>
    `).join('')}
  </div>
</div>

<div class="intel-section">
  <div class="intel-header">
    <span class="intel-sec-title">Recent events</span>
    <span class="panel-action">Timeline →</span>
  </div>
  <div class="timeline">
    ${intel.events.map(e => `
      <div class="tl-item ${e.active ? 'active' : ''}">
        <div class="tl-date">${e.date}</div>
        <div class="tl-title">${e.title}</div>
      </div>
    `).join('')}
  </div>
</div>
```

`;
}

function renderReport(d) {
const r = d.reports[d.current_report_id];
return `
<article class="report">
<h1 class="report-title">${r.title}</h1>
<p class="report-subtitle">${r.subtitle}</p>

```
  <div class="byline">
    <div class="byline-item"><span class="label">Dossier</span><span class="value">${d.title}</span></div>
    <div class="byline-item"><span class="label">Nodes</span><span class="value teal">${d.stats.entities} entities</span></div>
    <div class="byline-item"><span class="label">Arcs</span><span class="value teal">${d.stats.relations} relations</span></div>
    <div class="byline-item"><span class="label">Corpus</span><span class="value">${d.stats.corpus} articles</span></div>
    <div class="byline-item"><span class="label">Sources</span><span class="value">${d.stats.sources} think tanks</span></div>
  </div>

  <div class="exec-summary">
    <div class="exec-label">Executive Summary</div>
    <div class="exec-text">${r.executive_summary}</div>
  </div>

  <div class="report-body">${r.body_html}</div>

  <div class="sources">
    <div class="sources-label">Sources cited · ${r.sources.length} of ${d.stats.corpus}</div>
    ${r.sources.map(s => `
      <div class="source-item">
        <div class="source-num">[${s.num}]</div>
        <div>
          <div class="source-title">${s.title}</div>
          <div class="source-meta">${s.meta}</div>
        </div>
        <div class="source-date">${s.date}</div>
      </div>
    `).join('')}
  </div>
</article>
```

`;
}

function wireDossierInteractions(d) {
document.querySelectorAll(’.graph-ctrl’).forEach(btn => {
btn.addEventListener(‘click’, () => {
btn.parentElement.querySelectorAll(‘button’).forEach(b => b.classList.remove(‘active’));
btn.classList.add(‘active’);
});
});
const ta = document.querySelector(’.chat-input-box textarea’);
if (ta) {
ta.addEventListener(‘input’, () => {
ta.style.height = ‘auto’;
ta.style.height = Math.min(ta.scrollHeight, 120) + ‘px’;
});
}
}

// ============ SIMPLIFIED CONTINENTS ============
// Stylised, very minimal land outlines for editorial feel (not geographic accuracy)
function getSimpleContinentsPath(w, h) {
// Build continent blobs by projecting a small set of approximate anchor points
// and drawing soft polygons. This is deliberately sketchy -- atlas, not atlas-accurate.
const pts = (coords) => coords.map(([lon, lat]) => {
const p = projectToSVG(lon, lat, w, h);
return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
}).join(’ ’);

const style = ‘fill="#f0ece1" stroke="#d9d4c6" stroke-width="0.8" stroke-linejoin="round"’;

const nAmerica = pts([
[-168,67],[-140,70],[-95,72],[-70,60],[-60,47],[-82,26],[-98,18],[-117,32],[-125,50],[-150,59],[-168,67]
]);
const sAmerica = pts([
[-80,12],[-50,5],[-40,-20],[-60,-55],[-73,-52],[-80,-20],[-82,-5],[-80,12]
]);
const europe = pts([
[-10,36],[5,36],[15,37],[28,38],[40,43],[60,55],[55,70],[28,71],[10,58],[-10,50],[-10,36]
]);
const africa = pts([
[-18,15],[10,35],[32,32],[50,12],[51,-5],[40,-18],[18,-35],[0,-5],[-17,5],[-18,15]
]);
const asia = pts([
[40,43],[60,55],[90,55],[120,53],[145,58],[155,45],[140,35],[125,22],[105,10],[90,20],[75,10],[55,20],[40,28],[40,43]
]);
const oceania = pts([
[113,-12],[135,-12],[153,-25],[145,-38],[118,-35],[113,-22],[113,-12]
]);

return `<polygon ${style} points="${nAmerica}"/> <polygon ${style} points="${sAmerica}"/> <polygon ${style} points="${europe}"/> <polygon ${style} points="${africa}"/> <polygon ${style} points="${asia}"/> <polygon ${style} points="${oceania}"/>`;
}