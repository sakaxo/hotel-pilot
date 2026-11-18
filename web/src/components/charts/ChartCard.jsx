import { cn } from "@/lib/utils";
export function ChartCard({ title, description, actions, children, className, }) {
    return (<div className={cn("rounded-lg border border-border bg-card p-4 shadow-sm", className)}>
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </div>);
}
