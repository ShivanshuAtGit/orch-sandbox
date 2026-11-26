// A small notes app: one page, an in-memory list, and a JSON API.
// Kept tiny on purpose: orch's build flow and quality gates are tested on it.

const notes = [];

const page = () => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sandbox notes</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 40rem; margin: 2rem auto; padding: 0 1rem; color: #1c2128; }
    form { display: flex; gap: .5rem; }
    input { flex: 1; padding: .5rem; }
    li { padding: .25rem 0; }
    .empty { color: #6b7380; }
    .error { color: #b42318; }
  </style>
</head>
<body>
  <h1>Notes</h1>
  <form id="add">
    <input id="text" name="text" maxlength="200" placeholder="Write a note" aria-label="Note text">
    <button type="submit">Add</button>
  </form>
  <p id="message" role="status"></p>
  <ul id="list"></ul>
  <script>
    const list = document.getElementById('list');
    const message = document.getElementById('message');
    async function load() {
      const res = await fetch('/api/notes');
      const items = await res.json();
      list.innerHTML = '';
      if (!items.length) list.innerHTML = '<li class="empty">No notes yet.</li>';
      for (const n of items) {
        const li = document.createElement('li');
        li.textContent = n.text;
        list.appendChild(li);
      }
    }
    document.getElementById('add').addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = document.getElementById('text').value;
      const res = await fetch('/api/notes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text }) });
      if (!res.ok) {
        message.className = 'error';
        message.textContent = (await res.json()).error;
        return;
      }
      message.className = '';
      message.textContent = 'Added.';
      document.getElementById('text').value = '';
      load();
    });
    load();
  </script>
</body>
</html>`;

function send(res, status, body, type = 'application/json') {
  res.writeHead(status, { 'content-type': type });
  res.end(type === 'application/json' ? JSON.stringify(body) : body);
}

async function readJson(req) {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  try {
    return JSON.parse(raw || '{}');
  } catch {
    return null;
  }
}

export async function handle(req, res) {
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'GET' && url.pathname === '/') return send(res, 200, page(), 'text/html; charset=utf-8');
  if (req.method === 'GET' && url.pathname === '/api/notes') return send(res, 200, notes);
  if (req.method === 'POST' && url.pathname === '/api/notes') {
    const body = await readJson(req);
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    if (!text) return send(res, 400, { error: 'Write something first.' });
    if (text.length > 200) return send(res, 400, { error: 'Keep it under 200 characters.' });
    const note = { id: notes.length + 1, text };
    notes.push(note);
    return send(res, 201, note);
  }
  return send(res, 404, { error: 'Not found.' });
}

/** For tests: start empty. */
export function reset() {
  notes.length = 0;
}
