// GeoIntel Reader · app.js · v2.3.4

const APP_VERSION = "2.3.4";
console.log("GeoIntel Reader " + APP_VERSION);

// ============ ON-SCREEN DEBUG LOG ============
// Needed for diagnostics on iPad where Web Inspector is off. Every
// diagnostic call below mirrors to this ring buffer; the chat panel
// renders it inside a <details> that auto-opens when CHAT_ERROR fires.
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
// Supabase Edge Function: geointel-reader-chat (contract v2.2, typed responses
// with scenario.user_question and a pre-rendered question blockquote inside
// scenario.report_html; evidence_strength is computed client-side).
const GEOINTEL_CHAT_ENDPOINT = "https://chuvfdbpwiszjuoyhvlw.supabase.co/functions/v1/geointel-reader-chat";

// TODO(user): paste your Supabase anon key here before deploying.
// This is the public "anon" key from Supabase Project Settings -> API -> anon/public.
// It is safe to include in the frontend.
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNodXZmZGJwd2lzemp1b3lodmx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzOTU2NzcsImV4cCI6MjA4OTk3MTY3N30.7OAuk36xTNa6cFyF2cnpBRUtgeZpttAyi-ZA28_fhdU";

// Hardcoded welcome message (Section 2 alternative: saves one API call per session).
const WELCOME_MESSAGE = "Ciao. Questa è una demo di GeoIntel Reader. Posso costruire proiezioni di scenario su 6 aree: Russia-Ucraina, Iran (Hormuz e rivalità con USA), Taiwan, AI US-Cina, Mar Rosso-Houthi.\n\nFai una domanda di scenario. Se mancano elementi per rispondere bene, te li chiedo. Quando lo scenario è chiaro, genero report e sotto-grafo.";

// Ephemeral chat state for live backend.
let CHAT_IN_FLIGHT = false;
let CHAT_ERROR = null;
let REPORT_LOADING = false; // shows a loader inside the Report panel after a confirmation.
const CHAT_HISTORY_CAP = 20;

// Scenario state (spec v2.2 Section 2.1: multi-scenario history).
// Each item: { id, title, question, report_html, entity_ids, relation_keys, created_at }.
let scenarioHistory = [];
let currentScenarioIndex = -1;
let chatHistory = [];          // [{role:"user"|"assistant", content:string}]
let lastAssistantType = null;  // type from last assistant response

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

// ============ EQUAL EARTH PROJECTION ============
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
// v2.0: routes are driven by scenario state, not the URL. The hash only
// distinguishes the Atlas "home" (default) from the scenario-populated view.
// The populated view is shown whenever `getCurrentScenario()` is non-null OR
// when a scenario generation is in flight (REPORT_LOADING).
function getRoute() {
  if (getCurrentScenario() || REPORT_LOADING) return { view: "scenario" };
  return { view: "home" };
}

window.addEventListener("hashchange", function() {
  if (!getCurrentScenario() && !REPORT_LOADING) ATLAS_VIEW = { level: "world", clusterId: null };
  render();
});
window.addEventListener("DOMContentLoaded", render);

// Global Esc handler: close the top-most overlay/drawer.
window.addEventListener("keydown", function(e) {
  if (e.key !== "Escape") return;
  if (GRAPH_OVERLAY_OPEN) { GRAPH_OVERLAY_OPEN = false; render(); return; }
  if (ARCHIVE_OPEN) { ARCHIVE_OPEN = false; render(); return; }
  if (INFO_CARD.open) { INFO_CARD = { open: false, type: null, id: null }; render(); return; }
  if (GRAPH_HIGHLIGHT) { GRAPH_HIGHLIGHT = null; render(); return; }
});

// ============ ATLAS STATE (ephemeral) ============
let ATLAS_VIEW = { level: "world", clusterId: null };
let INFO_CARD = { open: false, type: null, id: null };

// ============ GLOBAL CHAT ============
// The chat UI is kept compatible with the v1 message format (role/time/text)
// but the API wire format lives in `chatHistory` ({role, content}).
function makeGreeting() {
  return { role: "ai", time: "Now", text: escapeHTMLForChat(WELCOME_MESSAGE) };
}
let GLOBAL_CHAT = [makeGreeting()];

// Ephemeral UI state for populated view (kept for graph fullscreen + chip click).
let GRAPH_HIGHLIGHT = null; // entity id (from chip click)

// Archive drawer UI state.
let ARCHIVE_OPEN = false;

// Graph fullscreen overlay state.
let GRAPH_OVERLAY_OPEN = false;

// Basemap loading flag (for empty-state placeholder).
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
  // After the graph SVG is in the DOM, apply the subgraph filter and inject
  // the client-computed Evidence strength into the Report headline.
  if (route.view === "scenario") {
    applyScenarioHighlight();
    injectEvidenceStrength();
  }
}

// ============ TOPBAR ============
function renderTopbar(route) {
  const leftEl = document.getElementById("topbar-left-extra");
  const centerEl = document.getElementById("topbar-center");
  if (!leftEl || !centerEl) return;

  if (route.view === "scenario") {
    leftEl.innerHTML = '<a class="back-to-atlas" href="#" id="back-to-atlas">← Atlas</a>';
    const title = getCurrentScenario() && getCurrentScenario().title
      ? getCurrentScenario().title
      : (REPORT_LOADING ? "Generating scenario…" : "Scenario");
    centerEl.innerHTML = '<span class="dossier-pill">SCENARIO · ' + escapeHTML(title.toUpperCase()) + '</span>';
  } else {
    leftEl.innerHTML = '';
    centerEl.innerHTML = '';
  }
}

// ============ WORKING SURFACE ============
function renderWorkingSurfaceHTML() {
  const route = getRoute();
  return '<div class="working-surface">' +
    (ARCHIVE_OPEN ? renderArchiveDrawer() : '') +
    renderChatPanel() +
    '<div class="right-area">' +
      (route.view === "scenario" ? renderPopulatedRight() : renderAmbientRight()) +
    '</div>' +
    (GRAPH_OVERLAY_OPEN && route.view === "scenario" ? renderGraphOverlay() : '') +
  '</div>';
}

