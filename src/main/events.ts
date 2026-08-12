import { BrowserWindow } from 'electron';
import type { OpenMCChannel } from '../shared/types';

let mainWindow: BrowserWindow | null = null;

export function setMainWindow(win: BrowserWindow | null): void {
  mainWindow = win;
}

export function broadcast<K extends OpenMCChannel>(channel: K, payload: unknown): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}
