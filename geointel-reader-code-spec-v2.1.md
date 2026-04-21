# GeoIntel Reader · Frontend Update Spec

## For Claude Code · v2.1 (hardened)

——

## TL;DR for Claude Code

You are updating an existing single-page web app. The user will give you a new `data.js` file plus this spec. Your job:

1. **Replace `data.js`** at the existing path (it’s a drop-in replacement — same shape, new content, one new field called `brief_text`).
1. **Make the chat in the right-hand panel interactive** (today it renders a hard-coded `chat: []` array from `data.js`; now it must accept user input and call a Supabase Edge Function to get live answers).
1. **Do not touch** the report panel, the intel panel, the graph SVG, the cluster map, or the overall CSS.

Read the ENTIRE spec before writing any code. There is a self-verification checklist at the end — run it mentally before declaring done.

——

## Section 1 — Context

### 1.1 The app

This is a static single-page app hosted on GitHub Pages at `dinodifilippo-lab.github.io/geointel-kb/` (or similar). It’s built around a global `window.CHESS_DATA` object defined in `data.js`. The app renders:

- A world-map / cluster visualisation on the left (dossiers grouped into geographic clusters + a trans-geographic orbital ring)
- A detail view that opens when a dossier is selected, containing: report panel, chat panel, intel panel, graph-SVG panel

The chat panel today just renders pre-scripted Q&A pairs from `data.js`. After this update, it becomes live.

### 1.2 What the backend looks like

A Supabase Edge Function called `geointel-reader-chat` has already been deployed and tested. It accepts a POST with a dossier brief and a user question, and returns the model’s answer. You do NOT need to write any backend — only consume the existing endpoint.

Endpoint:

```
https://chuvfdbpwiszjuoyhvlw.supabase.co/functions/v1/geointel-reader-chat
```

——

## Section 2 — The new `data.js`

### 2.1 How to install it

Overwrite the existing `data.js` at its current repo path. It’s a single-file `window.CHESS_DATA = { ... };` assignment.

### 2.2 What changed vs the previous version

Keep in mind the following when touching anything that consumes `data.js`:

- **Dossier list (6 total):** `russia-ukraine`, `iran-hormuz`, `iran-usa`, `taiwan-strait`, `ai-us-china`, `red-sea-houthis`.
- **Cluster list:** `eastern-europe`, `middle-east`, `east-asia`, `sahel`, `arctic`. The sahel and arctic clusters are present but empty (`dossier_ids: []`).
- **Trans-geographic:** `trans_geographic_dossier_ids: [“ai-us-china”]`.
- **New field per dossier:** `brief_text` — a plain string, typically 8–15 KB, containing the full dossier analytical brief.
- **Every dossier starts with `chat: []`** (empty). Do NOT seed messages.
- `reports`, `intel`, `graph_svg`, `actors`, `stats`, `description`, `title`, `id`, `cluster_id`, `lat`, `lon`, `current_report_id` are unchanged in structure.

### 2.3 CRITICAL: `brief_text` must never be rendered

`brief_text` is LLM context only. It must never appear in the DOM. If the current code does anything like `for (key in dossier) render(key)`, you need to explicitly skip `brief_text`. The safest pattern:

```javascript
// Never render brief_text. It’s internal LLM context.
const PRIVATE_DOSSIER_FIELDS = new Set([“brief_text”]);
```

Or just never reference `brief_text` anywhere except in the fetch call body (see Section 3.3).

——

## Section 3 — The live chat

### 3.1 Dependencies and keys

Add two constants near the top of the main JS (same file that holds the existing render logic, wherever that is — probably `index.html` inline script, or `app.js`, or similar):

```javascript
const GEOINTEL_CHAT_ENDPOINT = “https://chuvfdbpwiszjuoyhvlw.supabase.co/functions/v1/geointel-reader-chat”;

// TODO(user): paste your Supabase anon key here before deploying.
// This is the public “anon” key from Supabase Project Settings -> API -> anon/public.
// It is safe to include in the frontend.
const SUPABASE_ANON_KEY = “PASTE_SUPABASE_ANON_KEY_HERE”;
```

Leave the TODO comment visible. The user will paste the real key before committing.

### 3.2 UI changes to the chat panel

Find the chat panel in the existing HTML/JSX/template — wherever the loop over `dossier.chat` currently lives. Add, at the bottom of the chat panel:

1. A **text input** (or textarea) for the user’s question
1. A **send button**
1. A **loading indicator** that shows only while a request is in flight
1. An **error display area** (inline, dismissible)