function renderGraphOverlay() {
  const title = getCurrentScenario() && getCurrentScenario().title ? getCurrentScenario().title : "Subgraph";
  return '<div class="graph-overlay" role="dialog" aria-label="Graph fullscreen">' +
    '<div class="graph-overlay-bg" data-overlay-dismiss="1"></div>' +
    '<div class="graph-overlay-box">' +
      '<div class="graph-overlay-header">' +
        '<div class="graph-overlay-title">Subgraph · ' + escapeHTML(title) + '</div>' +
        '<button class="graph-overlay-close" id="graph-overlay-close" type="button" aria-label="Close">×</button>' +
      '</div>' +
      '<div class="graph-overlay-canvas">' +
        renderKgGraphSVG(true) +
      '</div>' +
      '<div class="graph-overlay-hint">Esc to close</div>' +
    '</div>' +
  '</div>';
}

function renderChatPanel() {
  const count = GLOBAL_CHAT.length;
  const metaLabel = count <= 1 ? "Ready" : count + " msg · Session";
  const isEmpty = count <= 1;
  const messagesHTML = '<div class="day-sep">Today · ' + formatToday() + '</div>' +
    GLOBAL_CHAT.map(renderMessage).join("");

  return '<aside class="chat-panel">' +
    '<div class="panel-header">' +
      '<span class="panel-title">Chat</span>' +
      '<div class="chat-header-right">' +
        '<button class="new-chat-btn" id="archive-btn" title="Open archive">' +
          '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"/></svg>' +
        '</button>' +
        '<button class="new-chat-btn" id="new-chat-btn" title="New chat">' +
          '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>' +
          '<span>New</span>' +
        '</button>' +
        '<span class="panel-meta">' + metaLabel + '</span>' +
      '</div>' +
    '</div>' +
    '<div class="chat-messages' + (isEmpty ? ' empty' : '') + '" id="chat-messages">' +
      messagesHTML +
    '</div>' +
    '<form class="chat-input-wrap" id="chat-form">' +
      (CHAT_ERROR
        ? '<div class="chat-error" id="chat-error" role="alert">' +
            '<span class="chat-error-text">' + escapeHTML(CHAT_ERROR) + '</span>' +
            '<button type="button" class="chat-error-dismiss" id="chat-error-dismiss" aria-label="Dismiss">×</button>' +
          '</div>'
        : '') +
      renderDebugPanel() +
      (CHAT_IN_FLIGHT
        ? '<div class="chat-loading" id="chat-loading" aria-live="polite">Analysing<span class="dots"></span></div>'
        : '') +
      '<div class="chat-input-box">' +
        '<textarea id="chat-textarea" placeholder="Chiedi uno scenario (es. finestra migliore per un\'azione cinese su Taiwan)…" rows="1"' + (CHAT_IN_FLIGHT ? ' disabled' : '') + '></textarea>' +
        '<div class="chat-input-actions">' +
          '<button type="submit" class="send-btn" id="chat-send"' + (CHAT_IN_FLIGHT ? ' disabled' : '') + '>Run <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg></button>' +
        '</div>' +
      '</div>' +
    '</form>' +
  '</aside>';
}

function renderDebugPanel() {
  if (!DEBUG_LOG.length) return '';
  // Auto-open when an error is visible; user can close/reopen with the caret.
  const openAttr = CHAT_ERROR ? ' open' : '';
  const rows = DEBUG_LOG.map(function(e) {
    return '<div class="debug-row">' +
      '<span class="debug-ts">' + escapeHTML(e.ts) + '</span>' +
      '<span class="debug-label">' + escapeHTML(e.label) + '</span>' +
      '<span class="debug-text">' + escapeHTML(e.text) + '</span>' +
    '</div>';
  }).join("");
  return '<details class="debug-panel"' + openAttr + '>' +
    '<summary>Debug log · ' + DEBUG_LOG.length + ' entries ' +
      '<span class="debug-actions">' +
        '<button type="button" class="debug-clear" id="debug-copy">copy</button>' +
        '<button type="button" class="debug-clear" id="debug-clear">clear</button>' +
      '</span>' +
    '</summary>' +
    '<div class="debug-body">' + rows + '</div>' +
  '</details>';
}

function formatToday() {
  const d = new Date();
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return months[d.getMonth()] + " " + d.getDate();
}

// ============ AMBIENT RIGHT (clickable Atlas) ============
function renderAmbientRight() {
  const regionLabel = ATLAS_VIEW.level === "region" && ATLAS_VIEW.clusterId
    ? (CHESS_DATA.clusters.find(function(x){return x.id === ATLAS_VIEW.clusterId;}) || {}).label || ""
    : "";

  const headerRight = ATLAS_VIEW.level === "region"
    ? '<button class="ambient-back" id="ambient-back">← World</button>'
    : '';

  return '<div class="atlas-ambient">' +
    '<div class="ambient-header">' +
      '<div class="ambient-head-text">' +
        '<div class="ambient-title">Atlas' + (regionLabel ? ' <span class="ambient-sub">· ' + regionLabel + '</span>' : '') + '</div>' +
        '<div class="ambient-subtitle">' +
          (!BASEMAP_LOADED
            ? 'Loading basemap…'
            : ATLAS_VIEW.level === "region"
              ? 'Tap a dossier to open, or ask directly in chat.'
              : 'Ask in chat, or tap a region to drill in.') +
        '</div>' +
      '</div>' +
      headerRight +
    '</div>' +
    '<div class="atlas-ambient-map" id="atlas-ambient-map">' +
      renderAtlasSVG() +
      (INFO_CARD.open ? renderInfoCard() : '') +
    '</div>' +
    '<div class="ambient-legend">' +
      '<div class="legend-group"><span class="legend-dot" style="background:#0d7a6e"></span><span>Active dossier</span></div>' +
      '<div class="legend-group"><span class="legend-dot" style="background:#c4bfb1"></span><span>Region in osservazione</span></div>' +
      '<div class="legend-group"><span class="legend-dot" style="background:#5b21b6"></span><span>Trans-geografico (orbital)</span></div>' +
    '</div>' +
  '</div>';
}

function renderAtlasSVG() {
  const vb = computeAmbientViewBox();
  const labelScale = ATLAS_VIEW.level === "region" ? 0.5 : 1;
  const showOrbital = ATLAS_VIEW.level === "world";
  const regionDossiers = (ATLAS_VIEW.level === "region" && ATLAS_VIEW.clusterId)
    ? renderRegionDossierMarkers(ATLAS_VIEW.clusterId, labelScale)
    : '';

  return '<svg class="atlas-svg interactive" viewBox="' + vb + '" preserveAspectRatio="xMidYMid meet">' +
    '<rect class="atlas-bg" x="0" y="0" width="' + MAP_W + '" height="' + MAP_H + '"/>' +
    '<ellipse class="atlas-graticule" cx="' + (MAP_W/2) + '" cy="' + (MAP_H/2) + '" rx="' + (MAP_W * 0.46) + '" ry="' + (MAP_H * 0.58) + '"/>' +
    '<g class="land">' + renderLand() + '</g>' +
    '<g class="clusters">' + renderClusterMarkers(labelScale) + '</g>' +
    '<g class="region-dossiers">' + regionDossiers + '</g>' +
    '<g class="orbital-ring">' + (showOrbital ? renderOrbitalMarkers(labelScale) : '') + '</g>' +
  '</svg>';
}

