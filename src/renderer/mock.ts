import type {
  AppInfo,
  GameVersion,
  JavaStatus,
  LaunchResult,
  NewsItem,
  ProfileStatus,
  OpenMCAPI,
  OpenMCChannel,
  OpenMCChannelMap,
  Settings,
  UpdateStatus,
} from '../shared/types';
import { DEFAULT_VERSION, SERVER_IP, SERVER_PORT } from '../shared/constants';

const defaultSettings: Settings = {
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

const staticVersions: GameVersion[] = [
  { id: 'latest', type: 'release' },
  { id: '1.21.11', type: 'release', releaseTime: '2025-11-04' },
  { id: '1.21.10', type: 'release', releaseTime: '2025-10-23' },
  { id: '1.21.9', type: 'release', releaseTime: '2025-10-09' },
  { id: '1.21.8', type: 'release', releaseTime: '2025-08-26' },
  { id: '1.21.7', type: 'release', releaseTime: '2025-07-29' },
  { id: '1.21.6', type: 'release', releaseTime: '2025-07-15' },
  { id: '1.21.5', type: 'release', releaseTime: '2025-05-12' },
  { id: '1.21.4', type: 'release', releaseTime: '2024-12-03' },
  { id: '1.21.3', type: 'release', releaseTime: '2024-10-23' },
  { id: '1.21.1', type: 'release', releaseTime: '2024-08-08' },
  { id: '1.21', type: 'release', releaseTime: '2024-06-13' },
];

const staticNews: NewsItem[] = [];

type Subscriber = (payload: unknown) => void;

export const mockAPI: OpenMCAPI = {
  async appInfo(): Promise<AppInfo> {
    return { version: '1.0.0-dev', platform: navigator.platform, arch: 'x64' };
  },

  async getSettings(): Promise<Settings> {
    return { ...defaultSettings };
  },

  async saveSettings(patch: Partial<Settings>): Promise<Settings> {
    Object.assign(defaultSettings, patch);
    return { ...defaultSettings };
  },

  async getProfile(): Promise<ProfileStatus> {
    return { username: defaultSettings.lastUsername || null };
  },

  async setProfile(username: string): Promise<ProfileStatus> {
    defaultSettings.lastUsername = username.trim();
    return { username: defaultSettings.lastUsername || null };
  },

  async getNews(): Promise<NewsItem[]> {
    return staticNews;
  },

  async getVersions(): Promise<GameVersion[]> {
    return staticVersions;
  },

  async getJavaStatus(): Promise<JavaStatus> {
    return { state: 'found', version: '21.0.5', path: 'mock-java' };
  },

  async launchGame(username: string): Promise<LaunchResult> {
    if (username.trim().length < 3) {
      return { ok: false, message: 'Le pseudo doit contenir au moins 3 caractères.' };
    }
    emit('launch-state', { stage: 'preparing', message: 'Préparation du lancement…' });
    emit('progress', { type: 'download', task: 'Téléchargement de Minecraft 1.21.11', current: 0, total: 100, percent: 0 });
    for (let p = 10; p <= 100; p += 10) {
      emit('progress', { type: 'download', task: 'Téléchargement de Minecraft 1.21.11', current: p, total: 100, percent: p });
      await delay(180);
    }
    emit('launch-state', { stage: 'launching', message: 'Lancement du jeu…' });
    await delay(1200);
    emit('launch-state', { stage: 'running', message: 'Le jeu est lancé !' });
    return { ok: true, message: 'Jeu lancé (mode démo)', pid: 12345 };
  },

  async cancelLaunch(): Promise<void> {
    emit('launch-state', { stage: 'idle' });
  },

  async checkForUpdates(): Promise<UpdateStatus> {
    return { state: 'not-available', version: '1.0.0' };
  },

  async installUpdate(): Promise<void> {},

  async chooseBackground(): Promise<string | null> {
    return null;
  },

  async resetBackground(): Promise<void> {},

  openExternal(url: string): void {
    if (url) window.open(url, '_blank');
  },

  minimizeWindow(): void {},
  toggleMaximizeWindow(): void {},
  closeWindow(): void {},

  on<K extends OpenMCChannel>(channel: K, cb: (payload: OpenMCChannelMap[K]) => void): () => void {
    const subs = subscribers.get(channel) ?? new Set<Subscriber>();
    subs.add(cb as Subscriber);
    subscribers.set(channel, subs);
    return () => {
      subs.delete(cb as Subscriber);
    };
  },
};

const subscribers = new Map<OpenMCChannel, Set<Subscriber>>();

function emit(channel: OpenMCChannel, payload: unknown): void {
  subscribers.get(channel)?.forEach((cb) => cb(payload));
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
