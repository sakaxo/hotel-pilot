import { Modal } from "@/components/common/Modal"
import { StatusBadge } from "@/components/common/StatusBadge"
import { Button } from "@/components/ui/button"
import { useAppData } from "@/context/AppDataContext"
import { useToast } from "@/context/ToastContext"
import { formatCurrency } from "@/lib/format"
import type { Room, RoomStatus } from "@/types"

const QUICK_STATUSES: RoomStatus[] = ["Available", "Cleaning", "Maintenance"]

export function RoomDetails({
  open,
  onClose,
  room,
  onEdit,
}: {
  open: boolean
  onClose: () => void
  room: Room | null
  onEdit: () => void
}) {
  const { getRoomCategory, getGuest, setRoomStatus } = useAppData()
  const { showToast } = useToast()
  if (!room) return null

  const category = getRoomCategory(room.categoryId)
  const guest = getGuest(room.currentGuestId)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Room ${room.number}`}
      description={category?.name}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onEdit}>Edit room</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 text-sm">
        <div className="flex items-center justify-between">
          <p className="font-medium text-foreground">Current status</p>
          <StatusBadge status={room.status} />
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-md border border-border p-3">
          <div>
            <p className="text-xs text-muted-foreground">Floor</p>
            <p className="font-medium text-foreground">{room.floor}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Rate / night</p>
            <p className="font-medium text-foreground">{formatCurrency(room.rate)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Capacity</p>
            <p className="font-medium text-foreground">{category?.capacity ?? "—"} guest(s)</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Housekeeping</p>
            <p className="font-medium text-foreground">{room.housekeepingStatus}</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Current guest</p>
          <p className="font-medium text-foreground">
            {guest ? `${guest.firstName} ${guest.lastName}` : "No guest currently assigned"}
          </p>
        </div>

        {room.status !== "Occupied" && room.status !== "Reserved" && (
          <div>
            <p className="mb-2 text-xs text-muted-foreground">Quick status update</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_STATUSES.filter((s) => s !== room.status).map((s) => (
                <Button
                  key={s}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRoomStatus(room.id, s)
                    showToast({ title: `Room ${room.number} marked as ${s}`, variant: "info" })
                  }}
                >
                  Mark {s}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