function renderInfoCard() {
  if (INFO_CARD.type !== "dossier") return '';
  const d = CHESS_DATA.dossiers[INFO_CARD.id];
  if (!d) return '';
  const actors = (d.actors || []).map(function(a) {
    return '<span class="actor-chip">' + a + '</span>';
  }).join("");
  const cluster = d.cluster_id ? CHESS_DATA.clusters.find(function(x){return x.id === d.cluster_id;}) : null;
  const eyebrow = d.trans_geographic ? "Trans-geographic" : (cluster ? cluster.label : "Dossier");
  return '<aside class="info-card" role="dialog" aria-label="Dossier information">' +
    '<button class="info-card-close" title="Close">×</button>' +
    '<div class="info-card-eyebrow">' + eyebrow + '</div>' +
    '<h2 class="info-card-title">' + d.title + '</h2>' +
    '<p class="info-card-desc">' + d.description + '</p>' +
    '<div class="info-card-section-label">Actors</div>' +
    '<div class="actor-list">' + actors + '</div>' +
    '<div class="info-card-foot">' +
      '<span>' + d.stats.entities + ' entities · ' + d.stats.relations + ' arcs · ' + d.stats.corpus + ' articles</span>' +
    '</div>' +
  '</aside>';
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

// ============ POPULATED RIGHT (scenario-driven, v2.0) ============
function renderPopulatedRight() {
  const subAttr = getCurrentScenario() ? ' data-active-subgraph="1"' : '';
  const reportBody = REPORT_LOADING
    ? renderReportLoader()
    : (getCurrentScenario()
        ? renderScenarioReport(getCurrentScenario())
        : renderReportEmpty());
  const reportTitle = getCurrentScenario() && getCurrentScenario().title
    ? '<span class="panel-title">Report · <span class="scenario-title-inline">' + escapeHTML(getCurrentScenario().title) + '</span></span>'
    : '<span class="panel-title">Report</span>';
  return '<div class="upper-strip">' +
    '<section class="graph-panel' + (getCurrentScenario() ? ' active-subgraph' : '') + '"' + subAttr + '>' +
      '<div class="panel-header">' +
        '<span class="panel-title">Subgraph</span>' +
        '<button class="panel-action panel-action-btn" id="graph-expand-btn" type="button" aria-label="Open graph fullscreen">Expand</button>' +
      '</div>' +
      '<div class="graph-svg-wrap">' +
        renderKgGraphSVG(false) +
      '</div>' +
      '<div class="legend">' +
        '<div class="legend-item"><span class="legend-dot" style="background:#0d7a6e"></span>Actor</div>' +
        '<div class="legend-item"><span class="legend-dot" style="background:#a8570f"></span>Asset</div>' +
        '<div class="legend-item"><span class="legend-dot" style="background:#b8203a"></span>Negative arc</div>' +
        '<div class="legend-item"><span class="legend-dot" style="background:#15803d"></span>Positive arc</div>' +
      '</div>' +
    '</section>' +
    '<aside class="intel-panel">' +
      '<div class="panel-header"><span class="panel-title">Intel</span></div>' +
      '<div class="intel-body">' + renderIntel(computeScenarioIntel()) + '</div>' +
    '</aside>' +
  '</div>' +
  '<section class="report-panel">' +
    '<div class="panel-header">' +
      reportTitle +
      '<div class="report-header-right">' +
        '<button class="download-btn" title="Download report"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg><span>PDF</span></button>' +
      '</div>' +
    '</div>' +
    '<div class="report-scroll">' + reportBody + '</div>' +
  '</section>';
}

function renderReportEmpty() {
  return '<div class="report-empty">' +
    '<div class="report-empty-inner">' +
      '<div class="report-empty-title">Nessuno scenario generato</div>' +
      '<div class="report-empty-body">Chiedi qualcosa nella chat a sinistra per generare uno scenario.</div>' +
    '</div>' +
  '</div>';
}

function renderReportLoader() {
  return '<div class="report-empty">' +
    '<div class="report-empty-inner">' +
      '<div class="report-empty-title">Generazione in corso<span class="dots"></span></div>' +
      '<div class="report-empty-body">Sto componendo il report e isolando il sotto-grafo rilevante.</div>' +
    '</div>' +
  '</div>';
}

function renderScenarioReport(scenario) {
  // The backend returns report_html pre-structured with .scenario-report etc.
  // We trust it as server-generated HTML. Wrap in the existing .report-scroll.
  return scenario.report_html || renderReportEmpty();
}

// ============ MAP RENDERING ============
function renderLand() {
  if (!WORLD_LAND) return '';
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
    parts.push('<polygon points="' + pts.join(" ") + '"/>');
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
      ? '<text class="cluster-count" y="5" text-anchor="middle">' + count + '</text>'
      : '';
    const labelSize = (14 * labelScale).toFixed(1);
    const ringR = hasData ? 36 : 26;
    const dotR = hasData ? 14 : 9;
    const isHidden = ATLAS_VIEW.level === "region" && ATLAS_VIEW.clusterId !== c.id;
    return '<g class="cluster-marker ' + (hasData ? "has-data" : "empty") + ' interactive' + (isHidden ? ' hidden' : '') + '"' +
      ' data-cluster-id="' + c.id + '"' +
      ' transform="translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ')">' +
      '<circle class="cluster-ring" r="' + ringR + '" fill="none" stroke="currentColor" stroke-width="1" opacity="0.25"/>' +
      '<circle class="cluster-dot" r="' + dotR + '"/>' +
      countLabel +
      '<text class="cluster-label" y="' + (dotR + 18).toFixed(0) + '" text-anchor="middle" style="font-size:' + labelSize + 'px">' + c.label + '</text>' +
    '</g>';
  }).join("");
}

