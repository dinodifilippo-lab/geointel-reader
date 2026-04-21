// CHESS Reader · app.js · v0.9.0

const APP_VERSION = "0.9.0";
console.log("CHESS Reader " + APP_VERSION);

// ============ BASEMAP ASSET (async) ============
let WORLD_LAND = null;
fetch("world-110m.json")
  .then(function(r) { return r.json(); })
  .then(function(data) { WORLD_LAND = data; render(); })
  .catch(function(err) { console.warn("Basemap failed to load:", err); });

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
function getRoute() {
  const h = window.location.hash.replace(/^#/, "");
  if (!h || h === "atlas" || h === "home") return { view: "home" };
  if (h === "atlas-full") return { view: "home" }; // legacy alias
  const m = h.match(/^(report|dossier)\/(.+)$/);
  if (m) {
    const key = m[2];
    // Numeric key → generated snapshot index
    if (/^\d+$/.test(key) && GENERATED_REPORTS[key]) {
      return { view: "report", dossierId: GENERATED_REPORTS[key].dossierId, reportNum: Number(key) };
    }
    // Dossier id fallback
    if (CHESS_DATA.dossiers[key]) return { view: "report", dossierId: key, reportNum: null };
  }
  return { view: "home" };
}

window.addEventListener("hashchange", function() {
  if (getRoute().view === "home") ATLAS_VIEW = { level: "world", clusterId: null };
  render();
});
window.addEventListener("DOMContentLoaded", render);

// ============ ATLAS STATE (ephemeral) ============
let ATLAS_VIEW = { level: "world", clusterId: null };
let INFO_CARD = { open: false, type: null, id: null };

// ============ GLOBAL CHAT ============
const GREETING_MSG = {
  role: "ai",
  time: "Now",
  text: "Hello. Ask me about any geopolitical tension in the world — I will synthesise a dossier from the Knowledge Graph, combining entity-level analysis, arcs with polarity and volatility, and an editorial report."
};
let GLOBAL_CHAT = [Object.assign({}, GREETING_MSG)];
let REPORT_COUNTER = 0; // increments on each AI response that produces a report

// Generated snapshots indexed by reportNum.
// Each: { dossierId, query, timestamp, reportNum }.
const GENERATED_REPORTS = {};

// Ephemeral UI state for populated view.
let GRAPH_FILTER = "full"; // full | actor | asset | event
let GRAPH_HIGHLIGHT = null; // entity name to highlight (from chip click)

// Archive drawer UI state.
let ARCHIVE_OPEN = false;

function newChat() {
  saveChatToArchive();
  GLOBAL_CHAT = [Object.assign({}, GREETING_MSG)];
  REPORT_COUNTER = 0;
  for (const k in GENERATED_REPORTS) delete GENERATED_REPORTS[k];
  ATLAS_VIEW = { level: "world", clusterId: null };
  INFO_CARD = { open: false, type: null, id: null };
  GRAPH_FILTER = "full";
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

  if (route.view === "report") {
    const d = CHESS_DATA.dossiers[route.dossierId];
    if (!d) {
      window.location.hash = "";
      return;
    }
    const snapshot = route.reportNum ? GENERATED_REPORTS[route.reportNum] : null;
    root.innerHTML = renderWorkingSurfaceHTML(d, snapshot);
    wireWorkingSurface(d);
  } else {
    root.innerHTML = renderWorkingSurfaceHTML(null, null);
    wireWorkingSurface(null);
  }
}

// ============ TOPBAR ============
function renderTopbar(route) {
  const leftEl = document.getElementById("topbar-left-extra");
  const centerEl = document.getElementById("topbar-center");
  if (!leftEl || !centerEl) return;

  if (route.view === "report") {
    const d = CHESS_DATA.dossiers[route.dossierId];
    leftEl.innerHTML = '<a class="back-to-atlas" href="#">← Atlas</a>';
    centerEl.innerHTML = d
      ? '<span class="dossier-pill">DOSSIER · ' + d.title.toUpperCase() + '</span>'
      : '';
  } else {
    leftEl.innerHTML = '';
    centerEl.innerHTML = '';
  }
}

// ============ WORKING SURFACE ============
function renderWorkingSurfaceHTML(dossier, snapshot) {
  return '<div class="working-surface">' +
    (ARCHIVE_OPEN ? renderArchiveDrawer() : '') +
    renderChatPanel(dossier) +
    '<div class="right-area">' +
      (dossier ? renderPopulatedRight(dossier, snapshot) : renderAmbientRight()) +
    '</div>' +
  '</div>';
}

function renderChatPanel(_dossier) {
  const count = GLOBAL_CHAT.length;
  const metaLabel = count <= 1 ? "Ready" : count + " msg · Session";
  const isEmpty = count <= 1;
  const messagesHTML = (isEmpty ? "" : '<div class="day-sep">Today · ' + formatToday() + '</div>') +
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
      '<div class="chat-input-box">' +
        '<textarea id="chat-textarea" placeholder="Ask anything about the world\'s tensions…" rows="1"></textarea>' +
        '<div class="chat-input-actions">' +
          '<button type="submit" class="send-btn">Run <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg></button>' +
        '</div>' +
      '</div>' +
    '</form>' +
  '</aside>';
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
          (ATLAS_VIEW.level === "region"
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

// ============ POPULATED RIGHT ============
function renderPopulatedRight(d, snapshot) {
  const r = d.reports[d.current_report_id];
  const displayNum = snapshot ? snapshot.reportNum : d.current_report_id;
  const displayTimestamp = snapshot ? formatSnapshotTimestamp(snapshot.timestamp) : r.timestamp;
  const queryByline = snapshot
    ? '<div class="snapshot-query"><span class="snapshot-query-label">Triggered by</span><span class="snapshot-query-text">"' + escapeHTML(snapshot.query) + '"</span></div>'
    : '';
  const filterStateAttr = ' data-graph-filter="' + GRAPH_FILTER + '"';
  const hlAttr = GRAPH_HIGHLIGHT ? ' data-graph-highlight="' + escapeHTML(GRAPH_HIGHLIGHT) + '"' : '';
  return '<div class="upper-strip">' +
    '<section class="graph-panel"' + filterStateAttr + hlAttr + '>' +
      '<div class="panel-header">' +
        '<span class="panel-title">Graph <span class="report-num">#' + displayNum + '</span></span>' +
        '<span class="panel-action">Expand</span>' +
      '</div>' +
      '<div class="graph-controls">' +
        '<button class="graph-ctrl' + (GRAPH_FILTER === "full" ? " active" : "") + '" data-filter="full">Full</button>' +
        '<button class="graph-ctrl' + (GRAPH_FILTER === "actor" ? " active" : "") + '" data-filter="actor">Actors</button>' +
        '<button class="graph-ctrl' + (GRAPH_FILTER === "asset" ? " active" : "") + '" data-filter="asset">Assets</button>' +
        '<button class="graph-ctrl' + (GRAPH_FILTER === "event" ? " active" : "") + '" data-filter="event">Events</button>' +
      '</div>' +
      '<div class="graph-svg-wrap">' +
        '<svg class="graph-svg" viewBox="0 0 720 360" preserveAspectRatio="xMidYMid meet">' + d.graph_svg + '</svg>' +
      '</div>' +
      '<div class="legend">' +
        '<div class="legend-item"><span class="legend-dot" style="background:#0d7a6e"></span>Actor</div>' +
        '<div class="legend-item"><span class="legend-dot" style="background:#a8570f"></span>Asset</div>' +
        '<div class="legend-item"><span class="legend-dot" style="background:#5b21b6"></span>Event</div>' +
        '<div class="legend-item"><span class="legend-dot" style="background:#b8203a"></span>Negative arc</div>' +
        '<div class="legend-item"><span class="legend-dot" style="background:#15803d"></span>Positive arc</div>' +
      '</div>' +
    '</section>' +
    '<aside class="intel-panel">' +
      '<div class="panel-header"><span class="panel-title">Intel</span></div>' +
      '<div class="intel-body">' + renderIntel(d.intel) + '</div>' +
    '</aside>' +
  '</div>' +
  '<section class="report-panel">' +
    '<div class="panel-header">' +
      '<span class="panel-title">Report <span class="report-num">#' + displayNum + '</span></span>' +
      '<div class="report-header-right">' +
        '<span class="panel-meta">' + displayTimestamp + '</span>' +
        '<button class="download-btn" title="Download report"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg><span>PDF</span></button>' +
      '</div>' +
    '</div>' +
    '<div class="report-scroll">' + queryByline + renderReport(d) + '</div>' +
  '</section>';
}

function formatSnapshotTimestamp(iso) {
  try {
    const d = new Date(iso);
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear() + " · " +
      String(d.getHours()).padStart(2,"0") + ":" + String(d.getMinutes()).padStart(2,"0") + " UTC";
  } catch (e) {
    return iso;
  }
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
function wireWorkingSurface(dossier) {
  wireChatForm(dossier);
  wireGraphCtrls();
  wireCommonChrome();
  if (!dossier) {
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
  // Report chip navigation in the chat messages — routes to snapshot number.
  document.querySelectorAll(".msg-link[data-report-num]").forEach(function(a) {
    a.addEventListener("click", function(e) {
      e.preventDefault();
      const n = a.getAttribute("data-report-num");
      GRAPH_FILTER = "full";
      GRAPH_HIGHLIGHT = null;
      window.location.hash = "report/" + n;
    });
  });
  // Graph filter + chip highlight only relevant in the populated view.
  wireGraphFilters();
  wireChipToGraph();
  applyGraphFilter();
  applyGraphHighlight();
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

function wireGraphCtrls() {
  // Filter wiring now lives in wireGraphFilters (wireCommonChrome calls it).
}

// ============ GRAPH FILTERS & CHIP HIGHLIGHT ============
function classifyGraphNodes() {
  // Tag each .graph-node with data-type based on its inner stroke colour.
  const panel = document.querySelector(".graph-panel");
  if (!panel) return;
  const nodes = panel.querySelectorAll(".graph-node");
  nodes.forEach(function(g) {
    if (g.hasAttribute("data-type")) return;
    let type = "other";
    const stroked = g.querySelector('[stroke="#0d7a6e"], [stroke="#a8570f"], [stroke="#5b21b6"]');
    if (stroked) {
      const col = stroked.getAttribute("stroke");
      if (col === "#0d7a6e") type = "actor";
      else if (col === "#a8570f") type = "asset";
      else if (col === "#5b21b6") type = "event";
    }
    g.setAttribute("data-type", type);
    const label = g.querySelector("text");
    if (label) g.setAttribute("data-label", (label.textContent || "").trim().toUpperCase());
  });
}

function wireGraphFilters() {
  document.querySelectorAll(".graph-ctrl").forEach(function(btn) {
    btn.addEventListener("click", function() {
      const f = btn.getAttribute("data-filter") || "full";
      GRAPH_FILTER = f;
      btn.parentElement.querySelectorAll("button").forEach(function(b) { b.classList.remove("active"); });
      btn.classList.add("active");
      const panel = document.querySelector(".graph-panel");
      if (panel) panel.setAttribute("data-graph-filter", f);
      applyGraphFilter();
    });
  });
}

function applyGraphFilter() {
  classifyGraphNodes();
  // CSS handles the fade via [data-graph-filter] selectors.
}

function wireChipToGraph() {
  // Chips in the report body navigate-highlight the matching graph node.
  document.querySelectorAll(".report-body .chip").forEach(function(chip) {
    chip.addEventListener("click", function() {
      const name = normaliseLabel(chip.textContent);
      if (!name) return;
      GRAPH_HIGHLIGHT = name;
      const panel = document.querySelector(".graph-panel");
      if (panel) panel.setAttribute("data-graph-highlight", name);
      applyGraphHighlight();
      const wrap = document.querySelector(".graph-svg-wrap");
      if (wrap) wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  });
}

function applyGraphHighlight() {
  classifyGraphNodes();
  const panel = document.querySelector(".graph-panel");
  if (!panel) return;
  const target = GRAPH_HIGHLIGHT;
  panel.querySelectorAll(".graph-node").forEach(function(g) {
    g.classList.remove("highlight");
    if (!target) return;
    const label = g.getAttribute("data-label") || "";
    if (label && labelMatches(label, target)) {
      g.classList.add("highlight");
    }
  });
}

function normaliseLabel(raw) {
  if (!raw) return "";
  // Strip leading bullet marks and whitespace, keep letters/digits/spaces.
  return raw.replace(/^[●◆▲\s]+/, "").replace(/\s+/g, " ").trim().toUpperCase();
}

function labelMatches(a, b) {
  // a and b are already uppercase. Accept exact, prefix, or first-word match.
  if (!a || !b) return false;
  if (a === b) return true;
  const ap = a.split(" ")[0];
  const bp = b.split(" ")[0];
  if (ap && bp && ap === bp) return true;
  // Try substring containment both directions.
  return a.indexOf(b) !== -1 || b.indexOf(a) !== -1;
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

// ============ CHAT (mock end-to-end) ============
function wireChatForm(dossier) {
  const form = document.getElementById("chat-form");
  const ta = document.getElementById("chat-textarea");
  if (!form || !ta) return;
  ta.addEventListener("input", function() {
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  });
  ta.addEventListener("keydown", function(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });
  form.addEventListener("submit", function(e) {
    e.preventDefault();
    const text = ta.value.trim();
    if (!text) return;
    handleChatSubmit(text, dossier);
  });
}

function handleChatSubmit(text, _currentDossier) {
  const targetId = dispatchQuery(text);
  const now = formatNow();
  REPORT_COUNTER += 1;
  const reportNum = REPORT_COUNTER;

  GENERATED_REPORTS[reportNum] = {
    dossierId: targetId,
    query: text,
    timestamp: new Date().toISOString(),
    reportNum: reportNum
  };

  GLOBAL_CHAT.push({ role: "user", time: now, text: escapeHTML(text) });
  GLOBAL_CHAT.push({
    role: "ai",
    time: now,
    text: "Synthesising from the " + (CHESS_DATA.dossiers[targetId] ? CHESS_DATA.dossiers[targetId].title : "") + " subgraph",
    pending: true,
    report_dossier: targetId,
    report_num: reportNum
  });

  GRAPH_FILTER = "full";
  GRAPH_HIGHLIGHT = null;
  window.location.hash = "report/" + reportNum;

  setTimeout(function() {
    for (let i = GLOBAL_CHAT.length - 1; i >= 0; i--) {
      const m = GLOBAL_CHAT[i];
      if (m.pending && m.report_dossier === targetId && m.report_num === reportNum) {
        m.pending = false;
        m.text = mockAIResponse(text, CHESS_DATA.dossiers[targetId]);
        m.time = formatNow();
        break;
      }
    }
    render();
  }, 900);
}

function dispatchQuery(text) {
  const t = text.toLowerCase();
  if (/\b(houthi|houthis|red\s+sea|bab|bab-el-mandeb|suez|ansar\s+allah|prosperity\s+guardian)\b/.test(t)) return "red-sea-houthis";
  if (/\b(hormuz|iran|gulf|persian|gcc|strait of hormuz|irgc)\b/.test(t)) return "iran-hormuz";
  if (/\b(taiwan|china\s+sea|tsmc|south\s+china|formosa|pla|indopacom)\b/.test(t)) return "taiwan-strait";
  if (/\b(ai|a\.i\.|semiconductor|chip|lithography|asml|nvidia|tech\s+rivalry|compute)\b/.test(t)) return "ai-us-china";
  return "iran-hormuz";
}

function mockAIResponse(query, dossier) {
  if (!dossier) return "Response generated.";
  return "Drawing on <strong>" + dossier.stats.entities + " entities</strong> and <strong>" + dossier.stats.relations + " relations</strong> in the " + dossier.title + " subgraph, here is a preliminary synthesis. Expand the report on the right for the full editorial.";
}

function formatNow() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return hh + ":" + mm;
}

function escapeHTML(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ============ MESSAGE / INTEL / REPORT ============
function renderMessage(m) {
  if (m.role === "user") {
    return '<div class="msg user"><div class="msg-bubble">' + m.text + '</div><div class="msg-time">' + m.time + '</div></div>';
  }
  let reportLink = "";
  if (!m.pending && m.report_num) {
    reportLink = '<a class="msg-link" data-report-num="' + m.report_num + '" href="#report/' + m.report_num + '">↗ Report #' + m.report_num + ' →</a>';
  } else if (m.report_id) {
    reportLink = '<a class="msg-link">↗ Report #' + m.report_id + ' →</a>';
  }
  const dots = m.pending ? '<span class="dots"></span>' : "";
  return '<div class="msg ai ' + (m.pending ? "pending" : "") + '"><div class="msg-bubble">' + m.text + dots + '</div>' + reportLink + '<div class="msg-time">' + m.time + '</div></div>';
}

function renderIntel(intel) {
  const C = intel.confidence;
  const circumference = 2 * Math.PI * 23;
  const offset = circumference * (1 - C.value);

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

  const eventsHTML = intel.events.map(function(e) {
    return '<div class="tl-item ' + (e.active ? "active" : "") + '"><div class="tl-date">' + e.date + '</div><div class="tl-title">' + e.title + '</div></div>';
  }).join("");

  return '<div class="intel-section">' +
    '<div class="intel-header"><span class="intel-sec-title">Confidence</span><span class="panel-action">Breakdown</span></div>' +
    '<div class="confidence-block">' +
      '<div class="gauge">' +
        '<svg width="58" height="58" viewBox="0 0 58 58">' +
          '<circle cx="29" cy="29" r="23" fill="none" stroke="#ebe8df" stroke-width="5"/>' +
          '<circle cx="29" cy="29" r="23" fill="none" stroke="#15803d" stroke-width="5" stroke-linecap="round" stroke-dasharray="' + circumference.toFixed(1) + '" stroke-dashoffset="' + offset.toFixed(1) + '"/>' +
        '</svg>' +
        '<div class="gauge-text">' + C.value.toFixed(2) + '</div>' +
      '</div>' +
      '<div class="confidence-meta"><div class="big">' + C.label + '</div><div class="small">' + C.note + '</div></div>' +
    '</div>' +
  '</div>' +
  '<div class="intel-section">' +
    '<div class="intel-header"><span class="intel-sec-title">Top arcs</span><span class="panel-action">All 28</span></div>' +
    '<div class="arc-list">' + arcsHTML + '</div>' +
  '</div>' +
  '<div class="intel-section">' +
    '<div class="intel-header"><span class="intel-sec-title">Recent events</span><span class="panel-action">Timeline →</span></div>' +
    '<div class="timeline">' + eventsHTML + '</div>' +
  '</div>';
}

function renderReport(d) {
  const r = d.reports[d.current_report_id];
  const sourcesHTML = r.sources.map(function(s) {
    return '<div class="source-item"><div class="source-num">[' + s.num + ']</div><div><div class="source-title">' + s.title + '</div><div class="source-meta">' + s.meta + '</div></div><div class="source-date">' + s.date + '</div></div>';
  }).join("");

  return '<article class="report">' +
    '<h1 class="report-title">' + r.title + '</h1>' +
    '<p class="report-subtitle">' + r.subtitle + '</p>' +
    '<div class="byline">' +
      '<div class="byline-item"><span class="label">Dossier</span><span class="value">' + d.title + '</span></div>' +
      '<div class="byline-item"><span class="label">Nodes</span><span class="value teal">' + d.stats.entities + ' entities</span></div>' +
      '<div class="byline-item"><span class="label">Arcs</span><span class="value teal">' + d.stats.relations + ' relations</span></div>' +
      '<div class="byline-item"><span class="label">Corpus</span><span class="value">' + d.stats.corpus + ' articles</span></div>' +
      '<div class="byline-item"><span class="label">Sources</span><span class="value">' + d.stats.sources + ' think tanks</span></div>' +
    '</div>' +
    '<div class="exec-summary">' +
      '<div class="exec-label">Executive Summary</div>' +
      '<div class="exec-text">' + r.executive_summary + '</div>' +
    '</div>' +
    '<div class="report-body">' + r.body_html + '</div>' +
    '<div class="sources">' +
      '<div class="sources-label">Sources cited · ' + r.sources.length + ' of ' + d.stats.corpus + '</div>' +
      sourcesHTML +
    '</div>' +
  '</article>';
}
