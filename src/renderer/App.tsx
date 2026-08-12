import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';
import { TitleBar } from './components/TitleBar';
import { Sidebar, type View } from './components/Sidebar';
import { PlayPanel } from './components/PlayPanel';
import { NewsPanel } from './components/NewsPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { ProgressOverlay } from './components/ProgressOverlay';
import { Toasts } from './components/Toasts';
import bgDefault from './assets/bg.jpg';
import type {
  AppInfo,
  GameVersion,
  JavaStatus,
  LaunchState,
  NewsItem,
  ProfileStatus,
  ProgressInfo,
  Settings,
  Toast,
  UpdateStatus,
} from '../shared/types';

export default function App() {
  const [view, setView] = useState<View>('home');
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [profile, setProfile] = useState<ProfileStatus>({ username: null });
  const [news, setNews] = useState<NewsItem[] | null>(null);
  const [versions, setVersions] = useState<GameVersion[]>([]);
  const [java, setJava] = useState<JavaStatus>({ state: 'unknown' });
  const [update, setUpdate] = useState<UpdateStatus>({ state: 'idle' });
  const [launch, setLaunch] = useState<LaunchState>({ stage: 'idle' });
  const [progress, setProgress] = useState<ProgressInfo | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  const pushToast = useCallback((kind: Toast['kind'], message: string) => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 6000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const saveSettings = useCallback(
    (patch: Partial<Settings>) => {
      setSettings((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...patch };
        api.saveSettings(patch).catch(() => pushToast('error', 'Impossible de sauvegarder les réglages.'));
        return next;
      });
    },
    [pushToast],
  );

  useEffect(() => {
    (async () => {
      try {
        const [info, s, p, vs, j] = await Promise.all([
          api.appInfo(),
          api.getSettings(),
          api.getProfile(),
          api.getVersions(),
          api.getJavaStatus(),
        ]);
        setAppInfo(info);
        setSettings(s);
        setProfile(p);
        setVersions(vs);
        setJava(j);
      } catch {
        pushToast('error', 'Impossible de charger la configuration.');
      }
      api.getNews().then(setNews).catch(() => setNews([]));
    })();
  }, [pushToast]);

  useEffect(() => {
    const unsubs = [
      api.on('progress', (p) => setProgress(p)),
      api.on('launch-state', (l) => setLaunch(l)),
      api.on('java-status', (j) => setJava(j)),
      api.on('update-status', (u) => setUpdate(u)),
      api.on('toast', (t) => pushToast(t.kind, t.message)),
    ];
    return () => unsubs.forEach((u) => u());
  }, [pushToast]);

  const handleLaunch = useCallback(
    async (username: string) => {
      setProfile({ username });
      try {
        const res = await api.launchGame(username);
        if (!res.ok) {
          setLaunch({ stage: 'error', message: res.message });
          pushToast('error', res.message ?? 'Le lancement a échoué.');
        } else {
          pushToast('success', `Bonne partie, ${username} !`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Le lancement a échoué.';
        setLaunch({ stage: 'error', message });
        pushToast('error', message);
      }
    },
    [pushToast],
  );

  const handleChooseBackground = useCallback(async () => {
    const path = await api.chooseBackground();
    if (path) {
      saveSettings({ background: path });
      pushToast('success', 'Fond d’écran mis à jour.');
    }
  }, [saveSettings, pushToast]);

  const handleResetBackground = useCallback(() => {
    api.resetBackground();
    saveSettings({ background: null });
  }, [saveSettings]);

  const handleCheckUpdates = useCallback(async () => {
    setUpdate({ state: 'checking' });
    const u = await api.checkForUpdates();
    if (u) setUpdate(u);
  }, []);

  const background = settings?.background ?? bgDefault;

  return (
    <div className="app">
      <div className="app-bg" style={{ backgroundImage: `url(${background})` }} />
      <TitleBar info={appInfo} />
      <div className="app-content">
        <Sidebar view={view} onView={setView} />
        <main className="main">
          {view === 'home' && settings && (
            <div className="home-single">
              <PlayPanel
                settings={settings}
                profile={profile}
                versions={versions}
                launchState={launch}
                onLaunch={handleLaunch}
                onLaunchCancel={() => api.cancelLaunch()}
                onProfileChange={(username) => api.setProfile(username)}
                onChange={saveSettings}
              />
            </div>
          )}
          {view === 'settings' && settings && (
            <SettingsPanel
              settings={settings}
              versions={versions}
              java={java}
              update={update}
              appInfo={appInfo}
              onChange={saveSettings}
              onChooseBackground={handleChooseBackground}
              onResetBackground={handleResetBackground}
              onCheckUpdates={handleCheckUpdates}
              onInstallUpdate={() => api.installUpdate()}
            />
          )}
          {view === 'news' && <NewsPanel news={news} />}
        </main>
      </div>
      <ProgressOverlay launch={launch} progress={progress} onCancel={() => api.cancelLaunch()} />
      <Toasts toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
