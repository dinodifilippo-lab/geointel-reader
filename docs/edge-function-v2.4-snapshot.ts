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
//   Round 1 (this commit): skeleton. All function bodies are stubs.
//   Round 2: HTTP helpers + classifier call + classifier prompt.
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
// TODO Round 2: populate classifier system prompt (same taxonomy as v2.3:
// welcome / out_of_scope / clarification / ready_to_generate / acknowledge
// / scenario_followup).
const CLASSIFIER_SYSTEM_PROMPT = "";

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
// TODO Round 2: buffered call used by the classifier (Haiku, ~5s).
async function callAnthropicBuffered(
  _apiKey: string,
  _model: string,
  _maxTokens: number,
  _systemPrompt: string,
  _messages: any[]
): Promise<{ ok: true; text: string; usage: any } | { ok: false; status: number; error: string }> {
  return { ok: false, status: 500, error: "Round 2 not implemented" };
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

  // TODO Round 2: parse + validate body (question string, kg.entities
  // and kg.relations arrays), then classify. Short-circuit return
  // (buffered JSON) if classifier type !== "acknowledge".
  //
  // TODO Round 3 + 4: if classifier says "acknowledge", wrap the
  // generator run in an NDJSON ReadableStream and return it with
  // Content-Type application/x-ndjson + Cache-Control no-transform.
  console.log("[TRACE +" + (Date.now() - t0) + "ms] skeleton exit, not wired");
  return errorResponse("Skeleton only (v2.4 Round 1). Rounds 2-4 pending.", 501);
});
