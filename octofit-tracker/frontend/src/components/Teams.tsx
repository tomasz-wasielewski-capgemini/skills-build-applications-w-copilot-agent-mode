import { CapabilityCard } from './CapabilityCard.js';
export default function Teams() {
  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      apiPath="/api/teams"
      itemsKey="teams"
      emptyMessage="No teams available."
    />
  );
}
