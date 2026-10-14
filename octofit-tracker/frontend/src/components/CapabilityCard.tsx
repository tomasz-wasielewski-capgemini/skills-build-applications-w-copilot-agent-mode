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

type Props = {
  title: string;
  description: string;
  items?: unknown[];
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
};

export function CapabilityCard({
  title,
  description,
  items = [],
  isLoading = false,
  error = null,
  emptyMessage = 'No items available.',
}: Props) {
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
