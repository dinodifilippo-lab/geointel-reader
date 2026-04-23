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
//   Round 1 (done): skeleton. All function bodies are stubs.
//   Round 2 (this commit): CLASSIFIER_SYSTEM_PROMPT + callAnthropicBuffered
//     + classifier logic in the handler. parseJsonLoose and
//     buildClassifierInput intentionally left as stubs per instruction
//     ("Altri stub invariati"), so the code is still non-deployable
//     end-to-end; the classifier surface is populated structurally.
//   Round 3: generator streaming call + generator prompt (critical_edges).
//   Round 4: NDJSON plumbing (start / heartbeat / done) + handler glue.

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

// TODO Round 3: populate generator system prompt. Carries the v2.3
// content (STRUCTURE A / STRUCTURE B, user_question preserved, no
// evidence_strength) plus new critical_edges section:
//   - 3 to 5 arcs that the report body actually cites.
//   - Each element { src_id, dst_id, mechanism, volatility } where
//     src_id / dst_id match entities present in the KG, mechanism is
//     a short free-text label (e.g. "coercive strike"), volatility is
//     one of L / M / H / VH, copied from the relation in the KG.
const GENERATOR_SYSTEM_PROMPT = "";

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

// TODO Round 3: streaming call used by the generator (Sonnet, ~50s).
// Returns an async iterable of text deltas plus final usage on stop.
// The outer handler drains this and emits NDJSON frames to the client.
async function callAnthropicStreaming(
  _apiKey: string,
  _model: string,
  _maxTokens: number,
  _systemPrompt: string,
  _messages: any[]
): Promise<any> {
  throw new Error("Round 3 not implemented");
}

// -----------------------------------------------------------------
// JSON parsing with fallbacks (shared with v2.3)
// -----------------------------------------------------------------
// TODO Round 2: try strict parse, then strip markdown fences, then
// extract first { to last }.
function parseJsonLoose(_text: string): any | null {
  return null;
}

// -----------------------------------------------------------------
// Input builders
// -----------------------------------------------------------------
// TODO Round 2: light entity index + flattened history for classifier.
function buildClassifierInput(_req: any): any[] {
  return [];
}

// TODO Round 3: full KG + preselected entity ids + history + prior
// scenario for the generator.
function buildGeneratorInput(_req: any, _classifierResult: any): any[] {
  return [];
}

// -----------------------------------------------------------------
// NDJSON stream plumbing
// -----------------------------------------------------------------
// TODO Round 4: emit NDJSON frames to the client:
//   { type: "start" }                         at boot
//   { type: "heartbeat", t: <ms-since-t0> }   every HEARTBEAT_INTERVAL_MS
//   { type: "done", payload: <full-body> }    when generator returns
// `payload` keeps the v2.3 shape: { type, message, scenario?, debug? }
// with scenario now carrying `critical_edges` in addition to v2.3 fields.
function buildNdjsonStream(_runGenerator: () => Promise<any>): ReadableStream {
  return new ReadableStream();
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

  // Acknowledge path: stream the generator. TODO Round 3 + 4.
  console.log("[TRACE +" + (Date.now() - t0) + "ms] acknowledge path, generator not yet wired");
  return errorResponse("Generator streaming not yet wired (v2.4 Round 3 + 4 pending).", 501);
});
