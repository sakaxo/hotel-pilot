import * as React from "react"
import { FiCheckCircle, FiCreditCard } from "react-icons/fi"

import { Modal } from "@/components/common/Modal"
import { Button } from "@/components/ui/button"
import { FormInput } from "@/components/forms/FormInput"
import { FormSelect } from "@/components/forms/FormSelect"
import { FormTextarea } from "@/components/forms/FormTextarea"
import { SearchInput } from "@/components/common/SearchInput"

import { useToast } from "@/context/ToastContext"
import { useSyncOnChange } from "@/hooks/useSyncOnChange"
import { formatCurrency } from "@/lib/format"

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "")

const GUESTS_API = `${API_BASE_URL}/api/guests/`
const ROOMS_API = `${API_BASE_URL}/api/rooms/`
const RESERVATIONS_API = `${API_BASE_URL}/api/reservations/`

async function readResponse(response) {
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message =
      data.detail ||
      data.message ||
      Object.entries(data)
        .map(([key, value]) => {
          const text = Array.isArray(value) ? value.join(" ") : value
          return `${key}: ${text}`
        })
        .join("\n") ||
      "Something went wrong."

    throw new Error(message)
  }

  return data
}

function toLocalDateTime(date) {
  const local = new Date(date)
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset())
  return local.toISOString().slice(0, 16)
}

function getDefaultCheckIn() {
  return toLocalDateTime(new Date())
}

function getDefaultCheckOut() {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  date.setHours(11, 0, 0, 0)
  return toLocalDateTime(date)
}