function renderRegionDossierMarkers(clusterId, labelScale) {
  const c = CHESS_DATA.clusters.find(function(x) { return x.id === clusterId; });
  if (!c) return '';
  return c.dossier_ids.map(function(id) {
    const d = CHESS_DATA.dossiers[id];
    if (!d || d.lon == null || d.lat == null) return '';
    const p = projectToSVG(d.lon, d.lat, MAP_W, MAP_H);
    const labelSize = (12 * labelScale).toFixed(1);
    return '<g class="dossier-marker" data-dossier-id="' + d.id + '"' +
      ' transform="translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ')">' +
      '<circle class="dossier-halo" r="14" opacity="0.3"/>' +
      '<circle class="dossier-dot" r="6"/>' +
      '<text class="dossier-label" y="-14" text-anchor="middle" style="font-size:' + labelSize + 'px">' + d.title + '</text>' +
    '</g>';
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
    return '<g class="orbital-item interactive" data-dossier-id="' + d.id + '"' +
      ' transform="translate(' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ')">' +
      '<circle r="22" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3" stroke-dasharray="2,3"/>' +
      '<circle class="orbital-dot" r="10"/>' +
      '<text class="orbital-label" y="-32" text-anchor="middle" style="font-size:' + labelSize + 'px">' + d.title + '</text>' +
    '</g>';
  }).join("");
}

// ============ WIRE WORKING SURFACE ============
function wireWorkingSurface(isScenarioView) {
  wireChatForm(isScenarioView);
  wireCommonChrome();
  if (!isScenarioView) {
    wireAmbientInteractions();
  }
}

function wireCommonChrome() {
  // New chat button lives in the chat panel, present on both routes.
  const newBtn = document.getElementById("new-chat-btn");
  if (newBtn) newBtn.addEventListener("click", newChat);
  // Archive drawer toggle.
  const archBtn = document.getElementById("archive-btn");
  if (archBtn) archBtn.addEventListener("click", function() { ARCHIVE_OPEN = !ARCHIVE_OPEN; render(); });
  // Back-to-Atlas from the topbar: clear scenario state.
  const backBtn = document.getElementById("back-to-atlas");
  if (backBtn) backBtn.addEventListener("click", function(e) {
    e.preventDefault();
    // Keep scenarios in history; just detach from the current view.
    currentScenarioIndex = -1;
    REPORT_LOADING = false;
    render();
  });
  // Debug-log clear button inside the chat panel.
  const dbgClear = document.getElementById("debug-clear");
  if (dbgClear) dbgClear.addEventListener("click", function(e) {
    e.preventDefault();
    e.stopPropagation();
    DEBUG_LOG = [];
    render();
  });
  // Debug-log copy button. Flattens the ring buffer to TSV so it pastes
  // cleanly into chat / issue trackers. iOS Safari needs this because
  // text selection inside <details> is awkward on touch.
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
      // Fallback for non-HTTPS or older WebKit contexts.
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
  // Graph fullscreen expand + close + overlay dismiss.
  const expandBtn = document.getElementById("graph-expand-btn");
  if (expandBtn) expandBtn.addEventListener("click", function() { GRAPH_OVERLAY_OPEN = true; render(); });
  const overlayClose = document.getElementById("graph-overlay-close");
  if (overlayClose) overlayClose.addEventListener("click", function() { GRAPH_OVERLAY_OPEN = false; render(); });
  document.querySelectorAll("[data-overlay-dismiss]").forEach(function(el) {
    el.addEventListener("click", function() { GRAPH_OVERLAY_OPEN = false; render(); });
  });
  // Scenario-card click: recall that scenario (v2.2 Section 2.3).
  document.querySelectorAll(".scenario-card").forEach(function(card) {
    const id = card.getAttribute("data-scenario-id");
    if (!id) return;
    card.addEventListener("click", function() { recallScenario(id); });
    card.addEventListener("keydown", function(e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); recallScenario(id); }
    });
  });
  // PDF export with graph snapshot (v2.2 Section 4).
  document.querySelectorAll(".download-btn").forEach(function(btn) {
    btn.addEventListener("click", function() { exportScenarioPdf(); });
  });
  // Archive drawer entry wiring.
  wireArchiveDrawer();
}

function wireAmbientInteractions() {
  // Cluster: N=0 pulse; N=1 info card for that dossier; N>=2 zoom-and-reveal.
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
  // Dossier markers in region view → info card for that dossier
  document.querySelectorAll(".dossier-marker").forEach(function(el) {
    el.addEventListener("click", function(e) {
      e.stopPropagation();
      const id = el.getAttribute("data-dossier-id");
      INFO_CARD = { open: true, type: "dossier", id: id };
      render();
    });
  });
  // Orbital dossier → info card
  document.querySelectorAll(".orbital-item").forEach(function(el) {
    el.addEventListener("click", function(e) {
      e.stopPropagation();
      const id = el.getAttribute("data-dossier-id");
      INFO_CARD = { open: true, type: "dossier", id: id };
      render();
    });
  });
  // Back to world zoom
  const backBtn = document.getElementById("ambient-back");
  if (backBtn) {
    backBtn.addEventListener("click", function() {
      ATLAS_VIEW = { level: "world", clusterId: null };
      INFO_CARD = { open: false, type: null, id: null };
      render();
    });
  }
  // Info card close
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
    ? '<div class="archive-empty">No archived conversations yet.</div>'
    : archive.map(function(entry, idx) {
        const firstUser = (entry.messages || []).find(function(m) { return m.role === "user"; });
        const title = firstUser ? stripHTML(firstUser.text) : "(empty conversation)";
        const started = new Date(entry.startedAt);
        const dateLabel = started.toLocaleDateString() + " · " + String(started.getHours()).padStart(2,"0") + ":" + String(started.getMinutes()).padStart(2,"0");
        const count = (entry.messages || []).length;
        return '<div class="archive-item" data-archive-idx="' + idx + '">' +
          '<div class="archive-item-main">' +
            '<div class="archive-item-title">' + escapeHTML(title) + '</div>' +
            '<div class="archive-item-meta">' + dateLabel + ' · ' + count + ' msg</div>' +
          '</div>' +
          '<button class="archive-delete" data-archive-idx="' + idx + '" title="Delete">×</button>' +
        '</div>';
      }).join("");
  const clearAllBtn = archive.length > 0
    ? '<button class="archive-clear-all" id="archive-clear-all">Clear all</button>'
    : '';
  return '<aside class="archive-drawer" role="dialog" aria-label="Archived chats">' +
    '<div class="archive-header">' +
      '<span class="archive-title">Archive</span>' +
      '<button class="archive-close" id="archive-close" title="Close">×</button>' +
    '</div>' +
    '<div class="archive-body">' + items + '</div>' +
    (clearAllBtn ? '<div class="archive-footer">' + clearAllBtn + '</div>' : '') +
  '</aside>';
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
      // Save current before switching, unless the current is just the greeting.
      saveChatToArchive();
      GLOBAL_CHAT = (entry.messages || []).slice();
      // Re-seed GENERATED_REPORTS from messages so chips still resolve.
      let maxNum = 0;
      for (let i = 0; i < GLOBAL_CHAT.length; i++) {
        const m = GLOBAL_CHAT[i];
        if (m && m.report_num && m.report_dossier && !GENERATED_REPORTS[m.report_num]) {
          GENERATED_REPORTS[m.report_num] = {
            dossierId: m.report_dossier,
            query: "",
            timestamp: new Date().toISOString(),
            reportNum: m.report_num
          };
        }
        if (m && m.report_num && m.report_num > maxNum) maxNum = m.report_num;
      }
      REPORT_COUNTER = maxNum;
      ARCHIVE_OPEN = false;
      // Remove the restored entry from the archive to avoid duplicates.
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

// ============ CHAT (live, v2.0 typed responses) ============
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
  // Scroll to bottom of chat messages.
  const msgs = document.getElementById("chat-messages");
  if (msgs) msgs.scrollTop = msgs.scrollHeight;
}

