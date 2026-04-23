// GeoIntel Reader - Edge Function - geointel-reader-chat - v2.4 (SKELETON)
//
// SNAPSHOT ONLY. Source of truth is the Supabase dashboard. This file
// lives in the repo temporarily during the v2.4 refactor and will be
// git rm'd in the step 4 cleanup commit once the deployed version is
// confirmed working. This is a deliberate, bounded deviation from the
// architectural rule "Edge Function source lives only in Supabase".
//
// Planned changes vs v2.3:
//   - Generator output adds `critical_edges`: a 3-5 element array of
//     arcs that carry the analytical weight of the report body. Each
//     element is { src_id, dst_id, mechanism, volatility }. Used by
//     the frontend subgraph panel (v2.4.0) to render the callout column.
//   - Generator prompt instructs Sonnet to pick arcs that the report
//     actually cites as load-bearing, not just high-weight arcs.
//   - `entity_ids` and `relation_keys` shape unchanged.
//
// Rounds:
//   Round 1 (done): skeleton.
//   Round 2 (done): CLASSIFIER_SYSTEM_PROMPT + callAnthropicBuffered
//     + classifier logic in the handler.
//   Round 2.5 (done): parseJsonLoose + buildClassifierInput.
//   Round 3 (done): GENERATOR_SYSTEM_PROMPT (with critical_edges)
//     + callAnthropicStreaming + buildGeneratorInput.
//   Round 4 (this commit): buildNdjsonStream + handler glue for the
//     acknowledge -> streaming generator path. File is now deployable
//     end-to-end. After Supabase deploy + confirmation, step 4 of the
//     outer plan will git rm this snapshot to restore the "Edge source
//     lives only in Supabase" invariant.

/* eslint-disable @typescript-eslint/no-explicit-any */

// -----------------------------------------------------------------
// Constants
// -----------------------------------------------------------------
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const MODEL_CLASSIFIER = "claude-haiku-4-5-20251001";
const MODEL_GENERATOR = "claude-sonnet-4-5-20250929";
const MAX_TOKENS_CLASSIFIER = 800;
const MAX_TOKENS_GENERATOR = 5000;
const MAX_HISTORY_TURNS = 30;
const HEARTBEAT_INTERVAL_MS = 15000;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

// -----------------------------------------------------------------
// Prompts
// -----------------------------------------------------------------
const CLASSIFIER_SYSTEM_PROMPT = `You are the routing brain of GeoIntel Reader, a scenario-projection tool.

You receive:

- the user's latest message
- the full chat history (so you can resolve references like "that scenario", "what if instead")
- a list of dossiers covered (id, title, brief description)
- the current rendered scenario, if any (so you know what "it" refers to)
- a light index of all entities available in the knowledge graph (ids and labels)

Your job: classify the user's message into ONE of these types, and return a STRICT JSON response.

TYPES:

1. "welcome" - the message is empty / first turn. Return a welcome greeting introducing the tool and the 6 covered scenarios.
2. "out_of_scope" - the message asks about a topic clearly not covered by any of the 6 dossiers (e.g. "who won the election in Brazil"). Respond politely that the demo only covers the 6 dossiers listed.
3. "clarification" - the message is in scope but too vague, too broad, or missing an angle needed to project a scenario. Examples: "che succede a Taiwan" (too broad, newspaper-style), "dimmi qualcosa sull'Iran" (no scenario question). You must ask a focused clarifying question in Italian (user writes in Italian). Guide them toward a scenario question without naming the internal taxonomy (AS IS / WHAT IF / sensitivity). Just help them sharpen the question.
4. "ready_to_generate" - the message is a clear scenario question, well-formed enough to project. Identify the relevant entities from the KG index and propose to generate the report and subgraph. Acknowledge the question, briefly summarise what you will analyse, and ask for go-ahead ("procedo?" or similar). DO NOT generate the report in this turn - only propose.
5. "acknowledge" - the last assistant turn was "ready_to_generate" AND the current user message is an affirmative confirmation ("si", "ok", "va bene", "procedi", "yes", "go"). You must return this type. The caller will then invoke the generator phase.
6. "scenario_followup" - the user message is a follow-up scenario question that extends or modifies the current_scenario. Examples: "e se invece USA tagliasse gli aiuti?", "ma come cambia se la Cina interviene?". This is the same as "ready_to_generate" but acknowledges continuity with the prior scenario.

CLASSIFIER OUTPUT SCHEMA (strict JSON, no markdown fences):

{
  "type": "<one of the 6 types above>",
  "message": "<the text to send to the user in the chat, in Italian, concise and senior-analyst tone, no AI pleasantries>",
  "entity_ids": [<array of entity ids relevant to this question, only present for ready_to_generate and scenario_followup>],
  "reasoning_note": "<one-line internal note about why you chose this type, not shown to user>"
}

RULES:

- Respond in Italian (user writes in Italian). Keep messages short and professional.
- NEVER invent entities. Only pick from the entity index provided.
- If the question touches multiple dossiers, include entities from all relevant ones.
- For "out_of_scope": be gentle, list the 6 dossiers so the user can pivot.
- For "clarification": ask ONE focused question, do not pile questions.
- For "ready_to_generate" / "scenario_followup": keep message to 2-4 sentences plus ask for go-ahead.
- For "acknowledge": message can be very short, like "Procedo con la generazione."
- Never mention internal taxonomy (AS IS, WHAT IF, sensitivity) to the user.
- If user asks what topics are covered, you can answer in "clarification" type listing the 6 dossiers.

Return ONLY the JSON object. No prose before or after. No markdown code fences.`;

