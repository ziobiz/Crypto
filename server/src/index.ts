import path from 'path';
import dotenv from 'dotenv';
import express from 'express';
import next from 'next';
import { createApiApp } from '../../backend/dist/app';

const rootDir = path.resolve(__dirname, '../..');
const frontendDir = path.join(rootDir, 'frontend');

dotenv.config({ path: path.join(rootDir, 'backend/.env'), override: false });

const dev = process.env.NODE_ENV !== 'production';
const port = Number(process.env.WEB_PORT ?? 3000);

async function main() {
  const nextApp = next({ dev, dir: frontendDir });
  const handle = nextApp.getRequestHandler();

  await nextApp.prepare();

  const server = express();
  const apiApp = createApiApp();

  server.use(apiApp);

  server.all('*', (req, res) => handle(req, res));

  server.listen(port, () => {
    console.log(`Crypto Workflow → http://localhost:${port} (${dev ? 'dev' : 'production'})`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