export function ReservationForm({ open, onClose, reservation, onSaved }) {
  const { showToast } = useToast()

  const isEditing = Boolean(reservation)

  const [bookingType, setBookingType] = React.useState("walk_in")
  const [guestMode, setGuestMode] = React.useState("existing")

  const [guests, setGuests] = React.useState([])
  const [rooms, setRooms] = React.useState([])

  const [guestSearch, setGuestSearch] = React.useState("")
  const [guestId, setGuestId] = React.useState("")

  const [newGuest, setNewGuest] = React.useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    nationality: "",
    id_type: "",
    id_number: "",
    address: "",
  })

  const [roomId, setRoomId] = React.useState("")
  const [checkIn, setCheckIn] = React.useState("")
  const [checkOut, setCheckOut] = React.useState("")

  const [adults, setAdults] = React.useState(1)
  const [children, setChildren] = React.useState(0)
  const [discountAmount, setDiscountAmount] = React.useState("0")
  const [specialRequests, setSpecialRequests] = React.useState("")

  const [cardIdentifier, setCardIdentifier] = React.useState("")
  const [cardVerified, setCardVerified] = React.useState(false)
  const [cardMessage, setCardMessage] = React.useState("")
  const [cardChecking, setCardChecking] = React.useState(false)

  const [loadingData, setLoadingData] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState({})

  const selectedRoom = rooms.find((room) => String(room.id) === String(roomId))

  const selectedGuest = guests.find(
    (guest) => String(guest.id) === String(guestId)
  )

  const nights = React.useMemo(() => {
    if (!checkIn || !checkOut) return 0

    const start = new Date(checkIn)
    const end = new Date(checkOut)

    return Math.max(0, Math.ceil((end.getTime() - start.getTime()) / 86400000))
  }, [checkIn, checkOut])

  const roomRate = Number(selectedRoom?.rate || 0)
  const discount = Math.max(0, Number(discountAmount || 0))
  const totalAmount = Math.max(0, roomRate * nights - discount)

  useSyncOnChange(open ? (reservation?.id ?? "new") : null, async (key) => {
    if (key === null) return

    setErrors({})
    setCardIdentifier("")
    setCardVerified(false)
    setCardMessage("")
    setGuestSearch("")

    if (reservation) {
      setBookingType("future")
      setGuestMode("existing")
      setGuestId(String(reservation.guest))
      setRoomId(String(reservation.room))
      setCheckIn(toLocalDateTime(reservation.check_in))
      setCheckOut(toLocalDateTime(reservation.check_out))
      setAdults(reservation.adults)
      setChildren(reservation.children)
      setDiscountAmount(String(reservation.discount_amount || 0))
      setSpecialRequests(reservation.special_requests || "")
    } else {
      setBookingType("walk_in")
      setGuestMode("existing")
      setGuestId("")
      setRoomId("")
      setCheckIn(getDefaultCheckIn())
      setCheckOut(getDefaultCheckOut())
      setAdults(1)
      setChildren(0)
      setDiscountAmount("0")
      setSpecialRequests("")

      setNewGuest({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        nationality: "",
        id_type: "",
        id_number: "",
        address: "",
      })
    }

    setLoadingData(true)

    try {
      const [guestResponse, roomResponse] = await Promise.all([
        fetch(`${GUESTS_API}?page_size=100`),
        fetch(`${ROOMS_API}?page_size=100`),
      ])

      const guestResult = await readResponse(guestResponse)
      const roomResult = await readResponse(roomResponse)

      setGuests(guestResult.results || [])
      setRooms(roomResult.results || [])
    } catch (error) {
      showToast({
        title: "Unable to load reservation information",
        description: error.message,
        variant: "error",
      })
    } finally {
      setLoadingData(false)
    }
  })

  React.useEffect(() => {
    setCardVerified(false)
    setCardMessage("")
  }, [cardIdentifier])

  const filteredGuests = guests.filter((guest) => {
    const term = guestSearch.trim().toLowerCase()

    if (!term) return true

    return [guest.first_name, guest.last_name, guest.email, guest.phone]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(term))
  })

  const availableRooms = rooms.filter((room) => {
    if (room.status === "maintenance") return false

    if (isEditing && String(room.id) === String(reservation?.room)) {
      return true
    }

    return room.status === "available"
  })

  function updateNewGuest(field, value) {
    setNewGuest((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function validateForm() {
    const nextErrors = {}

    if (!isEditing && guestMode === "existing" && !guestId) {
      nextErrors.guest = "Select an existing guest."
    }

    if (!isEditing && guestMode === "new") {
      if (!newGuest.first_name.trim()) {
        nextErrors.first_name = "First name is required."
      }

      if (!newGuest.last_name.trim()) {
        nextErrors.last_name = "Last name is required."
      }

      if (!newGuest.email.trim()) {
        nextErrors.email = "Email is required."
      }

      if (!newGuest.phone.trim()) {
        nextErrors.phone = "Phone number is required."
      }
    }

    if (!roomId) {
      nextErrors.room = "Select a room."
    }

    if (!checkIn) {
      nextErrors.check_in = "Check-in date and time are required."
    }

    if (!checkOut) {
      nextErrors.check_out = "Checkout date and time are required."
    }

    if (checkIn && checkOut && new Date(checkOut) <= new Date(checkIn)) {
      nextErrors.check_out = "Checkout must be after check-in."
    }

    if (adults < 1) {
      nextErrors.adults = "At least one adult is required."
    }

    if (bookingType === "walk_in" && !cardIdentifier.trim()) {
      nextErrors.card_identifier = "Enter the RFID card identifier."
    }

    if (bookingType === "walk_in" && !cardVerified) {
      nextErrors.card_identifier = "Verify the RFID card before continuing."
    }

    if (discount < 0 || discount > roomRate * nights) {
      nextErrors.discount_amount = "Enter a valid discount."
    }

    setErrors(nextErrors)

    return Object.keys(nextErrors).length === 0
  }

  async function verifyCard() {
    if (!cardIdentifier.trim()) {
      setErrors((current) => ({
        ...current,
        card_identifier: "Enter the card identifier.",
      }))
      return
    }

    setCardChecking(true)
    setCardVerified(false)
    setCardMessage("")

    try {
      const params = new URLSearchParams({
        card_identifier: cardIdentifier.trim(),
      })

      const response = await fetch(
        `${RESERVATIONS_API}card-lookup/?${params.toString()}`
      )

      const result = await readResponse(response)

      if (!result.available) {
        throw new Error(result.message || "This card cannot be assigned.")
      }

      setCardVerified(true)
      setCardMessage(result.message || "Card verified and available.")

      setErrors((current) => ({
        ...current,
        card_identifier: undefined,
      }))
    } catch (error) {
      setCardVerified(false)
      setCardMessage(error.message)
    } finally {
      setCardChecking(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!validateForm()) return

    setSubmitting(true)

    try {
      const payload = {
        room: Number(roomId),
        check_in: new Date(checkIn).toISOString(),
        check_out: new Date(checkOut).toISOString(),
        adults: Number(adults),
        children: Number(children),
        discount_amount: discount.toFixed(2),
        special_requests: specialRequests,
      }

      let endpoint = RESERVATIONS_API
      let method = "POST"

      if (isEditing) {
        endpoint = `${RESERVATIONS_API}${reservation.id}/`
        method = "PATCH"

        delete payload.discount_amount
        delete payload.special_requests
      } else if (bookingType === "walk_in") {
        endpoint = `${RESERVATIONS_API}walk-in/`

        payload.card_identifier = cardIdentifier.trim()

        if (guestMode === "existing") {
          payload.guest = Number(guestId)
        } else {
          payload.new_guest = newGuest
        }
      } else {
        if (guestMode === "existing") {
          payload.guest = Number(guestId)
        } else {
          const guestResponse = await fetch(GUESTS_API, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(newGuest),
          })

          const createdGuest = await readResponse(guestResponse)
          payload.guest = createdGuest.id
        }
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      await readResponse(response)

      onSaved?.(
        isEditing
          ? "Reservation updated successfully."
          : bookingType === "walk_in"
            ? "Guest checked in successfully."
            : "Reservation created successfully."
      )

      onClose()
    } catch (error) {
      showToast({
        title: "Unable to save reservation",
        description: error.message,
        variant: "error",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        isEditing
          ? "Edit reservation"
          : bookingType === "walk_in"
            ? "Walk-in check-in"
            : "New reservation"
      }
      description={
        isEditing
          ? "Update the guest's reservation details."
          : "Register the guest, allocate a room and complete the booking."
      }
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={submitting || loadingData}
            loading={submitting}
          >
            {isEditing
              ? "Save changes"
              : bookingType === "walk_in"
                ? "Confirm and check in"
                : "Create reservation"}
          </Button>
        </>
      }
    >
      {loadingData ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Loading guests and rooms...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {!isEditing && (
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => {
                  setBookingType("walk_in")
                  setCardIdentifier("")
                  setCardVerified(false)
                }}
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  bookingType === "walk_in"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                Walk-in check-in
              </button>

              <button
                type="button"
                onClick={() => {
                  setBookingType("future")
                  setCardIdentifier("")
                  setCardVerified(false)
                }}
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  bookingType === "future"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                Future reservation
              </button>
            </div>
          )}

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Guest information
              </h3>

              {!isEditing && (
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:underline"
                  onClick={() => {
                    setGuestMode((current) =>
                      current === "existing" ? "new" : "existing"
                    )
                    setGuestId("")
                    setErrors({})
                  }}
                >
                  {guestMode === "existing"
                    ? "Register new guest"
                    : "Select existing guest"}
                </button>
              )}
            </div>

            {guestMode === "existing" ? (
              <>
                <SearchInput
                  value={guestSearch}
                  onChange={setGuestSearch}
                  placeholder="Search guests by name, email or phone..."
                />

                <FormSelect
                  label="Guest"
                  placeholder="Select a guest"
                  value={guestId}
                  onChange={(event) => setGuestId(event.target.value)}
                  error={errors.guest}
                  options={filteredGuests.map((guest) => ({
                    label: `${guest.first_name} ${guest.last_name} · ${guest.phone}`,
                    value: String(guest.id),
                  }))}
                />

                {selectedGuest && (
                  <div className="rounded-md border border-border bg-muted/20 p-3 text-sm">
                    <p className="font-medium">
                      {selectedGuest.first_name} {selectedGuest.last_name}
                    </p>

                    <p className="text-muted-foreground">
                      {selectedGuest.email} · {selectedGuest.phone}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormInput
                  label="First name"
                  value={newGuest.first_name}
                  onChange={(event) =>
                    updateNewGuest("first_name", event.target.value)
                  }
                  error={errors.first_name}
                  required
                />

                <FormInput
                  label="Last name"
                  value={newGuest.last_name}
                  onChange={(event) =>
                    updateNewGuest("last_name", event.target.value)
                  }
                  error={errors.last_name}
                  required
                />

                <FormInput
                  label="Email"
                  type="email"
                  value={newGuest.email}
                  onChange={(event) =>
                    updateNewGuest("email", event.target.value)
                  }
                  error={errors.email}
                  required
                />

                <FormInput
                  label="Phone"
                  value={newGuest.phone}
                  onChange={(event) =>
                    updateNewGuest("phone", event.target.value)
                  }
                  error={errors.phone}
                  required
                />
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-foreground">
              Room allocation
            </h3>

            <FormSelect
              label="Select room"
              placeholder="Choose an available room"
              value={roomId}
              onChange={(event) => setRoomId(event.target.value)}
              error={errors.room}
              options={availableRooms.map((room) => ({
                label: `Room ${room.number} · ${
                  room.category_name || "Room"
                } · ${formatCurrency(room.rate)}/night`,
                value: String(room.id),
              }))}
            />

            {selectedRoom && (
              <div className="rounded-md border border-border bg-muted/20 p-3 text-sm">
                <p className="font-medium">Room {selectedRoom.number}</p>

                <p className="text-muted-foreground">
                  {selectedRoom.category_name || "Room"} · {selectedRoom.status}
                </p>
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-foreground">
              Stay details
            </h3>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormInput
                label="Check-in date and time"
                type="datetime-local"
                value={checkIn}
                onChange={(event) => setCheckIn(event.target.value)}
                error={errors.check_in}
                required
              />

              <FormInput
                label="Check-out date and time"
                type="datetime-local"
                value={checkOut}
                onChange={(event) => setCheckOut(event.target.value)}
                error={errors.check_out}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormInput
                label="Adults"
                type="number"
                min="1"
                value={adults}
                onChange={(event) => setAdults(Number(event.target.value))}
                error={errors.adults}
              />

              <FormInput
                label="Children"
                type="number"
                min="0"
                value={children}
                onChange={(event) => setChildren(Number(event.target.value))}
              />
            </div>
          </section>

          {bookingType === "walk_in" && !isEditing && (
            <section className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-foreground">
                RFID card assignment
              </h3>

              <p className="text-xs text-muted-foreground">
                Pick a physical card from your inventory and enter the
                identifier printed on it.
              </p>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <FormInput
                    label="RFID card identifier"
                    value={cardIdentifier}
                    onChange={(event) => setCardIdentifier(event.target.value)}
                    placeholder="e.g. RFID-0008"
                    error={errors.card_identifier}
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={verifyCard}
                  disabled={cardChecking || !cardIdentifier.trim()}
                >
                  <FiCreditCard data-icon="inline-start" />
                  {cardChecking ? "Checking..." : "Verify card"}
                </Button>
              </div>

              {cardMessage && (
                <div
                  className={`flex items-start gap-2 rounded-md border p-3 text-sm ${
                    cardVerified
                      ? "border-success/20 bg-success/5 text-success"
                      : "border-danger/20 bg-danger/5 text-danger"
                  }`}
                >
                  {cardVerified && (
                    <FiCheckCircle className="mt-0.5 shrink-0" />
                  )}

                  <span>{cardMessage}</span>
                </div>
              )}

              {cardVerified && (
                <div className="flex items-center gap-2 text-xs text-success">
                  <FiCreditCard />
                  This card will be assigned to the selected guest and room.
                </div>
              )}
            </section>
          )}

          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-foreground">
              Accommodation charges
            </h3>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormInput
                label="Room rate per night"
                value={formatCurrency(roomRate)}
                disabled
              />

              <FormInput
                label="Discount amount"
                type="number"
                min="0"
                value={discountAmount}
                onChange={(event) => setDiscountAmount(event.target.value)}
                error={errors.discount_amount}
                disabled={isEditing}
              />
            </div>

            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Number of nights</span>

                <span>{nights}</span>
              </div>

              <div className="mt-2 flex justify-between text-sm">
                <span className="text-muted-foreground">Accommodation</span>

                <span>{formatCurrency(roomRate * nights)}</span>
              </div>

              <div className="mt-2 flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>

                <span>-{formatCurrency(discount)}</span>
              </div>

              <div className="mt-3 flex justify-between border-t border-border pt-3">
                <span className="font-semibold">Total amount</span>

                <span className="text-lg font-semibold text-primary">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
          </section>

          <FormTextarea
            label="Special requests"
            value={specialRequests}
            onChange={(event) => setSpecialRequests(event.target.value)}
            placeholder="Late checkout, extra pillows, special arrangements..."
          />
        </form>
      )}
    </Modal>
  )
}

export default ReservationForm
