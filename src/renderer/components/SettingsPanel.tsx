import { DEFAULT_VERSION } from '../../shared/constants';
import type { AppInfo, GameVersion, JavaStatus, Settings, UpdateStatus } from '../../shared/types';
import { Card, SectionTitle, Toggle } from './ui';

export function SettingsPanel({
  settings,
  versions,
  java,
  update,
  appInfo,
  onChange,
  onChooseBackground,
  onResetBackground,
  onCheckUpdates,
  onInstallUpdate,
}: {
  settings: Settings;
  versions: GameVersion[];
  java: JavaStatus;
  update: UpdateStatus;
  appInfo: AppInfo | null;
  onChange: (patch: Partial<Settings>) => void;
  onChooseBackground: () => void;
  onResetBackground: () => void;
  onCheckUpdates: () => void;
  onInstallUpdate: () => void;
}) {
  return (
    <div>
      <div className="view-header">
        <h2 className="view-title">Réglages</h2>
        <p className="view-subtitle">Configure ton expérience de jeu.</p>
      </div>

      <div className="stack" style={{ maxWidth: 780 }}>
        <Card>
          <SectionTitle icon={<i className="bi bi-controller" />}>Jeu</SectionTitle>
          <SettingRow label="Version du jeu" desc="Version de Minecraft à lancer.">
            <select
              className="settings-input"
              value={settings.selectedVersion}
              onChange={(e) => onChange({ selectedVersion: e.target.value })}
            >
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.id === DEFAULT_VERSION ? 'Dernière version (recommandé)' : v.id}
                </option>
              ))}
            </select>
          </SettingRow>
          <SettingRow label="Mémoire maximale" desc="RAM maximale allouée à Minecraft.">
            <div className="row">
              <input
                type="range"
                className="range settings-range"
                min={2048}
                max={16384}
                step={512}
                value={settings.maxRam}
                onChange={(e) => onChange({ maxRam: Number(e.target.value) })}
              />
              <span className="range-value">{settings.maxRam / 1024} Go</span>
            </div>
          </SettingRow>
          <SettingRow label="Résolution" desc="Taille de la fenêtre du jeu.">
            <div className="row">
              <input
                type="number"
                className="settings-input"
                style={{ width: 90 }}
                min={320}
                max={7680}
                value={settings.width}
                onChange={(e) => onChange({ width: clamp(Number(e.target.value), 320, 7680) })}
              />
              <span className="muted">×</span>
              <input
                type="number"
                className="settings-input"
                style={{ width: 90 }}
                min={240}
                max={4320}
                value={settings.height}
                onChange={(e) => onChange({ height: clamp(Number(e.target.value), 240, 4320) })}
              />
            </div>
          </SettingRow>
          <SettingRow label="Plein écran" desc="Lancer Minecraft en plein écran.">
            <Toggle on={settings.fullscreen} onChange={(v) => onChange({ fullscreen: v })} />
          </SettingRow>
        </Card>

        <Card>
          <SectionTitle icon={<i className="bi bi-cup-hot" />}>Java</SectionTitle>
          <SettingRow label="Runtime Java" desc="Java utilisé pour lancer le jeu.">
            <span className="badge">
              {java.state === 'found'
                ? `Trouvé — ${java.version ?? '?'}`
                : java.state === 'downloading'
                  ? `Téléchargement… ${java.progress ?? 0}%`
                  : java.state === 'downloaded'
                    ? 'Java intégré prêt'
                    : java.state === 'error'
                      ? 'Erreur'
                      : 'Détection…'}
            </span>
          </SettingRow>
          {java.path && (
            <div className="hint" style={{ wordBreak: 'break-all' }}>
              {java.path}
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle icon={<i className="bi bi-rocket-takeoff" />}>Lancement</SectionTitle>
          <SettingRow label="Adresse du serveur" desc="Serveur rejoint automatiquement au lancement.">
            <input
              className="settings-input"
              value={settings.serverIp}
              onChange={(e) => onChange({ serverIp: e.target.value })}
            />
          </SettingRow>
          <SettingRow label="Arguments JVM" desc="Arguments supplémentaires pour la machine virtuelle Java.">
            <input
              className="settings-input wide"
              value={settings.extraJvmArgs}
              placeholder="-XX:+UseG1GC"
              onChange={(e) => onChange({ extraJvmArgs: e.target.value })}
            />
          </SettingRow>
          <SettingRow label="Garder le launcher ouvert" desc="Ne pas fermer le launcher après le lancement.">
            <Toggle on={settings.keepOpen} onChange={(v) => onChange({ keepOpen: v })} />
          </SettingRow>
          <SettingRow label="Presence Discord" desc="Afficher « Joue sur OpenMC » sur ton profil.">
            <Toggle on={settings.discordRpc} onChange={(v) => onChange({ discordRpc: v })} />
          </SettingRow>
        </Card>

        <Card>
          <SectionTitle icon={<i className="bi bi-image" />}>Apparence</SectionTitle>
          <SettingRow label="Fond d’écran" desc="Image d’arrière-plan du launcher.">
            <div className="row">
              <button className="btn" onClick={onChooseBackground}>
                Choisir une image…
              </button>
              {settings.background && (
                <button className="btn ghost" onClick={onResetBackground}>
                  Réinitialiser
                </button>
              )}
            </div>
          </SettingRow>
        </Card>

        <Card>
          <SectionTitle icon={<i className="bi bi-arrow-repeat" />}>Mises à jour</SectionTitle>
          <SettingRow label="Version du launcher" desc={`v${appInfo?.version ?? '?'} — ${appInfo?.platform ?? ''} ${appInfo?.arch ?? ''}`}>
            <div className="row">
              {update.state === 'available' || update.state === 'ready' ? (
                <button className="btn primary" onClick={onInstallUpdate} disabled={update.state !== 'ready'}>
                  {update.state === 'available' ? 'Téléchargement…' : 'Installer et redémarrer'}
                </button>
              ) : (
                <button className="btn" onClick={onCheckUpdates} disabled={update.state === 'checking'}>
                  {update.state === 'checking' ? 'Vérification…' : 'Vérifier les mises à jour'}
                </button>
              )}
            </div>
          </SettingRow>
          {update.message && <div className="hint">{update.message}</div>}
        </Card>

        <Card>
          <SectionTitle icon={<i className="bi bi-info-circle" />}>À propos</SectionTitle>
          <p className="settings-desc" style={{ maxWidth: 'none', color: 'var(--text-dim)', lineHeight: 1.7 }}>
            OpenMC est un launcher Minecraft communautaire gratuit. Tu peux configurer le serveur à
            rejoindre dans les Réglages. Non affilié à Mojang ou Microsoft.
          </p>
        </Card>
      </div>
    </div>
  );
}

function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="settings-row">
      <div>
        <div className="settings-label">{label}</div>
        {desc && <div className="settings-desc">{desc}</div>}
      </div>
      {children}
    </div>
  );
}

function clamp(v: number, min: number, max: number): number {
  if (Number.isNaN(v)) return min;
  return Math.min(max, Math.max(min, v));
}