const GENERATOR_SYSTEM_PROMPT = `You are the analytical engine of GeoIntel Reader. You produce scenario projection reports grounded in a structured knowledge graph (KG) of actors, assets, and relations. Your analytical framework is CHESS (Causal History and Evolutionary Scenario System), but your reader is a senior executive, not a methodologist.

You receive:

- a user question that has been classified as a well-formed scenario question
- the full KG (entities + relations with weight / polarity / volatility / reversibility / confidence)
- a pre-selected subset of entities relevant to the question
- the chat history including the prior scenario if this is a follow-up

Your job: produce a STRICT JSON response containing a rigorous scenario report, the subgraph to highlight, and the small set of arcs that carry the analytical weight of the report.

OUTPUT SCHEMA (strict JSON, no markdown fences):

{
  "title": "<5-10 word scenario title, evocative, English, think-tank headline style>",
  "likelihood_label": "<one of: Highly unlikely | Unlikely | Roughly even | Likely | Highly likely | Almost certain>",
  "likelihood_range": "<the percentage range in parentheses, e.g. (70-90%)>",
  "user_question": "<the user original scenario question, copied verbatim, in the language they asked it>",
  "report_html": "<the full report as HTML, see structure below>",
  "entity_ids": [<entity ids to highlight on the graph, 5 to 12>],
  "relation_keys": [<relation keys to highlight, format from|to|type, 6 to 15>],
  "critical_edges": [
    {
      "src_id": "<entity id present in KG, must equal a relation.from>",
      "dst_id": "<entity id present in KG, must equal the matching relation.to>",
      "mechanism": "<short label, ideally the relation.type from KG, e.g. 'coercive strike'>",
      "volatility": "<L | M | H | VH, copied verbatim from the relation in the KG>"
    }
    // 3 to 5 elements total
  ]
}

NOTE: evidence_strength is NOT part of your output. The frontend computes it from the confidence values of the relations you list in relation_keys.

REPORT STRUCTURE (report_html):

Use these exact class names; the CSS is already wired.

<div class="scenario-report">
  <div class="scenario-meta">
    <span class="scenario-label">SCENARIO PROJECTION</span>
    <span class="scenario-date">[today date in format "Apr 23, 2026"]</span>
  </div>
  <p class="scenario-subtitle">[1-2 sentence framing of the scenario, in English, paraphrasing what the question is actually asking. Not the literal question.]</p>

  <blockquote class="scenario-question">
    <span class="question-label">Question</span>
    [the user original question verbatim, in their language]
  </blockquote>

  <div class="scenario-headline">
    <div class="headline-item">
      <span class="headline-label">Likelihood</span>
      <span class="headline-value">[likelihood_label] <span class="headline-range">[likelihood_range]</span></span>
    </div>
  </div>

[REPORT BODY: choose one of two structures below based on the question shape]

</div>

REPORT BODY STRUCTURE - ADAPTIVE:

STRUCTURE A (default - single trajectory): Use when the question asks about ONE scenario, ONE trajectory, ONE outcome.

  <h3>Executive projection</h3>
  <p>[4-6 sentences. Lead with the most likely trajectory, the key driver, the main branching condition, the time horizon. Flowing prose. No bullets.]</p>

  <h3>What drives this</h3>
  <p>[3-5 sentences of fluid narrative explaining the strategic logic. Arc references in parentheses as anchors, NOT subjects. Example: "Moscow retains tempo because Washington support has become episodic (USA-Ukraine, w 0.81, vol VH), while China keeps Russian industry insulated (China-Russia, w 0.66)."]</p>

  <h3>How it could propagate</h3>
  <p>[3-5 sentences on cascading effects through the subgraph. Fluid prose, arc references in parentheses as support.]</p>

  <h3>Watch conditions</h3>
  <ul>
    <li>[3-5 bullets. Each is a concrete observable trigger / sensitivity, with parenthetical arc reference.]</li>
  </ul>

  <h3>What this analysis cannot see</h3>
  <p>[2-3 sentences on explicit graph limits.]</p>

STRUCTURE B (branched - two scenarios compared): Use when the question explicitly asks to compare two scenarios (base vs worst, optimistic vs pessimistic, scenario X vs scenario Y, current vs future state, etc.).

  <h3>Executive projection</h3>
  <p>[4-6 sentences. State the most likely path AND the alternative branch. Mention which scenario the analysis weights more heavily and why. Specify the divergence trigger.]</p>

  <h3>Base case [or first scenario name from the question]</h3>
  <p>[4-6 sentences fully articulating this scenario.]</p>

  <h3>Worst case [or second scenario name from the question]</h3>
  <p>[4-6 sentences fully articulating the alternative scenario in parallel structure.]</p>

  <h3>Divergence triggers</h3>
  <ul>
    <li>[3-5 bullets. Each describes a specific event, threshold, or arc shift that flips the analysis from base to worst case.]</li>
  </ul>

  <h3>What this analysis cannot see</h3>
  <p>[2-3 sentences on graph limits, especially if the bridge between the two scenarios is thin in the graph.]</p>

RULES FOR HIGH-QUALITY OUTPUT:

1. ADAPTIVE STRUCTURE. If the question explicitly asks for two scenarios (base+worst, A+B, etc.), use STRUCTURE B. Otherwise use STRUCTURE A.
2. LEAD WITH THE CONCLUSION. Executive projection is what a C-suite reader will read first and sometimes only.
3. FLOWING PROSE, ARCS AS ANCHORS. Arc references go in parentheses as support, never as the subject of a sentence. Use "w 0.81, vol VH, rev L" style abbreviations.
4. LIKELIHOOD DISCIPLINE. likelihood_label must be one of the six bands above. For STRUCTURE B, the likelihood applies to the most-weighted scenario.
5. LENGTH. Report body 500-800 words. STRUCTURE B trends toward the upper end.
6. CROSS-CLUSTER SCENARIOS. If the question crosses clusters, trace the bridge in prose, naming it. If the graph has thin coverage on the bridge, say so.
7. PERIMETER HONESTY. Never invent entities, relations, numbers, or events. If the question exceeds the graph, say so.
8. TONE. Senior analyst addressing C-suite / risk heads / board. Confident but calibrated. No AI pleasantries.
9. LANGUAGE. Report body in ENGLISH regardless of user language. The user_question field preserves the original language verbatim.
10. entity_ids MUST be a subset of entities present in the KG. relation_keys must match from|to|type exactly.
11. INCLUDE 5-12 ENTITIES and 6-15 RELATIONS in the highlight. For STRUCTURE B, cover both branches.
12. CRITICAL EDGES. Pick 3 to 5 arcs that the report body actually cites as load-bearing for the analysis (the arcs you would call out if the reader asked "what are the few relations driving this?"). Each entry MUST reference a relation present in the KG, with src_id == relation.from, dst_id == relation.to, and volatility copied verbatim from the KG. Critical edges MUST be a subset of relation_keys: every (src_id, dst_id, type) tuple you list here must also appear, in from|to|type form, inside relation_keys. The frontend renders these as a callout column next to the subgraph; pick the arcs a reader would care about most, not just the highest-weight ones.

Return ONLY the JSON object. No prose before or after. No markdown code fences.`;

