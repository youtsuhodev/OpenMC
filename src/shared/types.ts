export interface AppInfo {
  version: string;
  platform: string;
  arch: string;
}

export interface Settings {
  maxRam: number;
  minRam: number;
  selectedVersion: string;
  width: number;
  height: number;
  fullscreen: boolean;
  extraJvmArgs: string;
  serverIp: string;
  serverPort: number;
  discordRpc: boolean;
  keepOpen: boolean;
  background: string | null;
  newsUrl: string;
  lastUsername: string;
}

export interface ProfileStatus {
  username: string | null;
}

export interface ServerStatus {
  online: boolean;
  playersOnline: number;
  playersMax: number;
  motd: string;
  version: string;
  latency: number | null;
  updatedAt: number;
}

export interface GameVersion {
  id: string;
  type: 'release' | 'snapshot' | string;
  releaseTime?: string;
}

export interface JavaStatus {
  state: 'unknown' | 'found' | 'downloading' | 'downloaded' | 'error';
  version?: string;
  path?: string;
  progress?: number;
  message?: string;
}

export type LaunchStage = 'idle' | 'preparing' | 'downloading' | 'launching' | 'running' | 'error';

export interface LaunchState {
  stage: LaunchStage;
  message?: string;
}

export interface LaunchResult {
  ok: boolean;
  message?: string;
  pid?: number;
}

export interface ProgressInfo {
  type: string;
  task: string;
  current: number;
  total: number;
  percent: number;
}

export interface NewsItem {
  title: string;
  date: string;
  content: string;
  image?: string;
}

export type UpdateState = 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'ready' | 'error';

export interface UpdateStatus {
  state: UpdateState;
  version?: string;
  message?: string;
  progress?: number;
}

export type ToastKind = 'info' | 'success' | 'error' | 'warn';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

export type OpenMCChannel =
  | 'progress'
  | 'server-status'
  | 'launch-state'
  | 'java-status'
  | 'update-status'
  | 'toast';

export interface OpenMCChannelMap {
  progress: ProgressInfo;
  'server-status': ServerStatus;
  'launch-state': LaunchState;
  'java-status': JavaStatus;
  'update-status': UpdateStatus;
  toast: Toast;
}

export interface OpenMCAPI {
  appInfo(): Promise<AppInfo>;
  getSettings(): Promise<Settings>;
  saveSettings(patch: Partial<Settings>): Promise<Settings>;
  getProfile(): Promise<ProfileStatus>;
  setProfile(username: string): Promise<ProfileStatus>;
  getNews(): Promise<NewsItem[]>;
  getVersions(): Promise<GameVersion[]>;
  getJavaStatus(): Promise<JavaStatus>;
  launchGame(username: string): Promise<LaunchResult>;
  cancelLaunch(): Promise<void>;
  checkForUpdates(): Promise<UpdateStatus>;
  installUpdate(): Promise<void>;
  chooseBackground(): Promise<string | null>;
  resetBackground(): Promise<void>;
  openExternal(url: string): void;
  minimizeWindow(): void;
  toggleMaximizeWindow(): void;
  closeWindow(): void;
  on<K extends OpenMCChannel>(channel: K, cb: (payload: OpenMCChannelMap[K]) => void): () => void;
}
