// GeoIntel Reader - app.js - v2.4.0

const APP_VERSION = "2.4.0";
console.log("GeoIntel Reader " + APP_VERSION);

// ============ ON-SCREEN DEBUG LOG ============
const DEBUG_LOG_CAP = 40;
let DEBUG_LOG = [];
function debugLog(label, data) {
try { console.log(label, data); } catch (e) {}
let text;
try {
if (data === undefined) text = "";
else if (typeof data === "string") text = data;
else if (typeof data === "number" || typeof data === "boolean") text = String(data);
else text = JSON.stringify(data);
} catch (e) { text = "[unserialisable: " + (e && e.message) + "]"; }
if (text && text.length > 300) text = text.slice(0, 300) + "…";
const d = new Date();
const ts = String(d.getHours()).padStart(2, "0") + ":" +
String(d.getMinutes()).padStart(2, "0") + ":" +
String(d.getSeconds()).padStart(2, "0");
DEBUG_LOG.push({ ts: ts, label: label, text: text });
if (DEBUG_LOG.length > DEBUG_LOG_CAP) DEBUG_LOG.shift();
}

// ============ LIVE CHAT BACKEND ============
const GEOINTEL_CHAT_ENDPOINT = "https://chuvfdbpwiszjuoyhvlw.supabase.co/functions/v1/geointel-reader-chat";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNodXZmZGJwd2lzemp1b3lodmx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzOTU2NzcsImV4cCI6MjA4OTk3MTY3N30.7OAuk36xTNa6cFyF2cnpBRUtgeZpttAyi-ZA28_fhdU";

const WELCOME_MESSAGE = "Ciao. Questa e’ una demo di GeoIntel Reader. Posso costruire proiezioni di scenario su 6 aree: Russia-Ucraina, Iran (Hormuz e rivalita’ con USA), Taiwan, AI US-Cina, Mar Rosso-Houthi.\n\nFai una domanda di scenario. Se mancano elementi per rispondere bene, te li chiedo. Quando lo scenario e’ chiaro, genero report e sotto-grafo.";

let CHAT_IN_FLIGHT = false;
let CHAT_ERROR = null;
let REPORT_LOADING = false;
const CHAT_HISTORY_CAP = 20;

let scenarioHistory = [];
let currentScenarioIndex = -1;
let chatHistory = [];
let lastAssistantType = null;

function getCurrentScenario() {
return currentScenarioIndex >= 0 && currentScenarioIndex < scenarioHistory.length
? scenarioHistory[currentScenarioIndex]
: null;
}

// ============ BASEMAP ASSET (async) ============
let WORLD_LAND = null;
fetch("world-110m.json")
.then(function(r) { return r.json(); })
.then(function(data) { WORLD_LAND = data; BASEMAP_LOADED = true; render(); })
.catch(function(err) { console.warn("Basemap failed to load:", err); BASEMAP_LOADED = true; render(); });

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
return { x: x, y: y };
}

function projectToSVG(lon, lat, viewBoxWidth, viewBoxHeight) {
const p = equalEarth(lon, lat);
const sx = (p.x + 2.7) / 5.4 * viewBoxWidth;
const sy = (1.3 - p.y) / 2.6 * viewBoxHeight;
return { x: sx, y: sy };
}

const MAP_W = 1200, MAP_H = 600;

// ============ ROUTING ============
function getRoute() {
if (getCurrentScenario() || REPORT_LOADING) return { view: "scenario" };
return { view: "home" };
}

window.addEventListener("hashchange", function() {
if (!getCurrentScenario() && !REPORT_LOADING) ATLAS_VIEW = { level: "world", clusterId: null };
render();
});
window.addEventListener("DOMContentLoaded", render);

window.addEventListener("keydown", function(e) {
if (e.key !== "Escape") return;
if (GRAPH_OVERLAY_OPEN) { GRAPH_OVERLAY_OPEN = false; render(); return; }
if (ARCHIVE_OPEN) { ARCHIVE_OPEN = false; render(); return; }
if (INFO_CARD.open) { INFO_CARD = { open: false, type: null, id: null }; render(); return; }
if (GRAPH_HIGHLIGHT) { GRAPH_HIGHLIGHT = null; render(); return; }
});

let ATLAS_VIEW = { level: "world", clusterId: null };
let INFO_CARD = { open: false, type: null, id: null };

function makeGreeting() {
return { role: "ai", time: "Now", text: escapeHTMLForChat(WELCOME_MESSAGE) };
}
let GLOBAL_CHAT = [makeGreeting()];
let GRAPH_HIGHLIGHT = null;
let ARCHIVE_OPEN = false;
let GRAPH_OVERLAY_OPEN = false;
let BASEMAP_LOADED = false;

function newChat() {
saveChatToArchive();
GLOBAL_CHAT = [makeGreeting()];
scenarioHistory = [];
currentScenarioIndex = -1;
chatHistory = [];
lastAssistantType = null;
CHAT_IN_FLIGHT = false;
CHAT_ERROR = null;
REPORT_LOADING = false;
ATLAS_VIEW = { level: "world", clusterId: null };
INFO_CARD = { open: false, type: null, id: null };
GRAPH_HIGHLIGHT = null;
ARCHIVE_OPEN = false;
if (window.location.hash) window.location.hash = "";
else render();
}

function saveChatToArchive() {
if (!GLOBAL_CHAT || GLOBAL_CHAT.length <= 1) return;
try {
const raw = localStorage.getItem("gir_chat_archive") || "[]";
const arr = JSON.parse(raw);
arr.push({ startedAt: Date.now(), messages: GLOBAL_CHAT });
localStorage.setItem("gir_chat_archive", JSON.stringify(arr));
} catch (e) {
console.warn("Archive save failed:", e);
}
}

// ============ RENDER ROOT ============
function render() {
const route = getRoute();
const root = document.getElementById("app-root");
if (!root) return;
renderTopbar(route);
root.innerHTML = renderWorkingSurfaceHTML();
wireWorkingSurface(route.view === "scenario");
if (route.view === "scenario") {
injectEvidenceStrength();
}
}

function renderTopbar(route) {
const leftEl = document.getElementById("topbar-left-extra");
const centerEl = document.getElementById("topbar-center");
if (!leftEl || !centerEl) return;
if (route.view === "scenario") {
leftEl.innerHTML = ‘<a class="back-to-atlas" href="#" id="back-to-atlas">← Atlas</a>’;
const title = getCurrentScenario() && getCurrentScenario().title
? getCurrentScenario().title
: (REPORT_LOADING ? "Generating scenario…" : "Scenario");
centerEl.innerHTML = ’<span class="dossier-pill">SCENARIO · ’ + escapeHTML(title.toUpperCase()) + ‘</span>’;
} else {
leftEl.innerHTML = ‘’;
centerEl.innerHTML = ‘’;
}
}

function renderWorkingSurfaceHTML() {
const route = getRoute();
return ‘<div class="working-surface">’ +
(ARCHIVE_OPEN ? renderArchiveDrawer() : ‘’) +
renderChatPanel() +
‘<div class="right-area">’ +
(route.view === "scenario" ? renderPopulatedRight() : renderAmbientRight()) +
‘</div>’ +
(GRAPH_OVERLAY_OPEN && route.view === "scenario" ? renderGraphOverlay() : ‘’) +
‘</div>’;
}

function renderGraphOverlay() {
const title = getCurrentScenario() && getCurrentScenario().title ? getCurrentScenario().title : "Subgraph";
return ‘<div class="graph-overlay" role="dialog" aria-label="Graph fullscreen">’ +
‘<div class="graph-overlay-bg" data-overlay-dismiss="1"></div>’ +
‘<div class="graph-overlay-box">’ +
‘<div class="graph-overlay-header">’ +
’<div class="graph-overlay-title">Subgraph · ’ + escapeHTML(title) + ‘</div>’ +
‘<button class="graph-overlay-close" id="graph-overlay-close" type="button" aria-label="Close">x</button>’ +
‘</div>’ +
‘<div class="graph-overlay-canvas" id="graph-overlay-canvas"></div>’ +
‘<div class="graph-overlay-hint">Esc to close</div>’ +
‘</div>’ +
‘</div>’;
}

