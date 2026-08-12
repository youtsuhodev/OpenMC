import logo from '../assets/logo.png';
import { APP_NAME } from '../../shared/constants';
import type { ReactNode } from 'react';

export type View = 'home' | 'settings' | 'news';

const NAV: { id: View; label: string; icon: ReactNode }[] = [
  { id: 'home', label: 'Accueil', icon: <i className="bi bi-house-door-fill" /> },
  { id: 'settings', label: 'Réglages', icon: <i className="bi bi-gear-fill" /> },
  { id: 'news', label: 'Actualités', icon: <i className="bi bi-newspaper" /> },
];

export function Sidebar({ view, onView }: { view: View; onView: (v: View) => void }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo-wrap">
        <img src={logo} alt="Logo OpenMC" className="sidebar-logo" />
        <div>
          <div className="sidebar-brand">{APP_NAME}</div>
          <div className="sidebar-tagline">Launcher communautaire</div>
        </div>
      </div>

      <nav className="nav">
        {NAV.map((item) => (
          <button
            key={item.id}
            className={`nav-item${view === item.id ? ' active' : ''}`}
            onClick={() => onView(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
