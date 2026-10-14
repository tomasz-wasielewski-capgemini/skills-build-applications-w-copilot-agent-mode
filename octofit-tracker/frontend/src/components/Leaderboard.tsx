import { CapabilityCard } from './CapabilityCard.js';
export default function Leaderboard() {
  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      apiPath="/api/leaderboard"
      itemsKey="leaderboard"
      emptyMessage="No leaderboard available."
    />
  );
}
