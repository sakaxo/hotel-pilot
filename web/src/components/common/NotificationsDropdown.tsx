import * as React from "react"
import { FiAlertTriangle, FiBell, FiCheckCircle, FiInfo, FiXCircle } from "react-icons/fi"
import { useAppData } from "@/context/AppDataContext"
import { formatRelativeTime } from "@/lib/format"
import { cn } from "@/lib/utils"

const TYPE_ICON = {
  info: { icon: FiInfo, className: "text-info" },
  warning: { icon: FiAlertTriangle, className: "text-warning" },
  success: { icon: FiCheckCircle, className: "text-success" },
  danger: { icon: FiXCircle, className: "text-danger" },
} as const

export function NotificationsDropdown() {
  const { data, markNotificationRead, markAllNotificationsRead } = useAppData()
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const unreadCount = data.notifications.filter((n) => !n.read).length

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-haspopup="menu"
        className="relative flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <FiBell className="size-4.5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex size-2 rounded-full bg-danger" />
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-md border border-border bg-card shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
            <p className="text-sm font-medium text-foreground">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllNotificationsRead}
                className="text-xs font-medium text-primary hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {data.notifications.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">You're all caught up.</p>
            )}
            {data.notifications.map((n) => {
              const { icon: Icon, className } = TYPE_ICON[n.type]
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => markNotificationRead(n.id)}
                  className={cn(
                    "flex w-full items-start gap-2.5 border-b border-border px-3 py-2.5 text-left last:border-0 hover:bg-muted/50",
                    !n.read && "bg-accent/40"
                  )}
                >
                  <Icon className={cn("mt-0.5 size-4 shrink-0", className)} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.description}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {formatRelativeTime(n.timestamp)}
                    </p>
                  </div>
                  {!n.read && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
