import { cn } from "@/lib/utils";
export function FilterDropdown({ label, value, options, onChange, className, allLabel = "All", }) {
    return (<label className={cn("flex items-center gap-2 text-sm", className)}>
      {label && <span className="whitespace-nowrap text-muted-foreground">{label}</span>}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-9 rounded-md border border-border bg-background px-2.5 text-sm text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none">
        <option value="all">{allLabel}</option>
        {options.map((opt) => (<option key={opt.value} value={opt.value}>
            {opt.label}
          </option>))}
      </select>
    </label>);
}
