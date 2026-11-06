import * as React from "react"
import { Modal } from "@/components/common/Modal"
import { Button } from "@/components/ui/button"
import { FormInput } from "@/components/forms/FormInput"
import { FormSelect } from "@/components/forms/FormSelect"
import { useAppData } from "@/context/AppDataContext"
import { useToast } from "@/context/ToastContext"
import { useSyncOnChange } from "@/hooks/useSyncOnChange"
import type { Room, RoomStatus } from "@/types"

const ROOM_STATUSES: RoomStatus[] = ["Available", "Occupied", "Reserved", "Cleaning", "Maintenance"]

export function RoomForm({
  open,
  onClose,
  room,
}: {
  open: boolean
  onClose: () => void
  room?: Room | null
}) {
  const { data, addRoom, updateRoom, getRoomCategory } = useAppData()
  const { showToast } = useToast()
  const isEditing = !!room

  const [number, setNumber] = React.useState("")
  const [categoryId, setCategoryId] = React.useState("")
  const [floor, setFloor] = React.useState(1)
  const [rate, setRate] = React.useState(0)
  const [status, setStatus] = React.useState<RoomStatus>("Available")
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  useSyncOnChange(open ? (room?.id ?? "new") : null, (key) => {
    if (key === null) return
    if (room) {
      setNumber(room.number)
      setCategoryId(room.categoryId)
      setFloor(room.floor)
      setRate(room.rate)
      setStatus(room.status)
    } else {
      setNumber("")
      setCategoryId(data.roomCategories[0]?.id ?? "")
      setFloor(1)
      setRate(data.roomCategories[0]?.baseRate ?? 0)
      setStatus("Available")
    }
    setErrors({})
  })

  function validate(): boolean {
    const nextErrors: Record<string, string> = {}
    if (!number.trim()) nextErrors.number = "Room number is required."
    else if (!isEditing && data.rooms.some((r) => r.number === number.trim())) {
      nextErrors.number = "A room with this number already exists."
    }
    if (!categoryId) nextErrors.categoryId = "Select a room category."
    if (floor < 1) nextErrors.floor = "Floor must be at least 1."
    if (rate <= 0) nextErrors.rate = "Rate must be greater than 0."
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    if (isEditing && room) {
      updateRoom(room.id, { number, categoryId, floor, rate, status })
      showToast({ title: "Room updated", variant: "success" })
    } else {
      addRoom({ number, categoryId, floor, rate })
      showToast({ title: "Room added", variant: "success" })
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit room" : "Add room"}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>{isEditing ? "Save changes" : "Add room"}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <FormInput
            label="Room number"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            error={errors.number}
            required
          />
          <FormInput
            label="Floor"
            type="number"
            min={1}
            value={floor}
            onChange={(e) => setFloor(Number(e.target.value))}
            error={errors.floor}
            required
          />
        </div>
        <FormSelect
          label="Room category"
          placeholder="Select a category"
          value={categoryId}
          onChange={(e) => {
            const cat = getRoomCategory(e.target.value)
            setCategoryId(e.target.value)
            if (cat && !isEditing) setRate(cat.baseRate)
          }}
          error={errors.categoryId}
          options={data.roomCategories.map((c) => ({ label: c.name, value: c.id }))}
          required
        />
        <FormInput
          label="Room rate / night"
          type="number"
          min={1}
          value={rate}
          onChange={(e) => setRate(Number(e.target.value))}
          error={errors.rate}
          required
        />
        {isEditing && (
          <FormSelect
            label="Room status"
            value={status}
            onChange={(e) => setStatus(e.target.value as RoomStatus)}
            options={ROOM_STATUSES.map((s) => ({ label: s, value: s }))}
          />
        )}
      </form>
    </Modal>
  )
}
