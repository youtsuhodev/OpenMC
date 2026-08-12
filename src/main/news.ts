import type { NewsItem } from '../shared/types';
import { getSettings } from './settings';

const DEFAULT_NEWS: NewsItem[] = [];

export async function getNews(): Promise<NewsItem[]> {
  const url = getSettings().newsUrl?.trim();
  if (!url) return DEFAULT_NEWS;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return DEFAULT_NEWS;
    const data = (await res.json()) as unknown;
    if (!Array.isArray(data)) return DEFAULT_NEWS;
    const items = data.filter(
      (n): n is NewsItem =>
        !!n &&
        typeof (n as NewsItem).title === 'string' &&
        typeof (n as NewsItem).content === 'string',
    );
    return items.slice(0, 50);
  } catch {
    return DEFAULT_NEWS;
  }
}