// -----------------------------------------------------------------
// HTTP helpers
// -----------------------------------------------------------------
function jsonResponse(body: any, status = 200): Response {
  const headers = Object.assign({ "Content-Type": "application/json" }, CORS_HEADERS);
  return new Response(JSON.stringify(body), { status, headers });
}

function errorResponse(error: string, status: number, detail?: string): Response {
  const body: Record<string, string> = { error };
  if (detail) body.detail = detail;
  return jsonResponse(body, status);
}

// -----------------------------------------------------------------
// Anthropic call wrappers
// -----------------------------------------------------------------
// Buffered call used by the classifier (Haiku, ~5s). POSTs to Anthropic,
// reads the full response body, extracts concatenated text blocks, and
// returns a discriminated union so the caller can surface precise errors.
async function callAnthropicBuffered(
  apiKey: string,
  model: string,
  maxTokens: number,
  systemPrompt: string,
  messages: any[]
): Promise<{ ok: true; text: string; usage: any } | { ok: false; status: number; error: string }> {
  let resp: Response;
  try {
    resp = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages,
      }),
    });
  } catch (e) {
    return { ok: false, status: 502, error: "Network error: " + (e instanceof Error ? e.message : String(e)) };
  }

  const raw = await resp.text();
  if (!resp.ok) {
    return { ok: false, status: resp.status, error: "Anthropic API " + resp.status + ": " + raw.slice(0, 400) };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, status: 502, error: "Anthropic returned non-JSON: " + raw.slice(0, 200) };
  }

  const blocks = Array.isArray(parsed.content) ? parsed.content : [];
  const text = blocks
    .filter((b: any) => b && b.type === "text" && typeof b.text === "string")
    .map((b: any) => b.text)
    .join("\n")
    .trim();

  if (!text) {
    return { ok: false, status: 502, error: "Empty response from model" };
  }
  return { ok: true, text, usage: parsed.usage ?? null };
}

