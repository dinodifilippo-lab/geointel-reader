// GeoIntel Reader · data.js · v2.1.0
// --------------------------------------------------
// Changes vs v2.0.0:
//   • entity.dossiers canonicalized: derived strictly from relations.dossiers
//     (entity in D iff it appears in any relation tagged D). 23 entity lines
//     rewritten: 12 had their declared set adjusted plus deterministic
//     alphabetical sort; 11 orphan entities (no relations reference them)
//     now have dossiers: []. Orphans today: ukmto, kharg-terminal, e3,
//     natanz, fordow, skorea, euv-lithography, duv-lithography, hbm-memory,
//     egypt, horn-africa-bases. Restore their dossier membership by adding
//     relations that reference them, not by re-curating this field.
//
// Changes vs v1.0.0:
//   • All 6 dossiers rewritten from scratch: Russia-Ukraine, Iran-Hormuz,
//     Iran-USA, Taiwan-Strait, AI-US-China, Red-Sea-Houthis.
//   • Each dossier now includes a `brief_text` field -- the full CHESS-style
//     dossier brief used as context for the LLM chat.
//   • Static chat arrays replaced with empty `chat: []` -- the chat is now live,
//     answers come from the Edge Function `geointel-reader-chat`.
//   • Reports kept as sample artefacts for the "Report" panel; they are
//     illustrative and do not drive the chat.
//   • `eastern-europe` cluster now has a dossier (russia-ukraine); was empty.
//   • Tool name normalised: "GeoIntel Reader" (CHESS is the methodology).
// --------------------------------------------------

