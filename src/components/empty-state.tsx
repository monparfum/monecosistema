import type { ReactNode } from "react";

export function EmptyState({
  eyebrow = "Em breve",
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="border border-border p-16 text-center flex flex-col items-center gap-4 bg-[color:var(--card)]">
      <div className="eyebrow">{eyebrow}</div>
      <div className="font-display text-3xl max-w-lg leading-tight">{title}</div>
      {description && (
        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
