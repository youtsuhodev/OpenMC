import { spawn } from 'child_process';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEV_URL = 'http://localhost:5173';

const tsc = path.join(root, 'node_modules', 'typescript', 'bin', 'tsc');
const vite = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');
const electron = path.join(root, 'node_modules', 'electron', 'cli.js');
const mainEntry = path.join(root, 'dist-electron', 'main', 'index.js');

function waitForFile(file, timeoutMs = 60000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      if (fs.existsSync(file)) return resolve();
      if (Date.now() - start > timeoutMs) return reject(new Error(`Timeout: ${file} non généré`));
      setTimeout(tick, 300);
    };
    tick();
  });
}

function waitForHttp(url, timeoutMs = 60000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      http
        .get(url, (res) => {
          res.resume();
          if (res.statusCode < 500) return resolve();
          retry();
        })
        .on('error', retry);
      function retry() {
        if (Date.now() - start > timeoutMs) return reject(new Error(`Timeout: ${url} injoignable`));
        setTimeout(tick, 300);
      }
    };
    tick();
  });
}

async function main() {
  console.log('[dev] Compilation du processus principal…');
  const tscWatch = spawn(process.execPath, [tsc, '-p', 'tsconfig.main.json', '--watch'], {
    cwd: root,
    stdio: 'inherit',
  });

  console.log('[dev] Démarrage du serveur Vite…');
  const viteProc = spawn(process.execPath, [vite], { cwd: root, stdio: 'inherit' });

  try {
    await waitForFile(mainEntry);
    await waitForHttp(DEV_URL);
  } catch (err) {
    console.error('[dev]', err.message);
    tscWatch.kill();
    viteProc.kill();
    process.exit(1);
  }

  console.log('[dev] Lancement d’Electron…');
  const electronProc = spawn(process.execPath, [electron, '.'], {
    cwd: root,
    env: { ...process.env, VITE_DEV_SERVER_URL: DEV_URL },
    stdio: 'inherit',
  });

  electronProc.on('exit', () => {
    tscWatch.kill();
    viteProc.kill();
    process.exit(0);
  });

  process.on('SIGINT', () => {
    electronProc.kill();
    tscWatch.kill();
    viteProc.kill();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('[dev] Erreur fatale:', err);
  process.exit(1);
});