function buildDossierIndex() {
  const D = (window.CHESS_DATA && window.CHESS_DATA.dossiers) || {};
  return Object.keys(D).map(function(id) {
    return { id: id, title: D[id].title, description: D[id].description || "" };
  });
}

function handleChatSubmit(text) {
  const now = formatNow();

  // Append user message to UI chat + API history.
  GLOBAL_CHAT.push({ role: "user", time: now, text: escapeHTMLForChat(text) });
  chatHistory.push({ role: "user", content: text });

  // If the last assistant turn was awaiting confirmation, this message likely
  // confirms or refines. Show a loader in the Report panel (Section 5.3).
  const expectingGeneration = (lastAssistantType === "ready_to_generate" ||
                               lastAssistantType === "scenario_followup");
  if (expectingGeneration) {
    REPORT_LOADING = true;
  }

  CHAT_IN_FLIGHT = true;
  CHAT_ERROR = null;

  // v2.2 Section 2.4: `current_scenario` is the REDUCED form of the currently
  // rendered scenario, or null. The LLM uses it for follow-up continuity.
  const _csFull = getCurrentScenario();
  const _csReduced = _csFull
    ? { question: _csFull.question, entity_ids: _csFull.entity_ids, relation_keys: _csFull.relation_keys }
    : null;
  const payload = {
    question: text,
    history: chatHistory.slice(-CHAT_HISTORY_CAP - 1, -1), // everything before the just-pushed user msg, capped
    kg: (window.CHESS_DATA && window.CHESS_DATA.kg) || { entities: [], relations: [] },
    dossier_index: buildDossierIndex(),
    current_scenario: _csReduced
  };

  // v2.3.1: payload diagnostics (also mirrored to the on-screen debug log).
  // These must run BEFORE render() so the on-screen panel shows the entries
  // for the in-flight request; otherwise a hanging fetch leaves the panel
  // stale at the previous turn's count.
  debugLog("PAYLOAD SIZE BYTES:", new Blob([JSON.stringify(payload)]).size);
  debugLog("PAYLOAD KEYS:", Object.keys(payload));
  debugLog("KG ENTITIES COUNT:", payload.kg && payload.kg.entities && payload.kg.entities.length);
  debugLog("KG RELATIONS COUNT:", payload.kg && payload.kg.relations && payload.kg.relations.length);
  debugLog("HISTORY LENGTH:", payload.history && payload.history.length);
  debugLog("CURRENT_SCENARIO PRESENT:", !!payload.current_scenario);

  // Render AFTER debugLog so the user sees the pre-fetch diagnostics even
  // if the server never responds.
  render();

  // Client-side timeout. If the Edge Function hangs (e.g. a slow LLM call
  // that the runtime then EarlyDrops), we want a clear error instead of
  // an infinite loader. Matches the max wall-clock budget we assume on
  // the function side; bump together if the backend limit is raised.
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
    // v2.3.1: response diagnostics (also mirrored on-screen).
    debugLog("RESPONSE STATUS:", resp.status);
    debugLog("RESPONSE OK:", resp.ok);
    debugLog("RESPONSE HEADERS:", [...resp.headers.entries()]);
    if (!resp.ok) {
      return resp.text().then(function(errText) {
        throw new Error("HTTP " + resp.status + ": " + (errText ? errText.slice(0, 300) : resp.statusText || "no body"));
      });
    }
    // Read as text first so we can surface non-JSON bodies (EarlyDrop can
    // truncate the response mid-stream).
    return resp.text().then(function(txt) {
      try { return JSON.parse(txt); }
      catch (e) {
        throw new Error("Malformed JSON from engine (likely EarlyDrop). First 200 chars: " + (txt || "").slice(0, 200));
      }
    });
  }).then(function(data) {
    clearTimeout(timeoutId);
    // Defensive logging so an unexpected type is visible in DevTools
    // instead of silently leaving the UI stuck.
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
    // v2.3.1: verbose failure diagnostics (also mirrored on-screen).
    debugLog("FETCH FAILED name:", err && err.name);
    debugLog("FETCH FAILED message:", err && err.message);
    debugLog("FETCH FAILED stack:", err && err.stack);
    console.error("Chat error:", err);
    CHAT_IN_FLIGHT = false;
    REPORT_LOADING = false;
    // Make the cause visible in the UI, not only in DevTools. Timeout and
    // EarlyDrop look different, so the user / operator can triage.
    const isAbort = err && (err.name === "AbortError" || /abort/i.test(String(err.message || "")));
    if (isAbort) {
      CHAT_ERROR = "Request timed out after " + Math.round(CHAT_TIMEOUT_MS / 1000) +
        "s. The Edge Function likely hit its wall-clock limit (EarlyDrop). " +
        "Raise `wallClockLimitMs` on the function and retry.";
    } else {
      const detail = (err && err.message) ? String(err.message).slice(0, 260) : "unknown error";
      CHAT_ERROR = "Analysis engine error: " + detail;
    }
    // Roll back the API history since the turn did not land.
    if (chatHistory.length && chatHistory[chatHistory.length - 1].role === "user") {
      chatHistory.pop();
    }
    render();
  });
}