function renderChatPanel() {
const count = GLOBAL_CHAT.length;
const metaLabel = count <= 1 ? "Ready" : count + " msg · Session";
const isEmpty = count <= 1;
const messagesHTML = ‘<div class="day-sep">Today · ’ + formatToday() + ‘</div>’ +
GLOBAL_CHAT.map(renderMessage).join("");
return ‘<aside class="chat-panel">’ +
‘<div class="panel-header">’ +
‘<span class="panel-title">Chat</span>’ +
‘<div class="chat-header-right">’ +
‘<button class="new-chat-btn" id="archive-btn" title="Open archive">’ +
‘<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"/></svg>’ +
‘</button>’ +
‘<button class="new-chat-btn" id="new-chat-btn" title="New chat">’ +
‘<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>’ +
‘<span>New</span>’ +
‘</button>’ +
‘<span class="panel-meta">’ + metaLabel + ‘</span>’ +
‘</div>’ +
‘</div>’ +
‘<div class="chat-messages' + (isEmpty ? ' empty' : '') + '" id="chat-messages">’ +
messagesHTML +
‘</div>’ +
‘<form class="chat-input-wrap" id="chat-form">’ +
(CHAT_ERROR
? ‘<div class="chat-error" id="chat-error" role="alert">’ +
‘<span class="chat-error-text">’ + escapeHTML(CHAT_ERROR) + ‘</span>’ +
‘<button type="button" class="chat-error-dismiss" id="chat-error-dismiss" aria-label="Dismiss">x</button>’ +
‘</div>’
: ‘’) +
renderDebugPanel() +
(CHAT_IN_FLIGHT
? ‘<div class="chat-loading" id="chat-loading" aria-live="polite">Analysing<span class="dots"></span></div>’
: ‘’) +
‘<div class="chat-input-box">’ +
‘<textarea id="chat-textarea" placeholder="Chiedi uno scenario (es. finestra migliore per un'azione cinese su Taiwan)…" rows="1"’ + (CHAT_IN_FLIGHT ? ’ disabled’ : ‘’) + ‘></textarea>’ +
‘<div class="chat-input-actions">’ +
‘<button type="submit" class="send-btn" id="chat-send"’ + (CHAT_IN_FLIGHT ? ’ disabled’ : ‘’) + ‘>Run <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg></button>’ +
‘</div>’ +
‘</div>’ +
‘</form>’ +
‘</aside>’;
}

function renderDebugPanel() {
if (!DEBUG_LOG.length) return ‘’;
const openAttr = CHAT_ERROR ? ’ open’ : ‘’;
const rows = DEBUG_LOG.map(function(e) {
return ‘<div class="debug-row">’ +
‘<span class="debug-ts">’ + escapeHTML(e.ts) + ‘</span>’ +
‘<span class="debug-label">’ + escapeHTML(e.label) + ‘</span>’ +
‘<span class="debug-text">’ + escapeHTML(e.text) + ‘</span>’ +
‘</div>’;
}).join("");
return ‘<details class="debug-panel"’ + openAttr + ‘>’ +
’<summary>Debug log · ’ + DEBUG_LOG.length + ’ entries ’ +
‘<span class="debug-actions">’ +
‘<button type="button" class="debug-clear" id="debug-copy">copy</button>’ +
‘<button type="button" class="debug-clear" id="debug-clear">clear</button>’ +
‘</span>’ +
‘</summary>’ +
‘<div class="debug-body">’ + rows + ‘</div>’ +
‘</details>’;
}

function formatToday() {
const d = new Date();
const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
return months[d.getMonth()] + " " + d.getDate();
}

// ============ AMBIENT RIGHT ============
function renderAmbientRight() {
const regionLabel = ATLAS_VIEW.level === "region" && ATLAS_VIEW.clusterId
? (CHESS_DATA.clusters.find(function(x){return x.id === ATLAS_VIEW.clusterId;}) || {}).label || ""
: "";
const headerRight = ATLAS_VIEW.level === "region"
? ‘<button class="ambient-back" id="ambient-back">← World</button>’
: ‘’;
return ‘<div class="atlas-ambient">’ +
‘<div class="ambient-header">’ +
‘<div class="ambient-head-text">’ +
‘<div class="ambient-title">Atlas’ + (regionLabel ? ’ <span class="ambient-sub">· ’ + regionLabel + ‘</span>’ : ‘’) + ‘</div>’ +
‘<div class="ambient-subtitle">’ +
(!BASEMAP_LOADED
? ‘Loading basemap…’
: ATLAS_VIEW.level === "region"
? ‘Tap a dossier to open, or ask directly in chat.’
: ‘Ask in chat, or tap a region to drill in.’) +
‘</div>’ +
‘</div>’ +
headerRight +
‘</div>’ +
‘<div class="atlas-ambient-map" id="atlas-ambient-map">’ +
renderAtlasSVG() +
(INFO_CARD.open ? renderInfoCard() : ‘’) +
‘</div>’ +
‘<div class="ambient-legend">’ +
‘<div class="legend-group"><span class="legend-dot" style="background:#0d7a6e"></span><span>Active dossier</span></div>’ +
‘<div class="legend-group"><span class="legend-dot" style="background:#c4bfb1"></span><span>Region in osservazione</span></div>’ +
‘<div class="legend-group"><span class="legend-dot" style="background:#5b21b6"></span><span>Trans-geografico (orbital)</span></div>’ +
‘</div>’ +
‘</div>’;
}

function renderAtlasSVG() {
const vb = computeAmbientViewBox();
const labelScale = ATLAS_VIEW.level === "region" ? 0.5 : 1;
const showOrbital = ATLAS_VIEW.level === "world";
const regionDossiers = (ATLAS_VIEW.level === "region" && ATLAS_VIEW.clusterId)
? renderRegionDossierMarkers(ATLAS_VIEW.clusterId, labelScale)
: ‘’;
return ‘<svg class="atlas-svg interactive" viewBox="' + vb + '" preserveAspectRatio="xMidYMid meet">’ +
‘<rect class="atlas-bg" x="0" y="0" width="' + MAP_W + '" height="' + MAP_H + '"/>’ +
‘<ellipse class="atlas-graticule" cx="' + (MAP_W/2) + '" cy="' + (MAP_H/2) + '" rx="' + (MAP_W * 0.46) + '" ry="' + (MAP_H * 0.58) + '"/>’ +
‘<g class="land">’ + renderLand() + ‘</g>’ +
‘<g class="clusters">’ + renderClusterMarkers(labelScale) + ‘</g>’ +
‘<g class="region-dossiers">’ + regionDossiers + ‘</g>’ +
‘<g class="orbital-ring">’ + (showOrbital ? renderOrbitalMarkers(labelScale) : ‘’) + ‘</g>’ +
‘</svg>’;
}

function renderInfoCard() {
if (INFO_CARD.type !== "dossier") return ‘’;
const d = CHESS_DATA.dossiers[INFO_CARD.id];
if (!d) return ‘’;
const actors = (d.actors || []).map(function(a) {
return ‘<span class="actor-chip">’ + a + ‘</span>’;
}).join("");
const cluster = d.cluster_id ? CHESS_DATA.clusters.find(function(x){return x.id === d.cluster_id;}) : null;
const eyebrow = d.trans_geographic ? "Trans-geographic" : (cluster ? cluster.label : "Dossier");
return ‘<aside class="info-card" role="dialog" aria-label="Dossier information">’ +
‘<button class="info-card-close" title="Close">x</button>’ +
‘<div class="info-card-eyebrow">’ + eyebrow + ‘</div>’ +
‘<h2 class="info-card-title">’ + d.title + ‘</h2>’ +
‘<p class="info-card-desc">’ + d.description + ‘</p>’ +
‘<div class="info-card-section-label">Actors</div>’ +
‘<div class="actor-list">’ + actors + ‘</div>’ +
‘<div class="info-card-foot">’ +
‘<span>’ + d.stats.entities + ’ entities · ’ + d.stats.relations + ’ arcs · ’ + d.stats.corpus + ’ articles</span>’ +
‘</div>’ +
‘</aside>’;
}

function computeAmbientViewBox() {
if (ATLAS_VIEW.level === "region" && ATLAS_VIEW.clusterId) {
const c = CHESS_DATA.clusters.find(function(x){return x.id === ATLAS_VIEW.clusterId;});
if (c) {
const p = projectToSVG(c.lon, c.lat, MAP_W, MAP_H);
const w = 460, h = 290;
return (p.x - w/2).toFixed(1) + " " + (p.y - h/2).toFixed(1) + " " + w + " " + h;
}
}
return "0 0 " + MAP_W + " " + MAP_H;
}

// ============ POPULATED RIGHT ============
function renderPopulatedRight() {
const reportBody = REPORT_LOADING
? renderReportLoader()
: (getCurrentScenario()
? renderScenarioReport(getCurrentScenario())
: renderReportEmpty());
const reportTitle = getCurrentScenario() && getCurrentScenario().title
? ‘<span class="panel-title">Report · <span class="scenario-title-inline">’ + escapeHTML(getCurrentScenario().title) + ‘</span></span>’
: ‘<span class="panel-title">Report</span>’;
return ‘<div class="upper-strip">’ +
‘<section class="graph-panel">’ +
‘<div class="panel-header">’ +
‘<span class="panel-title">Subgraph</span>’ +
‘<button class="panel-action panel-action-btn" id="graph-expand-btn" type="button" aria-label="Open graph fullscreen">Expand</button>’ +
‘</div>’ +
‘<div class="graph-svg-wrap" id="subgraph-container-inline"></div>’ +
renderSubgraphLegend(false) +
‘</section>’ +
‘<aside class="intel-panel">’ +
‘<div class="panel-header"><span class="panel-title">Intel</span></div>’ +
‘<div class="intel-body">’ + renderIntel(computeScenarioIntel()) + ‘</div>’ +
‘</aside>’ +
‘</div>’ +
‘<section class="report-panel">’ +
‘<div class="panel-header">’ +
reportTitle +
‘<div class="report-header-right">’ +
‘<button class="download-btn" title="Download report"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg><span>PDF</span></button>’ +
‘</div>’ +
‘</div>’ +
‘<div class="report-scroll">’ + reportBody + ‘</div>’ +
‘</section>’;
}

