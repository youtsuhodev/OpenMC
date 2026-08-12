import { contextBridge, ipcRenderer } from 'electron';
import type { OpenMCAPI, OpenMCChannel, OpenMCChannelMap } from '../shared/types';

const api: OpenMCAPI = {
  appInfo: () => ipcRenderer.invoke('app:info'),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (patch) => ipcRenderer.invoke('settings:save', patch),
  getProfile: () => ipcRenderer.invoke('profile:get'),
  setProfile: (username) => ipcRenderer.invoke('profile:set', username),
  getNews: () => ipcRenderer.invoke('news:get'),
  getVersions: () => ipcRenderer.invoke('versions:get'),
  getJavaStatus: () => ipcRenderer.invoke('java:status'),
  launchGame: (username) => ipcRenderer.invoke('game:launch', username),
  cancelLaunch: () => ipcRenderer.invoke('game:cancel'),
  checkForUpdates: () => ipcRenderer.invoke('update:check'),
  installUpdate: () => ipcRenderer.invoke('update:install'),
  chooseBackground: () => ipcRenderer.invoke('background:choose'),
  resetBackground: () => ipcRenderer.invoke('background:reset'),
  openExternal: (url) => {
    void ipcRenderer.invoke('app:openExternal', url);
  },
  minimizeWindow: () => {
    void ipcRenderer.invoke('window:minimize');
  },
  toggleMaximizeWindow: () => {
    void ipcRenderer.invoke('window:maximize');
  },
  closeWindow: () => {
    void ipcRenderer.invoke('window:close');
  },
  on: <K extends OpenMCChannel>(channel: K, cb: (payload: OpenMCChannelMap[K]) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: OpenMCChannelMap[K]) => cb(payload);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  },
};

contextBridge.exposeInMainWorld('openmc', api);
