import { Modal } from "@/components/common/Modal"
import { StatusBadge } from "@/components/common/StatusBadge"
import { Button } from "@/components/ui/button"
import { useAppData } from "@/context/AppDataContext"
import { formatDate, formatDateTime, maskCardUid } from "@/lib/format"
import type { RfidCard } from "@/types"

export function RfidCardDetails({
  open,
  onClose,
  card,
}: {
  open: boolean
  onClose: () => void
  card: RfidCard | null
}) {
  const { getGuest, getRoom } = useAppData()
  if (!card) return null

  const guest = getGuest(card.assignedGuestId)
  const room = getRoom(card.assignedRoomId)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={card.reference}
      description={maskCardUid(card.uid)}
      footer={
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="flex flex-col gap-4 text-sm">
        <div className="flex items-center justify-between">
          <p className="font-medium text-foreground">Current status</p>
          <StatusBadge status={card.status} />
        </div>

        {card.status === "Assigned" && (
          <div className="grid grid-cols-2 gap-3 rounded-md border border-border p-3">
            <div>
              <p className="text-xs text-muted-foreground">Assigned guest</p>
              <p className="font-medium text-foreground">
                {guest ? `${guest.firstName} ${guest.lastName}` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Assigned room</p>
              <p className="font-medium text-foreground">{room?.number ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Assigned on</p>
              <p className="font-medium text-foreground">{card.assignedDate ? formatDate(card.assignedDate) : "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Expires</p>
              <p className="font-medium text-foreground">{card.expiryDate ? formatDate(card.expiryDate) : "—"}</p>
            </div>
          </div>
        )}

        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Assignment history</p>
          <ul className="divide-y divide-border rounded-md border border-border">
            {card.history.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <div>
                  <p className="font-medium text-foreground">{h.action}</p>
                  <p className="text-xs text-muted-foreground">{h.details}</p>
                </div>
                <p className="text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(h.date)}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Modal>
  )
}
