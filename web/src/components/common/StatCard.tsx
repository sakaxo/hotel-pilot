import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function StatCard({
  label,
  value,
  icon,
  accent = "primary",
  hint,
  className,
}: {
  label: string
  value: ReactNode
  icon?: ReactNode
  accent?: "primary" | "success" | "warning" | "danger" | "info"
  hint?: string
  className?: string
}) {
  const accentStyles: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-[#8a5a16]",
    danger: "bg-danger/10 text-danger",
    info: "bg-info/10 text-info",
  }

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-4 shadow-sm",
        className
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="truncate text-2xl font-semibold text-foreground">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {icon && (
        <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg [&_svg]:size-5", accentStyles[accent])}>
          {icon}
        </div>
      )}
    </div>
  )
}
