import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { handle, reset } from '../src/app.js';
import { countLabel } from '../src/count.js';

const server = createServer(handle).listen(0);
const base = `http://localhost:${server.address().port}`;
after(() => server.close());
beforeEach(() => reset());

const getPage = async () => (await fetch(base + '/')).text();
const post = (text) => fetch(base + '/api/notes', { method: 'POST', body: JSON.stringify({ text }) });

test('countLabel: plural', () => {
  assert.equal(countLabel(3), '3 notes');
  assert.equal(countLabel(12), '12 notes');
});

test('countLabel: singular', () => {
  assert.equal(countLabel(1), '1 note');
});

test('countLabel: empty', () => {
  assert.equal(countLabel(0), 'No notes yet');
});

test('page has a count line right under the heading, before the form', async () => {
  const html = await getPage();
  assert.match(html, /<h1>Notes<\/h1>\s*<p id="count"[^>]*><\/p>\s*<form/);
});

test('page script uses countLabel, not the old empty list item', async () => {
  const html = await getPage();
  assert.match(html, /countLabel\(items\.length\)/);
  assert.doesNotMatch(html, /No notes yet\./);
});

test('count is recomputed from the fetched list inside load()', async () => {
  const html = await getPage();
  const load = html.slice(html.indexOf('async function load()'), html.indexOf("getElementById('add')"));
  assert.match(load, /count\.textContent = countLabel\(items\.length\)/);
});

test('two added notes are both returned by the API', async () => {
  await post('one');
  await post('two');
  assert.equal((await (await fetch(base + '/api/notes')).json()).length, 2);
});

test('count is empty in the served HTML (nothing before data arrives)', async () => {
  const html = await getPage();
  assert.match(html, /<p id="count"[^>]*><\/p>/);
});

test('load() clears the count when the fetch fails', async () => {
  const html = await getPage();
  assert.match(html, /catch[^}]*count\.textContent = ''/);
  assert.match(html, /if \(!res\.ok\) throw/);
});

test('count stays on one line on narrow screens', async () => {
  const html = await getPage();
  assert.match(html, /#count\s*\{[^}]*white-space:\s*nowrap/);
});

test('the inlined page script is valid JavaScript', async () => {
  const html = await getPage();
  const script = html.split('<script>')[1].split('</script>')[0];
  assert.doesNotThrow(() => new Function(script));
});

test('a note of spaces is refused and the list stays empty', async () => {
  const res = await post('   ');
  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), { error: 'Write something first.' });
  assert.deepEqual(await (await fetch(base + '/api/notes')).json(), []);
});