// Dispatch response by `type` (spec Section 1.3).
function handleResponse(data) {
  const type = data.type || "clarification";
  const message = typeof data.message === "string" ? data.message : "";
  const now = formatNow();

  CHAT_IN_FLIGHT = false;
  lastAssistantType = type;

  // Chat bubble text. For scenario, the assistant bubble stays short —
  // the actual analysis lives in the Report panel (Section 5.3).
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
  // Mirror into API-level history.
  chatHistory.push({ role: "assistant", content: bubbleText || "" });

  if (type === "scenario" && data.scenario && typeof data.scenario === "object") {
    // v2.2 Section 2.1: push into scenarioHistory with a unique id and
    // set currentScenarioIndex. A scenario card (Section 2.2) will also
    // appear in the chat flow, appended to GLOBAL_CHAT below.
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
      created_at: new Date().toISOString()
    };
    scenarioHistory.push(scenarioObj);
    currentScenarioIndex = scenarioHistory.length - 1;
    // Append a clickable recall card to the chat flow (v2.2 Section 2.2).
    GLOBAL_CHAT.push({
      role: "scenario-card",
      time: now,
      scenario_id: scenarioId,
      scenario_title: scenarioObj.title
    });
    REPORT_LOADING = false;
  } else {
    // Any non-scenario type: leave getCurrentScenario() alone (follow-ups may still
    // reference it) but clear the loader.
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
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Escape HTML but preserve paragraph breaks for chat bubbles.
function escapeHTMLForChat(s) {
  return escapeHTML(s).replace(/\n/g, "<br>");
}

// ============ KG GRAPH (dynamic SVG from window.CHESS_DATA.kg) ============
// The subgraph is laid out once by cluster affinity; positions are stable
// across renders so that highlighting only flips opacity, not layout.
const KG_VIEWBOX_W = 720;
const KG_VIEWBOX_H = 360;
const KG_CLUSTER_CENTERS = {
  "eastern-europe": { cx: 200, cy: 90 },
  "middle-east":    { cx: 360, cy: 260 },
  "east-asia":      { cx: 600, cy: 130 },
  "_unassigned":    { cx: 500, cy: 40 }   // null / trans-geographic / unmapped
};
let KG_LAYOUT_CACHE = null;

function computeKgLayout() {
  if (KG_LAYOUT_CACHE) return KG_LAYOUT_CACHE;
  const kg = (window.CHESS_DATA && window.CHESS_DATA.kg) || { entities: [], relations: [] };
  const groups = {};
  kg.entities.forEach(function(e) {
    const key = e.cluster && KG_CLUSTER_CENTERS[e.cluster] ? e.cluster : "_unassigned";
    (groups[key] = groups[key] || []).push(e);
  });
  const positions = {};
  Object.keys(groups).forEach(function(key) {
    const center = KG_CLUSTER_CENTERS[key] || KG_CLUSTER_CENTERS._unassigned;
    const arr = groups[key];
    // Sort actors before assets so that highlighted colours stack predictably.
    arr.sort(function(a, b) {
      if (a.type === b.type) return a.id.localeCompare(b.id);
      return a.type === "actor" ? -1 : 1;
    });
    const n = arr.length;
    const radius = 46 + Math.min(28, n * 1.6);
    for (let i = 0; i < n; i++) {
      const theta = (i / n) * Math.PI * 2 - Math.PI / 2;
      positions[arr[i].id] = {
        cx: +(center.cx + Math.cos(theta) * radius).toFixed(1),
        cy: +(center.cy + Math.sin(theta) * radius * 0.68).toFixed(1),
        entity: arr[i]
      };
    }
  });
  KG_LAYOUT_CACHE = positions;
  return positions;
}

// v2.3 Section 5: force-directed layout for the active subgraph. Falls back
// to cluster layout if d3-force is not available (e.g. CDN blocked).
function computeForceLayout(entities, relations, width, height) {
  if (typeof d3 === "undefined" || typeof d3.forceSimulation !== "function") return null;
  // d3-force mutates node/link objects in place.
  const nodes = entities.map(function(e) { return { id: e.id, entity: e }; });
  const nodeById = {};
  nodes.forEach(function(n) { nodeById[n.id] = n; });
  const links = relations
    .filter(function(r) { return nodeById[r.from] && nodeById[r.to]; })
    .map(function(r) { return { source: r.from, target: r.to, rel: r }; });
  const sim = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(function(d) { return d.id; }).distance(110).strength(0.6))
    .force("charge", d3.forceManyBody().strength(-380))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius(34))
    .stop();
  for (let i = 0; i < 300; i++) sim.tick();
  // Clamp to viewport with a margin so labels don't clip.
  const margin = 32;
  const positions = {};
  nodes.forEach(function(n) {
    positions[n.id] = {
      cx: +Math.max(margin, Math.min(width - margin, n.x)).toFixed(1),
      cy: +Math.max(margin, Math.min(height - margin, n.y)).toFixed(1),
      entity: n.entity
    };
  });
  return positions;
}

