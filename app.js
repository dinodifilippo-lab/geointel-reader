// CHESS Reader · app.js · v0.8.0

const APP_VERSION = "0.8.0";
console.log("CHESS Reader " + APP_VERSION);

// ============ BASEMAP ASSET (async load) ============
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
  if (!h || h === "atlas") return { view: "working", dossierId: null };
  if (h === "atlas-full") return { view: "atlas-full" };
  const m = h.match(/^(report|dossier)\/(.+)$/);
  if (m) return { view: "working", dossierId: m[2] };
  return { view: "working", dossierId: null };
}

function navigateHash(h) {
  if (window.location.hash.replace(/^#/, "") === h) render();
  else window.location.hash = h;
}

window.addEventListener("hashchange", render);
window.addEventListener("DOMContentLoaded", render);

// ============ ATLAS-FULL STATE (non-persistent) ============
let ATLAS_LOD = { level: "world", clusterId: null, dossierId: null };
let INFO_SHEET = { open: false, type: null, id: null };

// ============ RENDER ROOT ============
function render() {
  const route = getRoute();
  const root = document.getElementById("app-root");
  if (!root) return;

  renderTopbar(route);

  if (route.view === "atlas-full") {
    root.innerHTML = renderAtlasFullHTML();
    wireAtlasFull();
  } else {
    const dossier = route.dossierId ? CHESS_DATA.dossiers[route.dossierId] : null;
    root.innerHTML = renderWorkingSurfaceHTML(dossier);
    wireWorkingSurface(dossier);
  }
}

// ============ TOPBAR ============
function renderTopbar(route) {
  const leftEl = document.getElementById("topbar-left-extra");
  const centerEl = document.getElementById("topbar-center");
  if (!leftEl || !centerEl) return;

  if (route.view === "atlas-full") {
    leftEl.innerHTML = '<a class="back-to-atlas" href="#">← Back</a>';
    const lodLabel =
      ATLAS_LOD.level === "world" ? "World" :
      ATLAS_LOD.level === "region" ? regionLabel(ATLAS_LOD.clusterId) :
      dossierLabel(ATLAS_LOD.dossierId);
    centerEl.innerHTML =
      '<span class="breadcrumb-item">Atlas</span>' +
      '<span class="dot"></span>' +
      '<span class="breadcrumb-item">' + lodLabel + '</span>';
  } else if (route.dossierId) {
    const d = CHESS_DATA.dossiers[route.dossierId];
    leftEl.innerHTML = '';
    centerEl.innerHTML = d
      ? '<span class="dossier-pill">DOSSIER · ' + d.title.toUpperCase() + '</span>'
      : '';
  } else {
    leftEl.innerHTML = '';
    centerEl.innerHTML = '';
  }
}

function regionLabel(clusterId) {
  const c = CHESS_DATA.clusters.find(function(x) { return x.id === clusterId; });
  return c ? c.label : "Region";
}

function dossierLabel(dossierId) {
  const d = CHESS_DATA.dossiers[dossierId];
  return d ? d.title : "Dossier";
}

// ============ WORKING SURFACE ============
function renderWorkingSurfaceHTML(dossier) {
  return '<div class="working-surface">' +
    renderChatPanel(dossier) +
    '<div class="right-area">' +
      (dossier ? renderPopulatedRight(dossier) : renderAmbientRight()) +
    '</div>' +
  '</div>';
}

function renderChatPanel(dossier) {
  if (dossier) {
    return '<aside class="chat-panel">' +
      '<div class="panel-header">' +
        '<span class="panel-title">Chat</span>' +
        '<span class="panel-meta">' + dossier.chat.length + ' msg · Session</span>' +
      '</div>' +
      '<div class="chat-messages">' +
        '<div class="day-sep">Today · Apr 20</div>' +
        dossier.chat.map(renderMessage).join('') +
      '</div>' +
      renderChatInput(false) +
    '</aside>';
  }
  return '<aside class="chat-panel">' +
    '<div class="panel-header">' +
      '<span class="panel-title">Chat</span>' +
      '<span class="panel-meta">Ready</span>' +
    '</div>' +
    '<div class="chat-messages empty">' +
      '<div class="msg ai"><div class="msg-bubble">Hello. Ask me about any geopolitical tension in the world — I will synthesise a dossier from the Knowledge Graph, combining entity-level analysis, arcs with polarity and volatility, and an editorial report.</div><div class="msg-time">Now</div></div>' +
    '</div>' +
    renderChatInput(true) +
  '</aside>';
}

function renderChatInput(isEmpty) {
  const disabled = ' disabled';
  return '<div class="chat-input-wrap">' +
    '<div class="chat-input-box' + (isEmpty ? ' empty' : '') + '">' +
      '<textarea placeholder="Ask anything about the world\'s tensions…"' + disabled + '></textarea>' +
      '<div class="chat-input-actions">' +
        '<button class="send-btn"' + disabled + '>Run <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg></button>' +
      '</div>' +
    '</div>' +
    '<div class="chat-hint">Chat activation in v0.9.0 · currently read-only preview</div>' +
  '</div>';
}

// ============ AMBIENT RIGHT (Atlas as background) ============
function renderAmbientRight() {
  return '<div class="atlas-ambient">' +
    '<div class="ambient-header">' +
      '<div class="ambient-head-text">' +
        '<div class="ambient-title">Atlas</div>' +
        '<div class="ambient-subtitle">Knowledge landscape — active dossiers by region</div>' +
      '</div>' +
      '<a class="expand-btn" href="#atlas-full">Expand ' +
        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>' +
      '</a>' +
    '</div>' +
    '<div class="atlas-ambient-map">' +
      renderAtlasSVG({ interactive: false, viewBoxStr: "0 0 " + MAP_W + " " + MAP_H, showOrbital: true, labelScale: 1 }) +
    '</div>' +
    '<div class="ambient-legend">' +
      '<div class="legend-group"><span class="legend-dot" style="background:#0d7a6e"></span><span>Active dossier</span></div>' +
      '<div class="legend-group"><span class="legend-dot" style="background:#c4bfb1"></span><span>Region in osservazione</span></div>' +
      '<div class="legend-group"><span class="legend-dot" style="background:#5b21b6"></span><span>Trans-geografico (orbital)</span></div>' +
    '</div>' +
  '</div>';
}

// ============ POPULATED RIGHT (graph + intel + report) ============
function renderPopulatedRight(d) {
  const r = d.reports[d.current_report_id];
  return '<div class="upper-strip">' +
    '<section class="graph-panel">' +
      '<div class="panel-header">' +
        '<span class="panel-title">Graph <span class="report-num">#' + d.current_report_id + '</span></span>' +
        '<span class="panel-action">Expand</span>' +
      '</div>' +
      '<div class="graph-controls">' +
        '<button class="graph-ctrl active">Full</button>' +
        '<button class="graph-ctrl">Actors</button>' +
        '<button class="graph-ctrl">Assets</button>' +
        '<button class="graph-ctrl">Events</button>' +
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
      '<span class="panel-title">Report <span class="report-num">#' + d.current_report_id + '</span></span>' +
      '<div class="report-header-right">' +
        '<span class="panel-meta">' + r.timestamp + '</span>' +
        '<button class="download-btn" title="Download report"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg><span>PDF</span></button>' +
      '</div>' +
    '</div>' +
    '<div class="report-scroll">' + renderReport(d) + '</div>' +
  '</section>';
}

// ============ ATLAS FULL ============
function renderAtlasFullHTML() {
  const viewBoxStr = computeLODViewBox(ATLAS_LOD);
  const labelScale = computeLabelScale(ATLAS_LOD);
  return '<div class="atlas-full">' +
    '<div class="atlas-full-main' + (INFO_SHEET.open ? ' with-sheet' : '') + '">' +
      '<div class="atlas-full-map">' +
        renderAtlasSVG({ interactive: true, viewBoxStr: viewBoxStr, showOrbital: ATLAS_LOD.level === "world", labelScale: labelScale }) +
      '</div>' +
      '<div class="atlas-full-lod">' +
        '<button class="lod-btn' + (ATLAS_LOD.level === "world" ? " active" : "") + '" data-lod="world">World</button>' +
        '<button class="lod-btn' + (ATLAS_LOD.level === "region" ? " active" : "") + '" data-lod="region"' + (ATLAS_LOD.clusterId ? "" : " disabled") + '>Region</button>' +
        '<button class="lod-btn' + (ATLAS_LOD.level === "dossier-detail" ? " active" : "") + '" data-lod="dossier-detail"' + (ATLAS_LOD.dossierId ? "" : " disabled") + '>Dossier</button>' +
      '</div>' +
    '</div>' +
    (INFO_SHEET.open ? renderInfoSheet() : '') +
  '</div>';
}

function computeLODViewBox(lod) {
  if (lod.level === "world" || !lod.clusterId && !lod.dossierId) {
    return "0 0 " + MAP_W + " " + MAP_H;
  }
  if (lod.level === "region" && lod.clusterId) {
    const c = CHESS_DATA.clusters.find(function(x) { return x.id === lod.clusterId; });
    if (!c) return "0 0 " + MAP_W + " " + MAP_H;
    const p = projectToSVG(c.lon, c.lat, MAP_W, MAP_H);
    const w = 420, h = 260;
    return (p.x - w/2).toFixed(1) + " " + (p.y - h/2).toFixed(1) + " " + w + " " + h;
  }
  if (lod.level === "dossier-detail" && lod.dossierId) {
    const d = CHESS_DATA.dossiers[lod.dossierId];
    if (!d) return "0 0 " + MAP_W + " " + MAP_H;
    const lon = d.lon != null ? d.lon : 0;
    const lat = d.lat != null ? d.lat : 0;
    const p = projectToSVG(lon, lat, MAP_W, MAP_H);
    const w = 240, h = 150;
    return (p.x - w/2).toFixed(1) + " " + (p.y - h/2).toFixed(1) + " " + w + " " + h;
  }
  return "0 0 " + MAP_W + " " + MAP_H;
}

function computeLabelScale(lod) {
  if (lod.level === "region") return 0.45;
  if (lod.level === "dossier-detail") return 0.28;
  return 1;
}

function renderInfoSheet() {
  if (INFO_SHEET.type === "cluster") {
    const c = CHESS_DATA.clusters.find(function(x) { return x.id === INFO_SHEET.id; });
    if (!c) return '';
    const hasDossiers = c.dossier_ids.length > 0;
    const firstDossierId = hasDossiers ? c.dossier_ids[0] : null;
    return '<aside class="info-sheet">' +
      '<button class="info-close" data-action="close" title="Close">×</button>' +
      '<div class="info-eyebrow">Cluster</div>' +
      '<h2 class="info-title">' + c.label + '</h2>' +
      '<p class="info-desc">' + c.description + '</p>' +
      '<div class="info-meta-grid">' +
        '<div><span class="info-meta-label">Dossiers attivi</span><span class="info-meta-value">' + c.dossier_ids.length + '</span></div>' +
        '<div><span class="info-meta-label">Lat · Lon</span><span class="info-meta-value mono">' + c.lat.toFixed(1) + ' · ' + c.lon.toFixed(1) + '</span></div>' +
      '</div>' +
      (hasDossiers
        ? '<button class="ask-btn" data-action="ask" data-dossier-id="' + firstDossierId + '">Ask about this →</button>'
        : '<div class="info-empty-note">No active dossiers yet. Observing.</div>') +
    '</aside>';
  }
  if (INFO_SHEET.type === "dossier") {
    const d = CHESS_DATA.dossiers[INFO_SHEET.id];
    if (!d) return '';
    return '<aside class="info-sheet">' +
      '<button class="info-close" data-action="close" title="Close">×</button>' +
      '<div class="info-eyebrow">Dossier</div>' +
      '<h2 class="info-title">' + d.title + '</h2>' +
      '<p class="info-desc">' + d.description + '</p>' +
      '<div class="info-meta-grid three">' +
        '<div><span class="info-meta-label">Entities</span><span class="info-meta-value">' + d.stats.entities + '</span></div>' +
        '<div><span class="info-meta-label">Arcs</span><span class="info-meta-value">' + d.stats.relations + '</span></div>' +
        '<div><span class="info-meta-label">Corpus</span><span class="info-meta-value">' + d.stats.corpus + '</span></div>' +
      '</div>' +
      '<button class="ask-btn" data-action="ask" data-dossier-id="' + d.id + '">Ask about this →</button>' +
    '</aside>';
  }
  return '';
}

function wireAtlasFull() {
  document.querySelectorAll(".cluster-marker.has-data, .cluster-marker.empty").forEach(function(el) {
    el.addEventListener("click", function(e) {
      e.stopPropagation();
      const id = el.getAttribute("data-cluster-id");
      ATLAS_LOD = { level: "region", clusterId: id, dossierId: null };
      INFO_SHEET = { open: true, type: "cluster", id: id };
      render();
    });
  });
  document.querySelectorAll(".orbital-item, .dossier-marker").forEach(function(el) {
    el.addEventListener("click", function(e) {
      e.stopPropagation();
      const id = el.getAttribute("data-dossier-id");
      const d = CHESS_DATA.dossiers[id];
      ATLAS_LOD = { level: "dossier-detail", clusterId: d && d.cluster_id ? d.cluster_id : ATLAS_LOD.clusterId, dossierId: id };
      INFO_SHEET = { open: true, type: "dossier", id: id };
      render();
    });
  });
  document.querySelectorAll(".lod-btn").forEach(function(btn) {
    if (btn.hasAttribute("disabled")) return;
    btn.addEventListener("click", function() {
      const level = btn.getAttribute("data-lod");
      ATLAS_LOD = {
        level: level,
        clusterId: ATLAS_LOD.clusterId,
        dossierId: ATLAS_LOD.dossierId
      };
      if (level === "world") {
        ATLAS_LOD.clusterId = null;
        ATLAS_LOD.dossierId = null;
      }
      render();
    });
  });
  document.querySelectorAll(".info-close").forEach(function(btn) {
    btn.addEventListener("click", function() {
      INFO_SHEET = { open: false, type: null, id: null };
      ATLAS_LOD = { level: "world", clusterId: null, dossierId: null };
      render();
    });
  });
  document.querySelectorAll(".ask-btn").forEach(function(btn) {
    btn.addEventListener("click", function() {
      const id = btn.getAttribute("data-dossier-id");
      INFO_SHEET = { open: false, type: null, id: null };
      ATLAS_LOD = { level: "world", clusterId: null, dossierId: null };
      window.location.hash = "report/" + id;
    });
  });
}

// ============ ATLAS SVG (shared ambient + full) ============
function renderAtlasSVG(opts) {
  const interactive = !!opts.interactive;
  const viewBoxStr = opts.viewBoxStr;
  const showOrbital = opts.showOrbital !== false;
  const labelScale = opts.labelScale || 1;

  const landHTML = renderLand();
  const clustersHTML = renderClusterMarkers(interactive, labelScale);
  const orbitalHTML = showOrbital ? renderOrbitalMarkers(interactive, labelScale) : '';
  const regionDossiersHTML = (interactive && ATLAS_LOD.level === "region" && ATLAS_LOD.clusterId)
    ? renderRegionDossierMarkers(ATLAS_LOD.clusterId, labelScale)
    : '';

  return '<svg class="atlas-svg' + (interactive ? ' interactive' : '') + '" viewBox="' + viewBoxStr + '" preserveAspectRatio="xMidYMid meet">' +
    '<rect class="atlas-bg" x="0" y="0" width="' + MAP_W + '" height="' + MAP_H + '"/>' +
    '<ellipse class="atlas-graticule" cx="' + (MAP_W/2) + '" cy="' + (MAP_H/2) + '" rx="' + (MAP_W * 0.46) + '" ry="' + (MAP_H * 0.58) + '"/>' +
    '<g class="land">' + landHTML + '</g>' +
    '<g class="clusters">' + clustersHTML + '</g>' +
    '<g class="region-dossiers">' + regionDossiersHTML + '</g>' +
    '<g class="orbital-ring">' + orbitalHTML + '</g>' +
  '</svg>';
}

function renderLand() {
  if (!WORLD_LAND) return '';
  const parts = [];
  for (let i = 0; i < WORLD_LAND.length; i++) {
    const ring = WORLD_LAND[i];
    if (!ring || ring.length < 3) continue;
    // Skip polygons that cross the antimeridian (simple heuristic: longitude range > 180).
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

function renderClusterMarkers(interactive, labelScale) {
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
    return '<g class="cluster-marker ' + (hasData ? "has-data" : "empty") + (interactive ? " interactive" : "") + '"' +
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
      '<circle class="dossier-halo" r="10" opacity="0.35"/>' +
      '<circle class="dossier-dot" r="5"/>' +
      '<text class="dossier-label" y="-10" text-anchor="middle" style="font-size:' + labelSize + 'px">' + d.title + '</text>' +
    '</g>';
  }).join("");
}

function renderOrbitalMarkers(interactive, labelScale) {
  const transIds = CHESS_DATA.trans_geographic_dossier_ids;
  const labelSize = (13 * labelScale).toFixed(1);
  return transIds.map(function(id, i) {
    const d = CHESS_DATA.dossiers[id];
    if (!d) return "";
    const angle = -Math.PI / 2 + (i - (transIds.length - 1) / 2) * 0.4;
    const cx = MAP_W / 2 + Math.cos(angle) * (MAP_W * 0.42);
    const cy = MAP_H / 2 + Math.sin(angle) * (MAP_H * 0.55);
    return '<g class="orbital-item' + (interactive ? " interactive" : "") + '"' +
      ' data-dossier-id="' + d.id + '"' +
      ' transform="translate(' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ')">' +
      '<circle r="22" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3" stroke-dasharray="2,3"/>' +
      '<circle class="orbital-dot" r="10"/>' +
      '<text class="orbital-label" y="-32" text-anchor="middle" style="font-size:' + labelSize + 'px">' + d.title + '</text>' +
    '</g>';
  }).join("");
}

// ============ WIRE WORKING SURFACE ============
function wireWorkingSurface(dossier) {
  if (!dossier) return;
  document.querySelectorAll(".graph-ctrl").forEach(function(btn) {
    btn.addEventListener("click", function() {
      btn.parentElement.querySelectorAll("button").forEach(function(b) { b.classList.remove("active"); });
      btn.classList.add("active");
    });
  });
}

// ============ MESSAGE / INTEL / REPORT (reused from v0.7) ============
function renderMessage(m) {
  if (m.role === "user") {
    return '<div class="msg user"><div class="msg-bubble">' + m.text + '</div><div class="msg-time">' + m.time + '</div></div>';
  }
  const reportLink = m.report_id ? '<a class="msg-link">↗ Report #' + m.report_id + ' →</a>' : "";
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