window.CHESS_DATA = {

clusters: [
{ id: "eastern-europe", label: "Eastern Europe", lat: 49.0, lon: 32.0, dossier_ids: ["russia-ukraine"],
description: "Cluster strutturalmente dominato dal conflitto Russia-Ucraina. Archi ad alta volatilità sul fronte aiuti USA, bassa reversibilità sulle dinamiche di attrito, ed effetti di secondo ordine su energia europea, architettura NATO e supply chain difensive." },
{ id: "middle-east", label: "Middle East", lat: 29.0, lon: 50.0, dossier_ids: ["iran-hormuz", "iran-usa", "red-sea-houthis"],
description: "Strutturalmente la regione più volatile del grafo: chokepoint energetici (Hormuz, Bab-el-Mandeb), rivalità strategica Iran-USA, proxy network iraniano ridimensionato dopo 2024, e una fitta rete di archi ad alta polarità negativa con ramificazioni globali sull'assicurazione e sui mercati energetici." },
{ id: "east-asia", label: "East Asia", lat: 24.0, lon: 121.0, dossier_ids: ["taiwan-strait"],
description: "Cluster dominato dalla tensione Taiwan-strait: semiconduttori come asset strategico globale, presenza navale USA/Giappone, grey-zone PLA normalizzata, e un grafo ad alta confidenza ma bassa reversibilità sui principali archi militari." },
{ id: "sahel", label: "Sahel", lat: 15.0, lon: 0.0, dossier_ids: [],
description: "Regione in osservazione, nessun dossier ancora partizionato. Instabilità cronica, competizione tra attori esterni (Russia via Africa Corps, Francia, Turchia) e fragilità istituzionale." },
{ id: "arctic", label: "Arctic", lat: 78.0, lon: 20.0, dossier_ids: [],
description: "In osservazione. Apertura di rotte, militarizzazione graduale e competizione per risorse sub-marine stanno ricalibrando il grafo -- ma non abbiamo ancora massa critica di eventi per aprire un dossier." }
],

trans_geographic_dossier_ids: ["ai-us-china"],

dossiers: {

// =======================================================================
// 1. RUSSIA – UKRAINE
// =======================================================================
"russia-ukraine": {
  id: "russia-ukraine",
  title: "Russia · Ukraine",
  cluster_id: "eastern-europe",
  lat: 49.0,
  lon: 32.0,
  description: "Conflitto attritivo a bassa reversibilità. Europeanisation dell'aiuto occidentale sotto oscillazione USA, theatre hybrid nel Baltico, deep-strike ucraino su rifinerie russe, e dinamiche energetico-finanziarie che si estendono a India, Cina, Turchia.",
  actors: ["Russian Federation", "Ukraine", "United States", "Germany", "Poland", "UK", "France", "China (PRC)", "Turkey", "India", "Hungary / Slovakia"],
  stats: { entities: 18, relations: 42, events: 20, corpus: 312, sources: 8, last_update: "Apr 2026" },
  chat: [],
  current_report_id: 1,
  reports: {
    1: {
      id: 1,
      title: "The <em>Europeanisation</em> of Ukraine: A Front Line Held Under Shifting Patronage",
      subtitle: "Forced European backfill under oscillating US commitment; structural attrition, hybrid Baltic theatre, and the 2026 sensitivity map.",
      timestamp: "Apr 20, 2026 · 08:40 UTC",
      executive_summary: "The Russia–Ukraine system is in a <strong>high-attrition, low-reversibility configuration</strong>. The defining shift of 2025–26 is the <em>forced Europeanisation</em> of Ukrainian support under recurrent US aid-freeze cycles. Germany, Poland, UK, France, and the Nordic-Baltic bloc now carry a load-bearing share. Russian energy-grid strikes have reduced Ukrainian generation to ~55% of pre-war baseline. The single highest-leverage variable remains US aid continuity.",
      body_html: '<h2 data-num="01">The actors and the four theatres</h2><p>The war has differentiated into four parallel theatres: a <strong>positional ground war</strong> dominated by FPV drones, artillery and electronic warfare; a <strong>Russian long-range strike campaign</strong> against Ukrainian energy and civilian infrastructure; a <strong>Ukrainian deep-strike campaign</strong> against Russian refineries, Black Sea Fleet assets and strategic aviation; and a <strong>hybrid-economic theatre</strong> spanning Baltic cable incidents, Black Sea grain shipping, European gas markets, and sanctions architecture.</p><p>The <span class="chip actor">● Russian Federation</span> operates under a war-economy footing with defence spending at ~7.1% of GDP. <span class="chip actor">● Ukraine</span> retains political cohesion higher than 2023 Western forecasts; the binding constraint has shifted from equipment to manpower and industrial capacity protection. The <span class="chip actor">● United States</span> is now a <em>bifurcated, oscillating actor</em> -- recurring aid-freeze cycles have made US commitment itself a source of system volatility.</p><h2 data-num="02">The assets under pressure</h2><p>Three assets dominate: <span class="chip asset">◆ Ukrainian energy grid</span> at ~55% of pre-war generation after the winter 2025–26 strike campaign; <span class="chip asset">◆ Black Sea grain corridor</span> functioning at ~85% pre-war throughput despite Russian naval degradation; <span class="chip asset">◆ Zaporizhzhia Nuclear Plant (ZNPP)</span>, a latent tier-1 risk under Russian occupation.</p><h3>High-weight arcs</h3><ul class="report-list"><li><strong>Russia → Ukrainian energy grid</strong> · coercive strike, weight 0.88, high volatility, low reversibility.</li><li><strong>US → Ukraine (military aid)</strong> · enabling, weight 0.81, <em>very high volatility</em> -- the most volatile arc in the dossier.</li><li><strong>Germany → Ukraine</strong> · enabling, weight 0.71, stabilising trend after Taurus delivery Q3 2025.</li><li><strong>China → Russia (dual-use / financial enablement)</strong> · enabling-indirect, weight 0.66, structural.</li></ul><blockquote class="pullquote">The war is no longer about whether Ukraine can prevail -- it is about which side\'s manpower curve breaks first, and whether European cohesion holds long enough to matter.<cite>ECFR · Policy Brief · March 2026</cite></blockquote><h2 data-num="03">What would shift the system</h2><div class="data-callout"><div class="data-callout-cell"><div class="dc-label">Grid capacity</div><div class="dc-value coral">55%</div><div class="dc-hint">of pre-war baseline</div></div><div class="data-callout-cell"><div class="dc-label">Russian defence</div><div class="dc-value">7.1%</div><div class="dc-hint">of GDP, 2025</div></div><div class="data-callout-cell"><div class="dc-label">Confidence</div><div class="dc-value sage">0.79</div><div class="dc-hint">Corroborated ≥5 sources</div></div></div><p>Sensitivities in rank order: (i) US aid continuity -- sustained halt >12 weeks forces Ukrainian operational contraction within one fighting season; (ii) Chinese posture on dual-use exports, currently calibrated; (iii) European political cohesion, with Hungary/Slovakia as weak links; (iv) ZNPP incident as tail-risk; (v) Russian domestic economy sustainability at 2–3 more years per IMF modelling.</p>',
      sources: [
        { num: "01", title: "The Europeanisation of Ukraine Support", meta: "ECFR · Policy Brief", date: "2026-03-11" },
        { num: "02", title: "Russian War Economy: Sustainability Horizon", meta: "Bruegel · Working Paper", date: "2026-02-18" },
        { num: "03", title: "Hybrid Attrition in the Baltic", meta: "CSIS · Russia Program", date: "2026-01-22" },
        { num: "04", title: "China's Calibrated Ambiguity on Russia", meta: "MERICS · China Monitor", date: "2025-12-09" },
        { num: "05", title: "Turkey's Black Sea Balance", meta: "ISPI · Commentary", date: "2025-11-14" },
        { num: "06", title: "Ukrainian Defence Industrial Base 2025", meta: "Chatham House · Research Paper", date: "2025-10-28" }
      ]
    }
  },
  intel: {
    confidence: { value: 0.79, label: "High confidence", note: "Corroborated across ≥5 sources. Weakest: Russian casualty figures (0.42), China-Russia military-technical cooperation depth (0.54)." },
    top_arcs: [
      { from: "Russia", to: "UA grid", type: "coercive strike", weight: 0.88, polarity: "neg", volatility: "H" },
      { from: "US", to: "Ukraine", type: "enabling (aid)", weight: 0.81, polarity: "pos", volatility: "VH" },
      { from: "Germany", to: "Ukraine", type: "enabling (aid)", weight: 0.71, polarity: "pos", volatility: "M" },
      { from: "China", to: "Russia", type: "enabling-indirect", weight: 0.66, polarity: "neg-West", volatility: "L" },
      { from: "NATO", to: "Russia", type: "deterrent posture", weight: 0.69, polarity: "neg", volatility: "L" }
    ],
    events: [
      { date: "2026-03-20", title: "Russian winter strike campaign ends; UA grid at 55% pre-war", active: true },
      { date: "2026-02-11", title: "France-UK joint statement on coalition of the willing" },
      { date: "2026-01-15", title: "Ukrainian mobilisation law revision (draft age floor 23)" },
      { date: "2025-11-22", title: "Estonia-Finland cable incident; NATO Article 4 consultations" },
      { date: "2025-09-18", title: "Ukrainian strikes on Ryazan and Samara refineries" },
      { date: "2025-07-30", title: "German Taurus delivery" },
      { date: "2025-03-14", title: "First extended US aid pause (~8 weeks)" },
      { date: "2024-08-06", title: "Ukrainian Kursk incursion" }
    ]
  },
  brief_text: `RUSSIA-UKRAINE · Dossier Brief · As-Of April 2026

1. CURRENT SYSTEM STATE

The Russia-Ukraine system is in a high-attrition, low-reversibility configuration. Since late 2024 the front line has been structurally static: local gains are measured in single-digit kilometres per quarter by either side, at disproportionate cost. The war has differentiated into four parallel theatres: (i) a positional ground war dominated by FPV drones, tube artillery at historically high expenditure rates, glide bombs (KAB series), and electronic warfare as the decisive tactical variable; (ii) a Russian long-range strike campaign against Ukrainian energy and civilian infrastructure, using Shahed-136/Geran-2 swarms, Iskander-M, Kh-101, Kalibr, and increasingly Kinzhal and Zircon hypersonic variants for high-value targets; (iii) a Ukrainian deep-strike campaign against Russian refineries, Black Sea Fleet assets, and strategic aviation airfields (Engels, Olenya), using domestic long-range drones (Liutyi, Bober) and selective Western systems; (iv) a hybrid-economic theatre spanning Baltic cable and pipeline incidents, Black Sea grain shipping, European gas markets, sanctions evasion architecture, and information operations.

The most consequential shift since mid-2025 is the forced Europeanisation of Ukrainian support: US political commitment has become intermittent (recurring aid-freeze cycles), forcing Germany, Poland, France, UK, and the Nordic/Baltic bloc to carry a load-bearing share they were not prepared to carry two years ago.

1. ACTORS

State actors with autonomous decision capacity:

- Russian Federation (Kremlin): strategic escalation, nuclear signalling, sanctions-response doctrine. War economy footing since 2023; defence spending ~7.1% of GDP (2025). Time horizon: multi-year attritional frame normalised. Key institutional actors below Kremlin: Security Council (Patrushev faction, Shoigu displaced), GRU (now controls ex-Wagner assets as Africa Corps), FSB, Rosatom (civilian-nuclear diplomacy, ZNPP).
- Ukraine (Bankova / Office of the President): operational tempo, targeting priorities, mobilisation policy. Political cohesion higher than 2023 Western forecasts; binding constraint has shifted from equipment to manpower and industrial capacity protection. Key sub-actors: General Staff (Syrskyi command), GUR (military intelligence, authors of Crimea and rear-area strikes), Energoatom (nuclear operator).
- United States: bifurcated actor. Executive branch (White House, Pentagon) seeks sustained support; Congressional dynamics post-2024 election introduced recurrent aid-freeze cycles (eight-week pause Q1 2025 the defining precedent). The US position oscillates, which is itself a destabilising system variable.
- Germany: largest European contributor by value since late 2025 (Taurus delivered Q3 2025 after two years of Scholz-era resistance; Merz government accelerated profile). De facto anchor of continental European support.
- Poland: frontline enabler -- logistics corridor for ~80% of Western aid, training hub (Leopard and F-16 schools), political pressure agent within NATO/EU. Lowest threshold for escalatory posture in Europe; Tusk government maintains pre-2024 trajectory.
- United Kingdom: early and continuous supplier of Storm Shadow (precision long-range strike), NLAW anti-armour, special operations support, and maritime intelligence in Baltic/Black Sea. Over-indexes in grey-zone theatre.
- France: Macron's "ne rien exclure" doctrine (Feb 2024, reiterated 2025) expanded the envelope of acceptable European discourse on ground presence -- even without deployment, it shifted the rhetorical ceiling. SCALP-EG supplier (equivalent to Storm Shadow).
- Nordic-Baltic bloc (Finland, Sweden, Estonia, Latvia, Lithuania, Denmark, Norway): structural over-contributors relative to GDP. Finland's 2023 NATO accession and Sweden's 2024 accession closed the Baltic strategic geometry. Estonia leads rhetoric; Denmark leads F-16 coalition.
- China (PRC): non-belligerent but structurally enabling. Dual-use goods (machine tools, optics, drone components), yuan-settled energy trade ($100B+ annual flow), UNSC diplomatic cover. Has declined direct lethal aid despite Russian requests -- calibrated ambiguity is the strategy. Sanctions-enforcement toward Chinese small banks tightened under US secondary sanctions since mid-2024.
- Turkey: transactional posture. Enforces Montreux (blocks non-riparian warship transits to Black Sea -- major structural stabiliser), brokers selective diplomatic tracks (2022 grain deal, occasional prisoner exchanges), supplies Baykar Bayraktar to Ukraine while importing Russian gas and hosting sanctions-adjacent trade flows.
- India: large-scale buyer of discounted Russian Urals crude (~1.8M bpd through 2025). Acts as sanctions-softener without formal alignment; price-cap compliance selective.
- Hungary, Slovakia: the weak internal links of European consensus. Orbán government blocks or dilutes EU decisions systematically; Fico government post-2023 return shifted Slovakia from contributor to obstacle. Both remain inside EU/NATO decision-making, which amplifies their leverage.
- Italy: Meloni government maintained pre-war continuity of support despite coalition noise; stable contributor, not a lead actor.

Secondary state actors (border / systemic):

- Moldova: border state, energy-vulnerable (Transnistria gas dependency), aspirant EU accession track accelerated post-2022. Potential secondary Russian pressure vector.
- Romania: southern NATO anchor, Black Sea posture, hosts Aegis Ashore (Deveselu), grain logistics partner for Ukraine.
- Belarus: Lukashenko regime remains Russian force-multiplier (territory for 2022 northern axis, missile basing, tactical nuclear storage since 2023), but has not committed ground forces. Lukashenko's survival calculation constrains deeper entanglement.
- Mongolia: geographic sanctions-aggregation route for dual-use goods entering Russia from Chinese and Central Asian supply chains.

Non-state / sub-state actors:

- Africa Corps (ex-Wagner, now GRU-controlled post-Prigozhin): Russian force projection in Mali, Burkina Faso, Niger, CAR, Libya. Indirectly relevant as sanctions-revenue generator (gold, resource concessions) and Global South diplomatic lever.
- Ukrainian defence-industrial complex: domestic drone production reached ~4 million units estimated in 2025 (government target, likely order-of-magnitude correct). Domestic missile programmes (Neptune, Hrim-2) moving from prototype to serial.
- Rosatom: civilian-nuclear global actor still largely un-sanctioned; operates ZNPP under occupation; export nuclear diplomacy (Hungary Paks-2, Turkey Akkuyu) unaffected.
- Shadow fleet: 600-1000 tankers of opaque ownership enabling Russian oil exports above G7 price cap. Enforcement tightening 2025 but structurally resilient.

1. ASSETS

- Ukrainian energy grid: Q1 2026 generation capacity at ~55% of pre-war baseline. Winter 2025-26 saw rolling blackouts 8-14 hours daily in Kharkiv, Dnipro, Odesa. Systemic weight very high -- determines civilian resilience, industrial output, population retention.
- Black Sea grain corridor: functioning since Ukraine's unilateral corridor (Aug 2023) despite Russian exit from Istanbul agreement. Throughput ~85% of pre-war levels. Enabled by Ukrainian destruction/displacement of Russian Black Sea Fleet (~30% of surface combatants lost or relocated to Novorossiysk).
- Zaporizhzhia Nuclear Plant (ZNPP): Russian occupation, six reactors in cold shutdown. Latent tier-1 risk -- any cooling-system disruption (cooling pond, external power, shelling) would be escalation-level event regardless of technical radiological outcome.
- Nord Stream 1 and 2 pipelines: physically destroyed Sept 2022. Attribution dispute (German investigation points to Ukrainian-linked private operators, Russian attribution to US/UK, no state-level consensus) remains diplomatically active.
- European gas infrastructure: price sensitivity much reduced vs 2022-23. EU gas storage >85% entering winter 2025-26. LNG build-out (Germany floating terminals, Poland Swinoujscie expansion) structurally reduced Russian leverage. No longer a strategic weapon at pre-2023 intensity.
- Starlink constellation: operationally critical for Ukrainian C2 at tactical level. Musk-controlled -- actor-asset ambiguity. Classified as asset by CHESS topology (Ukraine depends on it, limited outgoing autonomous political arcs from Starlink itself), but Musk's personal decisions (e.g. Crimea coverage restrictions, Sept 2023 revelations) trigger the doctrinal override case where agency is attributed to the controller.
- SWIFT / CHIPS financial plumbing: Russian major banks disconnected since 2022. Parallel settlement architecture (yuan, rupee, shadow-banking, CIPS) matured into functional workaround for 70-80% of needed flows, at elevated transaction cost.
- Baltic subsea cables and energy pipelines: ≥6 damage incidents 2023-2026. Structural attrition vector. Notable: Balticconnector gas pipeline (Oct 2023), Estlink-2 power cable (Dec 2024), Estonia-Finland data cables (Nov 2025). Attribution converges on Russian or Russian-linked vessels dragging anchors.
- Russian refining capacity: Ukrainian strike campaign targeted ~15% of Russian refining capacity at peaks through 2024-25. Structural effect on export revenue and domestic fuel logistics; repairable but requires Western components under sanctions.
- Crimea Bridge (Kerch): struck multiple times (Oct 2022, Jul 2023), remains operational with reduced capacity. Symbolic and logistical node.

1. HIGH-WEIGHT ARCS (CHESS properties: weight 0-1, polarity, volatility, reversibility, confidence)

- Russia → Ukrainian energy grid · coercive strike · 0.88 · strongly neg · high vol · low rev · conf 0.84. Defining destructive arc.
- US → Ukraine (military aid) · enabling · 0.81 · strongly pos · very high vol · medium rev · conf 0.79. Most volatile arc in dossier.
- Germany → Ukraine (military aid) · enabling · 0.71 · strongly pos · medium vol · medium rev · conf 0.82. Stabilising.
- China → Russia (dual-use / financial enablement) · enabling-indirect · 0.66 · neg-for-West · low vol · low rev · conf 0.61. Structural.
- NATO collective → Russia · deterrent posture · 0.69 · neg · low vol · medium rev · conf 0.78. Untested at Article 5 threshold.
- Turkey → Black Sea access regime · gatekeeping (Montreux) · 0.54 · pos-for-Ukraine · low vol · medium rev · conf 0.83. Most reliable single stabiliser.
- Ukraine → Russian rear (long-range strikes) · reciprocal coercive · 0.61 · neg-for-Russia · high vol · medium rev · conf 0.74.
- Russia → Baltic cable infrastructure · hybrid attrition · 0.42 · neg · medium vol · low rev · conf 0.58. Cumulative effect.
- India → Russia (energy purchase) · sanctions-softening · 0.38 · neg-for-sanctions-regime · low vol · medium rev · conf 0.79.
- Hungary/Slovakia → EU consensus · veto-holder · 0.44 · neg-for-European-cohesion · medium vol · medium rev · conf 0.81.
- Poland → Ukraine (logistics) · enabling-structural · 0.57 · strongly pos · low vol · low rev · conf 0.85.
- Belarus → Russia (territorial enabling) · enabling-passive · 0.48 · neg-for-Ukraine · low vol · medium rev · conf 0.77.

1. EVENTS (chronological)

- Feb 2022: Full-scale invasion.
- Sep 2022: Nord Stream destruction.
- Oct 2022: First Kerch Bridge strike.
- Nov 2022: Kherson liberation.
- Jun 2023: Failed Ukrainian summer counter-offensive; Prigozhin mutiny.
- Aug 2023: Ukrainian unilateral Black Sea corridor established.
- Oct 2023: Balticconnector incident.
- Jan 2024: US aid package stalls in Congress (6-month gap).
- Feb 2024: Macron "ne rien exclure" doctrine announced.
- Apr 2024: US aid package eventually approved.
- Aug 2024: Ukrainian Kursk incursion -- first foreign ground operation inside Russia since WWII.
- Nov 2024: US presidential election.
- Dec 2024: Estlink-2 cable incident.
- Mar 2025: First extended US aid pause (~8 weeks), partial European backfill.
- Jul 2025: German Taurus delivery (reversal of prior doctrine).
- Sep 2025: Ukrainian strike campaign hits Ryazan and Samara refineries; Russian refining capacity -12% for six weeks.
- Nov 2025: Estonia-Finland cable incident; NATO Article 4 consultations.
- Jan 2026: Ukrainian mobilisation law revision (draft age floor 23).
- Feb 2026: France-UK joint statement on "coalition of the willing" for post-ceasefire deployment scenarios.
- Mar 2026: Russian winter strike campaign concludes; Ukrainian grid at 55% of pre-war baseline.

1. SYSTEM SENSITIVITIES

- US aid continuity: single highest-leverage variable. Sustained halt >12 weeks would force Ukrainian operational contraction within one fighting season.
- Chinese posture on dual-use exports: currently calibrated. Formal Chinese lethal aid = tier-1 escalation; Chinese tightening under Western pressure would degrade Russian industrial tempo in 6-9 months.
- European political cohesion: Hungarian, Slovak, and potential Austrian/Italian drift are the weak links. A second major European defection from consensus forces restructuring of aid architecture.
- ZNPP incident: tail-risk, high-impact. Would not move the front line but would reshape diplomatic geometry instantly.
- Russian domestic economy: 7%+ of GDP defence spending is sustainable 2-3 more years per IMF modelling; beyond that, structural pressure binds.
- Manpower asymmetry evolution: Russian recruitment via contract incentives and North Korean personnel rotations; Ukrainian mobilisation friction. Whichever side's manpower curve breaks first sets the next structural phase.
- Sanctions architecture enforcement: secondary sanctions on Chinese/Turkish/UAE small banks in 2025 showed enforcement can bite without new sanctions lists. Intensity, not breadth, is the variable.
- Belarusian succession/instability: Lukashenko's health a standing variable.

1. KNOWN UNKNOWNS

- Russian casualty figures: Western estimates 200k-450k killed, confidence low.
- Ukrainian casualty and manpower ceiling: official figures not disclosed.
- China-Russia military-technical cooperation depth: dual-use vs lethal-enablement threshold analytically hard.
- US administration Ukraine policy through 2028: high variance.
- European ground deployment threshold: rhetorically strong, operationally untested.
- Domestic Russian regime stability under attrition.
- Nord Stream attribution final adjudication.
- North Korean personnel rotation scale and combat effectiveness (10k-15k rotated since late 2024, contested).

1. OUT OF SCOPE

- Intra-Ukrainian political dynamics beyond executive branch.
- Brigade-level tactical order-of-battle.
- Russian nuclear doctrine technical detail.
- Specific sanctions list enumeration.
- Western intelligence-sharing mechanics.
- Refugee flow quantitative detail.
- Cyber operations tactical detail.
- Grain trade commodity price modelling.

1. SOURCES

ECFR Policy Brief · "The Europeanisation of Ukraine Support" · March 2026. Bruegel Working Paper · "Russian War Economy: Sustainability Horizon" · February 2026. CSIS Russia Program · "Hybrid Attrition in the Baltic" · January 2026. MERICS · "China's Calibrated Ambiguity on Russia" · December 2025. ISPI Commentary · "Turkey's Black Sea Balance" · November 2025. Chatham House · "Ukrainian Defence Industrial Base 2025" · October 2025. ISW · "Operational Assessment Q1 2026" · March 2026. IISS Military Balance · "Russia and Ukraine" · February 2026.`,
graph_svg: `<defs><radialGradient id="glowTealRU" cx="50%" cy="50%"><stop offset="0%" stop-color="#0d7a6e" stop-opacity="0.22"/><stop offset="100%" stop-color="#0d7a6e" stop-opacity="0"/></radialGradient><radialGradient id="glowAmberRU" cx="50%" cy="50%"><stop offset="0%" stop-color="#a8570f" stop-opacity="0.22"/><stop offset="100%" stop-color="#a8570f" stop-opacity="0"/></radialGradient><radialGradient id="glowVioletRU" cx="50%" cy="50%"><stop offset="0%" stop-color="#5b21b6" stop-opacity="0.22"/><stop offset="100%" stop-color="#5b21b6" stop-opacity="0"/></radialGradient><marker id="arrowCoralRU" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#b8203a"/></marker><marker id="arrowSageRU" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#15803d"/></marker><marker id="arrowMutedRU" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#9e9b94"/></marker></defs><g stroke="#e8e4d6" stroke-width="0.5" opacity="0.7"><line x1="0" y1="90" x2="720" y2="90"/><line x1="0" y1="180" x2="720" y2="180"/><line x1="0" y1="270" x2="720" y2="270"/><line x1="180" y1="0" x2="180" y2="360"/><line x1="360" y1="0" x2="360" y2="360"/><line x1="540" y1="0" x2="540" y2="360"/></g><path d="M 120 90 Q 260 160 430 200" stroke="#b8203a" stroke-width="3.5" fill="none" marker-end="url(#arrowCoralRU)" opacity="0.85"/><path d="M 640 80 Q 520 150 440 195" stroke="#15803d" stroke-width="3.2" fill="none" marker-end="url(#arrowSageRU)" opacity="0.8"/><path d="M 600 200 Q 520 210 450 205" stroke="#15803d" stroke-width="2.6" fill="none" marker-end="url(#arrowSageRU)" opacity="0.7"/><path d="M 430 210 Q 280 260 150 300" stroke="#b8203a" stroke-width="2.2" fill="none" marker-end="url(#arrowCoralRU)" opacity="0.55"/><path d="M 120 300 Q 125 200 118 100" stroke="#9e9b94" stroke-width="1.5" fill="none" marker-end="url(#arrowMutedRU)" opacity="0.55" stroke-dasharray="4,4"/><path d="M 360 60 Q 300 80 145 90" stroke="#9e9b94" stroke-width="1.3" fill="none" marker-end="url(#arrowMutedRU)" opacity="0.45"/><g class="graph-node"><circle cx="115" cy="90" r="26" fill="url(#glowTealRU)"/><circle cx="115" cy="90" r="13" fill="#ffffff" stroke="#0d7a6e" stroke-width="3"/><text class="graph-label" x="115" y="125" text-anchor="middle">RUSSIA</text></g><g class="graph-node"><circle cx="440" cy="200" r="22" fill="url(#glowTealRU)"/><circle cx="440" cy="200" r="11" fill="#ffffff" stroke="#0d7a6e" stroke-width="2.8"/><text class="graph-label" x="440" y="232" text-anchor="middle">UKRAINE</text></g><g class="graph-node"><circle cx="645" cy="75" r="22" fill="url(#glowTealRU)"/><circle cx="645" cy="75" r="11" fill="#ffffff" stroke="#0d7a6e" stroke-width="2.8"/><text class="graph-label" x="645" y="53" text-anchor="middle">USA</text></g><g class="graph-node"><circle cx="605" cy="205" r="18" fill="url(#glowTealRU)"/><circle cx="605" cy="205" r="9" fill="#ffffff" stroke="#0d7a6e" stroke-width="2.5"/><text class="graph-label" x="605" y="232" text-anchor="middle">GERMANY</text></g><g class="graph-node"><circle cx="120" cy="305" r="18" fill="url(#glowTealRU)"/><circle cx="120" cy="305" r="9" fill="#ffffff" stroke="#0d7a6e" stroke-width="2.5"/><text class="graph-label" x="120" y="332" text-anchor="middle">CHINA</text></g><g class="graph-node"><circle cx="370" cy="55" r="16" fill="url(#glowTealRU)"/><circle cx="370" cy="55" r="8" fill="#ffffff" stroke="#0d7a6e" stroke-width="2.3"/><text class="graph-label" x="370" y="35" text-anchor="middle">BELARUS</text></g><g class="graph-node"><circle cx="150" cy="200" r="28" fill="url(#glowAmberRU)"/><rect x="138" y="188" width="24" height="24" rx="3" fill="#ffffff" stroke="#a8570f" stroke-width="3" transform="rotate(45 150 200)"/><text class="graph-label" x="150" y="238" text-anchor="middle" fill="#a8570f">UA GRID</text></g><g class="graph-node"><circle cx="340" cy="300" r="18" fill="url(#glowAmberRU)"/><rect x="331" y="291" width="18" height="18" rx="2" fill="#ffffff" stroke="#a8570f" stroke-width="2.5" transform="rotate(45 340 300)"/><text class="graph-label" x="340" y="330" text-anchor="middle" fill="#a8570f">ZNPP</text></g><g class="graph-node"><circle cx="300" cy="130" r="14" fill="url(#glowVioletRU)"/><polygon points="300,122 309,135 291,135" fill="#ffffff" stroke="#5b21b6" stroke-width="2.5"/><text class="graph-label" x="300" y="156" text-anchor="middle" fill="#5b21b6">MAR '26</text></g>`
},

// =======================================================================
// 2. IRAN – HORMUZ
// =======================================================================
"iran-hormuz": {
  id: "iran-hormuz",
  title: "Iran · Hormuz",
  cluster_id: "middle-east",
  lat: 26.5,
  lon: 56.3,
  description: "Lo Stretto di Hormuz come sistema: postura navale iraniana, hedging del Golfo, presenza USA Fifth Fleet, ruolo del mercato assicurativo londinese come moltiplicatore sistemico del rischio. Dossier chokepoint-centrico, distinto dal dossier Iran-USA più ampio.",
  actors: ["Iran (State)", "IRGC-Navy", "US 5th Fleet", "UKMTO", "GCC bloc", "Commercial shipping", "Lloyd's market"],
  stats: { entities: 14, relations: 28, events: 11, corpus: 147, sources: 6, last_update: "Apr 2026" },
  chat: [],
  current_report_id: 1,
  reports: {
    1: {
      id: 1,
      title: "A Strait Held <em>Under Tension</em>: Hormuz in the Spring of 2026",
      subtitle: "Iranian maritime posture, Gulf shipping risk, and the structural fragility of a 21-mile chokepoint.",
      timestamp: "Apr 20, 2026 · 14:02 UTC",
      executive_summary: "The Hormuz system is in a <strong>high-tension stable</strong> configuration. Iranian hybrid pressure has intensified since late 2025, but GCC diplomatic hedging and US Fifth Fleet visibility have absorbed most escalatory energy. The structural weakness is insurance: further incident frequency would tip the London market into a risk-repricing cycle hard to reverse in under nine months.",
      body_html: '<h2 data-num="01">The actors and what they want</h2><p>Five actors carry operational weight. <span class="chip actor">● Iran (State)</span> pursues sanctions relief as first-order objective. The <span class="chip actor">● IRGC-Navy</span> operates with meaningful autonomy, especially in harassment operations below the threshold of open confrontation. The <span class="chip actor">● US Fifth Fleet</span> and <span class="chip actor">● UKMTO</span> maintain deterrence and reassurance rather than active interdiction. The <span class="chip actor">● GCC bloc</span> -- internally fractured between Saudi-Emirati alignment and Qatari-Omani hedging -- acts as a stabilising absorber.</p><h2 data-num="02">The assets under pressure</h2><p>Three assets dominate: <span class="chip asset">◆ Strait of Hormuz</span>, the <span class="chip asset">◆ Kharg Oil Terminal</span>, and increasingly the <span class="chip asset">◆ Gulf GNSS infrastructure</span> -- a soft target for deniable disruption.</p><h3>High-weight arcs</h3><ul class="report-list"><li><strong>IRGC-Navy → Commercial Shipping</strong> · coercive, weight 0.87, volatility high. The defining arc.</li><li><strong>US Fifth Fleet → IRGC-Navy</strong> · deterrent, weight 0.74, stabilising despite confrontational signature.</li><li><strong>GCC bloc → Strait of Hormuz</strong> · protective, weight 0.61, the quiet stabiliser.</li></ul><blockquote class="pullquote">The Strait is not a front line -- it is a pressure gauge. What matters is not whether Iran closes it (they will not), but how much friction they can impose before the shipping market closes it for them.<cite>ECFR · Policy Brief · March 2026</cite></blockquote><div class="data-callout"><div class="data-callout-cell"><div class="dc-label">Incidents Q1</div><div class="dc-value coral">23</div><div class="dc-hint">+87% vs Q4 2025</div></div><div class="data-callout-cell"><div class="dc-label">War-risk premium</div><div class="dc-value">0.45%</div><div class="dc-hint">of hull value, laden</div></div><div class="data-callout-cell"><div class="dc-label">Confidence</div><div class="dc-value sage">0.82</div><div class="dc-hint">Corroborated ≥3 sources</div></div></div>',
      sources: [
        { num: "01", title: "Iran's Maritime Strategy After the 2025 Escalation Cycle", meta: "ECFR · Policy Brief", date: "2026-03-11" },
        { num: "02", title: "Gulf Shipping Risk: A Quantitative Update", meta: "Bruegel · Working Paper", date: "2026-03-04" },
        { num: "03", title: "GNSS Spoofing as Hybrid Pressure", meta: "MERICS · China Monitor", date: "2026-02-28" },
        { num: "04", title: "The GCC Hedging Dilemma in a Multipolar Gulf", meta: "ISPI · Commentary", date: "2026-02-14" }
      ]
    }
  },
  intel: {
    confidence: { value: 0.82, label: "High confidence", note: "Corroborated across ≥3 sources. Weakest: GNSS attribution (0.64), China-Iran (0.59)." },
    top_arcs: [
      { from: "IRGC-Navy", to: "Shipping", type: "coercive", weight: 0.87, polarity: "neg", volatility: "H" },
      { from: "US 5th Fleet", to: "IRGC-Navy", type: "deterrent", weight: 0.74, polarity: "neg", volatility: "M" },
      { from: "GCC", to: "Hormuz", type: "protective", weight: 0.61, polarity: "pos", volatility: "L" },
      { from: "Lloyd's", to: "Gulf flows", type: "transmission", weight: 0.68, polarity: "systemic", volatility: "M" }
    ],
    events: [
      { date: "2026-03-02", title: "GNSS spoofing wave concludes · 340 transits affected", active: true },
      { date: "2026-02-04", title: "GNSS spoofing wave begins in southern Gulf" },
      { date: "2026-01-18", title: "Limpet-mine incident on Liberian-flagged tanker" },
      { date: "2025-12-22", title: "IRGC drone harassment of MSC container vessel" },
      { date: "2025-11-07", title: "US carrier rotation (Eisenhower → Truman)" }
    ]
  },
  brief_text: `IRAN-HORMUZ · Dossier Brief · As-Of April 2026

1. CURRENT SYSTEM STATE

The Hormuz system is in a high-tension stable configuration. Iranian hybrid pressure -- naval harassment, GNSS spoofing, limpet-mine incidents, seizure of commercial vessels -- has intensified since late 2025, but GCC diplomatic hedging and US Fifth Fleet visibility have absorbed most escalatory energy. The structural weakness of the system is the London insurance market: further incident frequency would tip war-risk premia into a repricing cycle hard to reverse under nine months, which in turn would depress Gulf export volumes independent of any physical closure.

The dossier covers the strait as chokepoint system -- naval postures, shipping risk, insurance transmission, Gulf hedging. It does NOT cover the broader Iran-USA strategic rivalry (proxies, nuclear programme, sanctions architecture), which is the subject of a separate dossier.

1. ACTORS

State and quasi-state:

- Iran (State): central policy-setter for Gulf posture, but with significant autonomy delegated to IRGC. Dual-track behaviour: diplomatic engagement when sanctions-easing is on the table, pressure escalation otherwise.
- IRGC-Navy (Islamic Revolutionary Guard Corps Navy): operates in near-autonomy from the regular Iranian Artesh Navy. Controls fast-boat swarms, coastal ASCM batteries (Qader, Noor), mini-submarines (Ghadir class), and GNSS/electronic warfare units. Topology: 7 outgoing autonomous-decision arcs vs 3 incoming command arcs -- CHESS classifies as actor, not asset.
- Artesh Navy (Iranian regular Navy): blue-water projection pretensions, conventional doctrine; lower autonomy, less relevant to harassment tempo.
- US Fifth Fleet (Bahrain HQ): deterrence posture, carrier rotation (typical 1-2 CSG presence), FON patrols. Operates under USCENTCOM. Mission is reassurance, not active interdiction.
- UK Maritime Trade Operations (UKMTO, Dubai): reporting and coordination hub for commercial shipping. Provides the daily attribution and incident data flow that feeds London insurance pricing.
- GCC bloc: internally fractured.
  - Saudi Arabia and UAE: hedging -- maintain security alignment with US but diplomatic opening with Iran since 2023 Beijing-brokered normalisation. Investing in rail/pipeline redundancy bypassing Hormuz (KSA East-West pipeline, UAE Fujairah).
  - Qatar: mediator role, relatively stable Iran-side communication channel.
  - Oman: traditional neutral broker.
  - Bahrain: most aligned with US posture (hosts Fifth Fleet).
  - Kuwait: low-profile hedger.
- Coalition Task Force 153 / International Maritime Security Construct: multinational escort frameworks, variable composition.

Non-state / sub-state:

- Commercial shipping operators: Maersk, MSC, Ocean Network Express, Evergreen, CMA CGM. Decisions on routing, flagging, crewing, and insurance purchase determine the demand side of the risk market.
- London insurance market (Lloyd's syndicates, Joint War Committee): the Joint War Committee Listed Areas determine surcharge geography. Re-listed Gulf Listed Areas in 2019 and has updated premium baselines repeatedly since.
- Iranian proxy network (Hezbollah, Kata'ib Hezbollah, Houthi): relevant only as potential second-order actors in a regional escalation scenario; their primary theatres are covered in Iran-USA and Red Sea dossiers.

1. ASSETS

- Strait of Hormuz: the physical asset. 21 miles at narrowest, ~21 million barrels per day of crude and condensate transit (~20% of global oil trade), plus ~30% of global seaborne LNG (Qatar). Weight: highest in the dossier.
- Kharg Oil Terminal: ~90% of Iranian crude exports flow through Kharg. Iranian-controlled, physically exposed, symbolically important. Not a target of Western action in current posture, but a latent tier-1 target in escalation scenarios.
- Gulf GNSS infrastructure: shared civilian/commercial GPS dependence, increasingly subject to Iranian spoofing campaigns in 2025-26. Spoofing redirects AIS positioning, creates navigational confusion, and introduces insurance ambiguity.
- Strait of Hormuz VTS (Vessel Traffic Separation Scheme): IMO-mandated, rigid, transited northbound in Omani waters and southbound in Iranian waters -- gives Iran physical proximity to every southbound transit without any violation of UNCLOS.
- UAE pipeline bypass (Fujairah): ~1.5M bpd capacity, runs crude around the strait. Partial insurance against full closure.
- Saudi East-West Pipeline (Petroline): 5M bpd capacity, Red Sea outlet at Yanbu. The single most important piece of chokepoint insurance for the global oil market.
- War-risk insurance premia (Gulf and Hormuz Listed Areas): not a physical asset but a financial transmission mechanism. Current premia at ~0.45% of hull value for laden transits (early 2026 baseline). Each material incident re-rates the curve.

1. HIGH-WEIGHT ARCS

- IRGC-Navy → Commercial shipping · coercive harassment · 0.87 · strongly neg · high vol · medium rev · conf 0.81. Defining arc.
- US Fifth Fleet → IRGC-Navy · deterrent presence · 0.74 · neg (confrontational but stabilising) · medium vol · medium rev · conf 0.80.
- GCC → Strait of Hormuz · protective-stabilising · 0.61 · pos · low vol · low rev · conf 0.77.
- IRGC-Navy → Gulf GNSS infrastructure · hybrid disruption · 0.52 · neg · medium vol · low rev · conf 0.64. New vector 2025-26.
- Iran (State) → IRGC-Navy · command-ambiguous · 0.58 · variable · medium vol · medium rev · conf 0.66. Central control calibrated but not absolute.
- London insurance market → Gulf shipping flows · transmission/pricing · 0.68 · systemic · medium vol · medium rev · conf 0.82. The arc that translates incidents into economic effect.
- UAE / KSA → Pipeline bypass capacity · structural redundancy · 0.48 · pos · low vol · low rev · conf 0.85.
- China → Iran · dormant-diplomatic · 0.34 · ambiguous · low vol · medium rev · conf 0.52.

1. EVENTS

- 1988: Operation Praying Mantis.
- Jun 2019: Limpet-mine attacks on tankers in Gulf of Oman.
- Jul 2019: Stena Impero seizure by IRGC-Navy.
- Sep 2019: Abqaiq-Khurais strikes.
- Mar 2023: Iran-Saudi Arabia diplomatic normalisation brokered by China.
- Apr 2024: IRGC seizure of MSC Aries near Strait of Hormuz.
- Apr 2024: Direct Iran-Israel missile/drone exchange.
- Jan 18, 2026: Limpet-mine incident on Liberian-flagged tanker -- resets baseline insurance premia to post-2019 levels.
- Feb 4-27, 2026: GNSS spoofing wave affects ~340 transits.
- Mar 2, 2026: GNSS spoofing wave concludes.
- Late 2025 onwards: Escalating frequency of Iranian fast-boat "close approach" incidents -- UKMTO incident log shows Q1 2026 at +87% vs Q4 2025.

1. SYSTEM SENSITIVITIES

- War-risk premium: reflexive relationship with incident frequency. Above ~1.0% of hull value laden, rerouting becomes economically rational for some operators even without physical closure.
- US carrier presence: withdrawal of 50% of carrier presence for 90 days would alter the deterrence arc weight by an estimated 0.3-0.4.
- Chinese diplomatic engagement with Tehran: currently dormant, but activation capable of redirecting Iranian priorities within weeks.
- GCC internal cohesion: Saudi-Emirati alignment vs Qatari-Omani hedging is the internal axis.
- Pipeline bypass operational status: any disruption to Saudi East-West Pipeline (cyber, Houthi strike, Red Sea spillover) would collapse the principal market-calming redundancy.
- Iranian presidential / supreme leader succession: long-tail variable.

1. KNOWN UNKNOWNS

- IRGC-Navy command autonomy level: confidence ~0.50.
- GNSS spoofing attribution: confidence on state-level authorisation ~0.64.
- Chinese willingness to activate Tehran diplomatic lever under what trigger.
- Precise insurance market thresholds for re-rating (London syndicates hold non-public risk models).
- UAE-Iran normalisation depth.

1. OUT OF SCOPE

- Iranian nuclear programme (covered in Iran-USA dossier).
- Iranian proxies outside Hormuz theatre (Hezbollah, Houthi, Iraqi militias -- covered in Iran-USA and Red Sea dossiers).
- Iran-Israel direct confrontation dynamics.
- Yemen / Red Sea theatre (separate dossier).
- Iranian domestic politics beyond strait-posture implications.
- US-Iran nuclear negotiation tracks.
- Iranian missile programme technical detail.

1. SOURCES

ECFR Policy Brief · "Iran's Maritime Strategy After the 2025 Escalation Cycle" · March 2026. Bruegel Working Paper · "Gulf Shipping Risk: A Quantitative Update" · March 2026. MERICS China Monitor · "GNSS Spoofing as Hybrid Pressure" · February 2026. ISPI Commentary · "The GCC Hedging Dilemma in a Multipolar Gulf" · February 2026. Chatham House · "Insurance Markets and Strait Risk" · January 2026. IISS · "Iranian Naval Forces Assessment" · December 2025.`,
graph_svg: `<defs><radialGradient id="glowTealIH" cx="50%" cy="50%"><stop offset="0%" stop-color="#0d7a6e" stop-opacity="0.22"/><stop offset="100%" stop-color="#0d7a6e" stop-opacity="0"/></radialGradient><radialGradient id="glowAmberIH" cx="50%" cy="50%"><stop offset="0%" stop-color="#a8570f" stop-opacity="0.22"/><stop offset="100%" stop-color="#a8570f" stop-opacity="0"/></radialGradient><radialGradient id="glowVioletIH" cx="50%" cy="50%"><stop offset="0%" stop-color="#5b21b6" stop-opacity="0.22"/><stop offset="100%" stop-color="#5b21b6" stop-opacity="0"/></radialGradient><marker id="arrowCoralIH" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#b8203a"/></marker><marker id="arrowSageIH" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#15803d"/></marker><marker id="arrowMutedIH" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#9e9b94"/></marker></defs><g stroke="#e8e4d6" stroke-width="0.5" opacity="0.7"><line x1="0" y1="90" x2="720" y2="90"/><line x1="0" y1="180" x2="720" y2="180"/><line x1="0" y1="270" x2="720" y2="270"/><line x1="180" y1="0" x2="180" y2="360"/><line x1="360" y1="0" x2="360" y2="360"/><line x1="540" y1="0" x2="540" y2="360"/></g><path d="M 160 110 Q 360 160 560 210" stroke="#b8203a" stroke-width="3.5" fill="none" marker-end="url(#arrowCoralIH)" opacity="0.85"/><path d="M 160 280 Q 120 190 155 115" stroke="#b8203a" stroke-width="2.5" fill="none" marker-end="url(#arrowCoralIH)" opacity="0.65"/><path d="M 360 60 Q 270 80 170 105" stroke="#9e9b94" stroke-width="1.5" fill="none" marker-end="url(#arrowMutedIH)" opacity="0.55"/><path d="M 580 90 Q 600 150 570 205" stroke="#15803d" stroke-width="2.5" fill="none" marker-end="url(#arrowSageIH)" opacity="0.7"/><path d="M 390 310 Q 475 260 560 215" stroke="#15803d" stroke-width="2" fill="none" marker-end="url(#arrowSageIH)" opacity="0.55"/><g class="graph-node"><circle cx="160" cy="110" r="26" fill="url(#glowTealIH)"/><circle cx="160" cy="110" r="13" fill="#ffffff" stroke="#0d7a6e" stroke-width="3"/><text class="graph-label" x="160" y="146" text-anchor="middle">IRGC-NAVY</text></g><g class="graph-node"><circle cx="360" cy="60" r="20" fill="url(#glowTealIH)"/><circle cx="360" cy="60" r="10" fill="#ffffff" stroke="#0d7a6e" stroke-width="2.5"/><text class="graph-label" x="360" y="38" text-anchor="middle">IRAN (STATE)</text></g><g class="graph-node"><circle cx="160" cy="280" r="20" fill="url(#glowTealIH)"/><circle cx="160" cy="280" r="10" fill="#ffffff" stroke="#0d7a6e" stroke-width="2.5"/><text class="graph-label" x="160" y="306" text-anchor="middle">US 5TH FLEET</text></g><g class="graph-node"><circle cx="580" cy="90" r="18" fill="url(#glowTealIH)"/><circle cx="580" cy="90" r="9" fill="#ffffff" stroke="#0d7a6e" stroke-width="2.5"/><text class="graph-label" x="580" y="68" text-anchor="middle">GCC</text></g><g class="graph-node"><circle cx="390" cy="315" r="17" fill="url(#glowTealIH)"/><circle cx="390" cy="315" r="8" fill="#ffffff" stroke="#0d7a6e" stroke-width="2.5"/><text class="graph-label" x="390" y="340" text-anchor="middle">UKMTO</text></g><g class="graph-node"><circle cx="560" cy="215" r="28" fill="url(#glowAmberIH)"/><rect x="548" y="203" width="24" height="24" rx="3" fill="#ffffff" stroke="#a8570f" stroke-width="3" transform="rotate(45 560 215)"/><text class="graph-label" x="560" y="252" text-anchor="middle" fill="#a8570f">HORMUZ</text></g><g class="graph-node"><circle cx="310" cy="200" r="16" fill="url(#glowVioletIH)"/><polygon points="310,190 320,204 300,204" fill="#ffffff" stroke="#5b21b6" stroke-width="2.5"/><text class="graph-label" x="310" y="228" text-anchor="middle" fill="#5b21b6">JAN 18</text></g>`
},

// =======================================================================
// 3. IRAN – USA
// =======================================================================
"iran-usa": {
  id: "iran-usa",
  title: "Iran · USA",
  cluster_id: "middle-east",
  lat: 32.0,
  lon: 53.0,
  description: "Rivalità strategica Iran-USA: nucleare, proxy network post-2024 (Hezbollah decapitato, Hamas dismantled, Houthi attivo), sanctions architecture, dinamiche regionali con Israele semi-autonomo e il crollo del regime Assad come turning point strutturale.",
  actors: ["United States", "Iran (Islamic Republic)", "Israel", "Hezbollah", "Houthi", "Hamas", "Iraqi militias", "Saudi Arabia", "Qatar", "China", "E3 (UK/FR/DE)"],
  stats: { entities: 20, relations: 38, events: 18, corpus: 268, sources: 8, last_update: "Apr 2026" },
  chat: [],
  current_report_id: 1,
  reports: {
    1: {
      id: 1,
      title: "<em>Weaker Proxies, Nearer Threshold</em>: The Iran–USA System in 2026",
      subtitle: "Nuclear hardening against proxy degradation; post-Assad logistics collapse; the structural asymmetry of a recalibrated rivalry.",
      timestamp: "Apr 20, 2026 · 11:15 UTC",
      executive_summary: "The Iran–USA system is in a <strong>managed-hostility configuration</strong>. The defining feature of 2025–26 is that <em>Iran's proxy network has been significantly degraded</em> (Hezbollah leadership decapitated, Hamas military structure devastated, Houthi under sustained pressure, Assad regime fallen) while <em>Iran's nuclear posture has hardened</em>. This combination -- weaker proxies, nearer nuclear threshold -- is inherently destabilising because it removes Iran's preferred forward deterrent layer while raising the stakes of its residual one.",
      body_html: '<h2 data-num="01">Four theatres, one system</h2><p>The US and Iran compete across four structurally distinct theatres simultaneously: a <strong>nuclear track</strong> centred on Iranian enrichment levels; a <strong>proxy architecture</strong> (Hezbollah, Houthi, Iraqi militias, Hamas) that acts as Iran\'s forward deterrent and simultaneously its escalation-control problem; a <strong>sanctions architecture</strong> designed to constrain Iranian oil revenue; and a <strong>regional influence competition</strong> across the Levant, Iraq, Yemen, and the Gulf.</p><p>Israel is an unavoidable third actor: US-Iran dynamics cannot be modelled without Israeli decision-making as a semi-autonomous force, especially after the transformed strategic geometry following October 2023.</p><h3>High-weight arcs</h3><ul class="report-list"><li><strong>Iran → nuclear breakout</strong> · latent-strategic, weight 0.84 -- reflects counterfactual importance to Iran\'s strategic calculus.</li><li><strong>Israel → Iran (direct and via proxies)</strong> · coercive-preventive, weight 0.78, high volatility -- most volatile arc after 2024 exchanges.</li><li><strong>Iran → proxy network</strong> · weight 0.72, <em>decreased vs 2023 baseline</em> due to proxy degradation.</li><li><strong>Post-Assad Syria → Iran (logistics)</strong> · disabling-structural, weight 0.51, <em>negative for Iran</em> -- the fall of Assad severed the land bridge.</li></ul><blockquote class="pullquote">Iran today holds a worse strategic hand than at any point since 2015 -- and a larger stockpile of highly-enriched uranium than at any point ever. The recalibration is not stability.<cite>Chatham House · March 2026</cite></blockquote><div class="data-callout"><div class="data-callout-cell"><div class="dc-label">Enrichment</div><div class="dc-value coral">60%+</div><div class="dc-hint">IAEA reported, 2025</div></div><div class="data-callout-cell"><div class="dc-label">Snapback</div><div class="dc-value">EXPIRED</div><div class="dc-hint">Oct 2025 · E3 lever lost</div></div><div class="data-callout-cell"><div class="dc-label">Confidence</div><div class="dc-value sage">0.76</div><div class="dc-hint">Corroborated ≥4 sources</div></div></div>',
      sources: [
        { num: "01", title: "Iran's Strategic Recalibration After 2024", meta: "Chatham House · Research", date: "2026-03-18" },
        { num: "02", title: "Iran Nuclear Programme Status", meta: "CFR · Backgrounder", date: "2026-03-05" },
        { num: "03", title: "The Middle East After Assad", meta: "ISPI · Commentary", date: "2026-02-22" },
        { num: "04", title: "Hezbollah Reconstitution Assessment", meta: "CSIS · Middle East", date: "2026-01-15" }
      ]
    }
  },
  intel: {
    confidence: { value: 0.76, label: "Moderate-high confidence", note: "Corroborated across ≥4 sources. Weakest: Iranian nuclear weaponisation timeline (0.48), Hezbollah reconstitution pace (0.52)." },
    top_arcs: [
      { from: "Iran", to: "Nuclear breakout", type: "latent-strategic", weight: 0.84, polarity: "neg-West", volatility: "L" },
      { from: "Israel", to: "Iran", type: "coercive-preventive", weight: 0.78, polarity: "neg", volatility: "H" },
      { from: "Iran", to: "Proxy network", type: "command/support", weight: 0.72, polarity: "variable", volatility: "M" },
      { from: "US", to: "Iran (sanctions)", type: "coercive-economic", weight: 0.68, polarity: "neg", volatility: "L" },
      { from: "Post-Assad Syria", to: "Iran", type: "disabling-structural", weight: 0.51, polarity: "neg-Iran", volatility: "L" }
    ],
    events: [
      { date: "2025-10-18", title: "JCPOA snapback mechanism expiry · E3 lever lost", active: true },
      { date: "2024-12-08", title: "Fall of Assad regime · Iran-Hezbollah land bridge severed" },
      { date: "2024-10-01", title: "Second direct Iran-Israel exchange" },
      { date: "2024-09-27", title: "Hassan Nasrallah eliminated in Beirut" },
      { date: "2024-07-31", title: "Ismail Haniyeh killed in Tehran" },
      { date: "2024-04-13", title: "First direct Iran-Israel exchange" },
      { date: "2023-10-07", title: "Hamas attack on Israel · system restructuring begins" }
    ]
  },
  brief_text: `IRAN-USA · Dossier Brief · As-Of April 2026

1. CURRENT SYSTEM STATE

The Iran-USA system is in a managed-hostility configuration: no functional diplomatic channel beyond Omani and Qatari indirect tracks, no formal JCPOA-successor framework, but also no overt state-on-state military action since the April 2024 Iran-Israel exchange. The two states compete across four structurally distinct theatres simultaneously: (i) a nuclear track centred on Iranian enrichment levels and Western ambiguity over breakout timeline; (ii) a proxy architecture (Hezbollah, Houthi, Kata'ib Hezbollah and other Iraqi militias, Hamas) which acts as Iran's forward deterrent and simultaneously as its escalation-control problem; (iii) a sanctions and financial architecture designed to constrain Iranian oil revenue and industrial capacity; (iv) a regional influence competition across the Levant, Iraq, Yemen, and increasingly the Gulf diplomatic space.

Israel is an unavoidable third actor in this system: US-Iran dynamics cannot be modelled without Israeli decision-making as a semi-autonomous force, especially after the transformed strategic geometry following October 2023.

The defining feature of the 2025-26 configuration is that Iran's proxy network has been significantly degraded (Hezbollah leadership decapitated in Lebanon campaign, Hamas military structure devastated, Houthi under sustained Coalition pressure) while Iran's nuclear posture has hardened (enrichment >60%, stockpile growth, threshold closer than at any point since 2015). This combination -- weaker proxies, nearer nuclear threshold -- is inherently destabilising because it removes Iran's preferred forward layer of deterrence while raising the stakes of its residual layer.

1. ACTORS

Primary state actors:

- United States: the dominant external actor. White House and Pentagon set posture; Congress constrains sanctions architecture and AUMF scope. Presidential administration posture toward Iran oscillates -- Trump administration 2025+ maximum pressure redux, but within a reshaped strategic environment post-Gaza. CENTCOM responsible for regional force posture (Fifth Fleet, air component in Gulf, persistent basing in Kuwait, Bahrain, UAE, Qatar, Iraq).
- Iran (Islamic Republic): multi-centre decision architecture -- Supreme Leader (Khamenei) as ultimate authority, IRGC as institutional anchor (especially Quds Force for external operations), elected presidency with limited foreign-policy autonomy, Supreme National Security Council as coordinating body. Key external-operations node: IRGC Quds Force -- Iran's interface with proxies, covert action, assassination, strategic deception.
- Israel: semi-autonomous US-aligned actor with independent decision capacity on Iranian nuclear and proxy threats. Post-October 2023, Israeli willingness to act unilaterally against Iranian interests (Hezbollah operations 2024, direct exchanges with Iran 2024) has raised above pre-2023 baseline. Israeli nuclear ambiguity unchanged.

Proxy architecture (Iran's forward layer):

- Hezbollah (Lebanon): historically Iran's most capable proxy, with estimated pre-2024 arsenal of 150,000+ rockets and missiles. Leadership structure severely disrupted in 2024 Israeli campaign (Nasrallah eliminated September 2024, much of senior council decapitated). Current status: diminished but not eliminated, with command reconstitution ongoing under reduced profile.
- Houthi (Ansar Allah, Yemen): covered in detail in Red Sea dossier. Relevant here as Iranian-aligned actor extending Iranian reach into Red Sea and southern Arabian Peninsula.
- Hamas (Gaza): military structure devastated through 2024 Israeli operation. Political leadership in Qatar/Turkey. No longer a near-term strategic threat; remains symbolic fulcrum of Israel-Palestine track.
- Kata'ib Hezbollah / Popular Mobilisation Forces factions (Iraq): harassment attacks against US forces in Iraq/Syria, periodic escalation around political triggers. Iran's main Iraqi lever.
- Islamic Jihad (Gaza): smaller than Hamas, more directly Iranian-aligned.
- Syrian regime fragments post-Assad: major structural change -- the fall of the Assad regime in late 2024 removed Iran's principal state-level Levant ally and disrupted the "land bridge" logistics to Hezbollah. This is arguably the largest geopolitical loss for the Iranian proxy network in a decade.

Secondary state actors:

- Saudi Arabia: post-March 2023 diplomatic normalisation with Iran, but remains US-aligned on deterrence. Hedges systematically. Yemen engagement (covered in Red Sea dossier).
- UAE: similar hedging, denser economic ties to Iran than Saudi Arabia.
- Qatar: primary diplomatic back-channel for US-Iran communication; hosts Hamas political leadership; maintains gas-export relationship with Iran (North Dome / South Pars shared field).
- Turkey: complex -- antagonistic on Syria (Kurdish issues, regime-change divergence), cooperative on anti-Kurdish ops, transactional on trade.
- Russia: tactical ally of Iran (Shahed drone supply inversion -- Iran→Russia), diplomatic cover. No structural alliance beyond current expediency.
- China: largest buyer of Iranian oil (notably through "teapot" small refineries), diplomatic cover at UN. Relatively passive in actual crisis management.
- European E3 (UK, France, Germany): residual JCPOA signatories; snapback mechanism expiry (October 2025) removed the principal European instrument for sanctions re-imposition. Diplomatic relevance now reduced.

1. ASSETS

Nuclear programme (Iran side):

- Natanz enrichment facility: main declared enrichment site, above-ground and underground halls. Multiple historical sabotage events (2020 explosion, 2021 explosion).
- Fordow enrichment facility: underground hardened facility buried under ~80m of rock. Primary site for advanced-centrifuge enrichment to high levels. The single most important nuclear asset -- hard to strike without deep-penetration weapons.
- Arak heavy-water reactor (IR-40): modified under JCPOA to limit plutonium production; status ambiguous post-JCPOA erosion.
- Isfahan / UCF: uranium conversion facility.
- Advanced centrifuges (IR-6, IR-9 prototypes): enable faster enrichment with smaller footprint.
- Stockpile of enriched uranium: reported (IAEA) at ~60% enrichment in significant quantities through 2025-26, well above JCPOA limits. Breakout timeline analytically estimated at weeks to small months for one weapon's worth of HEU; weaponisation timeline longer.

Strategic infrastructure (Iran side):

- Ballistic missile programme: Shahab, Sejjil, Khorramshahr, Fateh variants. Iran has the largest missile inventory in the Middle East.
- Drone programme: Shahed-136/131 series -- exported to Russia, operated by Houthi, used in April 2024 Iran-Israel exchange.
- Oil export infrastructure: Kharg terminal (principal), Bandar Abbas refinery, NIOC production architecture.

US presence assets:

- CENTCOM basing architecture: Al Udeid (Qatar, forward HQ), Al Dhafra (UAE), Naval Support Activity Bahrain (Fifth Fleet), Camp Arifjan (Kuwait), Ain al-Asad and others (Iraq), Al Tanf (Syria -- post-Assad status evolving).
- THAAD and Patriot deployments: mobile, positioned per assessed threat.
- Sanctions enforcement infrastructure: OFAC, Treasury, secondary sanctions architecture targeting Chinese, Turkish, UAE, and Hong Kong entities facilitating Iranian trade.

1. HIGH-WEIGHT ARCS

- Iran → proxy network (Hezbollah, Houthi, Iraqi militias) · command/support · 0.72 · variable polarity (neg for West) · medium vol · medium rev · conf 0.76. Weight has decreased vs 2023 baseline due to proxy degradation.
- Israel → Iran (direct and via proxies) · coercive-preventive · 0.78 · strongly neg · high vol · low rev · conf 0.81. Most volatile arc after the 2024 exchanges.
- US → Iran (sanctions) · coercive-economic · 0.68 · neg · low vol · medium rev · conf 0.83. Structural, not event-driven.
- US → Iran (military deterrence) · deterrent · 0.61 · neg · medium vol · medium rev · conf 0.75.
- Iran → nuclear breakout · latent-strategic · 0.84 · neg for West · low vol (currently) · low rev · conf 0.70. Arc weight reflects counterfactual importance to Iran's strategic calculus.
- Qatar / Oman → US-Iran communication · stabilising-diplomatic · 0.42 · pos · low vol · medium rev · conf 0.80.
- China → Iran (oil purchase) · sanctions-softening · 0.54 · neg for sanctions-regime · low vol · medium rev · conf 0.78.
- Russia → Iran (diplomatic/political) · enabling · 0.38 · neg for West · medium vol · medium rev · conf 0.69.
- Post-Assad Syria → Iran (logistics) · disabling-structural · 0.51 · negative for Iran · low vol · low rev · conf 0.77. The fall of Assad severed the land bridge.
- Iraqi militias → US forces · harassment · 0.35 · neg · high vol · medium rev · conf 0.71.

1. EVENTS

- 1979: Islamic Revolution -- system baseline.
- 1980-88: Iran-Iraq War.
- 2015: JCPOA signed.
- May 2018: US withdraws from JCPOA.
- Jan 2020: Soleimani strike; Iranian retaliation (Al-Asad base missile strike).
- 2019-21: Various sabotage events in Iran (Natanz, Karaj) attributed to Israeli operations.
- Oct 7, 2023: Hamas attack on Israel; trigger of the current Middle East geopolitical restructuring.
- Apr 2024: First direct Iran-Israel exchange.
- Jul 2024: Ismail Haniyeh (Hamas political leader) killed in Tehran -- major Iranian reputational blow.
- Sep 2024: Hassan Nasrallah (Hezbollah SG) eliminated in Beirut; Hezbollah senior leadership decapitated.
- Oct 2024: Second Iran-Israel direct exchange, larger salvo, Israeli retaliation targets Iranian air defence and missile production.
- Late 2024: Fall of the Assad regime in Syria. Iran-Hezbollah land bridge severed.
- Oct 2025: JCPOA snapback mechanism expiry -- E3 loses principal lever.
- 2025: IAEA reporting confirms sustained >60% enrichment at scale.
- 2025-26: Iraqi militia harassment of US forces continues at fluctuating tempo.

1. SYSTEM SENSITIVITIES

- Iranian nuclear decision: the system's dominant latent variable. A decision to cross the weaponisation threshold would reshape every other arc -- Israeli action near-certain, US action variable.
- Israeli strategic calculus toward Iran direct strike: 2024 exchanges demonstrated willingness; question is whether Natanz/Fordow targeting is on the table without US concurrence.
- Proxy reconstitution pace: Hezbollah rebuilding under reduced ceiling will take years, but direction of travel matters.
- Syrian succession and Iranian logistics reconstitution: any re-alignment of post-Assad Syria toward Iran (unlikely but not impossible) would restore a capability Iran currently lacks.
- Chinese enforcement posture on secondary sanctions: China's willingness to continue Iranian oil purchases under escalating US secondary sanctions is a standing variable.
- Regional diplomatic initiatives (Saudi-Iran normalisation depth): could marginally moderate Iranian behaviour on specific fronts; cannot change strategic calculus.

1. KNOWN UNKNOWNS

- Iranian nuclear weaponisation timeline (distinct from HEU breakout timeline): poorly constrained publicly.
- Depth of Iranian regime internal debate on nuclear threshold crossing.
- Hezbollah reconstitution pace and command structure post-Nasrallah.
- Extent of Iranian involvement in October 7, 2023 operational planning (political vs operational knowledge).
- Post-Assad Syria factional alignments affecting Iranian access.
- Secret US-Iran communications via Oman/Qatar -- content and progress.
- Israeli strike planning thresholds against Iranian nuclear sites.
- Internal Iranian succession dynamics (Supreme Leader health).

1. OUT OF SCOPE

- Strait of Hormuz chokepoint dynamics (separate dossier).
- Red Sea / Houthi anti-shipping campaign (separate dossier).
- Israel-Palestine track at the diplomatic/political level beyond its intersection with Iran.
- Intra-Iranian politics beyond foreign-policy-relevant factions.
- Detailed nuclear technical parameters (centrifuge cascade geometries, etc.).
- US domestic politics on Iran beyond administration posture.

1. SOURCES

Chatham House · "Iran's Strategic Recalibration After 2024" · March 2026. CFR Backgrounder · "Iran Nuclear Programme Status" · March 2026. ISPI Commentary · "The Middle East After Assad" · February 2026. Bruegel · "Sanctions Architecture Enforcement: China Transmission" · February 2026. ECFR · "European Diplomacy Post-Snapback" · January 2026. CSIS · "Hezbollah Reconstitution Assessment" · January 2026. IISS Military Balance · Iran chapter · February 2026. MERICS · "China-Iran Oil Trade Dynamics" · December 2025.`,
graph_svg: `<defs><radialGradient id="glowTealIU" cx="50%" cy="50%"><stop offset="0%" stop-color="#0d7a6e" stop-opacity="0.22"/><stop offset="100%" stop-color="#0d7a6e" stop-opacity="0"/></radialGradient><radialGradient id="glowAmberIU" cx="50%" cy="50%"><stop offset="0%" stop-color="#a8570f" stop-opacity="0.22"/><stop offset="100%" stop-color="#a8570f" stop-opacity="0"/></radialGradient><radialGradient id="glowVioletIU" cx="50%" cy="50%"><stop offset="0%" stop-color="#5b21b6" stop-opacity="0.22"/><stop offset="100%" stop-color="#5b21b6" stop-opacity="0"/></radialGradient><marker id="arrowCoralIU" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#b8203a"/></marker><marker id="arrowSageIU" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#15803d"/></marker><marker id="arrowMutedIU" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#9e9b94"/></marker></defs><g stroke="#e8e4d6" stroke-width="0.5" opacity="0.7"><line x1="0" y1="90" x2="720" y2="90"/><line x1="0" y1="180" x2="720" y2="180"/><line x1="0" y1="270" x2="720" y2="270"/><line x1="180" y1="0" x2="180" y2="360"/><line x1="360" y1="0" x2="360" y2="360"/><line x1="540" y1="0" x2="540" y2="360"/></g><path d="M 120 180 Q 280 180 430 180" stroke="#b8203a" stroke-width="3" fill="none" marker-end="url(#arrowCoralIU)" opacity="0.7"/><path d="M 430 180 Q 280 180 140 180" stroke="#b8203a" stroke-width="3" fill="none" marker-end="url(#arrowCoralIU)" opacity="0.7"/><path d="M 130 180 Q 130 260 310 295" stroke="#b8203a" stroke-width="2.8" fill="none" marker-end="url(#arrowCoralIU)" opacity="0.8"/><path d="M 290 310 Q 200 250 135 195" stroke="#b8203a" stroke-width="2.5" fill="none" marker-end="url(#arrowCoralIU)" opacity="0.65"/><path d="M 130 170 Q 260 120 400 70" stroke="#b8203a" stroke-width="2.8" fill="none" marker-end="url(#arrowCoralIU)" opacity="0.75"/><path d="M 575 75 Q 500 120 440 170" stroke="#15803d" stroke-width="2.5" fill="none" marker-end="url(#arrowSageIU)" opacity="0.65"/><path d="M 600 270 Q 500 240 440 195" stroke="#9e9b94" stroke-width="1.5" fill="none" marker-end="url(#arrowMutedIU)" opacity="0.5" stroke-dasharray="4,4"/><g class="graph-node"><circle cx="125" cy="180" r="26" fill="url(#glowTealIU)"/><circle cx="125" cy="180" r="13" fill="#ffffff" stroke="#0d7a6e" stroke-width="3"/><text class="graph-label" x="125" y="216" text-anchor="middle">IRAN</text></g><g class="graph-node"><circle cx="440" cy="180" r="26" fill="url(#glowTealIU)"/><circle cx="440" cy="180" r="13" fill="#ffffff" stroke="#0d7a6e" stroke-width="3"/><text class="graph-label" x="440" y="216" text-anchor="middle">USA</text></g><g class="graph-node"><circle cx="405" cy="60" r="22" fill="url(#glowTealIU)"/><circle cx="405" cy="60" r="11" fill="#ffffff" stroke="#0d7a6e" stroke-width="2.8"/><text class="graph-label" x="405" y="38" text-anchor="middle">ISRAEL</text></g><g class="graph-node"><circle cx="310" cy="310" r="20" fill="url(#glowTealIU)"/><circle cx="310" cy="310" r="10" fill="#ffffff" stroke="#0d7a6e" stroke-width="2.5"/><text class="graph-label" x="310" y="336" text-anchor="middle">HEZBOLLAH</text></g><g class="graph-node"><circle cx="580" cy="70" r="18" fill="url(#glowTealIU)"/><circle cx="580" cy="70" r="9" fill="#ffffff" stroke="#0d7a6e" stroke-width="2.5"/><text class="graph-label" x="580" y="48" text-anchor="middle">QATAR</text></g><g class="graph-node"><circle cx="610" cy="275" r="18" fill="url(#glowTealIU)"/><circle cx="610" cy="275" r="9" fill="#ffffff" stroke="#0d7a6e" stroke-width="2.5"/><text class="graph-label" x="610" y="300" text-anchor="middle">CHINA</text></g><g class="graph-node"><circle cx="90" cy="90" r="24" fill="url(#glowAmberIU)"/><rect x="78" y="78" width="24" height="24" rx="3" fill="#ffffff" stroke="#a8570f" stroke-width="3" transform="rotate(45 90 90)"/><text class="graph-label" x="90" y="126" text-anchor="middle" fill="#a8570f">NUCLEAR</text></g><g class="graph-node"><circle cx="280" cy="130" r="14" fill="url(#glowVioletIU)"/><polygon points="280,122 289,135 271,135" fill="#ffffff" stroke="#5b21b6" stroke-width="2.5"/><text class="graph-label" x="280" y="156" text-anchor="middle" fill="#5b21b6">OCT '25</text></g>`
},

// =======================================================================
// 4. TAIWAN STRAIT
// =======================================================================
"taiwan-strait": {
  id: "taiwan-strait",
  title: "Taiwan Strait",
  cluster_id: "east-asia",
  lat: 24.0,
  lon: 121.0,
  description: "Taiwan come asset strategico globale (semiconduttori avanzati) e come arco ad alta asimmetria con la Cina continentale. Grey-zone PLA normalizzata a ~28 incursioni ADIZ/giorno. Silicon shield come ancora strutturale del sistema. Dossier intersecato con AI US-China via TSMC.",
  actors: ["PRC (Beijing)", "PLA Eastern Theater", "ROC (Taiwan)", "US INDOPACOM", "Japan SDF", "Philippines", "Australia"],
  stats: { entities: 16, relations: 34, events: 14, corpus: 225, sources: 7, last_update: "Apr 2026" },
  chat: [],
  current_report_id: 1,
  reports: {
    1: {
      id: 1,
      title: "The <em>Silicon Shield</em>: Taiwan's Strategic Leverage in 2026",
      subtitle: "PLA grey-zone escalation, semiconductor supply chain, and the deterrence by denial posture.",
      timestamp: "Apr 20, 2026 · 10:22 UTC",
      executive_summary: "The Taiwan Strait has settled into a <strong>high-pressure equilibrium</strong>, with PLA daily ADIZ incursions now averaging 28/day -- a new normal that has desensitised diplomatic reaction. The structural anchor remains <strong>TSMC</strong>: no credible scenario analysis produces a PLA action that bypasses the semiconductor disruption cost, which is now priced into both Washington's and Beijing's calculations.",
      body_html: '<h2 data-num="01">The actors in the strait</h2><p>Six actors dominate. The <span class="chip actor">● PRC (Beijing)</span> and <span class="chip actor">● PLA Eastern Theater</span> operate in near-coordination but with the latter enjoying tactical autonomy for grey-zone activity. The <span class="chip actor">● ROC (Taipei)</span> has shifted posture post-2024 elections toward harder deterrence. The <span class="chip actor">● US INDOPACOM</span> maintains visibility without direct engagement.</p><p>Two second-order actors matter: <span class="chip actor">● Japan (SDF)</span> is increasingly overt in Taiwan contingency planning, and the <span class="chip actor">● Philippines</span> has transitioned from hedger to aligned partner via EDCA expansion.</p><h2 data-num="02">The silicon shield</h2><p>The singular structural asset is <span class="chip asset">◆ TSMC</span>, whose Hsinchu and Tainan fabs produce >60% of global advanced-node capacity. No other node in the entire CHESS KG has higher outgoing impact weight.</p><blockquote class="pullquote">If TSMC goes offline, the world\'s AI infrastructure stops within a fiscal quarter. Beijing knows this. Washington knows this. Taipei has built its entire deterrence doctrine on this.<cite>CSIS · Asia Program · February 2026</cite></blockquote><div class="data-callout"><div class="data-callout-cell"><div class="dc-label">ADIZ incursions</div><div class="dc-value coral">28/day</div><div class="dc-hint">Q1 2026 avg</div></div><div class="data-callout-cell"><div class="dc-label">TSMC impact weight</div><div class="dc-value">0.91</div><div class="dc-hint">highest in KG</div></div><div class="data-callout-cell"><div class="dc-label">Confidence</div><div class="dc-value sage">0.79</div><div class="dc-hint">Corroborated ≥4 sources</div></div></div>',
      sources: [
        { num: "01", title: "Taiwan's Deterrence by Denial: An Updated Assessment", meta: "CSIS · Asia Program", date: "2026-03-18" },
        { num: "02", title: "PLA Grey-Zone Operations: Patterns and Thresholds", meta: "MERICS · Security Brief", date: "2026-03-02" },
        { num: "03", title: "The Silicon Shield Reconsidered", meta: "CFR · Backgrounder", date: "2026-02-21" },
        { num: "04", title: "Japan-Taiwan Security Cooperation in 2026", meta: "ISPI · Commentary", date: "2026-02-10" },
        { num: "05", title: "Subsea Infrastructure Vulnerability", meta: "Bruegel · Working Paper", date: "2026-01-28" }
      ]
    }
  },
  intel: {
    confidence: { value: 0.79, label: "High confidence", note: "Corroborated across ≥4 sources. Weakest: PLA internal decision-making (0.48), Japan SDF doctrinal shift (0.62)." },
    top_arcs: [
      { from: "TSMC", to: "Global supply chain", type: "systemic", weight: 0.91, polarity: "pos", volatility: "M" },
      { from: "PLA", to: "ROC airspace", type: "coercive", weight: 0.83, polarity: "neg", volatility: "H" },
      { from: "US INDOPACOM", to: "PRC", type: "deterrent", weight: 0.71, polarity: "neg", volatility: "M" },
      { from: "Japan SDF", to: "Taiwan contingency", type: "enabling-deterrent", weight: 0.62, polarity: "pos", volatility: "M" },
      { from: "Philippines (EDCA)", to: "Taiwan contingency", type: "enabling", weight: 0.51, polarity: "pos", volatility: "L" }
    ],
    events: [
      { date: "2026-03-15", title: "PLA combined exercise · 54 aircraft, 9 vessels", active: true },
      { date: "2026-02-28", title: "Matsu subsea cable cut (3rd incident this quarter)" },
      { date: "2026-01-11", title: "Taiwan legislative elections · DPP retains executive" },
      { date: "2025-12-09", title: "Largest post-2022 combined exercise around Taiwan" },
      { date: "2025-10-15", title: "Japan-US 2+2 includes Taiwan contingency language" }
    ]
  },
  brief_text: `TAIWAN STRAIT · Dossier Brief · As-Of April 2026

1. CURRENT SYSTEM STATE

The Taiwan Strait system is in a high-pressure equilibrium configuration. PLA daily ADIZ incursions average ~28 per day (Q1 2026 baseline), a normalised baseline that has desensitised diplomatic reaction without reducing underlying tension. The structural anchor of the system is TSMC, whose advanced-node foundry capacity (>60% of global <7nm production) creates a silicon shield rationale -- no credible scenario analysis produces a PLA action that bypasses semiconductor disruption cost. This cost is priced into both Washington's and Beijing's calculations, which is why the strait remains in sustained pressure without converting to kinetic confrontation.

The 2024 Taiwan election (DPP retained presidency but lost legislative majority to KMT/TPP alliance) introduced a new institutional variable -- domestic political fragmentation that Beijing interprets as exploitable. The 2025-26 configuration shows Chinese grey-zone pressure intensifying at sub-kinetic levels (ADIZ, subsea cable incidents, economic coercion) while avoiding kinetic triggers that would crystallise US/Japanese response.

1. ACTORS

Primary state actors:

- People's Republic of China (PRC, Beijing): strategic direction from Central Military Commission (Xi chairmanship), operationalised through PLA. Posture is coercive without kinetic trigger -- testing the envelope of grey-zone pressure.
- PLA Eastern Theater Command (PLA East): operational command for Taiwan-directed activity. Controls naval, air, rocket, and cyber components in the theatre. Enjoys tactical autonomy for grey-zone activity within standing ROE; strategic-level decisions referred upward.
- Republic of China (ROC, Taipei): defence under presidential command via Ministry of National Defense. Post-2024 election: DPP executive (Lai administration) vs KMT/TPP legislature. Defence doctrine shifted post-2022 toward asymmetric "porcupine" posture, with increased reserve training, drone acquisition, and stockpiling.
- United States: INDOPACOM as theatre command, 7th Fleet as principal naval force. Strategic ambiguity on Taiwan defence commitment formally maintained, but deterrence signalling has hardened since 2022. Biden-era public statements implying commitment, Trump administration 2025+ posture more transactional.
- Japan: Self-Defense Forces increasingly oriented toward Taiwan contingency planning. 2+2 statements 2022-2025 progressively explicit. Southwest islands (Okinawa, Sakishima) positioned as forward logistics/basing.
- Philippines: post-2022 pivot under Marcos -- EDCA sites expanded to nine, including northern Luzon locations directly relevant to Taiwan contingency. From hedger to aligned partner.
- Australia: AUKUS framework (submarine acquisition), Pine Gap signals infrastructure, rotational US Marine presence (Darwin).
- South Korea: limited direct Taiwan role but aligned via US alliance; semiconductor second-source (Samsung, SK Hynix) adds supply-chain dimension.

Secondary state actors:

- North Korea: diversionary variable -- Korean Peninsula crisis could compound Taiwan crisis and vice versa.
- Vietnam, Indonesia, Malaysia: South China Sea competition theatre; indirect relevance.

Non-state / corporate actors with systemic weight:

- Taiwan Semiconductor Manufacturing Company (TSMC): the dossier's central node. Hsinchu (main fab cluster), Tainan (next-generation), and overseas expansion (Arizona fabs 1 & 2, Kumamoto Japan, Dresden Germany). Customer concentration among global tech (Apple, Nvidia, AMD, Qualcomm) creates downstream dependency. Highest outgoing impact weight in the entire CHESS KG.
- Hon Hai / Foxconn: largest Taiwanese electronics manufacturer, major China-mainland footprint -- a hostage variable in Chinese economic coercion calculus.
- United Microelectronics Corporation (UMC), MediaTek: secondary Taiwanese semiconductor players.

1. ASSETS

- TSMC Hsinchu and Tainan fabrication clusters: physical location of advanced-node production. Not physically hardened against military action. Partial redundancy via overseas fabs, but leading-edge nodes remain Taiwan-concentrated through at least 2027.
- Taiwan Strait itself: 100 miles at narrowest, rough seas outside May-to-September weather window -- climatological constraint on amphibious operation planning.
- Penghu (Pescadores) islands: forward defence line.
- Kinmen and Matsu islands: Taiwan-administered but adjacent to mainland; frequently the locus of grey-zone pressure (fishing vessel incidents, subsea cable cuts, balloon incursions).
- Subsea cable infrastructure (Matsu, Taiwan-Japan, Taiwan-Philippines): systemic vulnerability -- ≥3 incidents in Q1 2026 alone, pattern consistent with Russian Baltic methodology.
- US 7th Fleet presence (Yokosuka-based, forward-deployed): the principal military stabiliser.
- Japanese SDF bases on Southwest islands: Yonaguni (75 miles from Taiwan), Miyako, Ishigaki -- ground-based anti-ship missile deployments expanded 2023-25.
- Luzon Strait: chokepoint between Taiwan and Philippines, PLA transit route and US monitoring zone.
- Rare earth supply chain: China controls ~70% of global rare earth refining capacity -- a coercion asset against Taiwan supply chain (and Japan, Korea, global tech).

1. HIGH-WEIGHT ARCS

- TSMC → Global advanced-tech supply chain · systemic-dependency · 0.91 · pos (stabilising) · medium vol · medium rev · conf 0.87. Highest-weight single arc in the entire KG.
- PLA East → ROC airspace / waters · coercive grey-zone · 0.83 · strongly neg · high vol · low rev · conf 0.84. Daily tempo.
- US INDOPACOM → PRC · deterrent · 0.71 · neg · medium vol · medium rev · conf 0.78.
- Japan SDF → Taiwan contingency · enabling-deterrent · 0.62 · pos (for Taiwan) · medium vol · medium rev · conf 0.71.
- Philippines (EDCA) → Taiwan contingency enablement · enabling · 0.51 · pos · low vol · low rev · conf 0.80.
- PRC → Taiwan (economic coercion) · coercive-economic · 0.58 · neg · medium vol · medium rev · conf 0.75. Agricultural import bans, tourism squeeze, supply chain pressure.
- PRC → subsea cable infrastructure · hybrid attrition · 0.39 · neg · medium vol · low rev · conf 0.61.
- TSMC → Arizona/Kumamoto/Dresden (geographic diversification) · resilience-building · 0.47 · pos · low vol · low rev · conf 0.82.
- PRC-controlled rare earth → Taiwan/Japan/Korea tech · coercion-latent · 0.44 · neg · low vol · low rev · conf 0.76.
- US → Taiwan (arms sales) · enabling-deterrent · 0.56 · pos · low vol · low rev · conf 0.83.

1. EVENTS

- 1949: ROC retreat to Taiwan.
- 1979: US-PRC diplomatic normalisation; Taiwan Relations Act.
- 1995-96: Third Taiwan Strait Crisis (missile tests, US carrier response).
- 2016: Tsai Ing-wen (DPP) elected -- PRC suspends cross-strait dialogue.
- Aug 2022: Pelosi visit to Taipei; unprecedented PLA live-fire exercises encircling Taiwan.
- Jan 2024: Taiwan presidential election -- DPP retains executive, loses legislative majority.
- May 2024: Joint Sword 2024-A exercise -- punitive response to Lai inauguration.
- Oct 2024: Joint Sword 2024-B -- largest exercise in the period.
- 2022-25: Philippines EDCA expansion from 5 to 9 sites.
- 2023-25: Multiple Matsu subsea cable cuts, attribution to PRC vessels.
- Oct 2025: Japan-US 2+2 includes explicit Taiwan contingency language.
- Dec 2025: Large combined exercise around Taiwan -- 54 aircraft, 9 vessels in single-day peak.
- Feb 2026: Matsu subsea cable cut (3rd incident in the quarter).
- Mar 2026: Latest combined exercise -- 54 aircraft, 9 vessels in single-day peak.

1. SYSTEM SENSITIVITIES

- Japanese formal inclusion in Taiwan defence doctrine: 2+2 language has moved toward explicit -- any treaty-level formalisation would restructure PRC calculus.
- TSMC technical disruption independent of PLA action: fab accident, power grid failure, earthquake. Systemic consequences would unfold even in the absence of PLA trigger.
- Taiwan domestic political cohesion: executive-legislative split creates exploitable ambiguity on defence budgeting.
- US administration continuity on Taiwan posture: high variance across US political scenarios; post-2028 baseline uncertain.
- Philippine political continuity (Marcos post-2028): EDCA expansion partly personal to current administration.
- Chinese economic trajectory: prolonged slowdown could push Beijing toward either more cautious external posture (preservation logic) or more assertive (distraction logic).
- Semiconductor technology transition: if leading-edge production geography diversifies meaningfully by 2028-30, the silicon shield weakens.

1. KNOWN UNKNOWNS

- PLA internal decision-making on Taiwan action threshold: confidence ~0.48. Xi's personal threshold is particularly opaque.
- Chinese readiness timeline for credible amphibious operation at scale: publicly contested; estimates range 2027 to 2035.
- Japan SDF doctrinal shift operational depth: rhetoric vs actual operational planning.
- Taiwan reserve force combat effectiveness under mobilisation scenarios.
- US decision-making under various presidential administrations.
- TSMC contingency plans and "scorched earth" protocols (public discussion exists but operational depth unclear).
- Subsea cable incidents -- deliberate state-level direction vs opportunistic vessel behaviour.

1. OUT OF SCOPE

- Detailed tactical PLA force composition (orders of battle).
- Taiwan domestic politics beyond cross-strait relevant factions.
- Full South China Sea dossier (Spratly, Paracel, Scarborough dynamics).
- North Korean nuclear programme specifics.
- Technical semiconductor industry detail beyond systemic weight.
- US-China broader trade relationship (separate dossier).

1. SOURCES

CSIS Asia Program · "Taiwan's Deterrence by Denial: An Updated Assessment" · March 2026. MERICS Security Brief · "PLA Grey-Zone Operations: Patterns and Thresholds" · March 2026. CFR Backgrounder · "The Silicon Shield Reconsidered" · February 2026. ISPI Commentary · "Japan-Taiwan Security Cooperation in 2026" · February 2026. Bruegel · "Subsea Infrastructure Vulnerability in the Western Pacific" · January 2026. Chatham House · "Cross-Strait Political Dynamics Post-2024 Election" · December 2025. IISS · "PLA Navy Amphibious Capability Assessment" · November 2025.`,
graph_svg: `<defs><radialGradient id="glowTealTW" cx="50%" cy="50%"><stop offset="0%" stop-color="#0d7a6e" stop-opacity="0.22"/><stop offset="100%" stop-color="#0d7a6e" stop-opacity="0"/></radialGradient><radialGradient id="glowAmberTW" cx="50%" cy="50%"><stop offset="0%" stop-color="#a8570f" stop-opacity="0.22"/><stop offset="100%" stop-color="#a8570f" stop-opacity="0"/></radialGradient><radialGradient id="glowVioletTW" cx="50%" cy="50%"><stop offset="0%" stop-color="#5b21b6" stop-opacity="0.22"/><stop offset="100%" stop-color="#5b21b6" stop-opacity="0"/></radialGradient><marker id="arrowCoralTW" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#b8203a"/></marker><marker id="arrowSageTW" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#15803d"/></marker><marker id="arrowMutedTW" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#9e9b94"/></marker></defs><g stroke="#e8e4d6" stroke-width="0.5" opacity="0.7"><line x1="0" y1="90" x2="720" y2="90"/><line x1="0" y1="180" x2="720" y2="180"/><line x1="0" y1="270" x2="720" y2="270"/><line x1="180" y1="0" x2="180" y2="360"/><line x1="360" y1="0" x2="360" y2="360"/><line x1="540" y1="0" x2="540" y2="360"/></g><path d="M 150 80 Q 300 180 440 180" stroke="#b8203a" stroke-width="3.2" fill="none" marker-end="url(#arrowCoralTW)" opacity="0.85"/><path d="M 600 280 Q 400 200 170 120" stroke="#b8203a" stroke-width="2.3" fill="none" marker-end="url(#arrowCoralTW)" opacity="0.6"/><path d="M 440 200 Q 560 160 680 100" stroke="#15803d" stroke-width="3.5" fill="none" marker-end="url(#arrowSageTW)" opacity="0.8"/><path d="M 540 80 Q 490 130 445 175" stroke="#15803d" stroke-width="2" fill="none" marker-end="url(#arrowSageTW)" opacity="0.6"/><path d="M 520 320 Q 570 300 598 288" stroke="#9e9b94" stroke-width="1.4" fill="none" marker-end="url(#arrowMutedTW)" opacity="0.5"/><g class="graph-node"><circle cx="90" cy="55" r="20" fill="url(#glowTealTW)"/><circle cx="90" cy="55" r="10" fill="#ffffff" stroke="#0d7a6e" stroke-width="2.5"/><text class="graph-label" x="90" y="33" text-anchor="middle">PRC</text></g><g class="graph-node"><circle cx="150" cy="80" r="22" fill="url(#glowTealTW)"/><circle cx="150" cy="80" r="11" fill="#ffffff" stroke="#0d7a6e" stroke-width="2.8"/><text class="graph-label" x="150" y="112" text-anchor="middle">PLA EAST</text></g><g class="graph-node"><circle cx="445" cy="180" r="20" fill="url(#glowTealTW)"/><circle cx="445" cy="180" r="10" fill="#ffffff" stroke="#0d7a6e" stroke-width="2.5"/><text class="graph-label" x="445" y="158" text-anchor="middle">ROC</text></g><g class="graph-node"><circle cx="600" cy="285" r="20" fill="url(#glowTealTW)"/><circle cx="600" cy="285" r="10" fill="#ffffff" stroke="#0d7a6e" stroke-width="2.5"/><text class="graph-label" x="600" y="312" text-anchor="middle">INDOPACOM</text></g><g class="graph-node"><circle cx="540" cy="75" r="18" fill="url(#glowTealTW)"/><circle cx="540" cy="75" r="9" fill="#ffffff" stroke="#0d7a6e" stroke-width="2.5"/><text class="graph-label" x="540" y="53" text-anchor="middle">JAPAN SDF</text></g><g class="graph-node"><circle cx="510" cy="325" r="14" fill="url(#glowTealTW)"/><circle cx="510" cy="325" r="7" fill="#ffffff" stroke="#0d7a6e" stroke-width="2"/><text class="graph-label" x="510" y="348" text-anchor="middle">PHIL</text></g><g class="graph-node"><circle cx="680" cy="100" r="30" fill="url(#glowAmberTW)"/><rect x="666" y="86" width="28" height="28" rx="3" fill="#ffffff" stroke="#a8570f" stroke-width="3" transform="rotate(45 680 100)"/><text class="graph-label" x="680" y="142" text-anchor="middle" fill="#a8570f">TSMC</text></g>`
},

// =======================================================================
// 5. AI US – CHINA
// =======================================================================
"ai-us-china": {
  id: "ai-us-china",
  title: "AI · US-China",
  cluster_id: null,
  lat: 0,
  lon: 0,
  description: "Rivalità tecnologica US-Cina nell'AI: structured-decoupling su compute, lithography, memoria e talent. DeepSeek R1 come inflection point 2025 sulla teoria compute-centrica. Dossier trans-geografico, intersecato con Taiwan via TSMC.",
  actors: ["United States (BIS)", "China (MIIT)", "Nvidia", "ASML", "TSMC", "Samsung / SK Hynix", "Huawei", "SMIC", "DeepSeek / Chinese labs"],
  stats: { entities: 22, relations: 36, events: 15, corpus: 198, sources: 7, last_update: "Apr 2026" },
  chat: [],
  current_report_id: 1,
  reports: {
    1: {
      id: 1,
      title: "<em>Structured Decoupling</em>: The US–China AI System After DeepSeek",
      subtitle: "Export controls, compute geography, open-weight diffusion, and the erosion of the compute-centric theory.",
      timestamp: "Apr 20, 2026 · 09:30 UTC",
      executive_summary: "The AI US–China rivalry is in a <strong>structured-decoupling configuration</strong>. The defining 2025–26 feature is that <em>Chinese frontier model performance has closed substantially</em> vs US frontier -- DeepSeek R1 (January 2025) was the inflection point, demonstrating comparable reasoning performance at order-of-magnitude lower training cost. This has triggered a reconsideration of the compute-centric theory of AI dominance without resolving the policy response.",
      body_html: '<h2 data-num="01">Two ecosystems, one broken theory</h2><p>Unlike kinetic theatres, this dossier is dominated by <strong>policy moves</strong> -- export controls, investment screening, subsidy regimes -- rather than events. But the aggregate trajectory has escalatory path-dependence: each control tightening triggers Chinese indigenisation investment, which partially closes the capability gap asymmetrically (hardware gap persists, model sophistication gap narrowing).</p><p>The <span class="chip actor">● United States (BIS)</span> sets the export control architecture; <span class="chip actor">● China (MIIT)</span> coordinates indigenisation under <em>ziligengsheng</em> (self-sufficiency) doctrine. Corporate nodes dominate the operational layer: <span class="chip actor">● Nvidia</span>, <span class="chip actor">● ASML</span>, <span class="chip actor">● TSMC</span> on one side; <span class="chip actor">● Huawei</span>, <span class="chip actor">● SMIC</span>, <span class="chip actor">● DeepSeek</span> and other Chinese labs on the other.</p><h3>High-weight arcs</h3><ul class="report-list"><li><strong>US BIS → China (export controls)</strong> · coercive-technological, weight 0.82, low reversibility. Defining arc.</li><li><strong>China → domestic semiconductor buildout</strong> · enabling-industrial, weight 0.71.</li><li><strong>China → rare earths / critical minerals (export restrictions)</strong> · counter-coercive, weight 0.54.</li><li><strong>DeepSeek / Chinese open-weight releases → Global model ecosystem</strong> · capability-diffusion, weight 0.48.</li></ul><blockquote class="pullquote">The compute-centric theory of AI dominance did not survive 2025. What replaces it is not yet clear, but any policy built on the assumption that compute controls alone can hold the frontier is already obsolete.<cite>CSIS · Technology Policy · March 2026</cite></blockquote><div class="data-callout"><div class="data-callout-cell"><div class="dc-label">SMIC</div><div class="dc-value coral">7nm</div><div class="dc-hint">without EUV, 2023</div></div><div class="data-callout-cell"><div class="dc-label">Nvidia China rev</div><div class="dc-value">~13%</div><div class="dc-hint">from ~25% pre-controls</div></div><div class="data-callout-cell"><div class="dc-label">Confidence</div><div class="dc-value sage">0.81</div><div class="dc-hint">Corroborated ≥5 sources</div></div></div>',
      sources: [
        { num: "01", title: "Export Controls Two Years After October 2022", meta: "CSIS · Technology Policy", date: "2026-03-19" },
        { num: "02", title: "The Decoupling That Isn't: EU, US, China Technology Interdependence", meta: "Bruegel · Working Paper", date: "2026-03-05" },
        { num: "03", title: "China's Semiconductor Indigenisation", meta: "MERICS · China Monitor", date: "2026-02-22" },
        { num: "04", title: "The Silicon Curtain", meta: "CFR · Analysis", date: "2026-02-14" },
        { num: "05", title: "Open-Weight Models and US-China AI Competition", meta: "Chatham House · Research", date: "2026-01-28" }
      ]
    }
  },
  intel: {
    confidence: { value: 0.81, label: "High confidence", note: "Corroborated across ≥5 sources. Weakest: SMIC yield rates at advanced nodes (0.45), DeepSeek training cost attribution (0.58)." },
    top_arcs: [
      { from: "US BIS", to: "China (chip exports)", type: "coercive-technological", weight: 0.82, polarity: "neg-China", volatility: "M" },
      { from: "China", to: "Domestic semi buildout", type: "enabling-industrial", weight: 0.71, polarity: "pos-China", volatility: "L" },
      { from: "US/allies", to: "TSMC geo-diversification", type: "resilience-building", weight: 0.58, polarity: "pos", volatility: "L" },
      { from: "China", to: "Rare earths exports", type: "counter-coercive", weight: 0.54, polarity: "neg-West", volatility: "L" },
      { from: "DeepSeek / open-weight", to: "Global ecosystem", type: "capability-diffusion", weight: 0.48, polarity: "pos-China-rep", volatility: "M" }
    ],
    events: [
      { date: "2025-01-20", title: "DeepSeek R1 release · compute-centric theory challenged", active: true },
      { date: "2024-11-15", title: "Outbound investment rule published (effective Jan 2025)" },
      { date: "2024-03-29", title: "Third major BIS export control update" },
      { date: "2023-10-17", title: "Second BIS wave · H800/A800 restrictions" },
      { date: "2023-08-29", title: "Huawei Mate 60 Pro · SMIC 7nm surprise" },
      { date: "2022-10-07", title: "First comprehensive BIS China AI export controls" }
    ]
  },
  brief_text: `AI US-CHINA · Dossier Brief · As-Of April 2026

1. CURRENT SYSTEM STATE

The AI US-China rivalry is in a structured-decoupling configuration: the two leading-edge AI ecosystems are actively separating across compute supply chains, model development, scientific collaboration, and standards-setting, while remaining partially interdependent on manufacturing (lithography, advanced packaging) and rare-materials flows. Unlike kinetic theatres, this dossier is dominated by policy moves (export controls, investment screening, subsidy regimes) rather than events -- but the aggregate trajectory has escalatory path-dependence: each control tightening triggers Chinese indigenisation investment, which partially closes the capability gap asymmetrically (hardware gap persists, model sophistication gap narrowing).

The defining 2025-26 feature is that Chinese frontier model performance has closed substantially vs US frontier (DeepSeek R1 January 2025 was the inflection point -- comparable reasoning performance at order-of-magnitude lower training cost, using non-frontier-restricted chips). This has triggered a reconsideration of the compute-centric theory of AI dominance that underpinned the 2022-24 export control architecture, without resolving the policy response.

1. ACTORS

Primary state actors:

- United States: executive (White House AI policy, OSTP), legislative (bipartisan AI concern), Commerce (BIS -- export controls architecture), Defense (procurement, DARPA research). Trump administration 2025+ posture: preserve export control regime, tighten investment screening, push domestic buildout via CHIPS-era subsidies.
- China (PRC): State Council (Li Qiang premiership for economic planning), Ministry of Industry and Information Technology (MIIT, sectoral policy), Cyberspace Administration of China (content governance, model deployment approval), National Development and Reform Commission (subsidy channels). Key institutional direction: self-sufficiency (ziligengsheng) as strategic priority.

Corporate actors -- US-aligned:

- Nvidia: dominant supplier of AI accelerators globally. Subject to successive export control waves (A100/H100 banned Oct 2022, H800/A800 "China-specific" variants banned Oct 2023, further restrictions 2024-25). Revenue from China declined from ~25% pre-controls to low teens. Continues to design maximally-permitted China-specific products.
- OpenAI, Anthropic, Google DeepMind, Meta AI, xAI: frontier model labs. Training compute in US/allied data centres.
- ASML (Netherlands): monopoly supplier of EUV lithography; key operator of US-led export control regime through Dutch government alignment. DUV export restrictions extended 2023-24 under US pressure.
- TSMC: foundry for most US frontier AI chip designs. Geographic concentration in Taiwan is itself the Taiwan dossier's core variable.
- Samsung, SK Hynix: memory (HBM) critical for AI training; Korean government caught between US alliance and China market.
- Applied Materials, Lam Research, KLA: US semiconductor capital equipment makers -- subject to outbound investment restrictions and export controls to China.

Corporate actors -- China-aligned:

- Huawei: returned to frontier-adjacent competition via Ascend AI chip series (910B, 910C) manufactured by SMIC using 7nm-class processes. Gap narrowed but remains 1-2 generations behind Nvidia leading edge.
- SMIC (Semiconductor Manufacturing International Corporation): China's leading foundry, reached 7nm without EUV (Huawei Kirin 9000S, 2023) -- an achievement widely assessed as imperfectly replicable at scale. Working on further node reduction under sanctions constraints.
- DeepSeek, Zhipu AI, Moonshot, Baichuan, 01.AI, Alibaba Cloud (Qwen), ByteDance (Doubao), Tencent (Hunyuan): Chinese frontier model developers. DeepSeek R1 (January 2025) demonstrated that training efficiency innovations could partially compensate for compute-per-dollar disadvantages.
- CXMT, YMTC: Chinese memory producers, still lag Samsung/SK Hynix but advancing.
- Cambricon, Biren, Moore Threads, Iluvatar CoreX: Chinese GPU/AI-accelerator alternatives.

1. ASSETS

- Advanced logic foundry capacity (≤7nm): TSMC Taiwan (dominant), Samsung Korea (secondary), Intel US (recovering), SMIC China (constrained). Physical geography is a strategic variable.
- EUV lithography: ASML monopoly; single-vendor supply chain for leading-edge nodes below 5nm. China lacks EUV access under export controls.
- DUV lithography (mature and advanced): ASML, Nikon, Canon. Restricted to China on advanced DUV (TWINSCAN NXT:2000i and successors) since 2023.
- High-bandwidth memory (HBM) -- HBM3, HBM3E, HBM4: critical for AI accelerator performance. Samsung, SK Hynix, Micron. Export-restricted in various configurations to China.
- AI training compute clusters (hyperscaler-scale): Microsoft, Google, Amazon, Meta, xAI, Oracle, CoreWeave in US. Chinese equivalents at smaller but growing scale.
- Frontier model weights: OpenAI o-series, Claude 4 series, Gemini 2 series, Llama 4, xAI Grok 3-4, DeepSeek V/R series, Qwen 3 series, etc. Open-weight vs closed-weight distinction has become a US-China asymmetric variable (Chinese ecosystem leans open-weight, US mixed).
- Talent flows: ethnic-Chinese researchers in US AI labs remain significant; reverse migration pressures increasing under visa/security scrutiny.
- Scientific publication and collaboration networks: once robustly integrated, increasingly bifurcating.
- AI-specific energy infrastructure: hyperscale data centre power sourcing has become a strategic variable in both countries.
- Rare earths and critical minerals: Chinese processing dominance (~70% of rare earth refining, higher for heavy rare earths and specific critical minerals like gallium and germanium -- the latter two subject to Chinese export restrictions since 2023).

1. HIGH-WEIGHT ARCS

- US BIS → China (export controls on advanced chips / tools) · coercive-technological · 0.82 · strongly neg (for China) · medium vol (periodic tightening) · low rev · conf 0.86. Defining arc.
- China (state) → domestic semiconductor buildout · enabling-industrial · 0.71 · pos (for China) · low vol · low rev · conf 0.81.
- US / allied → TSMC (geographic diversification pressure) · resilience-building · 0.58 · pos · low vol · low rev · conf 0.79.
- China → Western AI talent (recruitment) · competing · 0.36 · neg (for US) · medium vol · medium rev · conf 0.64.
- Nvidia → Chinese market (maximally-permitted products) · revenue-adaptive · 0.42 · commercial · medium vol · medium rev · conf 0.78.
- China → rare earths / critical minerals (export restrictions) · counter-coercive · 0.54 · neg (for West) · low vol · low rev · conf 0.80.
- DeepSeek / Chinese open-weight releases → Global model ecosystem · capability-diffusion · 0.48 · pos (for China reputationally) · medium vol · low rev · conf 0.73.
- US → Europe / Japan / Korea / Netherlands (export-control coordination) · coalition-building · 0.62 · pos (for US) · medium vol · medium rev · conf 0.77.
- US outbound investment screening → US VC/PE into China · decoupling-financial · 0.41 · neg (for flows) · low vol · medium rev · conf 0.80.
- HBM supply (Korean) → Chinese AI accelerators · enabling / constrained · 0.46 · variable · medium vol · medium rev · conf 0.72.

1. EVENTS

- Oct 2022: BIS publishes first comprehensive China AI export controls -- A100/H100 and tool-level restrictions. Inflection point.
- Aug 2023: Huawei Mate 60 Pro released with Kirin 9000S chip (SMIC 7nm) -- surprises Western policy assessments.
- Oct 2023: Second BIS wave -- tightens against H800/A800 workarounds, expands country scope.
- 2023: Chinese gallium and germanium export restrictions.
- 2023: Dutch DUV restrictions (TWINSCAN NXT:2000i) aligned with US regime.
- Mar 2024: Third major BIS update.
- Late 2024: Biden administration outbound investment rule published (effective Jan 2025).
- Jan 2025: DeepSeek R1 release -- demonstrates near-frontier reasoning at a fraction of training cost. Market impact (Nvidia stock ~$600B market cap decline intraday).
- 2025: Trump administration assumes office; initial signals suggest continuity on export control regime with tighter enforcement and additional listing.
- 2025: HBM export restrictions extended.
- 2025-26: Successive Chinese open-weight model releases (Qwen 3, DeepSeek V3/R1 follow-ups) maintain capability parity pressure.
- 2025-26: Continued SMIC progression toward sub-7nm without EUV (technical and economic viability contested).

1. SYSTEM SENSITIVITIES

- Next BIS regulation wave: timing uncertain, content likely includes memory, cloud access, and potentially model-weight transfer restrictions.
- Chinese EUV indigenisation progress: if Shanghai Micro Electronics Equipment (SMEE) or SiCarrier achieves working EUV at any node, the hardware asymmetry collapses over ~5 years. Currently assessed as unlikely on short horizon.
- Taiwan contingency: intersects directly (see Taiwan dossier) -- any disruption to TSMC reshapes the entire AI supply chain.
- Korean posture: if Seoul chooses continued high-volume HBM to China, US regime effectiveness degrades. If Seoul aligns fully, Chinese AI compute tightens significantly.
- Dutch election cycle and ASML leverage: Dutch government policy on DUV controls is politically contingent.
- Nvidia commercial strategy: how far Nvidia pushes China-specific products shapes the effective ceiling.
- Open-weight model diffusion: Chinese release cadence of capable open-weight models changes the compute-equivalence calculation for downstream users globally.

1. KNOWN UNKNOWNS

- SMIC yield rates at 7nm and below -- public estimates unreliable.
- Chinese hyperscaler compute inventory composition (Nvidia stockpiles pre-controls, domestic accelerators ratio).
- Effective evasion throughput: extent to which controlled chips reach China through resale, transhipment, or cloud arbitrage.
- Chinese military-specific AI programme capabilities and compute allocation.
- Real training cost of DeepSeek R1 -- claimed $5.5M disputed; structural efficiency improvement undisputed.
- US administration priority weighting on AI export controls vs broader China policy.
- Chinese willingness to use rare earth / critical mineral exports coercively in crisis.

1. OUT OF SCOPE

- Taiwan Strait kinetic scenarios (separate dossier).
- Broader US-China trade relationship beyond tech.
- Consumer-facing Chinese internet policy detail (Great Firewall mechanics).
- AI safety / existential risk discussion.
- Commercial model performance benchmarks at technical detail.
- Chip architecture specifics.
- Tariff policy separate from export controls.

1. SOURCES

CSIS Technology Policy Program · "Export Controls Two Years After October 2022" · March 2026. Bruegel Working Paper · "The Decoupling That Isn't: EU, US, China Technology Interdependence" · March 2026. MERICS · "China's Semiconductor Indigenisation: Progress and Limits" · February 2026. CFR · "The Silicon Curtain" · February 2026. Chatham House · "Open-Weight Models and US-China AI Competition" · January 2026. ECFR · "European Tech Sovereignty Under US-China Pressure" · January 2026. ISPI · "Italy and the US-China Tech Rivalry" · December 2025.`,
graph_svg: `<defs><radialGradient id="glowTealAI" cx="50%" cy="50%"><stop offset="0%" stop-color="#0d7a6e" stop-opacity="0.22"/><stop offset="100%" stop-color="#0d7a6e" stop-opacity="0"/></radialGradient><radialGradient id="glowAmberAI" cx="50%" cy="50%"><stop offset="0%" stop-color="#a8570f" stop-opacity="0.22"/><stop offset="100%" stop-color="#a8570f" stop-opacity="0"/></radialGradient><radialGradient id="glowVioletAI" cx="50%" cy="50%"><stop offset="0%" stop-color="#5b21b6" stop-opacity="0.22"/><stop offset="100%" stop-color="#5b21b6" stop-opacity="0"/></radialGradient><marker id="arrowCoralAI" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#b8203a"/></marker><marker id="arrowSageAI" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#15803d"/></marker><marker id="arrowMutedAI" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#9e9b94"/></marker></defs><g stroke="#e8e4d6" stroke-width="0.5" opacity="0.7"><line x1="0" y1="90" x2="720" y2="90"/><line x1="0" y1="180" x2="720" y2="180"/><line x1="0" y1="270" x2="720" y2="270"/><line x1="180" y1="0" x2="180" y2="360"/><line x1="360" y1="0" x2="360" y2="360"/><line x1="540" y1="0" x2="540" y2="360"/></g><path d="M 140 90 Q 280 180 560 260" stroke="#b8203a" stroke-width="3.5" fill="none" marker-end="url(#arrowCoralAI)" opacity="0.85"/><path d="M 560 280 Q 400 290 160 120" stroke="#b8203a" stroke-width="2.2" fill="none" marker-end="url(#arrowCoralAI)" opacity="0.55"/><path d="M 140 110 Q 200 155 310 180" stroke="#15803d" stroke-width="2.5" fill="none" marker-end="url(#arrowSageAI)" opacity="0.7"/><path d="M 560 260 Q 450 220 330 185" stroke="#9e9b94" stroke-width="1.8" fill="none" marker-end="url(#arrowMutedAI)" opacity="0.55" stroke-dasharray="4,4"/><path d="M 320 195 Q 440 180 550 110" stroke="#15803d" stroke-width="2.3" fill="none" marker-end="url(#arrowSageAI)" opacity="0.65"/><path d="M 580 275 Q 600 200 620 120" stroke="#15803d" stroke-width="2" fill="none" marker-end="url(#arrowSageAI)" opacity="0.6"/><g class="graph-node"><circle cx="130" cy="95" r="28" fill="url(#glowTealAI)"/><circle cx="130" cy="95" r="14" fill="#ffffff" stroke="#0d7a6e" stroke-width="3"/><text class="graph-label" x="130" y="132" text-anchor="middle">US (BIS)</text></g><g class="graph-node"><circle cx="570" cy="270" r="28" fill="url(#glowTealAI)"/><circle cx="570" cy="270" r="14" fill="#ffffff" stroke="#0d7a6e" stroke-width="3"/><text class="graph-label" x="570" y="307" text-anchor="middle">CHINA</text></g><g class="graph-node"><circle cx="320" cy="190" r="24" fill="url(#glowAmberAI)"/><rect x="308" y="178" width="24" height="24" rx="3" fill="#ffffff" stroke="#a8570f" stroke-width="3" transform="rotate(45 320 190)"/><text class="graph-label" x="320" y="228" text-anchor="middle" fill="#a8570f">TSMC</text></g><g class="graph-node"><circle cx="555" cy="100" r="18" fill="url(#glowTealAI)"/><circle cx="555" cy="100" r="9" fill="#ffffff" stroke="#0d7a6e" stroke-width="2.5"/><text class="graph-label" x="555" y="78" text-anchor="middle">NVIDIA</text></g><g class="graph-node"><circle cx="635" cy="115" r="16" fill="url(#glowTealAI)"/><circle cx="635" cy="115" r="8" fill="#ffffff" stroke="#0d7a6e" stroke-width="2.3"/><text class="graph-label" x="635" y="140" text-anchor="middle">ASML</text></g><g class="graph-node"><circle cx="490" cy="330" r="18" fill="url(#glowTealAI)"/><circle cx="490" cy="330" r="9" fill="#ffffff" stroke="#0d7a6e" stroke-width="2.5"/><text class="graph-label" x="490" y="356" text-anchor="middle">SMIC</text></g><g class="graph-node"><circle cx="650" cy="330" r="18" fill="url(#glowTealAI)"/><circle cx="650" cy="330" r="9" fill="#ffffff" stroke="#0d7a6e" stroke-width="2.5"/><text class="graph-label" x="650" y="356" text-anchor="middle">DEEPSEEK</text></g><g class="graph-node"><circle cx="240" cy="310" r="14" fill="url(#glowVioletAI)"/><polygon points="240,302 249,315 231,315" fill="#ffffff" stroke="#5b21b6" stroke-width="2.5"/><text class="graph-label" x="240" y="336" text-anchor="middle" fill="#5b21b6">JAN '25</text></g>`
},

// =======================================================================
// 6. RED SEA / HOUTHI
// =======================================================================
"red-sea-houthis": {
  id: "red-sea-houthis",
  title: "Red Sea · Houthi",
  cluster_id: "middle-east",
  lat: 13.5,
  lon: 43.2,
  description: "Bab-el-Mandeb e mar Rosso come secondo chokepoint strutturale del Middle East: campagna Houthi contro il traffico commerciale, coalizione Prosperity Guardian, impatto sulle rotte Suez e ricadute fiscali su Egitto. Cape routing come nuovo equilibrio, non crisi episodica.",
  actors: ["Ansar Allah (Houthi)", "US CENTCOM · Prosperity Guardian", "UK Royal Navy", "EU Aspides", "Saudi Arabia", "Iran (State)", "Egypt", "Israel"],
  stats: { entities: 14, relations: 26, events: 14, corpus: 156, sources: 7, last_update: "Apr 2026" },
  chat: [],
  current_report_id: 1,
  reports: {
    1: {
      id: 1,
      title: "The <em>Secondary Strait</em>: Bab-el-Mandeb as Persistent Cost",
      subtitle: "Houthi anti-shipping campaign, Prosperity Guardian posture, and the Cape-routing equilibrium.",
      timestamp: "Apr 20, 2026 · 09:15 UTC",
      executive_summary: "Houthi attacks on Red Sea commercial shipping have evolved from episodic disruption to a <strong>persistent structural cost</strong>. Cape of Good Hope rerouting is now the baseline for most container liner services -- a new equilibrium, not a crisis. Western coalition counter-pressure has degraded specific Houthi capabilities episodically but has not restored pre-2023 shipping baseline.",
      body_html: '<h2 data-num="01">Theatre architecture</h2><p>Five actors define the current Bab-el-Mandeb configuration. <span class="chip actor">● Ansar Allah (Houthi)</span> is the operational protagonist; <span class="chip actor">● US CENTCOM / Prosperity Guardian</span> and <span class="chip actor">● UK Royal Navy</span> represent the coalition response; <span class="chip actor">● Saudi Arabia</span> and <span class="chip actor">● Iran (State)</span> function as shadow patrons of conflicting agendas.</p><h2 data-num="02">Assets under pressure</h2><p>Three assets dominate: <span class="chip asset">◆ Bab-el-Mandeb</span> strait (throughput at 30–40% of pre-crisis baseline), the <span class="chip asset">◆ Suez Canal</span> revenue stream (Egyptian SCA revenues declined 60%+ YoY at peak), and <span class="chip asset">◆ Europe-Asia liner schedules</span> now restructured around Cape routing.</p><h3>High-weight arcs</h3><ul class="report-list"><li><strong>Ansar Allah → Commercial Shipping</strong> · coercive, weight 0.84, high volatility.</li><li><strong>Iran → Ansar Allah</strong> · enabling, weight 0.66, <em>command depth contested</em>.</li><li><strong>Cape rerouting → Europe-Asia shipping economics</strong> · structural-reshaping, weight 0.62.</li><li><strong>Suez revenue loss → Egyptian fiscal stability</strong> · transmission, weight 0.54.</li></ul><blockquote class="pullquote">The Red Sea is no longer a route on which rare disruption happens; it is a route whose baseline cost of use has been reset. Planning teams priced this in twelve months ago.<cite>Bruegel · Working Paper · March 2026</cite></blockquote><div class="data-callout"><div class="data-callout-cell"><div class="dc-label">Throughput</div><div class="dc-value coral">30-40%</div><div class="dc-hint">of pre-crisis baseline</div></div><div class="data-callout-cell"><div class="dc-label">Suez revenue</div><div class="dc-value">-60%+</div><div class="dc-hint">YoY at peak impact</div></div><div class="data-callout-cell"><div class="dc-label">Confidence</div><div class="dc-value sage">0.78</div><div class="dc-hint">Corroborated ≥4 sources</div></div></div>',
      sources: [
        { num: "01", title: "The Houthi Maritime Campaign: Capability Curve Update", meta: "ECFR · Policy Brief", date: "2026-03-18" },
        { num: "02", title: "Cape of Good Hope as the New Normal", meta: "Bruegel · Working Paper", date: "2026-03-02" },
        { num: "03", title: "Egypt Fiscal Fragility Under Suez Revenue Loss", meta: "ISPI · Commentary", date: "2026-02-25" },
        { num: "04", title: "Prosperity Guardian: A Net Assessment Two Years In", meta: "MERICS · Policy Monitor", date: "2026-02-09" }
      ]
    }
  },
  intel: {
    confidence: { value: 0.78, label: "Moderate-high confidence", note: "Corroborated across ≥4 sources. Weakest: Iran-Houthi command depth (0.48), precise Houthi missile inventory reconstitution (0.55)." },
    top_arcs: [
      { from: "Ansar Allah", to: "Shipping (Bab-el-Mandeb)", type: "coercive", weight: 0.84, polarity: "neg", volatility: "H" },
      { from: "Iran", to: "Ansar Allah", type: "enabling-support", weight: 0.66, polarity: "neg-indirect", volatility: "L" },
      { from: "Prosperity Guardian", to: "Ansar Allah", type: "interdiction+strike", weight: 0.58, polarity: "neg", volatility: "M" },
      { from: "Cape rerouting", to: "Europe-Asia economics", type: "structural-reshaping", weight: 0.62, polarity: "neg-cost", volatility: "L" },
      { from: "Suez revenue loss", to: "Egyptian fiscal stability", type: "transmission", weight: 0.54, polarity: "neg", volatility: "M" }
    ],
    events: [
      { date: "2026-03-14", title: "Egyptian FX reserves drawdown signals Suez pressure", active: true },
      { date: "2026-01-22", title: "UK frigate intercepts Houthi UAS salvo" },
      { date: "2025-11-30", title: "Maersk announces indefinite Cape routing for Europe" },
      { date: "2025-10-12", title: "Shift confirmed as structural (Joint War Committee adjusts baselines)" },
      { date: "2024-06-12", title: "MV Tutor sunk by Houthi strike" },
      { date: "2024-02-19", title: "EU Operation Aspides launched" },
      { date: "2024-01-12", title: "First US-UK strikes on Yemen targets" },
      { date: "2023-12-18", title: "Operation Prosperity Guardian announced" }
    ]
  },
  brief_text: `RED SEA / HOUTHI · Dossier Brief · As-Of April 2026

1. CURRENT SYSTEM STATE

The Red Sea / Bab-el-Mandeb system is in a persistent structural-cost configuration. Houthi anti-shipping operations, sustained since late 2023, have evolved from episodic disruption into a permanent risk overlay that has reshaped Europe-Asia shipping economics. Cape of Good Hope rerouting is now the baseline for most container liner services, not the exception -- a new equilibrium rather than a crisis. Western coalition counter-pressure (Operation Prosperity Guardian, EU Aspides, periodic US/UK strikes on Yemen) has degraded specific Houthi capabilities episodically but has not restored pre-2023 shipping baseline.

The dossier's central question is no longer "when does this end" but "under what conditions does the baseline revert", and current analysis suggests the answer involves either (i) an Iranian decision to restrain the Houthi politically, or (ii) internal Yemeni political change, neither of which is moving decisively.

1. ACTORS

Primary state actors:

- Ansar Allah (Houthi movement, Yemen): de facto authority in northwestern Yemen including Sanaa and Hodeidah; operates a full government structure in controlled areas. Decision centre for anti-shipping tempo. Leadership (Abdul-Malik al-Houthi as Supreme Leader; operational commanders below) has proven capable of sustained multi-year campaign under air attack.
- United States (CENTCOM, Fifth Fleet, Task Force 153): leads Operation Prosperity Guardian (multinational). Periodic strike campaigns on Yemeni targets (Jan 2024 initial salvo, sustained operations 2024-26).
- United Kingdom (Royal Navy, including HMS Diamond and successor deployments): participates in US-led coalition; conducts interdiction and limited strike.
- European Union (Operation Aspides, since Feb 2024): separate EU-flagged maritime operation; defensive-only posture (no strikes on Yemen). Italy, France, Germany, Greece, Belgium contributing.
- Iran: Houthi principal patron -- weapons supply (missiles, drones, targeting intelligence via IRGC Quds Force). Level of direct control over Houthi tempo is the dossier's central ambiguity.
- Saudi Arabia: ended active combat role via 2022 truce, formalised in ongoing talks. Prefers Yemeni stabilisation to forward engagement. Would lose from Red Sea escalation affecting Saudi Red Sea coast (Yanbu, NEOM, Jeddah).
- United Arab Emirates: supports Southern Transitional Council (STC) in southern Yemen; maintains influence over Aden Gulf dynamics. Not active in anti-Houthi maritime operations.
- Egypt: structurally exposed -- Suez Canal transit revenues are major source of foreign currency. SCA revenues declined 60%+ YoY at peak impact. Fiscal pressure is the principal second-order consequence to Cairo.
- Israel: periodic Houthi missile/drone strikes on Israeli territory (Hodeidah retaliatory strikes by IAF). Not a maritime coalition participant but a target.

Non-state actors:

- Commercial shipping liners: Maersk, MSC, CMA CGM, Hapag-Lloyd, Ocean Network Express, Evergreen, COSCO, HMM. Individual rerouting decisions since Nov-Dec 2023. By early 2024, most had formalised Cape routing as default for most services.
- Insurance markets (London Joint War Committee): Red Sea war-risk premia re-rated multiple times through 2024-26. Joint War Committee area extensions.
- UN Panel of Experts (Yemen sanctions): documents evidence base on arms transfers -- a reference for attribution and enforcement.

1. ASSETS

- Bab-el-Mandeb strait: ~18 miles at narrowest between Yemen and Djibouti/Eritrea. ~12% of global trade pre-2023 baseline, including ~30% of container trade Europe-Asia. Current throughput ~30-40% of pre-crisis baseline.
- Suez Canal: connected asset -- Bab-el-Mandeb is the southern gate of the Suez route. Cape rerouting adds ~10-14 days and ~40% fuel cost per Europe-Asia voyage.
- Europe-Asia container liner schedules: repriced and rerouted. Cascading effects: longer vessel rotations, tighter effective capacity, higher container rates (Shanghai Containerised Freight Index spiked multiple times).
- Egyptian FX reserves: cratered through 2024 under Suez revenue loss, partially stabilised via IMF arrangement and Gulf support.
- Yemen's Hodeidah port: Houthi logistics hub; periodically struck by Israeli and coalition forces; essential for humanitarian aid flows -- a target with high political cost.
- Saudi Red Sea coast infrastructure (Yanbu oil terminal -- end of Saudi East-West Pipeline): structural crossover with Iran-Hormuz dossier: if Red Sea escalates into Saudi infrastructure, the Hormuz bypass insurance fails.
- Horn of Africa basing (Djibouti -- US Camp Lemonnier, Chinese base, French, Italian, Japanese bases): regional power projection nexus.

1. HIGH-WEIGHT ARCS

- Ansar Allah → Commercial shipping (Bab-el-Mandeb) · coercive · 0.84 · strongly neg · high vol · medium rev · conf 0.86. Defining arc.
- Iran → Ansar Allah (enabling) · support/supply · 0.66 · neg-indirect · low vol (supply channel stable) · low rev · conf 0.71. Command relationship level is the dossier's primary uncertainty.
- US-led coalition (Prosperity Guardian) → Ansar Allah · interdiction + strike · 0.58 · neg · medium vol · medium rev · conf 0.80. Reactive and suppressive rather than decisive.
- Cape rerouting → Europe-Asia shipping economics · structural-reshaping · 0.62 · neg (cost) · low vol · medium rev · conf 0.84. Baseline has shifted.
- Suez revenue loss → Egyptian fiscal stability · transmission · 0.54 · neg · medium vol · medium rev · conf 0.81.
- Saudi Arabia → Yemen stabilisation · diplomatic-conservative · 0.42 · pos (for system stability) · low vol · low rev · conf 0.75.
- EU Aspides → shipping protection · defensive-escort · 0.34 · pos · low vol · medium rev · conf 0.78.
- Israel → Hodeidah / Houthi targets · punitive · 0.28 · neg · medium vol · medium rev · conf 0.72.

1. EVENTS

- 2014-15: Houthi takeover of Sanaa; Saudi-led coalition intervention begins.
- 2019: Aramco / Abqaiq-Khurais attack (attributed Iran/Houthi) -- proved drone/missile reach.
- 2022: Saudi-Houthi truce agreed under UN mediation.
- Oct 2023: Post-October 7, Houthi begin anti-shipping operations in "solidarity" with Gaza.
- Nov-Dec 2023: Major liners begin Cape rerouting.
- Dec 2023: Operation Prosperity Guardian announced.
- Jan 2024: First US-UK strikes on Yemen targets.
- Feb 2024: EU Operation Aspides launched.
- 2024: Continued Houthi operations, including successful strikes (MV Rubymar sunk Mar 2024; MV Tutor sunk Jun 2024).
- 2024: Israeli strikes on Hodeidah in response to Houthi attacks on Israeli territory.
- 2025: Houthi shift to ballistic-only anti-ship campaign (reduced drone reliance, harder to intercept).
- Nov 2025: Maersk formally announces indefinite Cape routing for Europe services.
- Jan 2026: UK frigate intercepts Houthi UAS/missile salvo.
- Feb 2026: Shift confirmed as structural, not episodic -- Joint War Committee baselines adjusted.
- Mar 2026: Egyptian FX drawdown signals sustained Suez revenue shortfall.

1. SYSTEM SENSITIVITIES

- Iranian willingness to restrain Houthi: the dossier's single most important lever. Iran could plausibly trade Houthi de-escalation for nuclear or sanctions concessions; currently not offered.
- Internal Yemeni political change: Houthi governance legitimacy under sustained strike pressure remains a standing variable.
- Egyptian fiscal capacity: absent Gulf or IMF support intensification, Egypt approaches forced adjustment.
- Israeli response tempo: Israeli Hodeidah strikes introduce escalation without solving the shipping problem -- dynamic not under coalition control.
- Saudi Red Sea exposure: any Houthi strike on Saudi Red Sea infrastructure would force Saudi response and eliminate current Saudi conservation posture.
- Shipping insurance market re-rating events: further incidents could push premia above the threshold that makes even Cape rerouting insufficiently competitive without substantial freight rate increases.
- Coalition operational sustainment: Western political willingness to sustain open-ended strike operations in Yemen has limits.

1. KNOWN UNKNOWNS

- Iran-Houthi command relationship depth (~0.48 confidence on control tightness).
- Precise Houthi missile/drone inventory and reconstitution rate.
- Actual casualty and material damage inflicted by coalition strikes on Houthi capabilities.
- Saudi-Houthi backchannel status (paused Dec 2025, unclear resumption).
- Egyptian fiscal absorption capacity under continued shortfall.
- Precise level of Chinese / Russian quiet coordination with Houthi on passage assurances for their vessels.
- Duration of Cape routing stickiness: once liner schedules restructure for Cape, reversion has its own cost.

1. OUT OF SCOPE

- Yemeni civil war in full (government-Houthi ground dynamics beyond relevance to shipping).
- Gaza war detail (context only).
- Horn of Africa internal politics beyond basing.
- Iranian nuclear or broader Iran-USA rivalry (separate dossier).
- Iran-Hormuz dynamics (separate dossier).
- Israeli domestic politics.
- Global shipping industry consolidation beyond rerouting effects.

1. SOURCES

ECFR Policy Brief · "The Houthi Maritime Campaign: Capability Curve Update" · March 2026. Bruegel Working Paper · "Cape of Good Hope as the New Normal: Shipping Economics" · March 2026. ISPI Commentary · "Egypt Fiscal Fragility Under Suez Revenue Loss" · February 2026. MERICS Policy Monitor · "Prosperity Guardian: A Net Assessment Two Years In" · February 2026. Chatham House · "Iran-Houthi Relationship Revisited" · January 2026. CSIS Middle East Program · "Coalition Strike Operations in Yemen: Effectiveness Assessment" · December 2025. IISS · "Houthi Missile Inventory Assessment" · November 2025.`,
graph_svg: `<defs><radialGradient id="glowTealRS" cx="50%" cy="50%"><stop offset="0%" stop-color="#0d7a6e" stop-opacity="0.22"/><stop offset="100%" stop-color="#0d7a6e" stop-opacity="0"/></radialGradient><radialGradient id="glowAmberRS" cx="50%" cy="50%"><stop offset="0%" stop-color="#a8570f" stop-opacity="0.22"/><stop offset="100%" stop-color="#a8570f" stop-opacity="0"/></radialGradient><radialGradient id="glowVioletRS" cx="50%" cy="50%"><stop offset="0%" stop-color="#5b21b6" stop-opacity="0.22"/><stop offset="100%" stop-color="#5b21b6" stop-opacity="0"/></radialGradient><marker id="arrowCoralRS" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#b8203a"/></marker><marker id="arrowSageRS" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#15803d"/></marker><marker id="arrowMutedRS" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#9e9b94"/></marker></defs><g stroke="#e8e4d6" stroke-width="0.5" opacity="0.7"><line x1="0" y1="90" x2="720" y2="90"/><line x1="0" y1="180" x2="720" y2="180"/><line x1="0" y1="270" x2="720" y2="270"/><line x1="180" y1="0" x2="180" y2="360"/><line x1="360" y1="0" x2="360" y2="360"/><line x1="540" y1="0" x2="540" y2="360"/></g><path d="M 150 200 Q 340 180 540 170" stroke="#b8203a" stroke-width="3.5" fill="none" marker-end="url(#arrowCoralRS)" opacity="0.85"/><path d="M 100 80 Q 130 140 148 195" stroke="#b8203a" stroke-width="2.5" fill="none" marker-end="url(#arrowCoralRS)" opacity="0.7"/><path d="M 400 310 Q 300 260 160 205" stroke="#b8203a" stroke-width="2.2" fill="none" marker-end="url(#arrowCoralRS)" opacity="0.55"/><path d="M 605 75 Q 580 140 550 170" stroke="#15803d" stroke-width="2.3" fill="none" marker-end="url(#arrowSageRS)" opacity="0.65"/><path d="M 150 195 Q 300 260 540 300" stroke="#9e9b94" stroke-width="1.8" fill="none" marker-end="url(#arrowMutedRS)" opacity="0.55"/><g class="graph-node"><circle cx="150" cy="200" r="26" fill="url(#glowTealRS)"/><circle cx="150" cy="200" r="13" fill="#ffffff" stroke="#0d7a6e" stroke-width="3"/><text class="graph-label" x="150" y="237" text-anchor="middle">ANSAR ALLAH</text></g><g class="graph-node"><circle cx="95" cy="75" r="20" fill="url(#glowTealRS)"/><circle cx="95" cy="75" r="10" fill="#ffffff" stroke="#0d7a6e" stroke-width="2.5"/><text class="graph-label" x="95" y="53" text-anchor="middle">IRAN (STATE)</text></g><g class="graph-node"><circle cx="400" cy="320" r="20" fill="url(#glowTealRS)"/><circle cx="400" cy="320" r="10" fill="#ffffff" stroke="#0d7a6e" stroke-width="2.5"/><text class="graph-label" x="400" y="346" text-anchor="middle">PROSP. GUARDIAN</text></g><g class="graph-node"><circle cx="605" cy="70" r="18" fill="url(#glowTealRS)"/><circle cx="605" cy="70" r="9" fill="#ffffff" stroke="#0d7a6e" stroke-width="2.5"/><text class="graph-label" x="605" y="48" text-anchor="middle">SAUDI ARABIA</text></g><g class="graph-node"><circle cx="540" cy="305" r="16" fill="url(#glowTealRS)"/><circle cx="540" cy="305" r="8" fill="#ffffff" stroke="#0d7a6e" stroke-width="2.3"/><text class="graph-label" x="540" y="330" text-anchor="middle">EGYPT</text></g><g class="graph-node"><circle cx="540" cy="170" r="28" fill="url(#glowAmberRS)"/><rect x="528" y="158" width="24" height="24" rx="3" fill="#ffffff" stroke="#a8570f" stroke-width="3" transform="rotate(45 540 170)"/><text class="graph-label" x="540" y="210" text-anchor="middle" fill="#a8570f">BAB-EL-MANDEB</text></g><g class="graph-node"><circle cx="610" cy="220" r="18" fill="url(#glowAmberRS)"/><rect x="601" y="211" width="18" height="18" rx="2" fill="#ffffff" stroke="#a8570f" stroke-width="2.5" transform="rotate(45 610 220)"/><text class="graph-label" x="610" y="250" text-anchor="middle" fill="#a8570f">SUEZ</text></g><g class="graph-node"><circle cx="300" cy="125" r="14" fill="url(#glowVioletRS)"/><polygon points="300,117 309,130 291,130" fill="#ffffff" stroke="#5b21b6" stroke-width="2.5"/><text class="graph-label" x="300" y="151" text-anchor="middle" fill="#5b21b6">OCT '25</text></g>`
}

}
};


