import { useState } from 'react';
import { DEFAULT_VERSION } from '../../shared/constants';
import type { GameVersion, LaunchState, ProfileStatus, Settings } from '../../shared/types';
import { Card } from './ui';

export function PlayPanel({
  settings,
  profile,
  versions,
  launchState,
  onLaunch,
  onLaunchCancel,
  onProfileChange,
  onChange,
}: {
  settings: Settings;
  profile: ProfileStatus;
  versions: GameVersion[];
  launchState: LaunchState;
  onLaunch: (username: string) => void;
  onLaunchCancel: () => void;
  onProfileChange: (username: string) => void;
  onChange: (patch: Partial<Settings>) => void;
}) {
  const [username, setUsername] = useState(profile.username ?? '');
  const valid = username.trim().length >= 3 && username.trim().length <= 16 && /^[a-zA-Z0-9_]+$/.test(username.trim());

  const busy = launchState.stage === 'preparing' || launchState.stage === 'downloading' || launchState.stage === 'launching';
  const running = launchState.stage === 'running';

  const commit = (): void => {
    if (!valid) return;
    onProfileChange(username.trim());
    onLaunch(username.trim());
  };

  return (
    <Card className="play-card">
      <div className="play-top">
        <div className="play-heading">Bonne partie !</div>
        {profile.username && (
          <div className="user-chip">
            <span className="user-avatar">
              <img
                src={`https://mc-heads.net/avatar/${profile.username}/32`}
                alt=""
                style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                onError={(e) => ((e.currentTarget as HTMLImageElement).style.visibility = 'hidden')}
              />
            </span>
            <span className="user-name">{profile.username}</span>
          </div>
        )}
      </div>

      <div className="field-label" style={{ marginBottom: 7 }}>
        Pseudo en jeu
      </div>
      <input
        className="input"
        placeholder="Ton pseudo (3 à 16 caractères)"
        value={username}
        maxLength={16}
        onChange={(e) => setUsername(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && valid) commit();
        }}
        style={{ marginBottom: 18 }}
      />

      <div className="play-config">
        <div>
          <label className="field-label">Version du jeu</label>
          <select
            className="select"
            value={settings.selectedVersion}
            onChange={(e) => onChange({ selectedVersion: e.target.value })}
          >
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.id === DEFAULT_VERSION ? 'Dernière version (recommandé)' : v.id}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Mémoire allouée</label>
          <div className="range-wrap">
            <input
              type="range"
              className="range"
              min={2048}
              max={16384}
              step={512}
              value={settings.maxRam}
              onChange={(e) => onChange({ maxRam: Number(e.target.value) })}
            />
          </div>
          <div className="spread" style={{ marginTop: 2 }}>
            <span className="muted" style={{ fontSize: 11.5 }}>
              2 Go
            </span>
            <span className="range-value">{settings.maxRam / 1024} Go</span>
            <span className="muted" style={{ fontSize: 11.5 }}>
              16 Go
            </span>
          </div>
        </div>
      </div>

      <button
        className={`btn-play${busy || running ? ' working' : ''}`}
        onClick={running ? undefined : busy ? onLaunchCancel : valid ? commit : undefined}
        disabled={!valid && !busy && !running}
      >
        {busy ? 'Préparation…' : running ? 'Le jeu est lancé !' : 'Jouer'}
      </button>

      <div className="play-hint">
        <span className="dot green" />
        {settings.serverIp
          ? `Connexion automatique sur ${settings.serverIp}:${settings.serverPort}`
          : 'Configure l’adresse du serveur dans les Réglages.'}
      </div>
    </Card>
  );
}
