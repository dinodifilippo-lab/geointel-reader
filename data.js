// CHESS Reader · data.js · v0.7.0
// Mock data for Atlas + 3 dossiers

window.CHESS_DATA = {

// ============ CLUSTERS on Atlas map ============
// Each cluster is a geographic macro-region with 0..N dossiers inside
clusters: [
{
id: "middle-east",
label: "Middle East",
lat: 29.0,
lon: 50.0,
dossier_ids: ["iran-hormuz"]
},
{
id: "east-asia",
label: "East Asia",
lat: 24.0,
lon: 121.0,
dossier_ids: ["taiwan-strait"]
},
{
id: "sahel",
label: "Sahel",
lat: 15.0,
lon: 0.0,
dossier_ids: []  // empty -- displayed as gray, not clickable
},
{
id: "arctic",
label: "Arctic",
lat: 78.0,
lon: 20.0,
dossier_ids: []
},
{
id: "eastern-europe",
label: "Eastern Europe",
lat: 49.0,
lon: 32.0,
dossier_ids: []
}
],

// ============ TRANS-GEOGRAPHIC dossiers (orbital ring) ============
trans_geographic_dossier_ids: ["ai-us-china"],

// ============ DOSSIERS ============
dossiers: {

```
"iran-hormuz": {
  id: "iran-hormuz",
  title: "Iran · Hormuz",
  cluster_id: "middle-east",
  stats: {
    entities: 12,
    relations: 28,
    events: 5,
    corpus: 147,
    sources: 4,
    last_update: "2h ago"
  },
  chat: [
    { role: "user", time: "14:02", text: "What is the current state of tensions in the Hormuz Strait given Iran's posture?" },
    { role: "ai", time: "14:02", text: "Produced a full analysis spanning <strong>12 entities</strong> and <strong>28 relations</strong>. Overall system volatility is elevated, with two high-weight negative arcs dominating the picture.", report_id: 3, graph_id: 3 },
    { role: "user", time: "14:07", text: "Why did you classify IRGC-Navy as an actor rather than an asset of the broader Iranian state?" },
    { role: "ai", time: "14:07", text: "Topology-based: IRGC-Navy has 7 outgoing arcs representing autonomous decisions vs 3 incoming. Multiple sources attribute agency at the organisational level below central command." },
    { role: "user", time: "14:11", text: "What happens if US Fifth Fleet withdraws 50% of carrier presence for 90 days?" },
    { role: "ai", time: "14:12", text: "Scenario evaluated. <strong>Three tipping points</strong> identified within the 90-day window, with GCC insurance premia projected to surge 40–65%.", report_id: 4, graph_id: 4 },
    { role: "user", time: "14:19", text: "Tell me more about the \"Strait closure escalation\" tipping point." },
    { role: "ai", time: "now", text: "Analysing subgraph and retrieving source passages", pending: true }
  ],
  current_report_id: 3,
  reports: {
    3: {
      id: 3,
      title: "A Strait Held <em>Under Tension</em>: Hormuz in the Spring of 2026",
      subtitle: "Iranian maritime posture, Gulf shipping risk, and the structural fragility of a 21-mile chokepoint.",
      timestamp: "Apr 20, 2026 · 14:02 UTC",
      executive_summary: "The Hormuz system is currently in a <strong>high-tension stable</strong> configuration. Iranian hybrid pressure -- naval harassment, GNSS spoofing, limpet-mine incidents -- has intensified since late 2025, but <strong>GCC diplomatic hedging</strong> and US Fifth Fleet visibility have absorbed most escalatory energy. The structural weakness is insurance: any further increment in incident frequency would likely tip the London market into a risk-repricing cycle that is hard to reverse in under nine months.",
      body_html: `
        <h2 data-num="01">The actors and what they want</h2>
        <p>Five actors carry operational weight in the current Hormuz configuration. The <span class="chip actor">● Iran (State)</span> pursues sanctions relief as its first-order objective, but has repeatedly shown willingness to trade short-term Gulf stability for leverage. The <span class="chip actor">● IRGC-Navy</span> operates with meaningful autonomy from central command, especially in harassment operations below the threshold of open confrontation.</p>
        <p>On the opposing side, the <span class="chip actor">● US Fifth Fleet</span> and <span class="chip actor">● UKMTO</span> maintain a posture oriented around deterrence and freedom-of-navigation reassurance rather than active interdiction. The <span class="chip actor">● GCC bloc</span> -- internally fractured between Saudi-Emirati alignment and Qatari-Omani hedging -- acts as a stabilising absorber rather than a driver of outcomes.</p>

        <h2 data-num="02">The assets under pressure</h2>
        <p>Three assets dominate the tension field: <span class="chip asset">◆ Strait of Hormuz</span> itself, the <span class="chip asset">◆ Kharg Oil Terminal</span> (through which ~90% of Iranian crude flows), and increasingly the <span class="chip asset">◆ Gulf GNSS infrastructure</span>, which has become a soft target for deniable disruption.</p>

        <h3>High-weight arcs to monitor</h3>
        <ul class="report-list">
          <li><strong>IRGC-Navy → Commercial Shipping</strong> · coercive, weight 0.87, volatility high, polarity strongly negative. The defining arc of the current configuration.</li>
          <li><strong>US Fifth Fleet → IRGC-Navy</strong> · deterrent, weight 0.74, volatility medium, polarity negative. Stabilising despite its confrontational signature.</li>
          <li><strong>GCC bloc → Strait of Hormuz</strong> · protective, weight 0.61, volatility low, polarity positive. The quiet stabiliser.</li>
        </ul>

        <blockquote class="pullquote">
          The Strait is not a front line -- it is a pressure gauge. What matters is not whether Iran closes it (they will not), but how much friction they can impose before the shipping market closes it for them.
          <cite>ECFR · Policy Brief · March 2026</cite>
        </blockquote>

        <h2 data-num="03">Events and inflection</h2>
        <p>Five events have shaped the current state since January. The <span class="chip event">▲ Limpet-mine incident (Jan 18)</span> reset baseline insurance premia to post-2019 levels. The <span class="chip event">▲ GNSS spoofing wave (Feb 4–Feb 27)</span> disrupted an estimated 340 transits and established a new deniable-pressure vector that did not exist eighteen months ago.</p>

        <div class="data-callout">
          <div class="data-callout-cell">
            <div class="dc-label">Incidents Q1</div>
            <div class="dc-value coral">23</div>
            <div class="dc-hint">+87% vs Q4 2025</div>
          </div>
          <div class="data-callout-cell">
            <div class="dc-label">War-risk premium</div>
            <div class="dc-value">0.45%</div>
            <div class="dc-hint">of hull value, laden</div>
          </div>
          <div class="data-callout-cell">
            <div class="dc-label">Confidence</div>
            <div class="dc-value sage">0.82</div>
            <div class="dc-hint">Corroborated ≥3 sources</div>
          </div>
        </div>

        <h2 data-num="04">What would shift the system</h2>
        <p>The configuration is sensitive to three variables: (i) the war-risk premium itself, which has a reflexive relationship with incident frequency; (ii) US carrier presence, whose withdrawal would alter the deterrence arc's weight by an estimated 0.3–0.4; (iii) Chinese diplomatic engagement with Tehran, currently dormant but capable of redirecting Iranian priorities within weeks.</p>
        <p>None of these variables is currently moving. The system is stable -- <strong>stably tense</strong>.</p>
      `,
      sources: [
        { num: "01", title: "Iran's maritime strategy after the 2025 escalation cycle", meta: "ECFR · Policy Brief", date: "2026-03-11" },
        { num: "02", title: "Gulf shipping risk: a quantitative update", meta: "Bruegel · Working Paper", date: "2026-03-04" },
        { num: "03", title: "GNSS spoofing as hybrid pressure: Iranian innovation in denial", meta: "MERICS · China Monitor", date: "2026-02-28" },
        { num: "04", title: "The GCC hedging dilemma in a multipolar Gulf", meta: "ISPI · Commentary", date: "2026-02-14" }
      ]
    }
  },
  intel: {
    confidence: { value: 0.82, label: "High confidence", note: "Corroborated across ≥3 sources. Weakest: GNSS attribution (0.64), China-Iran (0.59)." },
    top_arcs: [
      { from: "IRGC-Navy", to: "Shipping", type: "coercive", weight: 0.87, polarity: "neg", volatility: "H" },
      { from: "US 5th Fleet", to: "IRGC-Navy", type: "deterrent", weight: 0.74, polarity: "neg", volatility: "M" },
      { from: "GCC", to: "Hormuz", type: "protective", weight: 0.61, polarity: "pos", volatility: "L" }
    ],
    events: [
      { date: "2026-03-02", title: "GNSS spoofing wave concludes · 340 transits affected", active: true },
      { date: "2026-02-04", title: "GNSS spoofing wave begins in southern Gulf" },
      { date: "2026-01-18", title: "Limpet-mine incident on Liberian-flagged tanker" },
      { date: "2025-12-22", title: "IRGC drone harassment of MSC container vessel" },
      { date: "2025-11-07", title: "US carrier rotation (Eisenhower → Truman)" }
    ]
  },
  // Pre-rendered SVG graph (we keep the existing Iran-Hormuz one)
  graph_svg: `
    <defs>
      <radialGradient id="glowTeal" cx="50%" cy="50%"><stop offset="0%" stop-color="#0d7a6e" stop-opacity="0.22"/><stop offset="100%" stop-color="#0d7a6e" stop-opacity="0"/></radialGradient>
      <radialGradient id="glowAmber" cx="50%" cy="50%"><stop offset="0%" stop-color="#a8570f" stop-opacity="0.22"/><stop offset="100%" stop-color="#a8570f" stop-opacity="0"/></radialGradient>
      <radialGradient id="glowViolet" cx="50%" cy="50%"><stop offset="0%" stop-color="#5b21b6" stop-opacity="0.22"/><stop offset="100%" stop-color="#5b21b6" stop-opacity="0"/></radialGradient>
      <marker id="arrowCoral" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#b8203a"/></marker>
      <marker id="arrowSage" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#15803d"/></marker>
      <marker id="arrowMuted" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#9e9b94"/></marker>
    </defs>
    <g stroke="#e8e4d6" stroke-width="0.5" opacity="0.7">
      <line x1="0" y1="90" x2="720" y2="90"/><line x1="0" y1="180" x2="720" y2="180"/><line x1="0" y1="270" x2="720" y2="270"/>
      <line x1="180" y1="0" x2="180" y2="360"/><line x1="360" y1="0" x2="360" y2="360"/><line x1="540" y1="0" x2="540" y2="360"/>
    </g>
    <path d="M 160 110 Q 360 160 560 210" stroke="#b8203a" stroke-width="3.5" fill="none" marker-end="url(#arrowCoral)" opacity="0.85"/>
    <path d="M 160 280 Q 120 190 155 115" stroke="#b8203a" stroke-width="2.5" fill="none" marker-end="url(#arrowCoral)" opacity="0.65"/>
    <path d="M 360 60 Q 270 80 170 105" stroke="#9e9b94" stroke-width="1.5" fill="none" marker-end="url(#arrowMuted)" opacity="0.55"/>
    <path d="M 580 90 Q 600 150 570 205" stroke="#15803d" stroke-width="2.5" fill="none" marker-end="url(#arrowSage)" opacity="0.7"/>
    <path d="M 165 115 Q 370 180 558 210" stroke="#b8203a" stroke-width="2" fill="none" marker-end="url(#arrowCoral)" opacity="0.45"/>
    <path d="M 390 310 Q 475 260 560 215" stroke="#15803d" stroke-width="2" fill="none" marker-end="url(#arrowSage)" opacity="0.55"/>
    <path d="M 390 295 Q 380 180 370 75" stroke="#9e9b94" stroke-width="1.2" fill="none" marker-end="url(#arrowMuted)" opacity="0.45" stroke-dasharray="4,4"/>
    <g class="graph-node"><circle cx="160" cy="110" r="26" fill="url(#glowTeal)"/><circle cx="160" cy="110" r="13" fill="#ffffff" stroke="#0d7a6e" stroke-width="3"/><text class="graph-label" x="160" y="146" text-anchor="middle">IRGC-NAVY</text></g>
    <g class="graph-node"><circle cx="360" cy="60" r="20" fill="url(#glowTeal)"/><circle cx="360" cy="60" r="10" fill="#ffffff" stroke="#0d7a6e" stroke-width="2.5"/><text class="graph-label" x="360" y="38" text-anchor="middle">IRAN (STATE)</text></g>
    <g class="graph-node"><circle cx="160" cy="280" r="20" fill="url(#glowTeal)"/><circle cx="160" cy="280" r="10" fill="#ffffff" stroke="#0d7a6e" stroke-width="2.5"/><text class="graph-label" x="160" y="306" text-anchor="middle">US 5TH FLEET</text></g>
    <g class="graph-node"><circle cx="580" cy="90" r="18" fill="url(#glowTeal)"/><circle cx="580" cy="90" r="9" fill="#ffffff" stroke="#0d7a6e" stroke-width="2.5"/><text class="graph-label" x="580" y="68" text-anchor="middle">GCC</text></g>
    <g class="graph-node"><circle cx="390" cy="315" r="17" fill="url(#glowTeal)"/><circle cx="390" cy="315" r="8" fill="#ffffff" stroke="#0d7a6e" stroke-width="2.5"/><text class="graph-label" x="390" y="340" text-anchor="middle">UKMTO</text></g>
    <g class="graph-node"><circle cx="560" cy="215" r="28" fill="url(#glowAmber)"/><rect x="548" y="203" width="24" height="24" rx="3" fill="#ffffff" stroke="#a8570f" stroke-width="3" transform="rotate(45 560 215)"/><text class="graph-label" x="560" y="252" text-anchor="middle" fill="#a8570f">HORMUZ</text></g>
    <g class="graph-node"><circle cx="390" cy="295" r="16" fill="url(#glowAmber)"/><rect x="383" y="288" width="14" height="14" rx="2" fill="#ffffff" stroke="#a8570f" stroke-width="2.5" transform="rotate(45 390 295)"/></g>
    <g class="graph-node"><circle cx="310" cy="200" r="16" fill="url(#glowViolet)"/><polygon points="310,190 320,204 300,204" fill="#ffffff" stroke="#5b21b6" stroke-width="2.5"/><text class="graph-label" x="310" y="228" text-anchor="middle" fill="#5b21b6">JAN 18</text></g>
  `
},

// ---------- TAIWAN STRAIT ----------
"taiwan-strait": {
  id: "taiwan-strait",
  title: "Taiwan Strait",
  cluster_id: "east-asia",
  stats: {
    entities: 14,
    relations: 32,
    events: 7,
    corpus: 198,
    sources: 5,
    last_update: "6h ago"
  },
  chat: [
    { role: "user", time: "10:22", text: "Assess the current posture around Taiwan given PLA grey-zone activity." },
    { role: "ai", time: "10:22", text: "Produced a full analysis across <strong>14 entities</strong> and <strong>32 relations</strong>. System is in a <em>high-pressure, slowly-escalating</em> configuration, with semiconductor supply chain as structural anchor.", report_id: 1, graph_id: 1 },
    { role: "user", time: "10:35", text: "What role does TSMC play in the deterrence posture?" },
    { role: "ai", time: "10:35", text: "TSMC is classified as an asset with exceptionally high systemic weight (0.91) -- the \"silicon shield\" hypothesis. Disruption would cascade globally within 4–8 weeks." }
  ],
  current_report_id: 1,
  reports: {
    1: {
      id: 1,
      title: "The <em>Silicon Shield</em>: Taiwan's Strategic Leverage in 2026",
      subtitle: "PLA grey-zone escalation, semiconductor supply chain, and the deterrence by denial posture.",
      timestamp: "Apr 20, 2026 · 10:22 UTC",
      executive_summary: "The Taiwan Strait has settled into a <strong>high-pressure equilibrium</strong>, with PLA daily ADIZ incursions now averaging 28/day -- a new normal that has desensitised diplomatic reaction. The structural anchor remains <strong>TSMC</strong>: no credible scenario analysis produces a PLA action that bypasses the semiconductor disruption cost, which is now priced into both Washington's and Beijing's calculations.",
      body_html: `
        <h2 data-num="01">The actors in the strait</h2>
        <p>Six actors dominate. The <span class="chip actor">● PRC (Beijing)</span> and <span class="chip actor">● PLA Eastern Theater</span> operate in near-coordination but with the latter enjoying tactical autonomy for grey-zone activity. The <span class="chip actor">● ROC (Taipei)</span> has shifted posture post-2024 elections toward harder deterrence. The <span class="chip actor">● US INDOPACOM</span> maintains visibility without direct engagement.</p>
        <p>Two second-order actors matter: <span class="chip actor">● Japan (SDF)</span> is increasingly overt in Taiwan contingency planning, and the <span class="chip actor">● Philippines</span> has transitioned from hedger to aligned partner via EDCA expansion.</p>

        <h2 data-num="02">The silicon shield</h2>
        <p>The singular structural asset is <span class="chip asset">◆ TSMC</span>, whose Hsinchu and Tainan fabs produce >60% of global advanced-node capacity. No other node in the entire CHESS KG has higher outgoing impact weight.</p>

        <blockquote class="pullquote">
          If TSMC goes offline, the world's AI infrastructure stops within a fiscal quarter. Beijing knows this. Washington knows this. Taipei has built its entire deterrence doctrine on this.
          <cite>CSIS · Asia Program · February 2026</cite>
        </blockquote>

        <h2 data-num="03">Grey-zone tempo</h2>
        <p>ADIZ incursions have become routine. The <span class="chip event">▲ December 2025 combined exercise</span> was the largest since 2022 but produced no new escalation. Three <span class="chip event">▲ subsea cable incidents</span> (Matsu) suggest a sustained low-intensity harassment pattern consistent with Russian Baltic methods.</p>

        <div class="data-callout">
          <div class="data-callout-cell">
            <div class="dc-label">ADIZ incursions</div>
            <div class="dc-value coral">28/day</div>
            <div class="dc-hint">Q1 2026 avg</div>
          </div>
          <div class="data-callout-cell">
            <div class="dc-label">TSMC impact weight</div>
            <div class="dc-value">0.91</div>
            <div class="dc-hint">highest in KG</div>
          </div>
          <div class="data-callout-cell">
            <div class="dc-label">Confidence</div>
            <div class="dc-value sage">0.79</div>
            <div class="dc-hint">Corroborated ≥4 sources</div>
          </div>
        </div>

        <h2 data-num="04">What would shift the system</h2>
        <p>The most sensitive variables are (i) Japanese formal inclusion in Taiwan contingency doctrine, (ii) any technical disruption affecting TSMC independent of PLA action (fab accidents, power grid), (iii) US presidential policy continuity post-2028. None are moving on short horizon.</p>
      `,
      sources: [
        { num: "01", title: "Taiwan's deterrence by denial: an updated assessment", meta: "CSIS · Asia Program", date: "2026-03-18" },
        { num: "02", title: "PLA grey-zone operations: patterns and thresholds", meta: "MERICS · Security Brief", date: "2026-03-02" },
        { num: "03", title: "The silicon shield reconsidered", meta: "CFR · Backgrounder", date: "2026-02-21" },
        { num: "04", title: "Japan-Taiwan security cooperation in 2026", meta: "ISPI · Commentary", date: "2026-02-10" },
        { num: "05", title: "Subsea infrastructure vulnerability in the Western Pacific", meta: "Bruegel · Working Paper", date: "2026-01-28" }
      ]
    }
  },
  intel: {
    confidence: { value: 0.79, label: "High confidence", note: "Corroborated across ≥4 sources. Weakest: PLA internal decision-making (0.48), Japan SDF doctrinal shift (0.62)." },
    top_arcs: [
      { from: "TSMC", to: "Global supply chain", type: "systemic", weight: 0.91, polarity: "pos", volatility: "M" },
      { from: "PLA", to: "ROC airspace", type: "coercive", weight: 0.83, polarity: "neg", volatility: "H" },
      { from: "US INDOPACOM", to: "PRC", type: "deterrent", weight: 0.71, polarity: "neg", volatility: "M" }
    ],
    events: [
      { date: "2026-03-15", title: "PLA combined exercise -- 54 aircraft, 9 vessels", active: true },
      { date: "2026-02-28", title: "Matsu subsea cable cut (3rd incident this quarter)" },
      { date: "2026-01-11", title: "Taiwan legislative elections -- DPP retains executive" },
      { date: "2025-12-09", title: "Largest post-2022 combined exercise around Taiwan" },
      { date: "2025-10-15", title: "Japan-US 2+2 includes Taiwan contingency language" }
    ]
  },
  graph_svg: `
    <defs>
      <radialGradient id="glowTeal2" cx="50%" cy="50%"><stop offset="0%" stop-color="#0d7a6e" stop-opacity="0.22"/><stop offset="100%" stop-color="#0d7a6e" stop-opacity="0"/></radialGradient>
      <radialGradient id="glowAmber2" cx="50%" cy="50%"><stop offset="0%" stop-color="#a8570f" stop-opacity="0.22"/><stop offset="100%" stop-color="#a8570f" stop-opacity="0"/></radialGradient>
      <radialGradient id="glowViolet2" cx="50%" cy="50%"><stop offset="0%" stop-color="#5b21b6" stop-opacity="0.22"/><stop offset="100%" stop-color="#5b21b6" stop-opacity="0"/></radialGradient>
      <marker id="arrowCoral2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#b8203a"/></marker>
      <marker id="arrowSage2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#15803d"/></marker>
      <marker id="arrowMuted2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#9e9b94"/></marker>
    </defs>
    <g stroke="#e8e4d6" stroke-width="0.5" opacity="0.7">
      <line x1="0" y1="90" x2="720" y2="90"/><line x1="0" y1="180" x2="720" y2="180"/><line x1="0" y1="270" x2="720" y2="270"/>
      <line x1="180" y1="0" x2="180" y2="360"/><line x1="360" y1="0" x2="360" y2="360"/><line x1="540" y1="0" x2="540" y2="360"/>
    </g>
    <!-- PLA -> ROC airspace -->
    <path d="M 150 80 Q 300 180 440 180" stroke="#b8203a" stroke-width="3.2" fill="none" marker-end="url(#arrowCoral2)" opacity="0.85"/>
    <!-- INDOPACOM -> PRC -->
    <path d="M 600 280 Q 400 200 170 120" stroke="#b8203a" stroke-width="2.3" fill="none" marker-end="url(#arrowCoral2)" opacity="0.6"/>
    <!-- TSMC -> global (goes to edge) -->
    <path d="M 440 200 Q 560 160 680 100" stroke="#15803d" stroke-width="3.5" fill="none" marker-end="url(#arrowSage2)" opacity="0.8"/>
    <!-- Japan -> ROC -->
    <path d="M 540 80 Q 490 130 445 175" stroke="#15803d" stroke-width="2" fill="none" marker-end="url(#arrowSage2)" opacity="0.6"/>
    <!-- Philippines -> INDOPACOM -->
    <path d="M 520 320 Q 570 300 598 288" stroke="#9e9b94" stroke-width="1.4" fill="none" marker-end="url(#arrowMuted2)" opacity="0.5"/>
    <!-- PRC -> PLA (command) -->
    <path d="M 100 60 Q 120 70 145 78" stroke="#9e9b94" stroke-width="1.5" fill="none" marker-end="url(#arrowMuted2)" opacity="0.55" stroke-dasharray="4,4"/>

    <!-- PRC -->
    <g class="graph-node"><circle cx="90" cy="55" r="20" fill="url(#glowTeal2)"/><circle cx="90" cy="55" r="10" fill="#ffffff" stroke="#0d7a6e" stroke-width="2.5"/><text class="graph-label" x="90" y="33" text-anchor="middle">PRC</text></g>
    <!-- PLA Eastern -->
    <g class="graph-node"><circle cx="150" cy="80" r="22" fill="url(#glowTeal2)"/><circle cx="150" cy="80" r="11" fill="#ffffff" stroke="#0d7a6e" stroke-width="2.8"/><text class="graph-label" x="150" y="112" text-anchor="middle">PLA EAST</text></g>
    <!-- ROC -->
    <g class="graph-node"><circle cx="445" cy="180" r="20" fill="url(#glowTeal2)"/><circle cx="445" cy="180" r="10" fill="#ffffff" stroke="#0d7a6e" stroke-width="2.5"/><text class="graph-label" x="445" y="158" text-anchor="middle">ROC</text></g>
    <!-- INDOPACOM -->
    <g class="graph-node"><circle cx="600" cy="285" r="20" fill="url(#glowTeal2)"/><circle cx="600" cy="285" r="10" fill="#ffffff" stroke="#0d7a6e" stroke-width="2.5"/><text class="graph-label" x="600" y="312" text-anchor="middle">INDOPACOM</text></g>
    <!-- Japan -->
    <g class="graph-node"><circle cx="540" cy="75" r="18" fill="url(#glowTeal2)"/><circle cx="540" cy="75" r="9" fill="#ffffff" stroke="#0d7a6e" stroke-width="2.5"/><text class="graph-label" x="540" y="53" text-anchor="middle">JAPAN SDF</text></g>
    <!-- Philippines -->
    <g class="graph-node"><circle cx="510" cy="325" r="14" fill="url(#glowTeal2)"/><circle cx="510" cy="325" r="7" fill="#ffffff" stroke="#0d7a6e" stroke-width="2"/><text class="graph-label" x="510" y="348" text-anchor="middle">PHIL</text></g>

    <!-- TSMC -- large asset -->
    <g class="graph-node"><circle cx="440" cy="205" r="32" fill="url(#glowAmber2)"/><rect x="425" y="190" width="28" height="28" rx="3" fill="#ffffff" stroke="#a8570f" stroke-width="3.2" transform="rotate(45 440 205)"/><text class="graph-label" x="440" y="248" text-anchor="middle" fill="#a8570f">TSMC</text></g>
    <!-- Subsea cables -->
    <g class="graph-node"><circle cx="380" cy="110" r="14" fill="url(#glowAmber2)"/><rect x="373" y="103" width="14" height="14" rx="2" fill="#ffffff" stroke="#a8570f" stroke-width="2.5" transform="rotate(45 380 110)"/><text class="graph-label" x="380" y="88" text-anchor="middle" fill="#a8570f">CABLES</text></g>

    <!-- Event: Dec 2025 exercise -->
    <g class="graph-node"><circle cx="290" cy="130" r="14" fill="url(#glowViolet2)"/><polygon points="290,122 299,135 281,135" fill="#ffffff" stroke="#5b21b6" stroke-width="2.5"/><text class="graph-label" x="290" y="156" text-anchor="middle" fill="#5b21b6">DEC '25</text></g>
  `
},

// ---------- AI · US-CHINA TECH RIVALRY (trans-geographic) ----------
"ai-us-china": {
  id: "ai-us-china",
  title: "AI · US–China Tech Rivalry",
  cluster_id: null,
  trans_geographic: true,
  stats: {
    entities: 18,
    relations: 41,
    events: 9,
    corpus: 224,
    sources: 6,
    last_update: "1d ago"
  },
  chat: [
    { role: "user", time: "09:15", text: "Current state of the AI compute export control regime and its effects on Chinese frontier model development." },
    { role: "ai", time: "09:15", text: "Analysis spans <strong>18 entities</strong> across US, China, Netherlands, Taiwan, South Korea. Export control regime is <em>tightening but leaking</em> -- 3 high-weight arcs indicate regulatory arbitrage escalation.", report_id: 1, graph_id: 1 }
  ],
  current_report_id: 1,
  reports: {
    1: {
      id: 1,
      title: "A <em>Tightening Leak</em>: Compute Export Controls in 2026",
      subtitle: "BIS regulation, Chinese workarounds, and the fragmentation of the global AI compute stack.",
      timestamp: "Apr 20, 2026 · 09:15 UTC",
      executive_summary: "The US compute export control regime has entered its <strong>third iteration</strong> and is now genuinely biting -- Chinese frontier labs face a 12–18 month hardware lag. However the regime is <strong>regulatorily porous</strong>: third-country transshipment (UAE, Malaysia, Vietnam) absorbs an estimated 15–25% of restricted chip volume. The structural question is whether enforcement can tighten faster than workarounds evolve. On current trajectory: no.",
      body_html: `
        <h2 data-num="01">The regulators and the regulated</h2>
        <p>Five regulators carry weight: the <span class="chip actor">● US BIS</span> as primary rule-maker, the <span class="chip actor">● Netherlands (ASML export licensing)</span> with veto over EUV tooling, <span class="chip actor">● Japan METI</span> on precursor equipment, <span class="chip actor">● South Korea</span> on HBM memory, and <span class="chip actor">● Taiwan MOEA</span> on fab output destination.</p>
        <p>On the other side, the <span class="chip actor">● PRC (MIIT)</span> and <span class="chip actor">● Chinese frontier labs</span> operate a portfolio of hardware substitution, algorithmic efficiency, and third-country sourcing.</p>

        <h2 data-num="02">The assets: chips, tools, memory</h2>
        <p>The three chokepoint assets are <span class="chip asset">◆ H100/H200 class GPUs</span>, <span class="chip asset">◆ EUV lithography</span> (ASML monopoly), and <span class="chip asset">◆ HBM3e memory</span> (SK Hynix + Samsung + Micron). Each has a different elasticity: GPUs are substitutable at performance cost, EUV is not substitutable at any cost, HBM has two-year lead times.</p>

        <blockquote class="pullquote">
          The export control regime is not failing. It is doing exactly what it was designed to do: impose a 12–18 month lag. The question is whether that lag is decisive or merely annoying.
          <cite>CSIS · Technology Competition Paper · February 2026</cite>
        </blockquote>

        <h2 data-num="03">Events and inflection</h2>
        <p>Nine events define the 2025–26 cycle. The <span class="chip event">▲ October 2023 BIS update</span> was the first bite. The <span class="chip event">▲ October 2024 expansion</span> closed chiplet workarounds. The <span class="chip event">▲ UAE transshipment disclosure (Nov 2025)</span> revealed enforcement gaps. Most recently the <span class="chip event">▲ March 2026 BIS sub-threshold rule</span> targets sub-sanctions-threshold shipments.</p>

        <div class="data-callout">
          <div class="data-callout-cell">
            <div class="dc-label">Lag imposed</div>
            <div class="dc-value">12–18 mo</div>
            <div class="dc-hint">on frontier compute</div>
          </div>
          <div class="data-callout-cell">
            <div class="dc-label">Leakage est.</div>
            <div class="dc-value coral">15–25%</div>
            <div class="dc-hint">via third countries</div>
          </div>
          <div class="data-callout-cell">
            <div class="dc-label">Confidence</div>
            <div class="dc-value sage">0.71</div>
            <div class="dc-hint">High for regulation, lower for leakage</div>
          </div>
        </div>

        <h2 data-num="04">What would shift the system</h2>
        <p>The system is sensitive to (i) any breakthrough in algorithmic compute efficiency that reduces hardware dependency (Chinese incentive is maximal), (ii) a Taiwan contingency that disrupts TSMC regardless of regime design, (iii) political continuity of the BIS regime post-2028.</p>
      `,
      sources: [
        { num: "01", title: "The October 2024 export controls: assessment at 18 months", meta: "CSIS · Technology Program", date: "2026-03-28" },
        { num: "02", title: "Chinese frontier models in the post-H100 era", meta: "MERICS · AI Tracker", date: "2026-03-15" },
        { num: "03", title: "Third-country transshipment and the limits of enforcement", meta: "Bruegel · Policy Contribution", date: "2026-03-04" },
        { num: "04", title: "ASML, METI, and the coalition of the necessary", meta: "CFR · Backgrounder", date: "2026-02-19" },
        { num: "05", title: "HBM memory as the next chokepoint", meta: "PIIE · Working Paper", date: "2026-02-02" },
        { num: "06", title: "Compute efficiency, not compute volume", meta: "ECFR · Policy Brief", date: "2026-01-20" }
      ]
    }
  },
  intel: {
    confidence: { value: 0.71, label: "Good confidence", note: "Regulation well-documented. Leakage estimates have wide uncertainty bands. Chinese internal labs opaque." },
    top_arcs: [
      { from: "US BIS", to: "Chinese labs", type: "restrictive", weight: 0.89, polarity: "neg", volatility: "M" },
      { from: "ASML", to: "China fabs", type: "gatekeeping", weight: 0.86, polarity: "neg", volatility: "L" },
      { from: "UAE/Malaysia", to: "Chinese labs", type: "bypass", weight: 0.58, polarity: "pos", volatility: "H" }
    ],
    events: [
      { date: "2026-03-20", title: "BIS sub-threshold rule · closes <$3k shipment loophole", active: true },
      { date: "2025-11-08", title: "UAE transshipment disclosure -- 40k GPUs rerouted" },
      { date: "2025-09-12", title: "Netherlands expands ASML DUV restrictions" },
      { date: "2024-10-17", title: "BIS October 2024 expansion · chiplet workaround closed" },
      { date: "2023-10-17", title: "First BIS comprehensive chip control package" }
    ]
  },
  graph_svg: `
    <defs>
      <radialGradient id="glowTeal3" cx="50%" cy="50%"><stop offset="0%" stop-color="#0d7a6e" stop-opacity="0.22"/><stop offset="100%" stop-color="#0d7a6e" stop-opacity="0"/></radialGradient>
      <radialGradient id="glowAmber3" cx="50%" cy="50%"><stop offset="0%" stop-color="#a8570f" stop-opacity="0.22"/><stop offset="100%" stop-color="#a8570f" stop-opacity="0"/></radialGradient>
      <radialGradient id="glowViolet3" cx="50%" cy="50%"><stop offset="0%" stop-color="#5b21b6" stop-opacity="0.22"/><stop offset="100%" stop-color="#5b21b6" stop-opacity="0"/></radialGradient>
      <marker id="arrowCoral3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#b8203a"/></marker>
      <marker id="arrowSage3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#15803d"/></marker>
      <marker id="arrowMuted3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#9e9b94"/></marker>
    </defs>
    <g stroke="#e8e4d6" stroke-width="0.5" opacity="0.7">
      <line x1="0" y1="90" x2="720" y2="90"/><line x1="0" y1="180" x2="720" y2="180"/><line x1="0" y1="270" x2="720" y2="270"/>
      <line x1="180" y1="0" x2="180" y2="360"/><line x1="360" y1="0" x2="360" y2="360"/><line x1="540" y1="0" x2="540" y2="360"/>
    </g>
    <!-- BIS -> Chinese labs (strongest negative) -->
    <path d="M 130 90 Q 360 150 590 200" stroke="#b8203a" stroke-width="3.8" fill="none" marker-end="url(#arrowCoral3)" opacity="0.85"/>
    <!-- ASML -> China fabs -->
    <path d="M 370 55 Q 480 130 585 205" stroke="#b8203a" stroke-width="3" fill="none" marker-end="url(#arrowCoral3)" opacity="0.75"/>
    <!-- UAE bypass -> Chinese labs (positive for target) -->
    <path d="M 410 310 Q 500 260 585 215" stroke="#15803d" stroke-width="2.5" fill="none" marker-end="url(#arrowSage3)" opacity="0.7" stroke-dasharray="6,3"/>
    <!-- METI -> ASML coordination -->
    <path d="M 540 60 Q 460 50 380 55" stroke="#9e9b94" stroke-width="1.4" fill="none" marker-end="url(#arrowMuted3)" opacity="0.55"/>
    <!-- Korea HBM -> Chinese labs -->
    <path d="M 250 310 Q 420 260 585 220" stroke="#b8203a" stroke-width="2.2" fill="none" marker-end="url(#arrowCoral3)" opacity="0.55"/>
    <!-- BIS -> TSMC destination -->
    <path d="M 125 95 Q 230 180 280 245" stroke="#9e9b94" stroke-width="1.2" fill="none" marker-end="url(#arrowMuted3)" opacity="0.4" stroke-dasharray="4,4"/>

    <!-- US BIS -->
    <g class="graph-node"><circle cx="125" cy="90" r="24" fill="url(#glowTeal3)"/><circle cx="125" cy="90" r="12" fill="#ffffff" stroke="#0d7a6e" stroke-width="3"/><text class="graph-label" x="125" y="125" text-anchor="middle">US BIS</text></g>
    <!-- ASML -->
    <g class="graph-node"><circle cx="375" cy="55" r="20" fill="url(#glowTeal3)"/><circle cx="375" cy="55" r="10" fill="#ffffff" stroke="#0d7a6e" stroke-width="2.5"/><text class="graph-label" x="375" y="33" text-anchor="middle">ASML (NL)</text></g>
    <!-- METI -->
    <g class="graph-node"><circle cx="555" cy="60" r="16" fill="url(#glowTeal3)"/><circle cx="555" cy="60" r="8" fill="#ffffff" stroke="#0d7a6e" stroke-width="2.3"/><text class="graph-label" x="555" y="38" text-anchor="middle">METI</text></g>
    <!-- MIIT (PRC) -->
    <g class="graph-node"><circle cx="600" cy="210" r="24" fill="url(#glowTeal3)"/><circle cx="600" cy="210" r="12" fill="#ffffff" stroke="#0d7a6e" stroke-width="3"/><text class="graph-label" x="600" y="244" text-anchor="middle">MIIT / LABS</text></g>
    <!-- UAE bypass -->
    <g class="graph-node"><circle cx="400" cy="315" r="16" fill="url(#glowTeal3)"/><circle cx="400" cy="315" r="8" fill="#ffffff" stroke="#0d7a6e" stroke-width="2.3"/><text class="graph-label" x="400" y="340" text-anchor="middle">UAE / MY</text></g>

    <!-- H100 GPUs -->
    <g class="graph-node"><circle cx="260" cy="175" r="22" fill="url(#glowAmber3)"/><rect x="248" y="163" width="22" height="22" rx="3" fill="#ffffff" stroke="#a8570f" stroke-width="2.8" transform="rotate(45 260 175)"/><text class="graph-label" x="260" y="210" text-anchor="middle" fill="#a8570f">GPU H100+</text></g>
    <!-- EUV -->
    <g class="graph-node"><circle cx="450" cy="170" r="18" fill="url(#glowAmber3)"/><rect x="441" y="161" width="18" height="18" rx="2" fill="#ffffff" stroke="#a8570f" stroke-width="2.5" transform="rotate(45 450 170)"/><text class="graph-label" x="450" y="200" text-anchor="middle" fill="#a8570f">EUV</text></g>
    <!-- HBM (SK Korea) -->
    <g class="graph-node"><circle cx="245" cy="315" r="18" fill="url(#glowAmber3)"/><rect x="236" y="306" width="18" height="18" rx="2" fill="#ffffff" stroke="#a8570f" stroke-width="2.5" transform="rotate(45 245 315)"/><text class="graph-label" x="245" y="345" text-anchor="middle" fill="#a8570f">HBM (KR)</text></g>

    <!-- Event: Oct '24 -->
    <g class="graph-node"><circle cx="290" cy="115" r="14" fill="url(#glowViolet3)"/><polygon points="290,107 299,120 281,120" fill="#ffffff" stroke="#5b21b6" stroke-width="2.5"/><text class="graph-label" x="290" y="141" text-anchor="middle" fill="#5b21b6">OCT '24</text></g>
    <!-- Event: Mar '26 -->
    <g class="graph-node"><circle cx="180" cy="165" r="14" fill="url(#glowViolet3)"/><polygon points="180,157 189,170 171,170" fill="#ffffff" stroke="#5b21b6" stroke-width="2.5"/><text class="graph-label" x="180" y="191" text-anchor="middle" fill="#5b21b6">MAR '26</text></g>
  `
}
```

}
};

console.log(`CHESS Reader data loaded: ${Object.keys(window.CHESS_DATA.dossiers).length} dossiers, ${window.CHESS_DATA.clusters.length} clusters`);