function renderSubgraphLegend(fullscreen) {
const sz = fullscreen ? ‘’ : ’ compact’;
return ‘<div class="subgraph-legend-bar' + sz + '">’ +
‘<div class="sg-leg-sec"><strong>Nodes</strong>’ +
‘<span class="sg-leg-item"><svg width="12" height="12"><circle cx="6" cy="6" r="4.5" fill="#d1fae5" stroke="#10b981" stroke-width="1.3"/></svg>Actor</span>’ +
‘<span class="sg-leg-item"><svg width="12" height="12"><circle cx="6" cy="6" r="4.5" fill="#fef3c7" stroke="#d97706" stroke-width="1.3"/></svg>Asset</span>’ +
‘</div>’ +
‘<div class="sg-leg-sec"><strong>Edges</strong>’ +
‘<span class="sg-leg-item"><svg width="22" height="8"><line x1="2" y1="4" x2="16" y2="4" stroke="#ef4444" stroke-width="2.2" opacity="0.85"/><polygon points="16,1 21,4 16,7" fill="#ef4444"/></svg>Negative</span>’ +
‘<span class="sg-leg-item"><svg width="22" height="8"><line x1="2" y1="4" x2="16" y2="4" stroke="#10b981" stroke-width="2.2" opacity="0.85"/><polygon points="16,1 21,4 16,7" fill="#10b981"/></svg>Positive</span>’ +
‘<span class="sg-leg-item sg-muted">thickness = weight</span>’ +
‘</div>’ +
‘<div class="sg-leg-sec"><strong>Volatility</strong>’ +
‘<span class="sg-leg-item"><span class="sg-vol-pill sg-vol-h">H</span>High</span>’ +
‘<span class="sg-leg-item"><span class="sg-vol-pill sg-vol-m">M</span>Med</span>’ +
‘<span class="sg-leg-item"><span class="sg-vol-pill sg-vol-l">L</span>Low</span>’ +
‘</div>’ +
‘</div>’ +
‘<details class="subgraph-glossary">’ +
‘<summary>Mechanisms glossary</summary>’ +
‘<div class="sg-glos-body">’ +
‘<div class="sg-glos-item"><strong>Coercion</strong>Direct pressure to bend the target's will.</div>’ +
‘<div class="sg-glos-item"><strong>Deterrence</strong>Forward posture raising the cost of aggressive action.</div>’ +
‘<div class="sg-glos-item"><strong>Enabling</strong>Indirect support that multiplies a partner's capability.</div>’ +
‘<div class="sg-glos-item"><strong>Basing</strong>Physical access to territory, ports, airfields.</div>’ +
‘<div class="sg-glos-item"><strong>Economic pressure</strong>Commercial and financial leverage.</div>’ +
‘</div>’ +
‘</details>’;
}

function renderReportEmpty() {
return ‘<div class="report-empty">’ +
‘<div class="report-empty-inner">’ +
‘<div class="report-empty-title">Nessuno scenario generato</div>’ +
‘<div class="report-empty-body">Chiedi qualcosa nella chat a sinistra per generare uno scenario.</div>’ +
‘</div>’ +
‘</div>’;
}

function renderReportLoader() {
return ‘<div class="report-empty">’ +
‘<div class="report-empty-inner">’ +
‘<div class="report-empty-title">Generazione in corso<span class="dots"></span></div>’ +
‘<div class="report-empty-body">Sto componendo il report e isolando il sotto-grafo rilevante.</div>’ +
‘</div>’ +
‘</div>’;
}

function renderScenarioReport(scenario) {
return scenario.report_html || renderReportEmpty();
}

// ============ MAP RENDERING ============
function renderLand() {
if (!WORLD_LAND) return ‘’;
const parts = [];
for (let i = 0; i < WORLD_LAND.length; i++) {
const ring = WORLD_LAND[i];
if (!ring || ring.length < 3) continue;
let minLon = 180, maxLon = -180;
for (let j = 0; j < ring.length; j++) {
const lon = ring[j][0];
if (lon < minLon) minLon = lon;
if (lon > maxLon) maxLon = lon;
}
if (maxLon - minLon > 180) continue;
const pts = [];
for (let j = 0; j < ring.length; j++) {
const p = projectToSVG(ring[j][0], ring[j][1], MAP_W, MAP_H);
pts.push(p.x.toFixed(1) + "," + p.y.toFixed(1));
}
parts.push(’<polygon points="’ + pts.join(" ") + ‘"/>’);
}
return parts.join("");
}

function renderClusterMarkers(labelScale) {
return CHESS_DATA.clusters.map(function(c) {
const p = projectToSVG(c.lon, c.lat, MAP_W, MAP_H);
const dossiers = c.dossier_ids.map(function(id) { return CHESS_DATA.dossiers[id]; }).filter(Boolean);
const count = dossiers.length;
const hasData = count > 0;
const countLabel = hasData
? ‘<text class="cluster-count" y="5" text-anchor="middle">’ + count + ‘</text>’
: ‘’;
const labelSize = (14 * labelScale).toFixed(1);
const ringR = hasData ? 36 : 26;
const dotR = hasData ? 14 : 9;
const isHidden = ATLAS_VIEW.level === "region" && ATLAS_VIEW.clusterId !== c.id;
return ‘<g class="cluster-marker ’ + (hasData ? "has-data" : "empty") + ’ interactive’ + (isHidden ? ’ hidden’ : ‘’) + ‘"’ +
’ data-cluster-id="’ + c.id + ‘"’ +
’ transform="translate(’ + p.x.toFixed(1) + ’ ’ + p.y.toFixed(1) + ‘)">’ +
‘<circle class="cluster-ring" r="' + ringR + '" fill="none" stroke="currentColor" stroke-width="1" opacity="0.25"/>’ +
‘<circle class="cluster-dot" r="' + dotR + '"/>’ +
countLabel +
‘<text class="cluster-label" y="' + (dotR + 18).toFixed(0) + '" text-anchor="middle" style="font-size:' + labelSize + 'px">’ + c.label + ‘</text>’ +
‘</g>’;
}).join("");
}

function renderRegionDossierMarkers(clusterId, labelScale) {
const c = CHESS_DATA.clusters.find(function(x) { return x.id === clusterId; });
if (!c) return ‘’;
return c.dossier_ids.map(function(id) {
const d = CHESS_DATA.dossiers[id];
if (!d || d.lon == null || d.lat == null) return ‘’;
const p = projectToSVG(d.lon, d.lat, MAP_W, MAP_H);
const labelSize = (12 * labelScale).toFixed(1);
return ‘<g class="dossier-marker" data-dossier-id="’ + d.id + ‘"’ +
’ transform="translate(’ + p.x.toFixed(1) + ’ ’ + p.y.toFixed(1) + ‘)">’ +
‘<circle class="dossier-halo" r="14" opacity="0.3"/>’ +
‘<circle class="dossier-dot" r="6"/>’ +
‘<text class="dossier-label" y="-14" text-anchor="middle" style="font-size:' + labelSize + 'px">’ + d.title + ‘</text>’ +
‘</g>’;
}).join("");
}

function renderOrbitalMarkers(labelScale) {
const transIds = CHESS_DATA.trans_geographic_dossier_ids;
const labelSize = (13 * labelScale).toFixed(1);
return transIds.map(function(id, i) {
const d = CHESS_DATA.dossiers[id];
if (!d) return "";
const angle = -Math.PI / 2 + (i - (transIds.length - 1) / 2) * 0.4;
const cx = MAP_W / 2 + Math.cos(angle) * (MAP_W * 0.42);
const cy = MAP_H / 2 + Math.sin(angle) * (MAP_H * 0.55);
return ‘<g class="orbital-item interactive" data-dossier-id="’ + d.id + ‘"’ +
’ transform="translate(’ + cx.toFixed(1) + ’ ’ + cy.toFixed(1) + ‘)">’ +
‘<circle r="22" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3" stroke-dasharray="2,3"/>’ +
‘<circle class="orbital-dot" r="10"/>’ +
‘<text class="orbital-label" y="-32" text-anchor="middle" style="font-size:' + labelSize + 'px">’ + d.title + ‘</text>’ +
‘</g>’;
}).join("");
}

// ============ WIRE WORKING SURFACE ============
function wireWorkingSurface(isScenarioView) {
wireChatForm(isScenarioView);
wireCommonChrome();
if (!isScenarioView) {
wireAmbientInteractions();
}
if (isScenarioView) {
const cs = getCurrentScenario();
if (cs) {
renderSubgraph(document.getElementById("subgraph-container-inline"), cs, false);
if (GRAPH_OVERLAY_OPEN) {
renderSubgraph(document.getElementById("graph-overlay-canvas"), cs, true);
}
}
}
}

