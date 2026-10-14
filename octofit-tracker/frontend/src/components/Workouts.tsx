import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

export default function Workouts() {
  const [items, setItems] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadWorkouts() {
      try {
        const response = await getJson<{ suggestions?: unknown[] }>('/api/workouts/suggestions/mona@example.com');
        if (!active) return;
        setItems(response.suggestions ?? []);
      } catch (caughtError) {
        if (!active) return;
        setError(caughtError instanceof Error ? caughtError.message : 'Unable to load workout suggestions');
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadWorkouts();
    return () => {
      active = false;
    };
  }, []);

  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      items={items}
      isLoading={isLoading}
      error={error}
      emptyMessage="No workout suggestions available."
    />
  );
}
