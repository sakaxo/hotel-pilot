import { cn } from "@/lib/utils"

export function LoadingState({
  label = "Loading...",
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-14", className)}>
      <span className="size-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}