function wireCommonChrome() {
const newBtn = document.getElementById("new-chat-btn");
if (newBtn) newBtn.addEventListener("click", newChat);
const archBtn = document.getElementById("archive-btn");
if (archBtn) archBtn.addEventListener("click", function() { ARCHIVE_OPEN = !ARCHIVE_OPEN; render(); });
const backBtn = document.getElementById("back-to-atlas");
if (backBtn) backBtn.addEventListener("click", function(e) {
e.preventDefault();
currentScenarioIndex = -1;
REPORT_LOADING = false;
render();
});
const dbgClear = document.getElementById("debug-clear");
if (dbgClear) dbgClear.addEventListener("click", function(e) {
e.preventDefault();
e.stopPropagation();
DEBUG_LOG = [];
render();
});
const dbgCopy = document.getElementById("debug-copy");
if (dbgCopy) dbgCopy.addEventListener("click", function(e) {
e.preventDefault();
e.stopPropagation();
const text = DEBUG_LOG.map(function(x) {
return x.ts + "\t" + x.label + "\t" + x.text;
}).join("\n");
const original = dbgCopy.textContent;
function flash(msg) {
dbgCopy.textContent = msg;
setTimeout(function() { dbgCopy.textContent = original; }, 1500);
}
if (navigator.clipboard && navigator.clipboard.writeText) {
navigator.clipboard.writeText(text).then(
function() { flash("copied"); },
function() { flash("failed"); }
);
} else {
try {
const ta = document.createElement("textarea");
ta.value = text;
ta.setAttribute("readonly", "");
ta.style.position = "absolute";
ta.style.left = "-9999px";
document.body.appendChild(ta);
ta.select();
const ok = document.execCommand("copy");
document.body.removeChild(ta);
flash(ok ? "copied" : "failed");
} catch (err) {
flash("failed");
}
}
});
const expandBtn = document.getElementById("graph-expand-btn");
if (expandBtn) expandBtn.addEventListener("click", function() { GRAPH_OVERLAY_OPEN = true; render(); });
const overlayClose = document.getElementById("graph-overlay-close");
if (overlayClose) overlayClose.addEventListener("click", function() { GRAPH_OVERLAY_OPEN = false; render(); });
document.querySelectorAll("[data-overlay-dismiss]").forEach(function(el) {
el.addEventListener("click", function() { GRAPH_OVERLAY_OPEN = false; render(); });
});
document.querySelectorAll(".scenario-card").forEach(function(card) {
const id = card.getAttribute("data-scenario-id");
if (!id) return;
card.addEventListener("click", function() { recallScenario(id); });
card.addEventListener("keydown", function(e) {
if (e.key === "Enter" || e.key === " ") { e.preventDefault(); recallScenario(id); }
});
});
document.querySelectorAll(".download-btn").forEach(function(btn) {
btn.addEventListener("click", function() { exportScenarioPdf(); });
});
wireArchiveDrawer();
}

function wireAmbientInteractions() {
document.querySelectorAll(".cluster-marker").forEach(function(el) {
el.addEventListener("click", function(e) {
e.stopPropagation();
const id = el.getAttribute("data-cluster-id");
const c = CHESS_DATA.clusters.find(function(x){return x.id === id;});
if (!c) return;
if (c.dossier_ids.length === 0) {
el.classList.add("shake");
setTimeout(function(){ el.classList.remove("shake"); }, 400);
return;
}
if (c.dossier_ids.length === 1) {
INFO_CARD = { open: true, type: "dossier", id: c.dossier_ids[0] };
render();
return;
}
ATLAS_VIEW = { level: "region", clusterId: id };
INFO_CARD = { open: false, type: null, id: null };
render();
});
});
document.querySelectorAll(".dossier-marker").forEach(function(el) {
el.addEventListener("click", function(e) {
e.stopPropagation();
const id = el.getAttribute("data-dossier-id");
INFO_CARD = { open: true, type: "dossier", id: id };
render();
});
});
document.querySelectorAll(".orbital-item").forEach(function(el) {
el.addEventListener("click", function(e) {
e.stopPropagation();
const id = el.getAttribute("data-dossier-id");
INFO_CARD = { open: true, type: "dossier", id: id };
render();
});
});
const backBtn = document.getElementById("ambient-back");
if (backBtn) {
backBtn.addEventListener("click", function() {
ATLAS_VIEW = { level: "world", clusterId: null };
INFO_CARD = { open: false, type: null, id: null };
render();
});
}
document.querySelectorAll(".info-card-close").forEach(function(btn) {
btn.addEventListener("click", function() {
INFO_CARD = { open: false, type: null, id: null };
render();
});
});
}

// ============ ARCHIVE DRAWER ============
function loadArchive() {
try {
return JSON.parse(localStorage.getItem("gir_chat_archive") || "[]");
} catch (e) {
return [];
}
}

function writeArchive(arr) {
try {
localStorage.setItem("gir_chat_archive", JSON.stringify(arr));
} catch (e) {
console.warn("Archive write failed:", e);
}
}

function renderArchiveDrawer() {
const archive = loadArchive();
const items = archive.length === 0
? ‘<div class="archive-empty">No archived conversations yet.</div>’
: archive.map(function(entry, idx) {
const firstUser = (entry.messages || []).find(function(m) { return m.role === "user"; });
const title = firstUser ? stripHTML(firstUser.text) : "(empty conversation)";
const started = new Date(entry.startedAt);
const dateLabel = started.toLocaleDateString() + " · " + String(started.getHours()).padStart(2,"0") + ":" + String(started.getMinutes()).padStart(2,"0");
const count = (entry.messages || []).length;
return ‘<div class="archive-item" data-archive-idx="' + idx + '">’ +
‘<div class="archive-item-main">’ +
‘<div class="archive-item-title">’ + escapeHTML(title) + ‘</div>’ +
‘<div class="archive-item-meta">’ + dateLabel + ’ · ’ + count + ’ msg</div>’ +
‘</div>’ +
‘<button class="archive-delete" data-archive-idx="' + idx + '" title="Delete">x</button>’ +
‘</div>’;
}).join("");
const clearAllBtn = archive.length > 0
? ‘<button class="archive-clear-all" id="archive-clear-all">Clear all</button>’
: ‘’;
return ‘<aside class="archive-drawer" role="dialog" aria-label="Archived chats">’ +
‘<div class="archive-header">’ +
‘<span class="archive-title">Archive</span>’ +
‘<button class="archive-close" id="archive-close" title="Close">x</button>’ +
‘</div>’ +
‘<div class="archive-body">’ + items + ‘</div>’ +
(clearAllBtn ? ‘<div class="archive-footer">’ + clearAllBtn + ‘</div>’ : ‘’) +
‘</aside>’;
}

function wireArchiveDrawer() {
const closeBtn = document.getElementById("archive-close");
if (closeBtn) closeBtn.addEventListener("click", function() { ARCHIVE_OPEN = false; render(); });
const clearBtn = document.getElementById("archive-clear-all");
if (clearBtn) clearBtn.addEventListener("click", function() {
writeArchive([]);
render();
});
document.querySelectorAll(".archive-item-main").forEach(function(el) {
el.addEventListener("click", function() {
const idx = Number(el.parentElement.getAttribute("data-archive-idx"));
const archive = loadArchive();
const entry = archive[idx];
if (!entry) return;
saveChatToArchive();
GLOBAL_CHAT = (entry.messages || []).slice();
ARCHIVE_OPEN = false;
const fresh = loadArchive();
fresh.splice(idx, 1);
writeArchive(fresh);
if (window.location.hash) window.location.hash = "";
else render();
});
});
document.querySelectorAll(".archive-delete").forEach(function(btn) {
btn.addEventListener("click", function(e) {
e.stopPropagation();
const idx = Number(btn.getAttribute("data-archive-idx"));
const archive = loadArchive();
archive.splice(idx, 1);
writeArchive(archive);
render();
});
});
}

function stripHTML(s) {
return (s || "").replace(/<[^>]*>/g, "");
}

// ============ CHAT ============
function wireChatForm(_isScenarioView) {
const form = document.getElementById("chat-form");
const ta = document.getElementById("chat-textarea");
const sendBtn = document.getElementById("chat-send");
if (!form || !ta) return;
ta.addEventListener("input", function() {
ta.style.height = "auto";
ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
});
ta.addEventListener("keydown", function(e) {
if (e.key === "Enter" && !e.shiftKey) {
e.preventDefault();
if (CHAT_IN_FLIGHT) return;
form.requestSubmit();
}
});
form.addEventListener("submit", function(e) {
e.preventDefault();
if (CHAT_IN_FLIGHT) return;
if (sendBtn && sendBtn.disabled) return;
const text = ta.value.trim();
if (!text) return;
handleChatSubmit(text);
});
const dismiss = document.getElementById("chat-error-dismiss");
if (dismiss) dismiss.addEventListener("click", function() {
CHAT_ERROR = null;
render();
});
if (!CHAT_IN_FLIGHT && ta) ta.focus();
const msgs = document.getElementById("chat-messages");
if (msgs) msgs.scrollTop = msgs.scrollHeight;
}

function buildDossierIndex() {
const D = (window.CHESS_DATA && window.CHESS_DATA.dossiers) || {};
return Object.keys(D).map(function(id) {
return { id: id, title: D[id].title, description: D[id].description || "" };
});
}

