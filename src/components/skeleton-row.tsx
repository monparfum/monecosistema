export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  return (
    <div className="py-5 grid gap-6 items-center animate-pulse" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="h-4 bg-[color:var(--muted)]" />
      ))}
    </div>
  );
}

export function SkeletonBlock({ height = 120 }: { height?: number }) {
  return <div className="bg-[color:var(--muted)] animate-pulse" style={{ height }} />;
}
