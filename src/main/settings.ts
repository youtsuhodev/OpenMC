import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import log from 'electron-log';
import type { Settings } from '../shared/types';
import { DEFAULT_VERSION, SERVER_IP, SERVER_PORT } from '../shared/constants';

const DEFAULTS: Settings = {
  maxRam: 4096,
  minRam: 1024,
  selectedVersion: DEFAULT_VERSION,
  width: 854,
  height: 480,
  fullscreen: false,
  extraJvmArgs: '',
  serverIp: SERVER_IP,
  serverPort: SERVER_PORT,
  discordRpc: true,
  keepOpen: true,
  background: null,
  newsUrl: '',
  lastUsername: '',
};

let cache: Settings | null = null;

function file(): string {
  return path.join(app.getPath('userData'), 'settings.json');
}

export function getSettings(): Settings {
  if (cache) return { ...cache };
  try {
    const raw = fs.readFileSync(file(), 'utf-8');
    cache = { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    cache = { ...DEFAULTS };
  }
  return { ...cache };
}

export function saveSettings(patch: Partial<Settings>): Settings {
  const next = { ...getSettings(), ...patch };
  cache = next;
  try {
    fs.mkdirSync(path.dirname(file()), { recursive: true });
    fs.writeFileSync(file(), JSON.stringify(next, null, 2));
  } catch (e) {
    log.error('Échec de la sauvegarde des réglages', e);
  }
  return { ...next };
}

export function gameRoot(): string {
  return path.join(app.getPath('userData'), 'game');
}
