import { app } from 'electron';
import { Client } from 'minecraft-launcher-core';
import type { ChildProcess } from 'child_process';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import log from 'electron-log';
import { ensureJava } from './java';
import { gameRoot, getSettings } from './settings';
import type {
  GameVersion,
  JavaStatus,
  LaunchResult,
  LaunchState,
  ProgressInfo,
  Toast,
} from '../shared/types';
import { VERSION_MANIFEST_URL } from '../shared/constants';

export interface LaunchEvents {
  onProgress: (p: ProgressInfo) => void;
  onLaunchState: (l: LaunchState) => void;
  onJavaStatus: (s: JavaStatus) => void;
  onToast: (t: Toast) => void;
}

interface Manifest {
  latest: { release: string };
  versions: { id: string; type: string; releaseTime: string }[];
}

let manifestCache: Manifest | null = null;
let child: ChildProcess | null = null;

async function getManifest(): Promise<Manifest> {
  if (manifestCache) return manifestCache;
  const res = await fetch(VERSION_MANIFEST_URL);
  if (!res.ok) throw new Error('Impossible de récupérer la liste des versions depuis Mojang.');
  manifestCache = (await res.json()) as Manifest;
  return manifestCache;
}

export async function getVersions(): Promise<GameVersion[]> {
  try {
    const manifest = await getManifest();
    const releases = manifest.versions
      .filter((v) => v.type === 'release')
      .slice(0, 12)
      .map((v) => ({ id: v.id, type: v.type as GameVersion['type'], releaseTime: v.releaseTime }));
    return [{ id: 'latest', type: 'release' }, ...releases];
  } catch (e) {
    log.warn('Manifest Mojang indisponible', e);
    return [
      { id: 'latest', type: 'release' },
      { id: '1.21.11', type: 'release' },
      { id: '1.21.5', type: 'release' },
    ];
  }
}

const TASK_LABELS: Record<string, string> = {
  version: 'Téléchargement de Minecraft…',
  assets: 'Téléchargement des ressources du jeu…',
  libraries: 'Téléchargement des bibliothèques…',
  natives: 'Préparation des natives…',
  log4j: 'Configuration du jeu…',
  forge: 'Préparation de Forge…',
};

function mapProgress(p: Record<string, unknown>, events: LaunchEvents): void {
  const total = Number(p.total ?? 0);
  const current = Number(p.current ?? p.task ?? 0);
  const percent = Number(p.percent ?? (total > 0 ? Math.round((current / total) * 100) : 0));
  const type = String(p.type ?? 'download');
  const task = typeof p.task === 'string' ? p.task : TASK_LABELS[type] ?? 'Téléchargement…';
  events.onProgress({ type, task, current, total, percent });
}

export function cancelLaunch(): void {
  if (child) {
    try {
      child.kill();
    } catch {
      /* ignore */
    }
    child = null;
  }
}

export async function launchGame(username: string, events: LaunchEvents): Promise<LaunchResult> {
  const clean = username.trim();
  if (clean.length < 3 || clean.length > 16) {
    return { ok: false, message: 'Le pseudo doit contenir entre 3 et 16 caractères.' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
    return {
      ok: false,
      message: 'Le pseudo ne peut contenir que des lettres, chiffres et underscores.',
    };
  }
  if (child) return { ok: false, message: 'Le jeu est déjà en cours de lancement.' };

  const settings = getSettings();

  try {
    events.onLaunchState({ stage: 'preparing', message: 'Préparation du lancement…' });

    const javaPath = await ensureJava((s) => events.onJavaStatus(s));

    let versionId = settings.selectedVersion;
    let versionType: string = 'release';
    if (versionId === 'latest') {
      const manifest = await getManifest();
      versionId = manifest.latest.release;
      versionType = 'release';
    }

    log.info(`Lancement de Minecraft ${versionId} (${clean}) avec ${javaPath}`);
    events.onLaunchState({
      stage: 'downloading',
      message: `Téléchargement de Minecraft ${versionId}…`,
    });

    const launcher = new Client();
    const gameLogPath = path.join(app.getPath('userData'), 'game-latest.log');
    try {
      fs.writeFileSync(gameLogPath, '');
    } catch {
      /* ignore */
    }
    const appendGameLog = (chunk: string): void => {
      try {
        fs.appendFileSync(gameLogPath, chunk);
      } catch {
        /* ignore */
      }
    };

    const processOrNull = await new Promise<ChildProcess | null>((resolve) => {
      launcher.on('progress', (p: Record<string, unknown>) => mapProgress(p, events));
      launcher.on('data', (data: string) => appendGameLog(data));
      launcher.on('debug', (msg: string) => log.debug(`[MCLC] ${msg}`));
      launcher.on('close', (code: number) => {
        log.info(`Minecraft s'est fermé (code ${code})`);
        child = null;
        events.onLaunchState({ stage: 'idle' });
      });

      launcher
        .launch({
          authorization: {
            access_token: '0',
            client_token: '0',
            uuid: offlineUuid(clean),
            name: clean,
            user_properties: '{}',
            meta: { type: 'legacy' },
          } as unknown as import('minecraft-launcher-core').IUser,
          root: gameRoot(),
          version: { number: versionId, type: versionType, custom: '' },
          memory: { max: settings.maxRam, min: settings.minRam },
          javaPath,
          window: {
            width: settings.width,
            height: settings.height,
            fullscreen: settings.fullscreen,
          },
          customArgs: settings.extraJvmArgs
            ? settings.extraJvmArgs.trim().split(/\s+/).filter(Boolean)
            : [],
          customLaunchArgs: settings.serverIp
            ? ['--server', settings.serverIp, '--port', String(settings.serverPort)]
            : [],
          overrides: {
            gameDirectory: gameRoot(),
            detached: true,
            maxSockets: 16,
          },
        })
        .then((proc) => resolve(proc ?? null))
        .catch(() => resolve(null));
    });

    if (!processOrNull) {
      events.onLaunchState({ stage: 'error', message: 'Le lancement a échoué.' });
      return {
        ok: false,
        message:
          'Le lancement a échoué. Vérifie ta connexion internet, ta version et tes réglages Java.',
      };
    }

    child = processOrNull;
    events.onLaunchState({ stage: 'running', message: 'Le jeu est lancé !' });
    return { ok: true, pid: child.pid };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erreur inconnue lors du lancement.';
    log.error('Échec du lancement', e);
    events.onLaunchState({ stage: 'error', message });
    return { ok: false, message };
  }
}

function offlineUuid(name: string): string {
  const digest = createHash('md5').update(`OfflinePlayer:${name}`, 'utf-8').digest();
  digest[6] = (digest[6] & 0x0f) | 0x30;
  digest[8] = (digest[8] & 0x3f) | 0x80;
  const hex = digest.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