function readNdjsonDone(resp) {
if (!resp.body || typeof resp.body.getReader !== "function") {
return resp.text().then(parseNdjsonText);
}
const reader = resp.body.getReader();
const decoder = new TextDecoder("utf-8");
let buffer = "";
let framesSeen = 0;
function pump() {
return reader.read().then(function(chunk) {
if (chunk.done) {
const tail = buffer.trim();
if (tail) {
const frame = parseNdjsonLine(tail);
if (frame) {
framesSeen = framesSeen + 1;
if (frame.type === "done") return frame.payload || {};
}
}
throw new Error("NDJSON stream ended without a ‘done’ frame (frames seen: " + framesSeen + ")");
}
buffer = buffer + decoder.decode(chunk.value, { stream: true });
let nl = buffer.indexOf("\n");
while (nl !== -1) {
const raw = buffer.slice(0, nl).trim();
buffer = buffer.slice(nl + 1);
nl = buffer.indexOf("\n");
if (!raw) continue;
const frame = parseNdjsonLine(raw);
if (!frame) continue;
framesSeen = framesSeen + 1;
if (frame.type === "start" || frame.type === "heartbeat") continue;
if (frame.type === "done") {
try { reader.cancel(); } catch (e) {}
return frame.payload || {};
}
debugLog("NDJSON UNKNOWN FRAME:", frame.type);
}
return pump();
});
}
return pump();
}

function parseNdjsonLine(line) {
try { return JSON.parse(line); }
catch (e) {
debugLog("NDJSON PARSE ERROR:", (line || "").slice(0, 120));
return null;
}
}

function parseNdjsonText(txt) {
const lines = String(txt || "").split("\n");
let framesSeen = 0;
for (let i = 0; i < lines.length; i = i + 1) {
const raw = lines[i].trim();
if (!raw) continue;
const frame = parseNdjsonLine(raw);
if (!frame) continue;
framesSeen = framesSeen + 1;
if (frame.type === "start" || frame.type === "heartbeat") continue;
if (frame.type === "done") return frame.payload || {};
}
throw new Error("NDJSON body had no ‘done’ frame (frames seen: " + framesSeen + ")");
}

function handleChatSubmit(text) {
const now = formatNow();
GLOBAL_CHAT.push({ role: "user", time: now, text: escapeHTMLForChat(text) });
chatHistory.push({ role: "user", content: text });
const expectingGeneration = (lastAssistantType === "ready_to_generate" ||
lastAssistantType === "scenario_followup");
if (expectingGeneration) {
REPORT_LOADING = true;
}
CHAT_IN_FLIGHT = true;
CHAT_ERROR = null;
const _csFull = getCurrentScenario();
const _csReduced = _csFull
? { question: _csFull.question, entity_ids: _csFull.entity_ids, relation_keys: _csFull.relation_keys }
: null;
const payload = {
question: text,
history: chatHistory.slice(-CHAT_HISTORY_CAP - 1, -1),
kg: (window.CHESS_DATA && window.CHESS_DATA.kg) || { entities: [], relations: [] },
dossier_index: buildDossierIndex(),
current_scenario: _csReduced
};
debugLog("PAYLOAD SIZE BYTES:", new Blob([JSON.stringify(payload)]).size);
debugLog("PAYLOAD KEYS:", Object.keys(payload));
debugLog("KG ENTITIES COUNT:", payload.kg && payload.kg.entities && payload.kg.entities.length);
debugLog("KG RELATIONS COUNT:", payload.kg && payload.kg.relations && payload.kg.relations.length);
debugLog("HISTORY LENGTH:", payload.history && payload.history.length);
debugLog("CURRENT_SCENARIO PRESENT:", !!payload.current_scenario);
render();
const CHAT_TIMEOUT_MS = 180000;
const controller = new AbortController();
const timeoutId = setTimeout(function() { controller.abort(); }, CHAT_TIMEOUT_MS);
fetch(GEOINTEL_CHAT_ENDPOINT, {
method: "POST",
headers: {
"Content-Type": "application/json",
"Authorization": "Bearer " + SUPABASE_ANON_KEY
},
body: JSON.stringify(payload),
signal: controller.signal
}).then(function(resp) {
debugLog("RESPONSE STATUS:", resp.status);
debugLog("RESPONSE OK:", resp.ok);
debugLog("RESPONSE HEADERS:", [].concat.apply([], [resp.headers.entries()].map(function(it){ var out=[]; var r; while(!(r=it.next()).done) out.push(r.value); return out; })));
if (!resp.ok) {
return resp.text().then(function(errText) {
throw new Error("HTTP " + resp.status + ": " + (errText ? errText.slice(0, 300) : resp.statusText || "no body"));
});
}
const contentType = (resp.headers.get("content-type") || "").toLowerCase();
if (contentType.indexOf("application/x-ndjson") !== -1) {
return readNdjsonDone(resp);
}
return resp.text().then(function(txt) {
try { return JSON.parse(txt); }
catch (e) {
throw new Error("Malformed JSON from engine (likely EarlyDrop). First 200 chars: " + (txt || "").slice(0, 200));
}
});
}).then(function(data) {
clearTimeout(timeoutId);
if (!data || typeof data !== "object") {
console.warn("Engine returned non-object payload:", data);
} else if (data.error) {
throw new Error("Engine error: " + String(data.error).slice(0, 300));
} else if (!data.type) {
console.warn("Engine returned no `type`; payload was:", data);
}
handleResponse(data || {});
}).catch(function(err) {
clearTimeout(timeoutId);
debugLog("FETCH FAILED name:", err && err.name);
debugLog("FETCH FAILED message:", err && err.message);
debugLog("FETCH FAILED stack:", err && err.stack);
console.error("Chat error:", err);
CHAT_IN_FLIGHT = false;
REPORT_LOADING = false;
const isAbort = err && (err.name === "AbortError" || /abort/i.test(String(err.message || "")));
if (isAbort) {
CHAT_ERROR = "Request timed out after " + Math.round(CHAT_TIMEOUT_MS / 1000) +
"s. The Edge Function likely hit its wall-clock limit (EarlyDrop). " +
"Raise wallClockLimitMs on the function and retry.";
} else {
const detail = (err && err.message) ? String(err.message).slice(0, 260) : "unknown error";
CHAT_ERROR = "Analysis engine error: " + detail;
}
if (chatHistory.length && chatHistory[chatHistory.length - 1].role === "user") {
chatHistory.pop();
}
render();
});
}

function handleResponse(data) {
const type = data.type || "clarification";
const message = typeof data.message === "string" ? data.message : "";
const now = formatNow();
CHAT_IN_FLIGHT = false;
lastAssistantType = type;
let bubbleText = message;
if (type === "scenario" && (!message || !message.trim())) {
bubbleText = "Procedo con la generazione.";
}
GLOBAL_CHAT.push({
role: "ai",
time: now,
text: escapeHTMLForChat(bubbleText || "(empty response)"),
type: type
});
chatHistory.push({ role: "assistant", content: bubbleText || "" });
if (type === "scenario" && data.scenario && typeof data.scenario === "object") {
const scenarioId = "sc_" + Date.now() + "_" + Math.floor(Math.random() * 1e6).toString(36);
const question = data.scenario.question
|| (chatHistory.length >= 2 ? chatHistory[chatHistory.length - 2].content : "");
const scenarioObj = {
id: scenarioId,
title: data.scenario.title || "Scenario",
question: question,
report_html: data.scenario.report_html || "",
entity_ids: Array.isArray(data.scenario.entity_ids) ? data.scenario.entity_ids.slice() : [],
relation_keys: Array.isArray(data.scenario.relation_keys) ? data.scenario.relation_keys.slice() : [],
critical_edges: Array.isArray(data.scenario.critical_edges) ? data.scenario.critical_edges.slice() : [],
created_at: new Date().toISOString()
};
scenarioHistory.push(scenarioObj);
currentScenarioIndex = scenarioHistory.length - 1;
GLOBAL_CHAT.push({
role: "scenario-card",
time: now,
scenario_id: scenarioId,
scenario_title: scenarioObj.title
});
REPORT_LOADING = false;
} else {
REPORT_LOADING = false;
}
render();
}

function formatNow() {
const d = new Date();
const hh = String(d.getHours()).padStart(2, "0");
const mm = String(d.getMinutes()).padStart(2, "0");
return hh + ":" + mm;
}

function escapeHTML(s) {
return String(s == null ? "" : s).replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">").replace(/"/g, """);
}

function escapeHTMLForChat(s) {
return escapeHTML(s).replace(/\n/g, "<br>");
}

// ============ SUBGRAPH ENGINE v2.4 (geometric from mock v11) ============
// Force-directed layout con miglioramenti grafici dal mock v11:
// - Endpoint math: archi si fermano al bordo del cerchio nodo (non centro)
// - Label collision avoidance con range dinamico (callout = far, inline = close)
// - Bbox nodi accurato che include label sottostante
// - Callout numerati per critical_edges con mechanism+volatility
// - Label inline minimale grigia per archi non critici
// - Polarity: negativo rosso, positivo verde
// - Thickness: proporzionale a weight
// - Freccia direzionale con marker SVG
const SG_NS = "http://www.w3.org/2000/svg";

