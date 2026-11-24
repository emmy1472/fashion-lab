import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

const control =
  "w-full h-9 rounded-lg border border-line-strong bg-card px-3 text-sm text-ink placeholder:text-muted transition-colors focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(control, className)} {...props} />;
  }
);

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, ...props }, ref) {
    return <select ref={ref} className={cn(control, "pr-8", className)} {...props} />;
  }
);

/** Label + control + optional hint. Pass the control as a render function to receive its id. */
export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  children: (id: string) => React.ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      {children(id)}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}
