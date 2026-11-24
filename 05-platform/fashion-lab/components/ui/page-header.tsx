import { cn } from "@/lib/utils";

/** Title block at the top of a page or project stage. One per screen. */
export function PageHeader({
  title,
  description,
  actions,
  meta,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Buttons / controls aligned to the right on wide screens. */
  actions?: React.ReactNode;
  /** Small line above the title, e.g. the active profile or material. */
  meta?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div className="min-w-0">
        {meta && <div className="text-sm text-muted mb-1">{meta}</div>}
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {description && <p className="text-sm text-ink-2 mt-1 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
