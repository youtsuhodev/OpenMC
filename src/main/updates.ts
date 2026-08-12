import { app } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import type { UpdateStatus } from '../shared/types';

export function initUpdates(onStatus: (s: UpdateStatus) => void): void {
  autoUpdater.logger = log;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => onStatus({ state: 'checking' }));
  autoUpdater.on('update-available', (info) =>
    onStatus({ state: 'available', version: info.version }),
  );
  autoUpdater.on('update-not-available', (info) =>
    onStatus({ state: 'not-available', version: info.version }),
  );
  autoUpdater.on('download-progress', (p) =>
    onStatus({ state: 'downloading', progress: Math.round(p.percent) }),
  );
  autoUpdater.on('update-downloaded', (info) =>
    onStatus({ state: 'ready', version: info.version }),
  );
  autoUpdater.on('error', (err) => onStatus({ state: 'error', message: err.message }));
}

export async function checkForUpdates(onStatus: (s: UpdateStatus) => void): Promise<void> {
  if (!app.isPackaged) {
    onStatus({ state: 'not-available', version: app.getVersion() });
    return;
  }
  onStatus({ state: 'checking' });
  try {
    await autoUpdater.checkForUpdates();
  } catch (e) {
    log.error('Échec de la recherche de mise à jour', e);
    onStatus({ state: 'error', message: 'Impossible de vérifier les mises à jour.' });
  }
}

export function installUpdate(): void {
  autoUpdater.quitAndInstall(false, true);
}
