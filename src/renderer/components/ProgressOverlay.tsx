import type { LaunchState, ProgressInfo } from '../../shared/types';
import { Card } from './ui';

export function ProgressOverlay({
  launch,
  progress,
  onCancel,
}: {
  launch: LaunchState;
  progress: ProgressInfo | null;
  onCancel: () => void;
}) {
  const active = launch.stage !== 'idle' && launch.stage !== 'running' && launch.stage !== 'error';
  if (!active) return null;

  const downloading = launch.stage === 'downloading' && progress;
  const pct = progress?.percent ?? 0;

  return (
    <div className="overlay">
      <Card className="overlay-card">
        {downloading ? (
          <>
            <div className="overlay-title">Téléchargement</div>
            <div className="overlay-task">{progress?.task ?? '…'}</div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="overlay-percent">{Math.round(pct)}%</div>
          </>
        ) : (
          <>
            <div className="spinner" />
            <div className="overlay-title">
              {launch.stage === 'preparing' ? 'Préparation' : launch.stage === 'launching' ? 'Lancement' : '…'}
            </div>
            <div className="overlay-task">{launch.message ?? 'Veuillez patienter…'}</div>
          </>
        )}
        <button className="btn ghost" onClick={onCancel} style={{ marginTop: 18 }}>
          Annuler
        </button>
      </Card>
    </div>
  );
}
