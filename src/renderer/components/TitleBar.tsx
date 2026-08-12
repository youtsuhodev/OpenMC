import logo from '../assets/logo.png';
import { api } from '../api';
import { APP_NAME } from '../../shared/constants';
import type { AppInfo } from '../../shared/types';

export function TitleBar({ info }: { info: AppInfo | null }) {
  return (
    <header className="titlebar">
      <div className="titlebar-brand">
        <img src={logo} alt="" className="titlebar-logo" />
        <span className="titlebar-title">{APP_NAME}</span>
        <span className="titlebar-version">v{info?.version ?? '…'}</span>
      </div>
      <div className="titlebar-right">
        <button className="win-btn" title="Réduire" onClick={() => api.minimizeWindow()}>
          &#x2013;
        </button>
        <button className="win-btn" title="Agrandir / Restaurer" onClick={() => api.toggleMaximizeWindow()}>
          &#x25A1;
        </button>
        <button className="win-btn close" title="Fermer" onClick={() => api.closeWindow()}>
          &#x2715;
        </button>
      </div>
    </header>
  );
}
