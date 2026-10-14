import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

export default function Teams() {
  const [items, setItems] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadTeams() {
      try {
        const response = await getJson<{ teams?: unknown[] }>('/api/teams');
        if (!active) return;
        setItems(response.teams ?? []);
      } catch (caughtError) {
        if (!active) return;
        setError(caughtError instanceof Error ? caughtError.message : 'Unable to load teams');
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadTeams();
    return () => {
      active = false;
    };
  }, []);

  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      items={items}
      isLoading={isLoading}
      error={error}
      emptyMessage="No teams available."
    />
  );
}