Minimal example (adapt to the existing design language — do not invent new colours or fonts):

```html
<div class=“chat-input-row”>
  <textarea id=“chat-input” class=“chat-input”
            placeholder=“Ask a question about this dossier...”
            rows=“2”></textarea>
  <button id=“chat-send” class=“chat-send-btn”>Send</button>
</div>
<div id=“chat-loading” class=“chat-loading” style=“display:none;”>
  Analysing...
</div>
<div id=“chat-error” class=“chat-error” style=“display:none;”></div>
```

Style these to match the existing aesthetic. **Reuse existing CSS variables / classes where possible.** If the existing stylesheet already has button/input styles, piggy-back on them.

Keyboard behaviour:

- Enter (without Shift) = send
- Shift+Enter = newline inside the input
- Send button always sends the current input

### 3.3 Send handler — the important one

```javascript
async function sendChatMessage() {
  const inputEl = document.getElementById(“chat-input”);
  const sendBtn = document.getElementById(“chat-send”);
  const loadingEl = document.getElementById(“chat-loading”);
  const errorEl = document.getElementById(“chat-error”);

  const question = inputEl.value.trim();
  if (!question) return;

  const dossier = window.CHESS_DATA.dossiers[currentDossierId];
  if (!dossier) {
    console.error(“No current dossier selected”);
    return;
  }

  // 1. Append user message immediately and re-render
  dossier.chat.push({ role: “user”, content: question });
  renderChat(dossier);  // use whatever the existing render function is called
  inputEl.value = “”;

  // 2. Show loading, disable input
  loadingEl.style.display = “block”;
  errorEl.style.display = “none”;
  sendBtn.disabled = true;
  inputEl.disabled = true;

  // 3. Build history: everything in dossier.chat EXCEPT the just-pushed user message
  const history = dossier.chat
    .slice(0, -1)
    .slice(-20)  // keep last 20 turns max
    .map(m => ({ role: m.role, content: m.content }));

  // 4. Call the Edge Function
  try {
    const resp = await fetch(GEOINTEL_CHAT_ENDPOINT, {
      method: “POST”,
      headers: {
        “Content-Type”: “application/json”,
        “Authorization”: “Bearer “ + SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        dossier_id: dossier.id,
        dossier_title: dossier.title,
        brief_text: dossier.brief_text,
        question: question,
        history: history,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(“HTTP “ + resp.status + “: “ + errText.slice(0, 200));
    }

    const data = await resp.json();
    const answer = data.answer || “(empty response)”;

    dossier.chat.push({ role: “assistant”, content: answer });
    renderChat(dossier);
  } catch (err) {
    console.error(“Chat error:”, err);
    errorEl.textContent = “Unable to reach the analysis engine. Please try again.”;
    errorEl.style.display = “block”;
  } finally {
    loadingEl.style.display = “none”;
    sendBtn.disabled = false;
    inputEl.disabled = false;
    inputEl.focus();
  }
}
```

Wire it up:

```javascript
document.getElementById(“chat-send”).addEventListener(“click”, sendChatMessage);
document.getElementById(“chat-input”).addEventListener(“keydown”, (e) => {
  if (e.key === “Enter” && !e.shiftKey) {
    e.preventDefault();
    sendChatMessage();
  }
});
```

Adapt the code above to the framework actually in use (if the app uses React/Vue/Svelte, use that framework’s idioms — state for dossier.chat, component for the input, etc.). If it’s plain vanilla JS with direct DOM manipulation, the above is essentially ready to paste.

### 3.4 Render function

There is already a function that renders the chat (it runs today to render the static `chat: []` array). Keep it. It only needs to know that `chat` may grow over time. If it currently only runs once on dossier open, make sure it can be called repeatedly (idempotent — clear the chat DOM container, then re-render all messages).

### 3.5 Dossier switch

When the user switches dossiers, the chat display must reset to the new dossier’s `chat` array (which starts empty for a fresh dossier, or carries in-session history if the user previously asked questions in that dossier during the current page visit).

**Do not persist chat across page reloads.** The `chat: []` in `data.js` is the canonical starting state. In-memory mutations are ephemeral.

——

## Section 4 — Things you must NOT change

- Do not change the cluster map logic.
- Do not change the report panel rendering.
- Do not change the intel panel rendering (confidence, top_arcs, events).
- Do not change the graph_svg rendering.
- Do not change the stylesheet beyond adding the minimal new classes for chat input / send / loading / error (match existing style, don’t invent new palettes).
- Do not remove or rename any field of `window.CHESS_DATA` or its dossiers.
- Do not add a router, a build step, a bundler, or any dependency. This is a static single-page app, keep it that way.
- Do not persist anything to localStorage / sessionStorage / cookies / IndexedDB.
- Do not add analytics or tracking.

