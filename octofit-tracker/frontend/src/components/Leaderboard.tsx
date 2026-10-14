import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

export default function Leaderboard() {
  const [items, setItems] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadLeaderboard() {
      try {
        const response = await getJson<{ leaderboard?: unknown[] }>('/api/leaderboard');
        if (!active) return;
        setItems(response.leaderboard ?? []);
      } catch (caughtError) {
        if (!active) return;
        setError(caughtError instanceof Error ? caughtError.message : 'Unable to load leaderboard');
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadLeaderboard();
    return () => {
      active = false;
    };
  }, []);

  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      items={items}
      isLoading={isLoading}
      error={error}
      emptyMessage="No leaderboard available."
    />
  );
}
