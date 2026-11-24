"use client";

import { cn } from "@/lib/utils";

export interface SegmentOption<T extends string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ElementType;
}

/** Mutually exclusive choice between 2–5 options (units, view modes, roles). */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
  size = "md",
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: SegmentOption<T>[];
  /** Accessible name for the group. */
  label: string;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("inline-flex items-center gap-0.5 rounded-lg border border-line bg-surface p-0.5", className)}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md font-medium transition-colors cursor-pointer",
              size === "sm" ? "h-7 px-2.5 text-xs" : "h-8 px-3 text-sm",
              active ? "bg-card text-ink shadow-xs" : "text-ink-2 hover:text-ink"
            )}
          >
            {Icon && <Icon className="size-3.5" aria-hidden />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