function renderKgGraphSVG(fullscreen) {
  const kg = (window.CHESS_DATA && window.CHESS_DATA.kg) || { entities: [], relations: [] };
  const vbW = fullscreen ? 960 : KG_VIEWBOX_W;
  const vbH = fullscreen ? 540 : KG_VIEWBOX_H;
  const clusterPos = computeKgLayout();
  // When a scenario is active, compute a fresh force-directed layout over
  // just the highlighted subset; non-highlighted nodes stay at their cluster
  // coords but are hidden via CSS (display:none).
  const cs = getCurrentScenario();
  let subgraphPos = null;
  if (cs && cs.entity_ids && cs.entity_ids.length) {
    const idSet = new Set(cs.entity_ids);
    const keySet = new Set(cs.relation_keys || []);
    const subEntities = kg.entities.filter(function(e) { return idSet.has(e.id); });
    const subRelations = kg.relations.filter(function(r) { return keySet.has(r.from + "|" + r.to + "|" + r.type); });
    subgraphPos = computeForceLayout(subEntities, subRelations, vbW, vbH);
  }
  function posFor(id) {
    if (subgraphPos && subgraphPos[id]) return subgraphPos[id];
    return clusterPos[id];
  }
  const arcs = kg.relations.map(function(r) {
    const a = posFor(r.from), b = posFor(r.to);
    if (!a || !b) return "";
    const key = r.from + "|" + r.to + "|" + r.type;
    const stroke = arcStroke(r.polarity);
    const mx = (a.cx + b.cx) / 2, my = (a.cy + b.cy) / 2;
    const dx = b.cx - a.cx, dy = b.cy - a.cy;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const off = Math.min(28, len * 0.12);
    const cpx = mx + (-dy / len) * off;
    const cpy = my + (dx / len) * off;
    const d = "M " + a.cx.toFixed(1) + " " + a.cy.toFixed(1) +
              " Q " + cpx.toFixed(1) + " " + cpy.toFixed(1) +
              " " + b.cx.toFixed(1) + " " + b.cy.toFixed(1);
    const sw = (1 + Math.max(0, Math.min(3, (r.weight || 0) * 3))).toFixed(1);
    return '<path class="kg-arc" data-relation-key="' + escapeHTML(key) + '"' +
      ' d="' + d + '" fill="none" stroke="' + stroke + '" stroke-width="' + sw + '"' +
      ' stroke-opacity="0.85" stroke-linecap="round"/>';
  }).join("");
  // v2.3 Section 3: EVERY node gets a label. Labels are children of the <g>
  // so display:none on the group hides them too (no orphan labels).
  const nodes = Object.keys(clusterPos).map(function(id) {
    const p = posFor(id);
    if (!p) return "";
    const e = p.entity;
    const fill = e.type === "asset" ? "#a8570f" : "#0d7a6e";
    const r = e.type === "asset" ? 7 : 8;
    const labelText = e.short_name || e.label || e.id;
    const labelY = (p.cy + r + 10).toFixed(1);
    return '<g class="kg-node" data-node-id="' + escapeHTML(id) + '" data-type="' + e.type + '">' +
      '<circle cx="' + p.cx.toFixed(1) + '" cy="' + p.cy.toFixed(1) + '" r="' + r + '" fill="' + fill + '" stroke="#ffffff" stroke-width="1.5"/>' +
      '<text class="kg-label" x="' + p.cx.toFixed(1) + '" y="' + labelY + '" text-anchor="middle">' + escapeHTML(labelText) + '</text>' +
    '</g>';
  }).join("");
  return '<svg class="graph-svg kg-graph" viewBox="0 0 ' + vbW + ' ' + vbH + '" preserveAspectRatio="xMidYMid meet">' +
    '<g class="kg-arcs">' + arcs + '</g>' +
    '<g class="kg-nodes">' + nodes + '</g>' +
  '</svg>';
}

function arcStroke(polarity) {
  if (!polarity) return "#9e9b94";
  if (polarity === "pos") return "#15803d";
  if (polarity === "neg") return "#b8203a";
  if (polarity.indexOf("neg") === 0) return "#c4602a";   // neg-West, neg-China, neg-cost, neg-indirect…
  if (polarity === "systemic") return "#5b21b6";
  return "#9e9b94"; // variable / commercial / unknown
}

function applyScenarioHighlight() {
  const cs = getCurrentScenario();
  const ids = cs ? new Set(cs.entity_ids || []) : null;
  const keys = cs ? new Set(cs.relation_keys || []) : null;
  // In-page graph panel(s).
  document.querySelectorAll(".graph-panel").forEach(function(panel) {
    panel.classList.remove("active-subgraph");
    panel.querySelectorAll(".kg-node.highlighted, .kg-arc.highlighted").forEach(function(el) {
      el.classList.remove("highlighted");
    });
    if (!cs) return;
    panel.classList.add("active-subgraph");
    panel.querySelectorAll(".kg-node").forEach(function(n) {
      if (ids.has(n.getAttribute("data-node-id"))) n.classList.add("highlighted");
    });
    panel.querySelectorAll(".kg-arc").forEach(function(a) {
      if (keys.has(a.getAttribute("data-relation-key"))) a.classList.add("highlighted");
    });
  });
  // Mirror the highlight in the fullscreen overlay (if open). The CSS rule
  // uses `.graph-overlay-canvas.active-subgraph` so we flag the canvas.
  document.querySelectorAll(".graph-overlay-canvas").forEach(function(canvas) {
    canvas.classList.remove("active-subgraph");
    if (!cs) return;
    canvas.classList.add("active-subgraph");
    canvas.querySelectorAll(".kg-node").forEach(function(n) {
      n.classList.toggle("highlighted", ids.has(n.getAttribute("data-node-id")));
    });
    canvas.querySelectorAll(".kg-arc").forEach(function(a) {
      a.classList.toggle("highlighted", keys.has(a.getAttribute("data-relation-key")));
    });
  });
}

// v2.3 Section 1: evidence strength = mean(confidence) of the relations in
// the scenario's relation_keys, rounded to 2 decimals. null if empty.
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
  if (value == null) return "—";
  if (value < 0.55) return "weak";
  if (value < 0.70) return "moderate";
  if (value < 0.80) return "moderate-high";
  return "high";
}

// Count of scenario arcs that actually matched a KG relation with confidence.
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

// v2.3 Section 1: after the report_html lands in the DOM, append an
// Evidence-strength .headline-item to the .scenario-headline emitted by
// the backend. Idempotent: marked with .evidence-strength to dedupe.
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
    '<span class="headline-label">Evidence strength</span>' +
    '<span class="headline-value">' + value.toFixed(2) +
      ' <span class="headline-range">' + escapeHTML(label) + '</span>' +
    '</span>';
  panel.appendChild(item);
}

// Derive the Intel panel payload from the active scenario (v2.3 Section 2:
// Evidence strength replaces Confidence; same number as the Report).
function computeScenarioIntel() {
  if (!getCurrentScenario()) {
    return {
      evidence: { value: null, label: "—", note: "Generate a scenario to see evidence strength." },
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
    ? label.charAt(0).toUpperCase() + label.slice(1) + " — mean confidence across " +
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
        volatility: r.volatility || "—"
      };
    });
  return {
    evidence: { value: value, label: label, note: note },
    top_arcs: topArcs
  };
}