function renderSubgraph(container, scenario, fullscreen) {
if (!container || !scenario) return;
const kg = (window.CHESS_DATA && window.CHESS_DATA.kg) || { entities: [], relations: [] };
const idSet = {};
(scenario.entity_ids || []).forEach(function(id) { idSet[id] = true; });
const keySet = {};
(scenario.relation_keys || []).forEach(function(k) { keySet[k] = true; });
const entities = kg.entities.filter(function(e) { return idSet[e.id]; });
const relations = kg.relations.filter(function(r) { return keySet[r.from + "|" + r.to + "|" + r.type]; });
if (entities.length === 0) {
container.innerHTML = ‘<div class="sg-empty">No subgraph for this scenario.</div>’;
return;
}
const vbW = fullscreen ? 1280 : 720;
const vbH = fullscreen ? 720 : 420;
const nodes = computeForceLayoutV24(entities, relations, vbW, vbH);
const criticalByKey = {};
(scenario.critical_edges || []).forEach(function(ce, idx) {
const k = ce.src_id + "|" + ce.dst_id;
criticalByKey[k] = { num: idx + 1, mechanism: ce.mechanism || "", volatility: (ce.volatility || "").toUpperCase() };
});
const svg = document.createElementNS(SG_NS, "svg");
svg.setAttribute("class", "sg-svg");
svg.setAttribute("viewBox", "0 0 " + vbW + " " + vbH);
svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
sgMakeDefs(svg);
const occupied = [];
Object.keys(nodes).forEach(function(id) { occupied.push(sgNodeBBox(nodes[id])); });
const midpoints = [];
relations.forEach(function(r) {
const fn = nodes[r.from], tn = nodes[r.to];
if (!fn || !tn) return;
const critical = criticalByKey[r.from + "|" + r.to];
const pol = sgPolaritySign(r.polarity);
const color = pol < 0 ? "#ef4444" : (pol > 0 ? "#10b981" : "#9e9b94");
const markerId = pol < 0 ? "sg-ar-r" : (pol > 0 ? "sg-ar-g" : "sg-ar-n");
const width = 1 + (r.weight || 0.4) * 3.2;
const opacity = critical ? 0.9 : 0.55;
const mid = sgDrawCurvedEdge(svg, fn, tn, {
color: color, width: width, opacity: opacity, marker: markerId, curveAmt: 0
});
midpoints.push({ rel: r, mid: mid, critical: critical });
});
midpoints.forEach(function(mp) {
if (!mp.critical) return;
const pos = sgPlaceLabel(mp.mid.x, mp.mid.y, 140, 30, occupied, "callout");
sgDrawCallout(svg, mp.mid.x, mp.mid.y, pos, mp.critical.num, mp.critical.mechanism, mp.critical.volatility);
});
midpoints.forEach(function(mp) {
if (mp.critical) return;
const text = (mp.rel.type || "").replace(/_/g, " ");
if (!text) return;
const labelW = text.length * 5.4 + 6;
const pos = sgPlaceLabel(mp.mid.x, mp.mid.y, labelW, 12, occupied, "inline");
sgDrawInlineLabel(svg, pos, text);
});
Object.keys(nodes).forEach(function(id) { sgDrawNode(svg, nodes[id]); });
container.innerHTML = "";
container.appendChild(svg);
}

function computeForceLayoutV24(entities, relations, width, height) {
const nodes = {};
entities.forEach(function(e) {
nodes[e.id] = {
id: e.id,
main: e.label || e.id,
sub: e.short_name && e.short_name !== e.label ? e.short_name : "",
type: e.type || "actor",
r: e.type === "asset" ? 11 : 13,
x: 0, y: 0, vx: 0, vy: 0,
fill: e.type === "asset" ? "#fef3c7" : "#d1fae5",
stroke: e.type === "asset" ? "#d97706" : "#10b981"
};
});
const cx = width / 2, cy = height / 2;
const keys = Object.keys(nodes);
const n = keys.length;
keys.forEach(function(id, i) {
const angle = (i / n) * Math.PI * 2;
const r = Math.min(width, height) * 0.32;
nodes[id].x = cx + Math.cos(angle) * r;
nodes[id].y = cy + Math.sin(angle) * r;
});
const links = relations
.filter(function(r) { return nodes[r.from] && nodes[r.to]; })
.map(function(r) { return { source: r.from, target: r.to, w: r.weight || 0.4 }; });
const iterations = 280;
const idealDist = Math.min(width, height) * 0.22;
const repel = 8000;
const attract = 0.03;
const centerPull = 0.008;
const margin = 50;
for (let iter = 0; iter < iterations; iter++) {
const coolingFactor = 1 - iter / iterations;
keys.forEach(function(id) {
const a = nodes[id];
a.vx = 0; a.vy = 0;
keys.forEach(function(id2) {
if (id === id2) return;
const b = nodes[id2];
const dx = a.x - b.x, dy = a.y - b.y;
const dist2 = dx * dx + dy * dy + 0.01;
const dist = Math.sqrt(dist2);
const f = repel / dist2;
a.vx += (dx / dist) * f;
a.vy += (dy / dist) * f;
});
});
links.forEach(function(l) {
const a = nodes[l.source], b = nodes[l.target];
if (!a || !b) return;
const dx = b.x - a.x, dy = b.y - a.y;
const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
const delta = dist - idealDist;
const f = attract * delta * (1 + l.w);
a.vx += (dx / dist) * f;
a.vy += (dy / dist) * f;
b.vx -= (dx / dist) * f;
b.vy -= (dy / dist) * f;
});
keys.forEach(function(id) {
const a = nodes[id];
a.vx += (cx - a.x) * centerPull;
a.vy += (cy - a.y) * centerPull;
});
keys.forEach(function(id) {
const a = nodes[id];
a.x += a.vx * coolingFactor;
a.y += a.vy * coolingFactor;
a.x = Math.max(margin, Math.min(width - margin, a.x));
a.y = Math.max(margin + 10, Math.min(height - margin - 30, a.y));
});
}
return nodes;
}

function sgPolaritySign(pol) {
if (typeof pol === "number") return pol < 0 ? -1 : (pol > 0 ? 1 : 0);
if (!pol) return 0;
const s = String(pol).toLowerCase();
if (s.indexOf("pos") === 0) return 1;
if (s.indexOf("neg") === 0) return -1;
return 0;
}

function sgMakeDefs(svg) {
const defs = document.createElementNS(SG_NS, "defs");
const markers = [
{ id: "sg-ar-r", color: "#ef4444" },
{ id: "sg-ar-g", color: "#10b981" },
{ id: "sg-ar-n", color: "#9e9b94" }
];
markers.forEach(function(m) {
const mk = document.createElementNS(SG_NS, "marker");
mk.setAttribute("id", m.id);
mk.setAttribute("viewBox", "0 0 10 10");
mk.setAttribute("refX", "9");
mk.setAttribute("refY", "5");
mk.setAttribute("markerWidth", "5");
mk.setAttribute("markerHeight", "5");
mk.setAttribute("orient", "auto");
const path = document.createElementNS(SG_NS, "path");
path.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
path.setAttribute("fill", m.color);
mk.appendChild(path);
defs.appendChild(mk);
});
svg.appendChild(defs);
}

function sgEndpointOnCircle(cx, cy, r, tx, ty) {
const dx = tx - cx, dy = ty - cy;
const len = Math.sqrt(dx * dx + dy * dy);
if (len < 0.001) return { x: cx, y: cy };
return { x: cx + (dx / len) * r, y: cy + (dy / len) * r };
}

function sgDrawCurvedEdge(svg, fromNode, toNode, opts) {
const fromR = fromNode.r || 12;
const toR = toNode.r || 12;
const curveAmt = opts.curveAmt || 0;
const dx = toNode.x - fromNode.x, dy = toNode.y - fromNode.y;
const len = Math.sqrt(dx * dx + dy * dy) || 1;
const midX = (fromNode.x + toNode.x) / 2, midY = (fromNode.y + toNode.y) / 2;
const perpX = -dy / len, perpY = dx / len;
const ctrlX = midX + perpX * curveAmt;
const ctrlY = midY + perpY * curveAmt;
const fromTarget = curveAmt !== 0 ? { x: ctrlX, y: ctrlY } : { x: toNode.x, y: toNode.y };
const toSource = curveAmt !== 0 ? { x: ctrlX, y: ctrlY } : { x: fromNode.x, y: fromNode.y };
const p1 = sgEndpointOnCircle(fromNode.x, fromNode.y, fromR + 2, fromTarget.x, fromTarget.y);
const p2 = sgEndpointOnCircle(toNode.x, toNode.y, toR + 7, toSource.x, toSource.y);
const path = document.createElementNS(SG_NS, "path");
const d = curveAmt !== 0
? "M " + p1.x + " " + p1.y + " Q " + ctrlX + " " + ctrlY + " " + p2.x + " " + p2.y
: "M " + p1.x + " " + p1.y + " L " + p2.x + " " + p2.y;
path.setAttribute("d", d);
path.setAttribute("fill", "none");
path.setAttribute("stroke", opts.color);
path.setAttribute("stroke-width", opts.width);
path.setAttribute("opacity", opts.opacity);
path.setAttribute("stroke-linecap", "round");
path.setAttribute("marker-end", "url(#" + opts.marker + ")");
svg.appendChild(path);
return curveAmt !== 0
? { x: 0.25 * p1.x + 0.5 * ctrlX + 0.25 * p2.x, y: 0.25 * p1.y + 0.5 * ctrlY + 0.25 * p2.y }
: { x: midX, y: midY };
}

