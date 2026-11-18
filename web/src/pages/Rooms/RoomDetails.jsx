import { Modal } from "@/components/common/Modal"
import { StatusBadge } from "@/components/common/StatusBadge"
import { Button } from "@/components/ui/button"
import { FormSelect } from "@/components/forms/FormSelect"
import { formatCurrency } from "@/lib/format"
import { useToast } from "@/context/ToastContext"

const ROOM_STATUSES = [
  { label: "Available", value: "available" },
  { label: "Occupied", value: "occupied" },
  { label: "Awaiting Inspection", value: "awaiting_inspection" },
  { label: "Maintenance", value: "maintenance" },
]

function getAllowedStatuses(currentStatus) {
  switch (currentStatus) {
    case "occupied":
      return ROOM_STATUSES.filter((option) => option.value === "occupied")

    case "awaiting_inspection":
      return ROOM_STATUSES.filter((option) =>
        ["awaiting_inspection", "available", "maintenance"].includes(
          option.value
        )
      )

    case "maintenance":
      return ROOM_STATUSES.filter((option) =>
        ["maintenance", "available"].includes(option.value)
      )

    case "available":
    default:
      return ROOM_STATUSES.filter((option) =>
        ["available", "maintenance"].includes(option.value)
      )
  }
}

export function RoomDetails({
  open,
  onClose,
  room,
  onEdit,
  onDelete,
  onUpdateStatus,
}) {
  const { showToast } = useToast()

  if (!room) return null

  async function handleStatusChange(event) {
    const value = event.target.value

    if (value === room.status) return

    try {
      await onUpdateStatus(room, value)
    } catch (error) {
      showToast({
        title: "Unable to update room status",
        description: error.message,
        variant: "error",
      })
    }
  }

  const statusOptions = getAllowedStatuses(room.status)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Room ${room.number}`}
      description={room.category_name}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>

          <Button variant="outline" onClick={() => onDelete(room)}>
            Delete room
          </Button>

          <Button onClick={onEdit}>Edit room</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 text-sm">
        <div className="flex items-center justify-between">
          <p className="font-medium text-foreground">Room status</p>
          <StatusBadge status={room.status} />
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-md border border-border p-3">
          <div>
            <p className="text-xs text-muted-foreground">Floor</p>
            <p className="font-medium text-foreground">{room.floor}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Rate / night</p>
            <p className="font-medium text-foreground">
              {formatCurrency(Number(room.rate), "GHS")}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Capacity</p>
            <p className="font-medium text-foreground">
              {room.category_capacity ?? "—"} guest(s)
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Room category</p>
            <p className="font-medium text-foreground">
              {room.category_name || "—"}
            </p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs text-muted-foreground">
            Update room status
          </p>

          <FormSelect
            label="Room status"
            value={room.status}
            onChange={handleStatusChange}
            options={statusOptions}
            disabled={room.status === "occupied"}
          />

          {room.status === "awaiting_inspection" && (
            <p className="mt-2 text-xs text-muted-foreground">
              Inspect the room before marking it as available. If repairs are
              required, change the status to Maintenance.
            </p>
          )}

          {room.status === "occupied" && (
            <p className="mt-2 text-xs text-muted-foreground">
              This room is occupied. Its status will change after the guest
              checks out.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
          <div>
            <p className="text-xs text-muted-foreground">Created</p>
            <p className="font-medium text-foreground">
              {room.created_at
                ? new Date(room.created_at).toLocaleDateString()
                : "—"}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Last updated</p>
            <p className="font-medium text-foreground">
              {room.updated_at
                ? new Date(room.updated_at).toLocaleDateString()
                : "—"}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  )
}
