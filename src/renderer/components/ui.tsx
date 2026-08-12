import type { ReactNode } from 'react';

export function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      className={`toggle${on ? ' on' : ''}`}
      onClick={() => !disabled && onChange(!on)}
      disabled={disabled}
      aria-label="basculer"
    />
  );
}

export function Card({ children, className, style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`card${className ? ` ${className}` : ''}`} style={style}>
      {children}
    </div>
  );
}

export function SectionTitle({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="settings-title">
      {icon && <span className="settings-title-icon">{icon}</span>}
      {children}
    </div>
  );
}