function sgNodeBBox(node) {
const mainLen = (node.main || "").length;
const subLen = (node.sub || "").length;
const maxW = Math.max(mainLen * 7.0, subLen * 6.0);
const w = Math.max(node.r * 2, maxW);
const h = node.r * 2 + 32;
return {
x: node.x - w / 2 - 6,
y: node.y - node.r - 6,
w: w + 12,
h: h + 12
};
}

function sgBboxOverlap(a, b) {
return !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y);
}

function sgPlaceLabel(midX, midY, labelW, labelH, occupied, rangeType) {
const padding = 5;
const directions = [
{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
{ dx: -0.7, dy: -0.7 }, { dx: 0.7, dy: -0.7 },
{ dx: -0.7, dy: 0.7 }, { dx: 0.7, dy: 0.7 }
];
const distances = rangeType === "callout"
? [55, 85, 115, 150, 190, 230]
: [16, 26, 38, 52, 70];
for (let di = 0; di < distances.length; di++) {
const dist = distances[di];
for (let i = 0; i < directions.length; i++) {
const dir = directions[i];
const cx = midX + dir.dx * dist;
const cy = midY + dir.dy * dist;
const bb = {
x: cx - labelW / 2 - padding,
y: cy - labelH / 2 - padding,
w: labelW + padding * 2,
h: labelH + padding * 2
};
let conflict = false;
for (let o = 0; o < occupied.length; o++) {
if (sgBboxOverlap(bb, occupied[o])) { conflict = true; break; }
}
if (!conflict) {
occupied.push(bb);
return { x: cx, y: cy };
}
}
}
return null;
}

function sgDrawNode(svg, node) {
const g = document.createElementNS(SG_NS, "g");
g.setAttribute("transform", "translate(" + node.x + "," + node.y + ")");
g.setAttribute("class", "sg-node");
const c = document.createElementNS(SG_NS, "circle");
c.setAttribute("r", node.r);
c.setAttribute("fill", node.fill);
c.setAttribute("stroke", node.stroke);
c.setAttribute("stroke-width", 1.6);
g.appendChild(c);
const t1 = document.createElementNS(SG_NS, "text");
t1.setAttribute("y", node.r + 13);
t1.setAttribute("text-anchor", "middle");
t1.setAttribute("font-size", "11.5");
t1.setAttribute("font-weight", "600");
t1.setAttribute("fill", "#0a0a0a");
t1.textContent = node.main;
g.appendChild(t1);
if (node.sub) {
const t2 = document.createElementNS(SG_NS, "text");
t2.setAttribute("y", node.r + 25);
t2.setAttribute("text-anchor", "middle");
t2.setAttribute("font-size", "9.5");
t2.setAttribute("fill", "#999");
t2.textContent = node.sub;
g.appendChild(t2);
}
svg.appendChild(g);
}

function sgDrawInlineLabel(svg, pos, text) {
if (!pos) return;
const t = document.createElementNS(SG_NS, "text");
t.setAttribute("x", pos.x);
t.setAttribute("y", pos.y);
t.setAttribute("text-anchor", "middle");
t.setAttribute("font-size", "9.5");
t.setAttribute("font-style", "italic");
t.setAttribute("font-weight", "500");
t.setAttribute("fill", "#a0a0a0");
t.textContent = text;
svg.appendChild(t);
try {
const bb = t.getBBox();
const bg = document.createElementNS(SG_NS, "rect");
bg.setAttribute("x", bb.x - 2);
bg.setAttribute("y", bb.y - 1);
bg.setAttribute("width", bb.width + 4);
bg.setAttribute("height", bb.height + 2);
bg.setAttribute("fill", "#ffffff");
bg.setAttribute("opacity", "0.92");
svg.insertBefore(bg, t);
} catch (e) {}
}

function sgDrawCallout(svg, anchorX, anchorY, labelPos, num, mech, vol) {
if (!labelPos) return;
const volColors = {
H: { bg: "#fee2e2", fg: "#991b1b" },
M: { bg: "#fef3c7", fg: "#92400e" },
L: { bg: "#f0f0ef", fg: "#525252" }
};
const boxW = 140, boxH = 28;
const bx = labelPos.x - boxW / 2;
const by = labelPos.y - boxH / 2;
const line = document.createElementNS(SG_NS, "line");
line.setAttribute("x1", anchorX);
line.setAttribute("y1", anchorY);
line.setAttribute("x2", labelPos.x);
line.setAttribute("y2", by + boxH / 2);
line.setAttribute("stroke", "#9a9a98");
line.setAttribute("stroke-width", 0.8);
line.setAttribute("stroke-dasharray", "3,3");
svg.appendChild(line);
const rect = document.createElementNS(SG_NS, "rect");
rect.setAttribute("x", bx);
rect.setAttribute("y", by);
rect.setAttribute("width", boxW);
rect.setAttribute("height", boxH);
rect.setAttribute("rx", 4);
rect.setAttribute("fill", "#ffffff");
rect.setAttribute("stroke", "#0a0a0a");
rect.setAttribute("stroke-width", 1.2);
svg.appendChild(rect);
const badge = document.createElementNS(SG_NS, "circle");
badge.setAttribute("cx", bx + 14);
badge.setAttribute("cy", by + boxH / 2);
badge.setAttribute("r", 8);
badge.setAttribute("fill", "#0a0a0a");
svg.appendChild(badge);
const bt = document.createElementNS(SG_NS, "text");
bt.setAttribute("x", bx + 14);
bt.setAttribute("y", by + boxH / 2 + 3);
bt.setAttribute("text-anchor", "middle");
bt.setAttribute("font-size", "9.5");
bt.setAttribute("font-weight", "700");
bt.setAttribute("fill", "#ffffff");
bt.textContent = num;
svg.appendChild(bt);
const lt = document.createElementNS(SG_NS, "text");
lt.setAttribute("x", bx + 28);
lt.setAttribute("y", by + boxH / 2 + 3);
lt.setAttribute("font-size", "10.5");
lt.setAttribute("font-weight", "600");
lt.setAttribute("fill", "#0a0a0a");
lt.textContent = mech;
svg.appendChild(lt);
if (vol && volColors[vol]) {
const vc = volColors[vol];
const pill = document.createElementNS(SG_NS, "rect");
pill.setAttribute("x", bx + boxW - 22);
pill.setAttribute("y", by + boxH / 2 - 6);
pill.setAttribute("width", 14);
pill.setAttribute("height", 12);
pill.setAttribute("rx", 6);
pill.setAttribute("fill", vc.bg);
svg.appendChild(pill);
const vt = document.createElementNS(SG_NS, "text");
vt.setAttribute("x", bx + boxW - 15);
vt.setAttribute("y", by + boxH / 2 + 3);
vt.setAttribute("text-anchor", "middle");
vt.setAttribute("font-size", "8.5");
vt.setAttribute("font-weight", "700");
vt.setAttribute("fill", vc.fg);
vt.textContent = vol;
svg.appendChild(vt);
}
}

// ============ EVIDENCE STRENGTH ============
function computeEvidenceStrength() {
const cs = getCurrentScenario();
if (!cs || !cs.relation_keys || cs.relation_keys.length === 0) return null;
const kg = (window.CHESS_DATA && window.CHESS_DATA.kg) || { relations: [] };
const relByKey = {};
kg.relations.forEach(function(r) { relByKey[r.from + "|" + r.to + "|" + r.type] = r; });
const confs = cs.relation_keys
.map(function(k) { return relByKey[k]; })
.filter(function(r) { return r && typeof r.confidence === "number"; })
.map(function(r) { return r.confidence; });
if (!confs.length) return null;
const mean = confs.reduce(function(a, b) { return a + b; }, 0) / confs.length;
return Math.round(mean * 100) / 100;
}

function evidenceStrengthLabel(value) {
if (value == null) return "-";
if (value < 0.55) return "weak";
if (value < 0.70) return "moderate";
if (value < 0.80) return "moderate-high";
return "high";
}

function evidenceStrengthCount() {
const cs = getCurrentScenario();
if (!cs || !cs.relation_keys) return 0;
const kg = (window.CHESS_DATA && window.CHESS_DATA.kg) || { relations: [] };
const relByKey = {};
kg.relations.forEach(function(r) { relByKey[r.from + "|" + r.to + "|" + r.type] = r; });
return cs.relation_keys.filter(function(k) {
const r = relByKey[k];
return r && typeof r.confidence === "number";
}).length;
}

function injectEvidenceStrength() {
const panel = document.querySelector(".scenario-report .scenario-headline");
if (!panel) return;
if (panel.querySelector(".headline-item.evidence-strength")) return;
const value = computeEvidenceStrength();
if (value == null) return;
const label = evidenceStrengthLabel(value);
const item = document.createElement("div");
item.className = "headline-item evidence-strength";
item.innerHTML =
‘<span class="headline-label">Evidence strength</span>’ +
‘<span class="headline-value">’ + value.toFixed(2) +
’ <span class="headline-range">’ + escapeHTML(label) + ‘</span>’ +
‘</span>’;
panel.appendChild(item);
}

function computeScenarioIntel() {
if (!getCurrentScenario()) {
return {
evidence: { value: null, label: "-", note: "Generate a scenario to see evidence strength." },
top_arcs: []
};
}
const kg = (window.CHESS_DATA && window.CHESS_DATA.kg) || { entities: [], relations: [] };
const relByKey = {};
kg.relations.forEach(function(r) { relByKey[r.from + "|" + r.to + "|" + r.type] = r; });
const picked = (getCurrentScenario().relation_keys || [])
.map(function(k) { return relByKey[k]; })
.filter(Boolean);
const value = computeEvidenceStrength();
const label = evidenceStrengthLabel(value);
const note = value != null
? label.charAt(0).toUpperCase() + label.slice(1) + " - mean confidence across " +
evidenceStrengthCount() + " arc" + (evidenceStrengthCount() === 1 ? "" : "s") + " in this scenario."
: "No arcs matched in the current scenario.";
const idLabel = {};
kg.entities.forEach(function(e) { idLabel[e.id] = e.label; });
const topArcs = picked
.slice()
.sort(function(a, b) { return (b.weight * (b.confidence || 0)) - (a.weight * (a.confidence || 0)); })
.slice(0, 5)
.map(function(r) {
return {
from: idLabel[r.from] || r.from,
to: idLabel[r.to] || r.to,
type: r.type,
weight: r.weight || 0,
polarity: (r.polarity && r.polarity.indexOf("pos") === 0) ? "pos" : "neg",
volatility: r.volatility || "-"
};
});
return {
evidence: { value: value, label: label, note: note },
top_arcs: topArcs
};
}

// ============ PDF EXPORT ============
async function exportScenarioPdf() {
const scenario = getCurrentScenario();
if (!scenario) { window.print(); return; }
if (typeof html2pdf !== "function" || typeof html2canvas !== "function") {
console.warn("html2pdf not loaded; falling back to print");
window.print();
return;
}
const reportEl = document.querySelector(".scenario-report") || document.querySelector(".report-scroll");
const graphEl = document.querySelector(".graph-panel");
if (!reportEl || !graphEl) { window.print(); return; }
let graphPng = null;
try {
graphPng = await snapshotGraphAsPng(graphEl);
} catch (err) {
console.warn("Graph snapshot failed:", err);
}
const reportBody = reportEl.outerHTML;
const snapshotBlock = graphPng
? ‘<div class="pdf-section">’ +
‘<h2 class="pdf-section-title">Subgraph</h2>’ +
‘<p class="pdf-section-sub">Entities and relations highlighted in this scenario.</p>’ +
‘<img src="' + graphPng + '" style="width:100%; height:auto;" />’ +
‘</div>’
: ‘’;
const wrapper = document.createElement("div");
wrapper.style.padding = "20px";
wrapper.style.fontFamily = "‘Fraunces’, Georgia, serif";
wrapper.innerHTML =
‘<div class="pdf-section">’ + reportBody + ‘</div>’ +
(snapshotBlock ? ‘<div class="pdf-page-break"></div>’ + snapshotBlock : ‘’);
const filename = "geointel-scenario-" + scenario.id + ".pdf";
html2pdf().from(wrapper).set({
margin: [10, 10, 10, 10],
filename: filename,
pagebreak: { mode: ["css", "legacy"] },
html2canvas: { scale: 2, backgroundColor: "#ffffff" },
jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
}).save();
}

async function snapshotGraphAsPng(graphEl) {
const canvas = await html2canvas(graphEl, {
backgroundColor: "#ffffff",
scale: 2,
logging: false
});
if (canvas && canvas.width > 0 && canvas.height > 0) {
try { return canvas.toDataURL("image/png"); } catch (e) {}
}
const svgEl = graphEl.querySelector("svg");
if (!svgEl) throw new Error("No svg inside graph panel");
const svgStr = new XMLSerializer().serializeToString(svgEl);
const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
const url = URL.createObjectURL(svgBlob);
try {
const img = new Image();
img.src = url;
await new Promise(function(resolve, reject) {
img.onload = resolve;
img.onerror = function() { reject(new Error("SVG image load failed")); };
});
const w = (svgEl.clientWidth || 720) * 2;
const h = (svgEl.clientHeight || 360) * 2;
const c = document.createElement("canvas");
c.width = w; c.height = h;
const ctx = c.getContext("2d");
ctx.fillStyle = "#ffffff";
ctx.fillRect(0, 0, w, h);
ctx.drawImage(img, 0, 0, w, h);
return c.toDataURL("image/png");
} finally {
URL.revokeObjectURL(url);
}
}

// ============ MESSAGE / INTEL ============
function renderMessage(m) {
if (m.role === "user") {
return ‘<div class="msg user"><div class="msg-bubble">’ + m.text + ‘</div><div class="msg-time">’ + m.time + ‘</div></div>’;
}
if (m.role === "scenario-card") {
const active = getCurrentScenario() && getCurrentScenario().id === m.scenario_id ? " active" : "";
return ‘<div class="scenario-card' + active + '" data-scenario-id="' + escapeHTML(m.scenario_id) + '" role="button" tabindex="0">’ +
‘<div class="scenario-card-label">Scenario generated</div>’ +
‘<div class="scenario-card-title">’ + escapeHTML(m.scenario_title || "Scenario") + ‘</div>’ +
‘<div class="scenario-card-hint">Tap to recall this scenario</div>’ +
‘</div>’;
}
const typeTag = m.type && m.type !== "welcome"
? ‘<div class="msg-type-tag">’ + m.type.replace(/_/g, " ") + ‘</div>’
: ‘’;
return ‘<div class="msg ai"><div class="msg-bubble">’ + m.text + ‘</div>’ + typeTag + ‘<div class="msg-time">’ + m.time + ‘</div></div>’;
}

function recallScenario(id) {
const idx = scenarioHistory.findIndex(function(s) { return s.id === id; });
if (idx < 0) return;
if (idx === currentScenarioIndex) return;
currentScenarioIndex = idx;
REPORT_LOADING = false;
render();
}

function renderIntel(intel) {
const E = intel.evidence;
const hasValue = typeof E.value === "number";
const circumference = 2 * Math.PI * 23;
const offset = hasValue ? circumference * (1 - E.value) : circumference;
const bigLabel = hasValue ? "Evidence strength" : "Evidence strength";
const smallLabel = hasValue
? E.label.charAt(0).toUpperCase() + E.label.slice(1)
: "";
const arcsHTML = intel.top_arcs.map(function(a) {
const polaritySign = a.polarity === "neg" ? "-" : "+";
const barStyle = a.polarity === "pos"
? "width:" + Math.round(a.weight * 100) + "%;background:linear-gradient(90deg,#15803d 0%,#0d7a6e 100%)"
: "width:" + Math.round(a.weight * 100) + "%";
return ‘<div class="arc-item">’ +
‘<div class="arc-flow"><span class="arc-node">’ + a.from + ‘</span><span class="arc-arrow">-></span><span class="arc-node">’ + a.to + ‘</span></div>’ +
‘<div class="arc-props"><span>’ + a.type + ’</span><span><span class="weight">w ’ + a.weight.toFixed(2) + ‘</span> · <span class="polarity ' + a.polarity + '">’ + polaritySign + ’</span> · vol ’ + a.volatility + ‘</span></div>’ +
‘<div class="arc-bar"><div class="arc-bar-fill" style="' + barStyle + '"></div></div>’ +
‘</div>’;
}).join("");
return ‘<div class="intel-section">’ +
‘<div class="intel-header"><span class="intel-sec-title">Evidence strength</span></div>’ +
‘<div class="confidence-block">’ +
‘<div class="gauge">’ +
‘<svg width="58" height="58" viewBox="0 0 58 58">’ +
‘<circle cx="29" cy="29" r="23" fill="none" stroke="#ebe8df" stroke-width="5"/>’ +
(hasValue
? ‘<circle cx="29" cy="29" r="23" fill="none" stroke="#15803d" stroke-width="5" stroke-linecap="round" stroke-dasharray="' + circumference.toFixed(1) + '" stroke-dashoffset="' + offset.toFixed(1) + '"/>’
: ‘’) +
‘</svg>’ +
‘<div class="gauge-text">’ + (hasValue ? E.value.toFixed(2) : "-") + ‘</div>’ +
‘</div>’ +
‘<div class="confidence-meta"><div class="big">’ + (hasValue ? smallLabel : bigLabel) + ‘</div><div class="small">’ + escapeHTML(E.note || "") + ‘</div></div>’ +
‘</div>’ +
‘</div>’ +
(arcsHTML
? ‘<div class="intel-section">’ +
‘<div class="intel-header"><span class="intel-sec-title">Top arcs</span><span class="panel-meta">’ + intel.top_arcs.length + ‘</span></div>’ +
‘<div class="arc-list">’ + arcsHTML + ‘</div>’ +
‘</div>’
: ‘’);
}