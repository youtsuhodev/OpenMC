import { app } from 'electron';
import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { promisify } from 'util';
import type { JavaStatus } from '../shared/types';
import { ADOPTIUM_API, JAVA_MIN_VERSION } from '../shared/constants';

const execFileP = promisify(execFile);

let cached: JavaStatus | null = null;

function runDir(): string {
  return path.join(app.getPath('userData'), 'runtime');
}

function bundledJava(): string | null {
  const dir = runDir();
  if (!fs.existsSync(dir)) return null;
  const candidates = walkForJava(dir);
  return candidates[0] ?? null;
}

function walkForJava(root: string): string[] {
  const found: string[] = [];
  const check = (dir: string): void => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'bin') {
          for (const exe of ['java', 'java.exe']) {
            const j = path.join(full, exe);
            if (fs.existsSync(j)) found.push(j);
          }
        } else if (!entry.name.startsWith('.')) {
          check(full);
        }
      }
    }
  };
  check(root);
  return found;
}

function knownLocations(): string[] {
  const paths: string[] = [];
  const home = app.getPath('home');

  if (process.env.JAVA_HOME) paths.push(process.env.JAVA_HOME);

  if (process.platform === 'win32') {
    const pf = process.env.ProgramFiles ?? 'C:\\Program Files';
    const pf86 = process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)';
    paths.push(pf, pf86, path.join(pf, 'Eclipse Adoptium'), path.join(pf86, 'Eclipse Adoptium'));
    paths.push(path.join(pf, 'Common Files', 'Oracle', 'Java', 'javapath'));
    const localAppData = process.env.LOCALAPPDATA ?? path.join(home, 'AppData', 'Local');
    paths.push(path.join(localAppData, 'Programs', 'Android Studio', 'jbr'));
    paths.push(path.join(home, 'AppData', 'Roaming', '.minecraft', 'runtime'));
  } else if (process.platform === 'darwin') {
    paths.push('/Library/Java/JavaVirtualMachines', '/usr/local/opt');
    paths.push(path.join(home, 'Library', 'Application Support', 'minecraft', 'runtime'));
  } else {
    paths.push('/usr/lib/jvm', '/usr/java', '/opt');
    paths.push(path.join(home, '.minecraft', 'runtime'));
  }
  paths.push(runDir());
  return paths;
}

async function readJavaVersion(javaPath: string): Promise<string | null> {
  try {
    const { stderr } = await execFileP(javaPath, ['-version'], { timeout: 15_000 });
    const text = stderr || '';
    const m = text.match(/version\s+"([^"]+)"/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

function versionAtLeast(current: string, min: number): boolean {
  const match = current.match(/(\d+)(?:\.(\d+))?/);
  if (!match) return false;
  const major = parseInt(match[1], 10);
  if (major === 1 && match[2]) return parseInt(match[2], 10) >= min - 8;
  return major >= min;
}

export async function ensureJava(onStatus: (s: JavaStatus) => void): Promise<string> {
  if (cached?.path && cached.state === 'found') return cached.path;

  const candidates = [...knownLocations().flatMap(walkForJava), bundledJava()].filter(
    (p): p is string => !!p,
  );
  const unique = [...new Set(candidates)];

  for (const javaPath of unique) {
    const version = await readJavaVersion(javaPath);
    if (version && versionAtLeast(version, JAVA_MIN_VERSION)) {
      cached = { state: 'found', version, path: javaPath };
      onStatus(cached);
      return javaPath;
    }
  }

  const downloaded = await downloadRuntime(onStatus);
  cached = { state: 'downloaded', path: downloaded };
  onStatus(cached);
  return downloaded;
}

function platformInfo(): { os: string; arch: string } {
  const arch = process.arch === 'arm64' ? 'aarch64' : 'x64';
  if (process.platform === 'win32') return { os: 'windows', arch };
  if (process.platform === 'darwin') return { os: 'mac', arch };
  return { os: 'linux', arch };
}

async function downloadRuntime(onStatus: (s: JavaStatus) => void): Promise<string> {
  const { os, arch } = platformInfo();
  const url = ADOPTIUM_API.replace('{arch}', arch).replace('{os}', os);
  onStatus({ state: 'downloading', message: 'Recherche du runtime Java…' });

  const res = await fetch(url);
  if (!res.ok) throw new Error('Impossible de trouver un runtime Java compatible.');
  const data = (await res.json()) as Array<{ binary?: { package?: { link?: string; name?: string } } }>;
  const link = data[0]?.binary?.package?.link;
  const name = data[0]?.binary?.package?.name;
  if (!link || !name) throw new Error('Réponse Adoptium invalide.');

  const destDir = path.join(runDir(), name.replace(/\.(zip|tar\.gz)$/i, ''));
  const javaExe = path.join(destDir, os === 'windows' ? 'bin\\java.exe' : 'bin/java');
  if (fs.existsSync(javaExe)) return javaExe;

  const archivePath = path.join(runDir(), name);
  await downloadFile(link, archivePath, (percent) => onStatus({ state: 'downloading', progress: percent }));
  await extractArchive(archivePath, runDir());
  try {
    fs.rmSync(archivePath, { force: true });
  } catch {
    /* ignore */
  }
  if (!fs.existsSync(javaExe)) throw new Error('Extraction du runtime Java incomplète.');
  return javaExe;
}

function downloadFile(url: string, dest: string, onProgress: (percent: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      const total = Number(res.headers['content-length'] ?? 0);
      let received = 0;
      const file = fs.createWriteStream(dest);
      res.on('data', (chunk: Buffer) => {
        received += chunk.length;
        if (total > 0) onProgress(Math.min(100, Math.round((received / total) * 100)));
      });
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve()));
      file.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(30_000, () => req.destroy(new Error('Téléchargement Java expiré.')));
  });
}

function extractArchive(archive: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(dest, { recursive: true });
    if (process.platform === 'win32') {
      execFileP('tar', ['-xf', archive, '-C', dest], { timeout: 300_000 })
        .then(() => resolve())
        .catch(async () => {
          try {
            await execFileP('powershell', ['-NoProfile', '-Command', `Expand-Archive -Path '${archive}' -DestinationPath '${dest}' -Force`], { timeout: 600_000 });
            resolve();
          } catch (e) {
            reject(e);
          }
        });
    } else {
      execFileP('tar', ['-xzf', archive, '-C', dest], { timeout: 300_000 }).then(() => resolve()).catch(reject);
    }
  });
}

export function getJavaStatus(): JavaStatus {
  return cached ?? { state: 'unknown' };
}
