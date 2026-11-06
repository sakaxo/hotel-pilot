import * as React from "react"
import { Modal } from "@/components/common/Modal"
import { Button } from "@/components/ui/button"
import { FormInput } from "@/components/forms/FormInput"
import { FormSelect } from "@/components/forms/FormSelect"
import { FormTextarea, DatePicker } from "@/components/forms/FormTextarea"
import { useAppData } from "@/context/AppDataContext"
import { useToast } from "@/context/ToastContext"
import { useSyncOnChange } from "@/hooks/useSyncOnChange"
import type { Reservation } from "@/types"

interface ReservationFormProps {
  open: boolean
  onClose: () => void
  reservation?: Reservation | null
  defaultRoomId?: string
}

const STATUS_OPTIONS = ["Pending", "Confirmed", "Checked In", "Checked Out", "Cancelled"]

export function ReservationForm({ open, onClose, reservation, defaultRoomId }: ReservationFormProps) {
  const { data, addGuest, addReservation, updateReservation, getRoomCategory } = useAppData()
  const { showToast } = useToast()
  const isEditing = !!reservation

  const [registerNewGuest, setRegisterNewGuest] = React.useState(false)
  const [guestId, setGuestId] = React.useState("")
  const [newGuest, setNewGuest] = React.useState({ firstName: "", lastName: "", email: "", phone: "" })
  const [roomId, setRoomId] = React.useState("")
  const [checkInDate, setCheckInDate] = React.useState("")
  const [checkOutDate, setCheckOutDate] = React.useState("")
  const [adults, setAdults] = React.useState(1)
  const [children, setChildren] = React.useState(0)
  const [specialRequests, setSpecialRequests] = React.useState("")
  const [status, setStatus] = React.useState<Reservation["status"]>("Pending")
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  useSyncOnChange(open ? (reservation?.id ?? "new") : null, (key) => {
    if (key === null) return
    if (reservation) {
      setRegisterNewGuest(false)
      setGuestId(reservation.guestId)
      setRoomId(reservation.roomId)
      setCheckInDate(reservation.checkInDate)
      setCheckOutDate(reservation.checkOutDate)
      setAdults(reservation.adults)
      setChildren(reservation.children)
      setSpecialRequests(reservation.specialRequests)
      setStatus(reservation.status)
    } else {
      setRegisterNewGuest(false)
      setGuestId("")
      setNewGuest({ firstName: "", lastName: "", email: "", phone: "" })
      setRoomId(defaultRoomId ?? "")
      setCheckInDate(new Date().toISOString().slice(0, 10))
      const checkout = new Date()
      checkout.setDate(checkout.getDate() + 1)
      setCheckOutDate(checkout.toISOString().slice(0, 10))
      setAdults(1)
      setChildren(0)
      setSpecialRequests("")
      setStatus("Pending")
    }
    setErrors({})
  })

  const room = data.rooms.find((r) => r.id === roomId)
  const category = getRoomCategory(room?.categoryId)
  const nights = React.useMemo(() => {
    if (!checkInDate || !checkOutDate) return 0
    const diff = new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()
    return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)))
  }, [checkInDate, checkOutDate])
  const roomRate = room?.rate ?? 0
  const totalAmount = roomRate * nights

  function validate(): boolean {
    const nextErrors: Record<string, string> = {}
    if (registerNewGuest) {
      if (!newGuest.firstName.trim()) nextErrors.firstName = "First name is required."
      if (!newGuest.lastName.trim()) nextErrors.lastName = "Last name is required."
      if (!newGuest.email.trim()) nextErrors.email = "Email is required."
    } else if (!guestId) {
      nextErrors.guestId = "Select a guest."
    }
    if (!roomId) nextErrors.roomId = "Select a room."
    if (!checkInDate) nextErrors.checkInDate = "Check-in date is required."
    if (!checkOutDate) nextErrors.checkOutDate = "Check-out date is required."
    if (checkInDate && checkOutDate && new Date(checkOutDate) <= new Date(checkInDate)) {
      nextErrors.checkOutDate = "Check-out must be after check-in."
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    let finalGuestId = guestId
    if (registerNewGuest) {
      const created = addGuest({
        firstName: newGuest.firstName,
        lastName: newGuest.lastName,
        email: newGuest.email,
        phone: newGuest.phone,
        nationality: "",
        idType: "",
        idNumber: "",
        address: "",
      })
      finalGuestId = created.id
    }

    if (isEditing && reservation) {
      updateReservation(reservation.id, {
        guestId: finalGuestId,
        roomId,
        checkInDate,
        checkOutDate,
        adults,
        children,
        specialRequests,
        roomRate,
        totalAmount,
        status,
      })
      showToast({ title: "Reservation updated", variant: "success" })
    } else {
      addReservation({
        guestId: finalGuestId,
        roomId,
        checkInDate,
        checkOutDate,
        adults,
        children,
        specialRequests,
        roomRate,
        totalAmount,
        status,
      })
      showToast({ title: "Reservation created", variant: "success" })
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit reservation" : "Add reservation"}
      description="Book a room for a guest and track payment status."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>{isEditing ? "Save changes" : "Create reservation"}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Guest</p>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setRegisterNewGuest((v) => !v)}
                className="text-xs font-medium text-primary hover:underline"
              >
                {registerNewGuest ? "Select existing guest" : "Register new guest"}
              </button>
            )}
          </div>
          {registerNewGuest ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormInput
                label="First name"
                value={newGuest.firstName}
                onChange={(e) => setNewGuest((g) => ({ ...g, firstName: e.target.value }))}
                error={errors.firstName}
                required
              />
              <FormInput
                label="Last name"
                value={newGuest.lastName}
                onChange={(e) => setNewGuest((g) => ({ ...g, lastName: e.target.value }))}
                error={errors.lastName}
                required
              />
              <FormInput
                label="Email"
                type="email"
                value={newGuest.email}
                onChange={(e) => setNewGuest((g) => ({ ...g, email: e.target.value }))}
                error={errors.email}
                required
              />
              <FormInput
                label="Phone"
                value={newGuest.phone}
                onChange={(e) => setNewGuest((g) => ({ ...g, phone: e.target.value }))}
              />
            </div>
          ) : (
            <FormSelect
              label=""
              placeholder="Select a guest"
              value={guestId}
              onChange={(e) => setGuestId(e.target.value)}
              error={errors.guestId}
              options={data.guests.map((g) => ({ label: `${g.firstName} ${g.lastName} · ${g.email}`, value: g.id }))}
            />
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormSelect
            label="Room"
            placeholder="Select a room"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            error={errors.roomId}
            options={data.rooms.map((r) => ({
              label: `Room ${r.number} · ${getRoomCategory(r.categoryId)?.name ?? ""} · $${r.rate}/night`,
              value: r.id,
            }))}
            required
          />
          <FormSelect
            label="Reservation status"
            value={status}
            onChange={(e) => setStatus(e.target.value as Reservation["status"])}
            options={STATUS_OPTIONS.map((s) => ({ label: s, value: s }))}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DatePicker
            label="Check-in date"
            value={checkInDate}
            onChange={(e) => setCheckInDate(e.target.value)}
            error={errors.checkInDate}
            required
          />
          <DatePicker
            label="Check-out date"
            value={checkOutDate}
            onChange={(e) => setCheckOutDate(e.target.value)}
            error={errors.checkOutDate}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <FormInput
            label="Adults"
            type="number"
            min={1}
            value={adults}
            onChange={(e) => setAdults(Number(e.target.value))}
          />
          <FormInput
            label="Children"
            type="number"
            min={0}
            value={children}
            onChange={(e) => setChildren(Number(e.target.value))}
          />
          <FormInput label="Room rate / night" value={roomRate ? `$${roomRate}` : "—"} readOnly disabled />
          <FormInput label="Total amount" value={totalAmount ? `$${totalAmount}` : "—"} readOnly disabled />
        </div>

        <FormTextarea
          label="Special requests"
          value={specialRequests}
          onChange={(e) => setSpecialRequests(e.target.value)}
          placeholder="e.g. Late check-out, extra pillows..."
        />

        {category && (
          <p className="text-xs text-muted-foreground">
            {category.name} · Capacity {category.capacity} guest(s) · {nights} night(s) stay
          </p>
        )}
      </form>
    </Modal>
  )
}
