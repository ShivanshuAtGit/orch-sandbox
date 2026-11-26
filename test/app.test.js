import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { handle, reset } from '../src/app.js';

const server = createServer(handle).listen(0);
const base = `http://localhost:${server.address().port}`;
after(() => server.close());
beforeEach(() => reset());

test('the page loads', async () => {
  const res = await fetch(base + '/');
  assert.equal(res.status, 200);
  assert.match(await res.text(), /<h1>Notes<\/h1>/);
});

test('notes start empty, and a note can be added', async () => {
  assert.deepEqual(await (await fetch(base + '/api/notes')).json(), []);
  const res = await fetch(base + '/api/notes', { method: 'POST', body: JSON.stringify({ text: 'Buy milk' }) });
  assert.equal(res.status, 201);
  assert.deepEqual(await (await fetch(base + '/api/notes')).json(), [{ id: 1, text: 'Buy milk' }]);
});

test('an empty note is refused with a plain message', async () => {
  const res = await fetch(base + '/api/notes', { method: 'POST', body: JSON.stringify({ text: '   ' }) });
  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), { error: 'Write something first.' });
});

test('unknown paths are 404', async () => {
  assert.equal((await fetch(base + '/nope')).status, 404);
});
