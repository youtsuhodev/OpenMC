import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { broadcast } from './events';
import { getSettings, saveSettings } from './settings';
import { getNews } from './news';
import { cancelLaunch, getVersions, launchGame } from './launch';
import { getJavaStatus } from './java';
import { checkForUpdates, installUpdate } from './updates';
import { chooseBackground, resetBackground } from './background';
import { updatePresence } from './discord';
import type { ProfileStatus, Settings } from '../shared/types';

function profileStatus(): ProfileStatus {
  const s = getSettings();
  return { username: s.lastUsername || null };
}

export function registerIpc(): void {
  ipcMain.handle('app:info', () => ({
    version: app.getVersion(),
    platform: process.platform,
    arch: process.arch,
  }));

  ipcMain.handle('settings:get', () => getSettings());
  ipcMain.handle('settings:save', (_e, patch: Partial<Settings>) => saveSettings(patch));

  ipcMain.handle('profile:get', () => profileStatus());
  ipcMain.handle('profile:set', (_e, username: string) => {
    saveSettings({ lastUsername: String(username ?? '').trim() });
    return profileStatus();
  });

  ipcMain.handle('news:get', () => getNews());
  ipcMain.handle('versions:get', () => getVersions());
  ipcMain.handle('java:status', () => getJavaStatus());

  ipcMain.handle('game:launch', async (_e, username: string) => {
    const res = await launchGame(String(username ?? ''), {
      onProgress: (p) => broadcast('progress', p),
      onLaunchState: (l) => broadcast('launch-state', l),
      onJavaStatus: (s) => broadcast('java-status', s),
      onToast: (t) => broadcast('toast', t),
    });
    if (res.ok) {
      saveSettings({ lastUsername: String(username ?? '').trim() });
      updatePresence({
        state: 'En jeu',
        details: 'Joue sur OpenMC',
        start: Date.now(),
      });
      if (!getSettings().keepOpen) {
        setTimeout(() => app.quit(), 6000);
      }
    }
    return res;
  });
  ipcMain.handle('game:cancel', () => cancelLaunch());

  ipcMain.handle('update:check', () => {
    void checkForUpdates((s) => broadcast('update-status', s));
    return { state: 'checking' as const };
  });
  ipcMain.handle('update:install', () => installUpdate());

  ipcMain.handle('background:choose', () => chooseBackground());
  ipcMain.handle('background:reset', () => resetBackground());

  ipcMain.handle('app:openExternal', (_e, url: string) => {
    if (typeof url === 'string' && /^https?:\/\//.test(url)) void shell.openExternal(url);
  });
  ipcMain.handle('window:minimize', () => BrowserWindow.getFocusedWindow()?.minimize());
  ipcMain.handle('window:maximize', () => {
    const w = BrowserWindow.getFocusedWindow();
    if (w) {
      if (w.isMaximized()) w.unmaximize();
      else w.maximize();
    }
  });
  ipcMain.handle('window:close', () => BrowserWindow.getFocusedWindow()?.close());
}
