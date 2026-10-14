import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Props = {
  title: string;
  description: string;
  apiPath: string;
  itemsKey: string;
  emptyMessage: string;
};

function formatItem(item: unknown): string {
  if (item === null || item === undefined) return '';
  if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
    return String(item);
  }
  if (Array.isArray(item)) {
    return item.map(formatItem).filter(Boolean).join(', ');
  }
  if (typeof item === 'object') {
    return Object.values(item as Record<string, unknown>)
      .map((value) => formatItem(value))
      .filter(Boolean)
      .join(' ');
  }
  return String(item);
}

export function CapabilityCard({ title, description, apiPath, itemsKey, emptyMessage }: Props) {
  const [items, setItems] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadItems() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getJson<Record<string, unknown>>(apiPath);
        if (!active) return;

        const nextItems = Array.isArray(response[itemsKey]) ? response[itemsKey] : [];
        setItems(nextItems as unknown[]);
      } catch (caughtError) {
        if (!active) return;
        const message = caughtError instanceof Error ? caughtError.message : 'Unable to load data';
        setError(message);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadItems();
    return () => { active = false; };
  }, [apiPath, itemsKey]);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>

        {isLoading && <p role="status">Loading {title.toLowerCase()}...</p>}

        {!isLoading && error && (
          <p role="alert">Unable to load {title.toLowerCase()}. Please try again later.</p>
        )}

        {!isLoading && !error && items.length === 0 && <p>{emptyMessage}</p>}

        {!isLoading && !error && items.length > 0 && (
          <ul className="list-group list-group-flush">
            {items.map((item, index) => (
              <li key={`${title}-${index}`} className="list-group-item">
                {formatItem(item)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
