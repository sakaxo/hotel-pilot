import { cn } from "@/lib/utils"
import type { AccessResult, CardStatus, PaymentStatus, ReservationStatus, RoomStatus } from "@/types"

type KnownStatus =
  | RoomStatus
  | ReservationStatus
  | PaymentStatus
  | CardStatus
  | AccessResult
  | "Active"
  | "Inactive"
  | string

const STATUS_STYLES: Record<string, string> = {
  // Rooms
  Available: "bg-success/10 text-success",
  Occupied: "bg-info/10 text-info",
  Reserved: "bg-warning/10 text-[#8a5a16]",
  Cleaning: "bg-muted text-muted-foreground",
  Maintenance: "bg-danger/10 text-danger",
  // Reservations
  Pending: "bg-warning/10 text-[#8a5a16]",
  Confirmed: "bg-info/10 text-info",
  "Checked In": "bg-success/10 text-success",
  "Checked Out": "bg-muted text-muted-foreground",
  Cancelled: "bg-danger/10 text-danger",
  // Payments
  Paid: "bg-success/10 text-success",
  Failed: "bg-danger/10 text-danger",
  Refunded: "bg-muted text-muted-foreground",
  "Partially Paid": "bg-warning/10 text-[#8a5a16]",
  // RFID cards
  Assigned: "bg-info/10 text-info",
  Blocked: "bg-danger/10 text-danger",
  Lost: "bg-danger/10 text-danger",
  // Access
  Granted: "bg-success/10 text-success",
  Denied: "bg-danger/10 text-danger",
  // Generic
  Active: "bg-success/10 text-success",
  Inactive: "bg-muted text-muted-foreground",
}

export function StatusBadge({
  status,
  className,
}: {
  status: KnownStatus
  className?: string
}) {
  const style = STATUS_STYLES[status] ?? "bg-muted text-muted-foreground"
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        style,
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {status}
    </span>
  )
}