// ============ PDF EXPORT (v2.2 Section 4) ============
// Produces a 2-page PDF: Report body + Subgraph snapshot. Uses html2pdf
// bundle (which also exposes html2canvas and jsPDF globally). If the
// libraries are not available (e.g. offline CDN), falls back to
// window.print() with the existing @media print stylesheet.
async function exportScenarioPdf() {
  const scenario = getCurrentScenario();
  if (!scenario) { window.print(); return; }
  if (typeof html2pdf !== "function" || typeof html2canvas !== "function") {
    console.warn("html2pdf / html2canvas not loaded; falling back to window.print()");
    window.print();
    return;
  }

  const reportEl = document.querySelector(".scenario-report")
    || document.querySelector(".report-scroll");
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
    ? '<div class="pdf-section">' +
        '<h2 class="pdf-section-title">Subgraph</h2>' +
        '<p class="pdf-section-sub">Entities and relations highlighted in this scenario.</p>' +
        '<img src="' + graphPng + '" style="width:100%; height:auto;" />' +
      '</div>'
    : '';

  const wrapper = document.createElement("div");
  wrapper.style.padding = "20px";
  wrapper.style.fontFamily = "'Fraunces', Georgia, serif";
  wrapper.innerHTML =
    '<div class="pdf-section">' + reportBody + '</div>' +
    (snapshotBlock ? '<div class="pdf-page-break"></div>' + snapshotBlock : '');

  const filename = "geointel-scenario-" + scenario.id + ".pdf";
  html2pdf().from(wrapper).set({
    margin: [10, 10, 10, 10],
    filename: filename,
    pagebreak: { mode: ["css", "legacy"] },
    html2canvas: { scale: 2, backgroundColor: "#ffffff" },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
  }).save();
}

// Try html2canvas first. If the graph is pure SVG and html2canvas returns
// an empty bitmap (happens on some Safari builds), fall back to serialising
// the SVG and drawing it via the Image -> canvas pipeline.
async function snapshotGraphAsPng(graphEl) {
  // html2canvas route.
  const canvas = await html2canvas(graphEl, {
    backgroundColor: "#ffffff",
    scale: 2,
    logging: false
  });
  if (canvas && canvas.width > 0 && canvas.height > 0) {
    try { return canvas.toDataURL("image/png"); } catch (e) { /* fall through */ }
  }
  // SVG serialisation fallback.
  const svgEl = graphEl.querySelector("svg");
  if (!svgEl) throw new Error("No <svg> inside graph panel");
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
    return '<div class="msg user"><div class="msg-bubble">' + m.text + '</div><div class="msg-time">' + m.time + '</div></div>';
  }
  if (m.role === "scenario-card") {
    // v2.2 Section 2.2: clickable recall card for a generated scenario.
    const active = getCurrentScenario() && getCurrentScenario().id === m.scenario_id ? " active" : "";
    return '<div class="scenario-card' + active + '" data-scenario-id="' + escapeHTML(m.scenario_id) + '" role="button" tabindex="0">' +
      '<div class="scenario-card-label">Scenario generated</div>' +
      '<div class="scenario-card-title">' + escapeHTML(m.scenario_title || "Scenario") + '</div>' +
      '<div class="scenario-card-hint">Tap to recall this scenario</div>' +
    '</div>';
  }
  const typeTag = m.type && m.type !== "welcome"
    ? '<div class="msg-type-tag">' + m.type.replace(/_/g, " ") + '</div>'
    : '';
  return '<div class="msg ai"><div class="msg-bubble">' + m.text + '</div>' + typeTag + '<div class="msg-time">' + m.time + '</div></div>';
}

// Recall a previously-generated scenario by id (Section 2.3: purely client-side).
function recallScenario(id) {
  const idx = scenarioHistory.findIndex(function(s) { return s.id === id; });
  if (idx < 0) return;
  if (idx === currentScenarioIndex) return; // already active, no-op
  currentScenarioIndex = idx;
  REPORT_LOADING = false;
  render();
}

function renderIntel(intel) {
  // v2.3 Section 2: Evidence strength replaces Confidence. Same number as
  // the Report headline (both use computeEvidenceStrength()).
  const E = intel.evidence;
  const hasValue = typeof E.value === "number";
  const circumference = 2 * Math.PI * 23;
  const offset = hasValue ? circumference * (1 - E.value) : circumference;
  const bigLabel = hasValue ? "Evidence strength" : "Evidence strength";
  const smallLabel = hasValue
    ? E.label.charAt(0).toUpperCase() + E.label.slice(1)
    : "";

  const arcsHTML = intel.top_arcs.map(function(a) {
    const polaritySign = a.polarity === "neg" ? "−" : "+";
    const barStyle = a.polarity === "pos"
      ? "width:" + Math.round(a.weight * 100) + "%;background:linear-gradient(90deg,#15803d 0%,#0d7a6e 100%)"
      : "width:" + Math.round(a.weight * 100) + "%";
    return '<div class="arc-item">' +
      '<div class="arc-flow"><span class="arc-node">' + a.from + '</span><span class="arc-arrow">━▶</span><span class="arc-node">' + a.to + '</span></div>' +
      '<div class="arc-props"><span>' + a.type + '</span><span><span class="weight">w ' + a.weight.toFixed(2) + '</span> · <span class="polarity ' + a.polarity + '">' + polaritySign + '</span> · vol ' + a.volatility + '</span></div>' +
      '<div class="arc-bar"><div class="arc-bar-fill" style="' + barStyle + '"></div></div>' +
    '</div>';
  }).join("");

  return '<div class="intel-section">' +
    '<div class="intel-header"><span class="intel-sec-title">Evidence strength</span></div>' +
    '<div class="confidence-block">' +
      '<div class="gauge">' +
        '<svg width="58" height="58" viewBox="0 0 58 58">' +
          '<circle cx="29" cy="29" r="23" fill="none" stroke="#ebe8df" stroke-width="5"/>' +
          (hasValue
            ? '<circle cx="29" cy="29" r="23" fill="none" stroke="#15803d" stroke-width="5" stroke-linecap="round" stroke-dasharray="' + circumference.toFixed(1) + '" stroke-dashoffset="' + offset.toFixed(1) + '"/>'
            : '') +
        '</svg>' +
        '<div class="gauge-text">' + (hasValue ? E.value.toFixed(2) : "—") + '</div>' +
      '</div>' +
      '<div class="confidence-meta"><div class="big">' + (hasValue ? smallLabel : bigLabel) + '</div><div class="small">' + escapeHTML(E.note || "") + '</div></div>' +
    '</div>' +
  '</div>' +
  (arcsHTML
    ? '<div class="intel-section">' +
        '<div class="intel-header"><span class="intel-sec-title">Top arcs</span><span class="panel-meta">' + intel.top_arcs.length + '</span></div>' +
        '<div class="arc-list">' + arcsHTML + '</div>' +
      '</div>'
    : '');
}
