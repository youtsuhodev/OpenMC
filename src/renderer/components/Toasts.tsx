import { useEffect, useRef } from 'react';
import type { Toast } from '../../shared/types';

export function Toasts({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 5000);
    return () => clearTimeout(t);
  }, [toast.id, onDismiss]);

  const icons: Record<Toast['kind'], string> = {
    success: 'bi-check-circle-fill',
    error: 'bi-x-circle-fill',
    warn: 'bi-exclamation-triangle-fill',
    info: 'bi-info-circle-fill',
  };

  return (
    <div ref={ref} className={`toast ${toast.kind}`} role="status">
      <i className={`bi ${icons[toast.kind]}`} />
      <span>{toast.message}</span>
    </div>
  );
}
