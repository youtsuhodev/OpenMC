import type { NewsItem } from '../../shared/types';
import { Card } from './ui';

function formatDate(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function NewsPanel({ news }: { news: NewsItem[] | null }) {
  return (
    <div>
      <div className="view-header">
        <h2 className="view-title">Actualités</h2>
        <p className="view-subtitle">Les dernières actualités du launcher.</p>
      </div>
      {!news || news.length === 0 ? (
        <Card>
          <p className="muted" style={{ fontSize: 13 }}>
            Aucune actualité disponible pour le moment.
          </p>
        </Card>
      ) : (
        <div className="news-list">
          {news.map((item) => (
            <Card key={item.title} className="news-card">
              <div className="news-date">{formatDate(item.date)}</div>
              <div className="news-title">{item.title}</div>
              <div className="news-content">{item.content}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