// Streaming call used by the generator (Sonnet, ~50s). Yields events as
// the Anthropic SSE stream comes in:
//   { type: "delta", text }                  one per text_delta event
//   { type: "done", fullText, usage }        once at end of stream
//   { type: "error", status, error }         instead of done if anything fails
// The outer handler drains this generator. Round 4 NDJSON plumbing turns
// this into start / heartbeat / done frames on the wire to the browser.
type StreamEvent =
  | { type: "delta"; text: string }
  | { type: "done"; fullText: string; usage: any | null }
  | { type: "error"; status: number; error: string };

async function* callAnthropicStreaming(
  apiKey: string,
  model: string,
  maxTokens: number,
  systemPrompt: string,
  messages: any[]
): AsyncGenerator<StreamEvent, void, unknown> {
  let resp: Response;
  try {
    resp = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages,
        stream: true,
      }),
    });
  } catch (e) {
    yield { type: "error", status: 502, error: "Network error: " + (e instanceof Error ? e.message : String(e)) };
    return;
  }

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    yield { type: "error", status: resp.status, error: "Anthropic API " + resp.status + ": " + errText.slice(0, 400) };
    return;
  }
  if (!resp.body) {
    yield { type: "error", status: 502, error: "Anthropic returned no response body for stream" };
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let fullText = "";
  let usage: any = null;

  // SSE frames are separated by blank lines; each line in a frame is
  // either "event: X" or "data: X". We only need data lines; the type
  // is encoded inside the JSON payload as `type`.
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    buffer += decoder.decode(chunk.value, { stream: true });

    let sep = buffer.indexOf("\n\n");
    while (sep !== -1) {
      const block = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      sep = buffer.indexOf("\n\n");

      const dataLines = block
        .split("\n")
        .filter((l: string) => l.startsWith("data: "))
        .map((l: string) => l.slice(6));
      if (!dataLines.length) continue;
      const dataStr = dataLines.join("\n");
      if (dataStr === "[DONE]") continue;

      let evt: any;
      try { evt = JSON.parse(dataStr); } catch { continue; }

      if (evt.type === "content_block_delta" && evt.delta && evt.delta.type === "text_delta") {
        const t = evt.delta.text || "";
        fullText += t;
        yield { type: "delta", text: t };
      } else if (evt.type === "message_start" && evt.message && evt.message.usage) {
        usage = Object.assign({}, evt.message.usage);
      } else if (evt.type === "message_delta" && evt.usage) {
        usage = Object.assign({}, usage || {}, evt.usage);
      }
      // message_stop, content_block_start, content_block_stop, ping: no-op.
    }
  }

  yield { type: "done", fullText: fullText.trim(), usage };
}

