import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

export default function Activities() {
  const [items, setItems] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadActivities() {
      try {
        const response = await getJson<{ activities?: unknown[] }>('/api/activities');
        if (!active) return;
        setItems(response.activities ?? []);
      } catch (caughtError) {
        if (!active) return;
        setError(caughtError instanceof Error ? caughtError.message : 'Unable to load activities');
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadActivities();
    return () => {
      active = false;
    };
  }, []);

  return (
    <CapabilityCard
      title="Activities"
      description="Track student activity minutes and points."
      items={items}
      isLoading={isLoading}
      error={error}
      emptyMessage="No activities available."
    />
  );
}