window.CHESS_DATA.kg = {

entities: [
// –– Russia-Ukraine ––
{ id: "russia",           label: "Russia",              type: "actor", subtype: "state",     cluster: "eastern-europe", dossiers: ["ai-us-china", "iran-usa", "russia-ukraine"] },
{ id: "ukraine",          label: "Ukraine",             type: "actor", subtype: "state",     cluster: "eastern-europe", dossiers: ["russia-ukraine"] },
{ id: "usa",              label: "United States",       type: "actor", subtype: "state",     cluster: null,             dossiers: ["ai-us-china", "iran-usa", "red-sea-houthis", "russia-ukraine", "taiwan-strait"] },
{ id: "germany",          label: "Germany",             type: "actor", subtype: "state",     cluster: "eastern-europe", dossiers: ["russia-ukraine"] },
{ id: "poland",           label: "Poland",              type: "actor", subtype: "state",     cluster: "eastern-europe", dossiers: ["russia-ukraine"] },
{ id: "uk",               label: "United Kingdom",      type: "actor", subtype: "state",     cluster: null,             dossiers: ["russia-ukraine"] },
{ id: "france",           label: "France",              type: "actor", subtype: "state",     cluster: "eastern-europe", dossiers: ["russia-ukraine"] },
{ id: "china",            label: "China (PRC)",         type: "actor", subtype: "state",     cluster: "east-asia",      dossiers: ["ai-us-china", "iran-hormuz", "iran-usa", "red-sea-houthis", "russia-ukraine", "taiwan-strait"] },
{ id: "turkey",           label: "Turkey",              type: "actor", subtype: "state",     cluster: null,             dossiers: ["russia-ukraine"] },
{ id: "india",            label: "India",               type: "actor", subtype: "state",     cluster: null,             dossiers: ["russia-ukraine"] },
{ id: "hungary-slovakia", label: "Hungary / Slovakia",  type: "actor", subtype: "state",     cluster: "eastern-europe", dossiers: ["russia-ukraine"] },
{ id: "nato",             label: "NATO",                type: "actor", subtype: "alliance",  cluster: null,             dossiers: ["russia-ukraine"] },
{ id: "belarus",          label: "Belarus",             type: "actor", subtype: "state",     cluster: "eastern-europe", dossiers: ["russia-ukraine"] },
{ id: "ua-grid",          label: "Ukrainian energy grid", type: "asset", subtype: "infrastructure", cluster: "eastern-europe", dossiers: ["russia-ukraine"] },
{ id: "znpp",             label: "Zaporizhzhia Nuclear Plant", type: "asset", subtype: "nuclear", cluster: "eastern-europe", dossiers: ["russia-ukraine"] },
{ id: "black-sea-corridor", label: "Black Sea grain corridor", type: "asset", subtype: "logistics", cluster: "eastern-europe", dossiers: ["russia-ukraine"] },
{ id: "baltic-cables",    label: "Baltic subsea cables", type: "asset", subtype: "infrastructure", cluster: "eastern-europe", dossiers: ["russia-ukraine"] },
{ id: "russian-refining", label: "Russian refining capacity", type: "asset", subtype: "energy", cluster: "eastern-europe", dossiers: ["russia-ukraine"] },

// ---- Iran-Hormuz ----
{ id: "iran",             label: "Iran (State)",        type: "actor", subtype: "state",     cluster: "middle-east",    dossiers: ["iran-hormuz", "iran-usa", "red-sea-houthis"] },
{ id: "irgc-navy",        label: "IRGC-Navy",           type: "actor", subtype: "military",  cluster: "middle-east",    dossiers: ["iran-hormuz"] },
{ id: "us-5th-fleet",     label: "US 5th Fleet",        type: "actor", subtype: "military",  cluster: "middle-east",    dossiers: ["iran-hormuz"] },
{ id: "ukmto",            label: "UKMTO",               type: "actor", subtype: "coord",     cluster: "middle-east",    dossiers: [] },
{ id: "gcc",              label: "GCC bloc",            type: "actor", subtype: "alliance",  cluster: "middle-east",    dossiers: ["iran-hormuz"] },
{ id: "saudi-arabia",     label: "Saudi Arabia",        type: "actor", subtype: "state",     cluster: "middle-east",    dossiers: ["iran-hormuz", "red-sea-houthis"] },
{ id: "qatar",            label: "Qatar",               type: "actor", subtype: "state",     cluster: "middle-east",    dossiers: ["iran-usa"] },
{ id: "uae",              label: "UAE",                 type: "actor", subtype: "state",     cluster: "middle-east",    dossiers: ["iran-hormuz"] },
{ id: "commercial-shipping", label: "Commercial shipping", type: "asset", subtype: "logistics", cluster: "middle-east", dossiers: ["iran-hormuz", "red-sea-houthis"] },
{ id: "lloyds-market",    label: "Lloyd's insurance market", type: "asset", subtype: "finance", cluster: null,        dossiers: ["iran-hormuz", "red-sea-houthis"] },
{ id: "hormuz",           label: "Strait of Hormuz",    type: "asset", subtype: "chokepoint", cluster: "middle-east",    dossiers: ["iran-hormuz", "red-sea-houthis"] },
{ id: "kharg-terminal",   label: "Kharg Oil Terminal",  type: "asset", subtype: "energy",    cluster: "middle-east",    dossiers: [] },
{ id: "gulf-gnss",        label: "Gulf GNSS infrastructure", type: "asset", subtype: "infrastructure", cluster: "middle-east", dossiers: ["iran-hormuz"] },
{ id: "ksa-eastwest-pipeline", label: "Saudi East-West Pipeline", type: "asset", subtype: "energy", cluster: "middle-east", dossiers: ["iran-hormuz", "red-sea-houthis"] },
{ id: "uae-fujairah-bypass", label: "UAE Fujairah pipeline bypass", type: "asset", subtype: "energy", cluster: "middle-east", dossiers: ["iran-hormuz"] },

// ---- Iran-USA ----
{ id: "israel",           label: "Israel",              type: "actor", subtype: "state",     cluster: "middle-east",    dossiers: ["iran-usa", "red-sea-houthis"] },
{ id: "hezbollah",        label: "Hezbollah",           type: "actor", subtype: "non-state", cluster: "middle-east",    dossiers: ["iran-usa"] },
{ id: "hamas",            label: "Hamas",               type: "actor", subtype: "non-state", cluster: "middle-east",    dossiers: ["iran-usa"] },
{ id: "houthi",           label: "Ansar Allah (Houthi)", type: "actor", subtype: "non-state", cluster: "middle-east", dossiers: ["iran-usa", "red-sea-houthis"] },
{ id: "iraqi-militias",   label: "Iraqi militias",      type: "actor", subtype: "non-state", cluster: "middle-east",    dossiers: ["iran-usa"] },
{ id: "e3",               label: "E3 (UK/FR/DE)",       type: "actor", subtype: "alliance",  cluster: null,             dossiers: [] },
{ id: "iran-nuclear",     label: "Iranian nuclear programme", type: "asset", subtype: "nuclear", cluster: "middle-east", dossiers: ["iran-usa"] },
{ id: "natanz",           label: "Natanz enrichment facility", type: "asset", subtype: "nuclear", cluster: "middle-east", dossiers: [] },
{ id: "fordow",           label: "Fordow enrichment facility", type: "asset", subtype: "nuclear", cluster: "middle-east", dossiers: [] },
{ id: "post-assad-syria", label: "Post-Assad Syria",    type: "asset", subtype: "territory", cluster: "middle-east",    dossiers: ["iran-usa"] },

// ---- Taiwan Strait ----
{ id: "pla-east",         label: "PLA Eastern Theater", type: "actor", subtype: "military",  cluster: "east-asia",      dossiers: ["taiwan-strait"] },
{ id: "taiwan",           label: "ROC (Taiwan)",        type: "actor", subtype: "state",     cluster: "east-asia",      dossiers: ["taiwan-strait"] },
{ id: "us-indopacom",     label: "US INDOPACOM",        type: "actor", subtype: "military",  cluster: "east-asia",      dossiers: ["taiwan-strait"] },
{ id: "japan-sdf",        label: "Japan SDF",           type: "actor", subtype: "military",  cluster: "east-asia",      dossiers: ["taiwan-strait"] },
{ id: "philippines",      label: "Philippines",         type: "actor", subtype: "state",     cluster: "east-asia",      dossiers: ["taiwan-strait"] },
{ id: "australia",        label: "Australia",           type: "actor", subtype: "state",     cluster: "east-asia",      dossiers: ["taiwan-strait"] },
{ id: "skorea",           label: "South Korea",         type: "actor", subtype: "state",     cluster: "east-asia",      dossiers: [] },
{ id: "tsmc",             label: "TSMC",                type: "asset", subtype: "corporate", cluster: "east-asia",      dossiers: ["ai-us-china", "taiwan-strait"] },
{ id: "taiwan-subsea-cables", label: "Taiwan subsea cables", type: "asset", subtype: "infrastructure", cluster: "east-asia", dossiers: ["taiwan-strait"] },
{ id: "us-7th-fleet",     label: "US 7th Fleet",        type: "asset", subtype: "military",  cluster: "east-asia",      dossiers: ["taiwan-strait"] },
{ id: "rare-earths",      label: "Rare earths supply chain", type: "asset", subtype: "materials", cluster: null,       dossiers: ["ai-us-china", "taiwan-strait"] },
{ id: "luzon-strait",     label: "Luzon Strait",        type: "asset", subtype: "chokepoint", cluster: "east-asia",     dossiers: ["taiwan-strait"] },

// ---- AI US-China ----
{ id: "us-bis",           label: "United States (BIS)", type: "actor", subtype: "gov-agency", cluster: null,             dossiers: ["ai-us-china"] },
{ id: "china-miit",       label: "China (MIIT)",        type: "actor", subtype: "gov-agency", cluster: "east-asia",      dossiers: ["ai-us-china"] },
{ id: "nvidia",           label: "Nvidia",              type: "actor", subtype: "corporate",  cluster: null,             dossiers: ["ai-us-china"] },
{ id: "asml",             label: "ASML",                type: "actor", subtype: "corporate",  cluster: null,             dossiers: ["ai-us-china"] },
{ id: "huawei",           label: "Huawei",              type: "actor", subtype: "corporate",  cluster: "east-asia",      dossiers: ["ai-us-china"] },
{ id: "smic",             label: "SMIC",                type: "actor", subtype: "corporate",  cluster: "east-asia",      dossiers: ["ai-us-china"] },
{ id: "deepseek",         label: "DeepSeek & Chinese labs", type: "actor", subtype: "corporate", cluster: "east-asia",  dossiers: ["ai-us-china"] },
{ id: "samsung-hynix",    label: "Samsung / SK Hynix",  type: "actor", subtype: "corporate",  cluster: "east-asia",      dossiers: ["ai-us-china"] },
{ id: "netherlands",      label: "Netherlands",         type: "actor", subtype: "state",      cluster: null,             dossiers: ["ai-us-china"] },
{ id: "euv-lithography",  label: "EUV lithography",     type: "asset", subtype: "technology", cluster: null,             dossiers: [] },
{ id: "duv-lithography",  label: "Advanced DUV lithography", type: "asset", subtype: "technology", cluster: null,       dossiers: [] },
{ id: "hbm-memory",       label: "HBM memory",          type: "asset", subtype: "technology", cluster: null,             dossiers: [] },
{ id: "frontier-models",  label: "Frontier AI models",  type: "asset", subtype: "technology", cluster: null,             dossiers: ["ai-us-china", "taiwan-strait"] },

// ---- Red Sea / Houthi ----
{ id: "prosperity-guardian", label: "Prosperity Guardian coalition", type: "actor", subtype: "alliance", cluster: "middle-east", dossiers: ["red-sea-houthis"] },
{ id: "eu-aspides",       label: "EU Operation Aspides", type: "actor", subtype: "alliance",  cluster: "middle-east",    dossiers: ["red-sea-houthis"] },
{ id: "egypt",            label: "Egypt",               type: "actor", subtype: "state",     cluster: "middle-east",    dossiers: [] },
{ id: "bab-el-mandeb",    label: "Bab-el-Mandeb",       type: "asset", subtype: "chokepoint", cluster: "middle-east",   dossiers: ["red-sea-houthis"] },
{ id: "suez",             label: "Suez Canal",          type: "asset", subtype: "chokepoint", cluster: "middle-east",   dossiers: ["red-sea-houthis"] },
{ id: "europe-asia-shipping", label: "Europe-Asia shipping lanes", type: "asset", subtype: "logistics", cluster: null, dossiers: ["red-sea-houthis"] },
{ id: "egyptian-fx",      label: "Egyptian FX reserves", type: "asset", subtype: "finance",  cluster: "middle-east",    dossiers: ["red-sea-houthis"] },
{ id: "hodeidah",         label: "Hodeidah port",       type: "asset", subtype: "logistics", cluster: "middle-east",    dossiers: ["red-sea-houthis"] },
{ id: "horn-africa-bases", label: "Horn of Africa bases", type: "asset", subtype: "military", cluster: "middle-east",   dossiers: [] }

],

relations: [
// –– Russia-Ukraine dossier ––
{ from: "russia",    to: "ua-grid",        type: "coercive strike",       weight: 0.88, polarity: "neg",       volatility: "H",  reversibility: "L", confidence: 0.84, dossiers: ["russia-ukraine"] },
{ from: "usa",       to: "ukraine",        type: "enabling (military aid)", weight: 0.81, polarity: "pos",     volatility: "VH", reversibility: "M", confidence: 0.79, dossiers: ["russia-ukraine"] },
{ from: "germany",   to: "ukraine",        type: "enabling (military aid)", weight: 0.71, polarity: "pos",     volatility: "M",  reversibility: "M", confidence: 0.82, dossiers: ["russia-ukraine"] },
{ from: "china",     to: "russia",         type: "enabling-indirect",     weight: 0.66, polarity: "neg-West",  volatility: "L",  reversibility: "L", confidence: 0.61, dossiers: ["russia-ukraine"] },
{ from: "nato",      to: "russia",         type: "deterrent posture",     weight: 0.69, polarity: "neg",       volatility: "L",  reversibility: "M", confidence: 0.78, dossiers: ["russia-ukraine"] },
{ from: "turkey",    to: "black-sea-corridor", type: "gatekeeping (Montreux)", weight: 0.54, polarity: "pos",  volatility: "L",  reversibility: "M", confidence: 0.83, dossiers: ["russia-ukraine"] },
{ from: "ukraine",   to: "russian-refining", type: "reciprocal coercive",  weight: 0.61, polarity: "neg",      volatility: "H",  reversibility: "M", confidence: 0.74, dossiers: ["russia-ukraine"] },
{ from: "russia",    to: "baltic-cables",  type: "hybrid attrition",      weight: 0.42, polarity: "neg",       volatility: "M",  reversibility: "L", confidence: 0.58, dossiers: ["russia-ukraine"] },
{ from: "india",     to: "russia",         type: "sanctions-softening (energy)", weight: 0.38, polarity: "neg-West", volatility: "L", reversibility: "M", confidence: 0.79, dossiers: ["russia-ukraine"] },
{ from: "hungary-slovakia", to: "nato",    type: "veto-holder (EU consensus)", weight: 0.44, polarity: "neg",   volatility: "M",  reversibility: "M", confidence: 0.81, dossiers: ["russia-ukraine"] },
{ from: "poland",    to: "ukraine",        type: "enabling-structural (logistics)", weight: 0.57, polarity: "pos", volatility: "L", reversibility: "L", confidence: 0.85, dossiers: ["russia-ukraine"] },
{ from: "belarus",   to: "russia",         type: "enabling-passive (territory)", weight: 0.48, polarity: "neg", volatility: "L",  reversibility: "M", confidence: 0.77, dossiers: ["russia-ukraine"] },
{ from: "uk",        to: "ukraine",        type: "enabling (military aid)", weight: 0.58, polarity: "pos",     volatility: "M",  reversibility: "M", confidence: 0.82, dossiers: ["russia-ukraine"] },
{ from: "france",    to: "ukraine",        type: "enabling (military aid)", weight: 0.52, polarity: "pos",     volatility: "M",  reversibility: "M", confidence: 0.78, dossiers: ["russia-ukraine"] },
{ from: "russia",    to: "znpp",           type: "occupation (latent risk)", weight: 0.40, polarity: "neg",    volatility: "L",  reversibility: "L", confidence: 0.85, dossiers: ["russia-ukraine"] },

// ---- Iran-Hormuz ----
{ from: "irgc-navy", to: "commercial-shipping", type: "coercive harassment", weight: 0.87, polarity: "neg",    volatility: "H",  reversibility: "M", confidence: 0.81, dossiers: ["iran-hormuz"] },
{ from: "us-5th-fleet", to: "irgc-navy",   type: "deterrent presence",    weight: 0.74, polarity: "neg",       volatility: "M",  reversibility: "M", confidence: 0.80, dossiers: ["iran-hormuz"] },
{ from: "gcc",       to: "hormuz",         type: "protective-stabilising", weight: 0.61, polarity: "pos",      volatility: "L",  reversibility: "L", confidence: 0.77, dossiers: ["iran-hormuz"] },
{ from: "irgc-navy", to: "gulf-gnss",      type: "hybrid disruption",     weight: 0.52, polarity: "neg",       volatility: "M",  reversibility: "L", confidence: 0.64, dossiers: ["iran-hormuz"] },
{ from: "iran",      to: "irgc-navy",      type: "command (ambiguous)",   weight: 0.58, polarity: "variable",  volatility: "M",  reversibility: "M", confidence: 0.66, dossiers: ["iran-hormuz"] },
{ from: "lloyds-market", to: "commercial-shipping", type: "transmission (pricing)", weight: 0.68, polarity: "systemic", volatility: "M", reversibility: "M", confidence: 0.82, dossiers: ["iran-hormuz"] },
{ from: "uae",       to: "uae-fujairah-bypass", type: "structural redundancy", weight: 0.48, polarity: "pos",  volatility: "L",  reversibility: "L", confidence: 0.85, dossiers: ["iran-hormuz"] },
{ from: "saudi-arabia", to: "ksa-eastwest-pipeline", type: "structural redundancy", weight: 0.52, polarity: "pos", volatility: "L", reversibility: "L", confidence: 0.86, dossiers: ["iran-hormuz"] },
{ from: "china",     to: "iran",           type: "dormant diplomatic",    weight: 0.34, polarity: "variable",  volatility: "L",  reversibility: "M", confidence: 0.52, dossiers: ["iran-hormuz", "iran-usa"] },

// ---- Iran-USA ----
{ from: "iran",      to: "iran-nuclear",   type: "latent-strategic",      weight: 0.84, polarity: "neg-West",  volatility: "L",  reversibility: "L", confidence: 0.70, dossiers: ["iran-usa"] },
{ from: "israel",    to: "iran",           type: "coercive-preventive",   weight: 0.78, polarity: "neg",       volatility: "H",  reversibility: "L", confidence: 0.81, dossiers: ["iran-usa"] },
{ from: "iran",      to: "hezbollah",      type: "command/support",       weight: 0.72, polarity: "variable",  volatility: "M",  reversibility: "M", confidence: 0.76, dossiers: ["iran-usa"] },
{ from: "iran",      to: "houthi",         type: "command/support",       weight: 0.66, polarity: "variable",  volatility: "M",  reversibility: "M", confidence: 0.71, dossiers: ["iran-usa", "red-sea-houthis"] },
{ from: "iran",      to: "iraqi-militias", type: "command/support",       weight: 0.58, polarity: "variable",  volatility: "M",  reversibility: "M", confidence: 0.73, dossiers: ["iran-usa"] },
{ from: "iran",      to: "hamas",          type: "command/support",       weight: 0.48, polarity: "variable",  volatility: "M",  reversibility: "M", confidence: 0.70, dossiers: ["iran-usa"] },
{ from: "usa",       to: "iran",           type: "coercive-economic (sanctions)", weight: 0.68, polarity: "neg", volatility: "L", reversibility: "M", confidence: 0.83, dossiers: ["iran-usa"] },
{ from: "usa",       to: "iran",           type: "deterrent (military)",  weight: 0.61, polarity: "neg",       volatility: "M",  reversibility: "M", confidence: 0.75, dossiers: ["iran-usa"] },
{ from: "qatar",     to: "usa",            type: "diplomatic back-channel", weight: 0.42, polarity: "pos",     volatility: "L",  reversibility: "M", confidence: 0.80, dossiers: ["iran-usa"] },
{ from: "china",     to: "iran",           type: "sanctions-softening (oil)", weight: 0.54, polarity: "neg-West", volatility: "L", reversibility: "M", confidence: 0.78, dossiers: ["iran-usa"] },
{ from: "russia",    to: "iran",           type: "enabling (diplomatic/political)", weight: 0.38, polarity: "neg-West", volatility: "M", reversibility: "M", confidence: 0.69, dossiers: ["iran-usa"] },
{ from: "post-assad-syria", to: "iran",    type: "disabling-structural (logistics)", weight: 0.51, polarity: "neg-Iran", volatility: "L", reversibility: "L", confidence: 0.77, dossiers: ["iran-usa"] },
{ from: "iraqi-militias", to: "usa",       type: "harassment",            weight: 0.35, polarity: "neg",       volatility: "H",  reversibility: "M", confidence: 0.71, dossiers: ["iran-usa"] },
{ from: "hezbollah", to: "israel",         type: "coercive (rockets/missiles)", weight: 0.54, polarity: "neg", volatility: "H",  reversibility: "M", confidence: 0.78, dossiers: ["iran-usa"] },

// ---- Taiwan Strait ----
{ from: "tsmc",      to: "frontier-models", type: "systemic dependency",  weight: 0.91, polarity: "pos",       volatility: "M",  reversibility: "M", confidence: 0.87, dossiers: ["taiwan-strait", "ai-us-china"] },
{ from: "pla-east",  to: "taiwan",         type: "coercive grey-zone",    weight: 0.83, polarity: "neg",       volatility: "H",  reversibility: "L", confidence: 0.84, dossiers: ["taiwan-strait"] },
{ from: "us-indopacom", to: "china",       type: "deterrent posture",     weight: 0.71, polarity: "neg",       volatility: "M",  reversibility: "M", confidence: 0.78, dossiers: ["taiwan-strait"] },
{ from: "japan-sdf", to: "taiwan",         type: "enabling-deterrent",    weight: 0.62, polarity: "pos",       volatility: "M",  reversibility: "M", confidence: 0.71, dossiers: ["taiwan-strait"] },
{ from: "philippines", to: "taiwan",       type: "enabling (EDCA basing)", weight: 0.51, polarity: "pos",      volatility: "L",  reversibility: "L", confidence: 0.80, dossiers: ["taiwan-strait"] },
{ from: "china",     to: "taiwan",         type: "coercive-economic",     weight: 0.58, polarity: "neg",       volatility: "M",  reversibility: "M", confidence: 0.75, dossiers: ["taiwan-strait"] },
{ from: "china",     to: "taiwan-subsea-cables", type: "hybrid attrition", weight: 0.39, polarity: "neg",      volatility: "M",  reversibility: "L", confidence: 0.61, dossiers: ["taiwan-strait"] },
{ from: "tsmc",      to: "usa",            type: "geographic diversification (Arizona)", weight: 0.47, polarity: "pos", volatility: "L", reversibility: "L", confidence: 0.82, dossiers: ["taiwan-strait", "ai-us-china"] },
{ from: "china",     to: "rare-earths",    type: "coercion-latent (refining)", weight: 0.44, polarity: "neg",  volatility: "L",  reversibility: "L", confidence: 0.76, dossiers: ["taiwan-strait", "ai-us-china"] },
{ from: "usa",       to: "taiwan",         type: "enabling (arms sales)", weight: 0.56, polarity: "pos",       volatility: "L",  reversibility: "L", confidence: 0.83, dossiers: ["taiwan-strait"] },
{ from: "australia", to: "usa",            type: "alliance (AUKUS)",      weight: 0.48, polarity: "pos",       volatility: "L",  reversibility: "L", confidence: 0.84, dossiers: ["taiwan-strait"] },
{ from: "us-7th-fleet", to: "luzon-strait", type: "monitoring/presence", weight: 0.56, polarity: "pos",        volatility: "L",  reversibility: "L", confidence: 0.81, dossiers: ["taiwan-strait"] },

// ---- AI US-China ----
{ from: "us-bis",    to: "china-miit",     type: "coercive-technological (export controls)", weight: 0.82, polarity: "neg-China", volatility: "M", reversibility: "L", confidence: 0.86, dossiers: ["ai-us-china"] },
{ from: "china-miit", to: "smic",          type: "enabling-industrial (indigenisation)", weight: 0.71, polarity: "pos", volatility: "L", reversibility: "L", confidence: 0.81, dossiers: ["ai-us-china"] },
{ from: "usa",       to: "tsmc",           type: "resilience-building (pressure)", weight: 0.58, polarity: "pos", volatility: "L", reversibility: "L", confidence: 0.79, dossiers: ["ai-us-china"] },
{ from: "china-miit", to: "rare-earths",   type: "counter-coercive (export restrictions)", weight: 0.54, polarity: "neg-West", volatility: "L", reversibility: "L", confidence: 0.80, dossiers: ["ai-us-china"] },
{ from: "deepseek",  to: "frontier-models", type: "capability-diffusion (open-weight)", weight: 0.48, polarity: "pos", volatility: "M", reversibility: "L", confidence: 0.73, dossiers: ["ai-us-china"] },
{ from: "us-bis",    to: "netherlands",    type: "coalition-building (export controls)", weight: 0.62, polarity: "pos", volatility: "M", reversibility: "M", confidence: 0.77, dossiers: ["ai-us-china"] },
{ from: "us-bis",    to: "nvidia",         type: "regulatory (chip export restrictions)", weight: 0.71, polarity: "neg-for-revenue", volatility: "M", reversibility: "M", confidence: 0.84, dossiers: ["ai-us-china"] },
{ from: "nvidia",    to: "china",          type: "revenue-adaptive (permitted products)", weight: 0.42, polarity: "commercial", volatility: "M", reversibility: "M", confidence: 0.78, dossiers: ["ai-us-china"] },
{ from: "asml",      to: "china",          type: "restricted (EUV ban)", weight: 0.66, polarity: "neg-China", volatility: "L", reversibility: "L", confidence: 0.88, dossiers: ["ai-us-china"] },
{ from: "samsung-hynix", to: "china",      type: "enabling (HBM, constrained)", weight: 0.46, polarity: "variable", volatility: "M", reversibility: "M", confidence: 0.72, dossiers: ["ai-us-china"] },
{ from: "huawei",    to: "smic",           type: "customer-strategic",    weight: 0.62, polarity: "pos",       volatility: "L",  reversibility: "L", confidence: 0.80, dossiers: ["ai-us-china"] },

// ---- Red Sea / Houthi ----
{ from: "houthi",    to: "commercial-shipping", type: "coercive (anti-shipping)", weight: 0.84, polarity: "neg", volatility: "H", reversibility: "M", confidence: 0.86, dossiers: ["red-sea-houthis"] },
{ from: "iran",      to: "houthi",         type: "enabling-support",      weight: 0.66, polarity: "neg-indirect", volatility: "L", reversibility: "L", confidence: 0.71, dossiers: ["red-sea-houthis"] },
{ from: "prosperity-guardian", to: "houthi", type: "interdiction + strike", weight: 0.58, polarity: "neg", volatility: "M", reversibility: "M", confidence: 0.80, dossiers: ["red-sea-houthis"] },
{ from: "bab-el-mandeb", to: "europe-asia-shipping", type: "structural-reshaping (Cape reroute)", weight: 0.62, polarity: "neg-cost", volatility: "L", reversibility: "M", confidence: 0.84, dossiers: ["red-sea-houthis"] },
{ from: "suez",      to: "egyptian-fx",    type: "transmission (revenue loss)", weight: 0.54, polarity: "neg", volatility: "M", reversibility: "M", confidence: 0.81, dossiers: ["red-sea-houthis"] },
{ from: "saudi-arabia", to: "houthi",      type: "diplomatic-conservative (truce)", weight: 0.42, polarity: "pos", volatility: "L", reversibility: "L", confidence: 0.75, dossiers: ["red-sea-houthis"] },
{ from: "eu-aspides", to: "commercial-shipping", type: "defensive-escort", weight: 0.34, polarity: "pos", volatility: "L", reversibility: "M", confidence: 0.78, dossiers: ["red-sea-houthis"] },
{ from: "israel",    to: "hodeidah",       type: "punitive strikes",      weight: 0.28, polarity: "neg",       volatility: "M",  reversibility: "M", confidence: 0.72, dossiers: ["red-sea-houthis"] },
{ from: "houthi",    to: "israel",         type: "coercive (missile/drone)", weight: 0.31, polarity: "neg",    volatility: "M",  reversibility: "M", confidence: 0.74, dossiers: ["red-sea-houthis"] },
{ from: "bab-el-mandeb", to: "lloyds-market", type: "risk-pricing transmission", weight: 0.48, polarity: "systemic", volatility: "M", reversibility: "M", confidence: 0.80, dossiers: ["red-sea-houthis"] },

// ---- CROSS-CLUSTER / CROSS-DOSSIER arcs (critical for multi-theatre scenarios) ----
{ from: "russia",    to: "china",          type: "tactical alignment (non-alliance)", weight: 0.52, polarity: "neg-West", volatility: "L", reversibility: "M", confidence: 0.72, dossiers: ["russia-ukraine", "ai-us-china"] },
{ from: "usa",       to: "china",          type: "strategic rivalry (systemic)", weight: 0.74, polarity: "neg", volatility: "M", reversibility: "L", confidence: 0.84, dossiers: ["taiwan-strait", "ai-us-china"] },
{ from: "russia",    to: "iran",           type: "tactical alignment (drone supply, diplomatic)", weight: 0.48, polarity: "neg-West", volatility: "M", reversibility: "M", confidence: 0.74, dossiers: ["iran-usa"] },
{ from: "usa",       to: "europe-asia-shipping", type: "coalition enforcement", weight: 0.52, polarity: "pos", volatility: "M", reversibility: "M", confidence: 0.78, dossiers: ["red-sea-houthis"] },
{ from: "china",     to: "bab-el-mandeb",  type: "transit dependency",    weight: 0.38, polarity: "systemic",  volatility: "L",  reversibility: "L", confidence: 0.76, dossiers: ["red-sea-houthis"] },
{ from: "ksa-eastwest-pipeline", to: "hormuz", type: "bypass redundancy", weight: 0.54, polarity: "pos",       volatility: "L",  reversibility: "L", confidence: 0.83, dossiers: ["iran-hormuz", "red-sea-houthis"] }

]
};