——

## Section 5 — Edge cases and defensive handling

1. **User presses Send with empty input** → do nothing (return early).
1. **User presses Send while a request is in flight** → the send button is disabled; defensive check: if `sendBtn.disabled`, return early.
1. **Endpoint returns 5xx or network error** → show error message, keep user’s question in the chat (do NOT remove it — the user can see “I asked this, no answer came, let me retry”).
1. **Endpoint returns 200 with empty answer** → show “(empty response)” or similar, no crash.
1. **User switches dossier while a request is in flight** → the response, when it arrives, should still push to the `dossier.chat` of the dossier the request was about (you captured the reference in the closure), but the UI should only render the chat of the currently-selected dossier. This means if the user switches away and back, they’ll see the answer; if they never come back, the answer is lost. Acceptable for a demo.
1. **Very long answer** → should render without breaking layout. Test with 1500+ token outputs.
1. **User question with special characters (quotes, newlines, emoji)** → `JSON.stringify` handles it; no special handling needed on your side.

——

## Section 6 — Self-verification checklist

Before you declare the task done, run through this mentally. Every item must be true.

**Data:**

- [ ] `data.js` has been overwritten with the new file.
- [ ] `window.CHESS_DATA.dossiers` has exactly these 6 keys: `russia-ukraine`, `iran-hormuz`, `iran-usa`, `taiwan-strait`, `ai-us-china`, `red-sea-houthis`.
- [ ] `window.CHESS_DATA.trans_geographic_dossier_ids` is `[“ai-us-china”]`.
- [ ] The `eastern-europe` cluster contains `russia-ukraine`.
- [ ] Each dossier has a non-empty `brief_text` field.
- [ ] Every dossier’s `chat` is `[]` at load time.

**UI:**

- [ ] The chat panel has a text input, send button, loading indicator, error area.
- [ ] Styling matches the existing design (no jarring new colours, fonts, or spacing).
- [ ] Enter key sends (Shift+Enter for newline).
- [ ] Loading indicator appears during requests and disappears after.
- [ ] Input and button are disabled during in-flight requests.

**Behaviour:**

- [ ] On send, the user message appears immediately.
- [ ] On success, the assistant message appears after.
- [ ] On error, the user message remains visible and an error message appears below.
- [ ] Switching dossiers shows the chat of the new dossier (not the old one’s).
- [ ] Switching away and back preserves in-session chat for a dossier.

**Security / correctness:**

- [ ] `brief_text` is NEVER rendered in the DOM (inspect the page source to confirm — search for any fragment of a brief_text string, should not appear).
- [ ] `SUPABASE_ANON_KEY` has a clear TODO comment.
- [ ] The fetch call uses POST, the correct endpoint, the Authorization header with Bearer + anon key.
- [ ] `history` is capped at 20 turns and excludes the just-appended user message.
- [ ] No localStorage / sessionStorage / IndexedDB usage introduced.

**Non-regression:**

- [ ] Report panel still renders for each dossier.
- [ ] Intel panel still renders (top_arcs, events, confidence).
- [ ] Graph SVG still renders.
- [ ] Cluster map still renders and shows `russia-ukraine` in `eastern-europe`.
- [ ] No console errors at page load or on dossier open.

——

## Section 7 — If something’s ambiguous

If you encounter something that makes you want to guess — e.g., the existing code uses a framework you need to adapt to, or the chat render function is structured differently than expected — **follow the existing patterns in the repo**. The goal is minimal surgical change. If the existing app is vanilla JS with DOM manipulation, stay vanilla. If it’s React, use React state and effects. If it’s Vue, use refs. Don’t introduce a new paradigm for the chat that doesn’t match the rest.

If you genuinely cannot tell what the existing pattern is from the code, default to vanilla JS with direct DOM manipulation as shown in Section 3.3. That is the simplest, most portable approach.

——

## Section 8 — Commit message

When you’re done, commit with a message like:

```
feat: live interactive chat + data.js v2.0

- Replace data.js with v2.0 (6 dossiers, brief_text field, empty chat arrays)
- Add chat input + send + loading + error UI
- Wire chat to Supabase Edge Function geointel-reader-chat
- Cap history at 20 turns
- SUPABASE_ANON_KEY left as TODO for user to fill in
- No changes to report / intel / graph / cluster map rendering
```