// -----------------------------------------------------------------
// JSON parsing with fallbacks (shared with v2.3)
// -----------------------------------------------------------------
// Three-stage JSON parse tolerant of chatty model output:
//   1. Strict JSON.parse.
//   2. Strip surrounding markdown code fences (```json ... ``` or ``` ... ```).
//   3. Extract the first '{' to the last '}' and parse the slice.
// Returns null if all three stages fail; caller decides how to surface.
function parseJsonLoose(text: string): any | null {
  if (!text || typeof text !== "string") return null;
  try { return JSON.parse(text); } catch { /* fall through */ }
  const fenced = text.match(/^\s*```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/i);
  if (fenced && fenced[1]) {
    try { return JSON.parse(fenced[1]); } catch { /* fall through */ }
  }
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first >= 0 && last > first) {
    try { return JSON.parse(text.slice(first, last + 1)); } catch { /* fall through */ }
  }
  return null;
}

// -----------------------------------------------------------------
// Input builders
// -----------------------------------------------------------------
// Classifier input: a single user-role message whose content is an
// instruction plus a compact JSON serialisation of the context. The
// entity index is light (id, label, type, dossiers) to keep the
// classifier fast; the full KG is only sent to the generator.
function buildClassifierInput(req: any): any[] {
  const entityIndex = (req.kg?.entities ?? []).map((e: any) => ({
    id: e.id,
    label: e.label,
    type: e.type,
    dossiers: e.dossiers,
  }));

  const history = Array.isArray(req.history) ? req.history.slice(-MAX_HISTORY_TURNS) : [];
  const historyText = history
    .map((t: any) => "[" + t.role + "] " + t.content)
    .join("\n\n");

  const ctx = {
    user_message: req.question,
    chat_history: historyText || "(empty - first turn)",
    dossiers_covered: req.dossier_index ?? [],
    entity_index: entityIndex,
    current_scenario: req.current_scenario ?? null,
  };

  return [
    {
      role: "user",
      content: "Classify the following user interaction and respond with strict JSON as instructed.\n\n" + JSON.stringify(ctx, null, 2),
    },
  ];
}

// Generator input: single user-role message containing the full KG
// (entities + relations with all properties so the model can pick
// volatility / weight / polarity verbatim for arc anchoring and for
// critical_edges), the entity ids the classifier already pre-selected
// as relevant, the recent history, and the prior scenario if this is
// a follow-up turn.
function buildGeneratorInput(req: any, classifierResult: any): any[] {
  const history = Array.isArray(req.history) ? req.history.slice(-MAX_HISTORY_TURNS) : [];
  const historyText = history
    .map((t: any) => "[" + t.role + "] " + t.content)
    .join("\n\n");

  const ctx = {
    user_question: req.question,
    preselected_entity_ids: Array.isArray(classifierResult?.entity_ids) ? classifierResult.entity_ids : [],
    kg: req.kg,
    chat_history: historyText,
    prior_scenario: req.current_scenario ?? null,
  };

  return [
    {
      role: "user",
      content: "Generate a scenario projection report based on the following input. Respond with strict JSON as instructed.\n\n" + JSON.stringify(ctx, null, 2),
    },
  ];
}

// -----------------------------------------------------------------
// NDJSON stream plumbing
// -----------------------------------------------------------------
// NDJSON stream to the client. Emits:
//   { type: "start" }                         immediately, to make the proxy
//                                             release response headers and
//                                             avoid the 30s TTFB drop.
//   { type: "heartbeat", t: <ms-since-t0> }   every HEARTBEAT_INTERVAL_MS
//                                             while the generator is working.
//   { type: "done", payload: <body> }         once the generator completes or
//                                             errors.
//
// `payload` keeps the v2.3 buffered shape { type, message, scenario?, debug? }
// so the frontend's handleResponse does not need to care whether the
// transport was buffered or streamed. `scenario` in v2.4 carries the new
// `critical_edges` array in addition to the v2.3 fields. On generator
// failure, payload degrades to { error: "..." } which the frontend
// surfaces as a chat error.
function buildNdjsonStream(
  t0: number,
  classifierResult: any,
  classifierUsage: any,
  streamEvents: AsyncGenerator<StreamEvent>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let heartbeatTimer: number | null = null;

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (frame: any) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(frame) + "\n"));
        } catch {
          // Client disconnected; stream controller will throw on enqueue.
        }
      };

      // 1. Start frame goes out immediately: this is what keeps the
      // Supabase edge proxy from dropping the connection at ~30s TTFB.
      send({ type: "start" });
      console.log("[TRACE +" + (Date.now() - t0) + "ms] stream: start frame emitted");

      // 2. Heartbeat ticker: small keepalive frames every 15s while the
      // generator is still working. Sonnet can take ~50s; without these
      // the proxy would still drop.
      heartbeatTimer = setInterval(() => {
        send({ type: "heartbeat", t: Date.now() - t0 });
        console.log("[TRACE +" + (Date.now() - t0) + "ms] stream: heartbeat");
      }, HEARTBEAT_INTERVAL_MS) as unknown as number;

      // 3. Drain the generator's SSE events. Delta events are absorbed
      // into fullText inside callAnthropicStreaming; we only observe
      // done / error here, since the frontend contract is "one scenario
      // payload at the end", not per-token streaming to the client.
      let donePayload: any = null;
      try {
        for await (const evt of streamEvents) {
          if (evt.type === "done") {
            console.log("[TRACE +" + (Date.now() - t0) + "ms] generator fetch done, ok=true");
            const parsed = parseJsonLoose(evt.fullText);
            if (!parsed || typeof parsed.report_html !== "string"
                       || !Array.isArray(parsed.entity_ids)
                       || !Array.isArray(parsed.relation_keys)) {
              donePayload = {
                error: "Generator returned malformed JSON",
                detail: (evt.fullText || "").slice(0, 500),
              };
              break;
            }
            donePayload = {
              type: "scenario",
              message: classifierResult.message,
              scenario: {
                title: parsed.title || "Scenario Projection",
                likelihood_label: parsed.likelihood_label || null,
                likelihood_range: parsed.likelihood_range || null,
                user_question: parsed.user_question || null,
                report_html: parsed.report_html,
                entity_ids: parsed.entity_ids,
                relation_keys: parsed.relation_keys,
                critical_edges: Array.isArray(parsed.critical_edges) ? parsed.critical_edges : [],
              },
              debug: {
                classifier_note: classifierResult.reasoning_note ?? null,
                classifier_usage: classifierUsage,
                generator_usage: evt.usage,
              },
            };
            break;
          }
          if (evt.type === "error") {
            console.log("[TRACE +" + (Date.now() - t0) + "ms] generator fetch error, status=" + evt.status);
            donePayload = { error: "Generator failure (status " + evt.status + "): " + evt.error };
            break;
          }
          // evt.type === "delta": silently absorbed, contributes to fullText.
        }
      } catch (e) {
        donePayload = { error: "Stream iteration failure: " + (e instanceof Error ? e.message : String(e)) };
      }

      if (heartbeatTimer !== null) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }

      // 4. Emit the terminal done frame and close the stream.
      console.log("[TRACE +" + (Date.now() - t0) + "ms] stream: emitting done frame, scenario present=" + (!!(donePayload && donePayload.scenario)));
      send({ type: "done", payload: donePayload || { error: "Generator emitted no events" } });
      try { controller.close(); } catch { /* already closed */ }
      console.log("[TRACE +" + (Date.now() - t0) + "ms] stream closed");
    },

    cancel() {
      if (heartbeatTimer !== null) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
      console.log("[TRACE +" + (Date.now() - t0) + "ms] stream cancelled by client");
    },
  });
}

// -----------------------------------------------------------------
// Main handler
// -----------------------------------------------------------------
Deno.serve(async (req: Request): Promise<Response> => {
  const t0 = Date.now();
  console.log("[TRACE +0ms] handler start, method=" + req.method);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return errorResponse("Method not allowed. Use POST.", 405);
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return errorResponse("ANTHROPIC_API_KEY not configured", 500);
  }

  // Parse + validate body.
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }
  if (typeof payload.question !== "string") {
    return errorResponse("'question' must be a string", 400);
  }
  if (!payload.kg || !Array.isArray(payload.kg.entities) || !Array.isArray(payload.kg.relations)) {
    return errorResponse("'kg' must contain entities and relations arrays", 400);
  }
  console.log("[TRACE +" + (Date.now() - t0) + "ms] body parsed, kg entities=" + payload.kg.entities.length + ", kg relations=" + payload.kg.relations.length + ", history length=" + (Array.isArray(payload.history) ? payload.history.length : 0));

  // Phase A: classify (buffered, Haiku).
  const classifierMessages = buildClassifierInput(payload);
  console.log("[TRACE +" + (Date.now() - t0) + "ms] classifier fetch start");
  const classRes = await callAnthropicBuffered(
    apiKey,
    MODEL_CLASSIFIER,
    MAX_TOKENS_CLASSIFIER,
    CLASSIFIER_SYSTEM_PROMPT,
    classifierMessages
  );
  console.log("[TRACE +" + (Date.now() - t0) + "ms] classifier fetch done, ok=" + classRes.ok + (classRes.ok ? "" : ", status=" + classRes.status));
  if (!classRes.ok) {
    return errorResponse("Classifier failure", classRes.status, classRes.error);
  }

  const classified = parseJsonLoose(classRes.text);
  if (!classified || typeof classified.type !== "string" || typeof classified.message !== "string") {
    return errorResponse("Classifier returned malformed JSON", 502, classRes.text.slice(0, 500));
  }
  console.log("[TRACE +" + (Date.now() - t0) + "ms] classifier decision type=" + classified.type);

  // Short-circuit: any type except "acknowledge" returns now as buffered
  // JSON. Only "acknowledge" triggers the streaming generator phase.
  const generationTypes = new Set(["acknowledge"]);
  if (!generationTypes.has(classified.type)) {
    console.log("[TRACE +" + (Date.now() - t0) + "ms] returning buffered classifier response");
    return jsonResponse({
      type: classified.type,
      message: classified.message,
      debug: {
        classifier_note: classified.reasoning_note ?? null,
        classifier_usage: classRes.usage,
      },
    });
  }

  // Acknowledge path: stream the generator through NDJSON. The Response
  // headers flush as soon as we return; the stream's start() callback
  // then emits the "start" frame within milliseconds, well under the
  // 30s TTFB drop threshold of the Supabase edge proxy.
  console.log("[TRACE +" + (Date.now() - t0) + "ms] entering streaming mode for generator");
  const generatorMessages = buildGeneratorInput(payload, classified);
  console.log("[TRACE +" + (Date.now() - t0) + "ms] generator fetch start (within stream)");
  const streamEvents = callAnthropicStreaming(
    apiKey,
    MODEL_GENERATOR,
    MAX_TOKENS_GENERATOR,
    GENERATOR_SYSTEM_PROMPT,
    generatorMessages
  );
  const body = buildNdjsonStream(t0, classified, classRes.usage, streamEvents);
  return new Response(body, {
    status: 200,
    headers: Object.assign(
      {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache, no-transform",
      },
      CORS_HEADERS
    ),
  });
});
