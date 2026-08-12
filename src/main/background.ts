import { BrowserWindow, dialog } from 'electron';
import fs from 'fs';
import path from 'path';
import { saveSettings } from './settings';

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.bmp': 'image/bmp',
};

export async function chooseBackground(): Promise<string | null> {
  const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
  if (!win) return null;
  const result = await dialog.showOpenDialog(win, {
    title: 'Choisir une image de fond',
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif'] }],
  });
  if (result.canceled || !result.filePaths[0]) return null;

  const file = result.filePaths[0];
  try {
    const ext = path.extname(file).toLowerCase();
    const mime = MIME[ext] ?? 'application/octet-stream';
    const buf = fs.readFileSync(file);
    const dataUrl = `data:${mime};base64,${buf.toString('base64')}`;
    saveSettings({ background: dataUrl });
    return dataUrl;
  } catch {
    return null;
  }
}

export function resetBackground(): void {
  saveSettings({ background: null });
}
