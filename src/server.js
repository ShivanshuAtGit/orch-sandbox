import { createServer } from 'node:http';
import { handle } from './app.js';

const port = Number(process.env.PORT ?? 4173);
createServer(handle).listen(port, '127.0.0.1', () => {
  console.log(`Sandbox notes on http://localhost:${port}`);
});
