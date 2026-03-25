import { cn } from "@/lib/utils";

interface OptionGridProps {
  options: { label: string; value: string; icon?: React.ReactNode; description?: string }[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multi?: boolean;
  columns?: 2 | 3;
}

export default function OptionGrid({ options, value, onChange, multi = false, columns = 2 }: OptionGridProps) {
  const selected = Array.isArray(value) ? value : [value];

  const toggle = (val: string) => {
    if (multi) {
      const arr = Array.isArray(value) ? value : [];
      if (arr.includes(val)) {
        onChange(arr.filter(v => v !== val));
      } else {
        onChange([...arr, val]);
      }
    } else {
      onChange(val);
    }
  };

  return (
    <div className={cn("grid gap-3", columns === 3 ? "grid-cols-3" : "grid-cols-2")}>
      {options.map(opt => {
        const isSelected = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            onClick={() => toggle(opt.value)}
            className={cn(
              "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all duration-200 text-center min-h-[90px]",
              isSelected
                ? "border-primary bg-primary/15 text-foreground shadow-[0_0_20px_hsl(var(--primary)/0.15)]"
                : "border-border bg-card text-muted-foreground hover:border-muted-foreground/40"
            )}
          >
            {opt.icon && <div className={cn("text-2xl", isSelected ? "text-primary" : "text-muted-foreground")}>{opt.icon}</div>}
            <span className="text-sm font-medium leading-tight">{opt.label}</span>
            {opt.description && <span className="text-[11px] text-muted-foreground leading-tight">{opt.description}</span>}
          </button>
        );
      })}
    </div>
  );
}
