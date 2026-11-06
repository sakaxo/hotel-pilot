import { Modal } from "@/components/common/Modal"
import { StatusBadge } from "@/components/common/StatusBadge"
import { Button } from "@/components/ui/button"
import { useAppData } from "@/context/AppDataContext"
import { formatCurrency, formatDate } from "@/lib/format"
import type { Reservation } from "@/types"

export function ReservationDetails({
  open,
  onClose,
  reservation,
  onEdit,
}: {
  open: boolean
  onClose: () => void
  reservation: Reservation | null
  onEdit: () => void
}) {
  const { getGuest, getRoom, getRoomCategory } = useAppData()
  if (!reservation) return null

  const guest = getGuest(reservation.guestId)
  const room = getRoom(reservation.roomId)
  const category = getRoomCategory(room?.categoryId)
  const balance = reservation.totalAmount - reservation.amountPaid

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Reservation ${reservation.reference}`}
      description="Reservation summary and current status"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onEdit}>Edit reservation</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 text-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">
              {guest ? `${guest.firstName} ${guest.lastName}` : "Unknown guest"}
            </p>
            <p className="text-xs text-muted-foreground">{guest?.email}</p>
          </div>
          <StatusBadge status={reservation.status} />
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-md border border-border p-3">
          <div>
            <p className="text-xs text-muted-foreground">Room</p>
            <p className="font-medium text-foreground">
              {room?.number} · {category?.name}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Guests</p>
            <p className="font-medium text-foreground">
              {reservation.adults} adult(s), {reservation.children} child(ren)
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Check-in</p>
            <p className="font-medium text-foreground">{formatDate(reservation.checkInDate)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Check-out</p>
            <p className="font-medium text-foreground">{formatDate(reservation.checkOutDate)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-md border border-border p-3">
          <div>
            <p className="text-xs text-muted-foreground">Total amount</p>
            <p className="font-medium text-foreground">{formatCurrency(reservation.totalAmount)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Amount paid</p>
            <p className="font-medium text-foreground">{formatCurrency(reservation.amountPaid)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Balance due</p>
            <p className="font-medium text-foreground">{formatCurrency(Math.max(0, balance))}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Payment status</p>
            <StatusBadge status={reservation.paymentStatus} />
          </div>
        </div>

        {reservation.specialRequests && (
          <div>
            <p className="text-xs text-muted-foreground">Special requests</p>
            <p className="text-foreground">{reservation.specialRequests}</p>
          </div>
        )}
      </div>
    </Modal>
  )
}
