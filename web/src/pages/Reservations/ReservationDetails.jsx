import * as React from "react"
import { FiCreditCard, FiLogIn, FiLogOut } from "react-icons/fi"

import { Modal } from "@/components/common/Modal"
import { StatusBadge } from "@/components/common/StatusBadge"
import { Button } from "@/components/ui/button"
import { FormInput } from "@/components/forms/FormInput"
import { useToast } from "@/context/ToastContext"
import { formatCurrency, formatDate } from "@/lib/format"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

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

export function ReservationDetails({
  open,
  onClose,
  reservation,
  onEdit,
  onChanged,
}) {
  const { showToast } = useToast()

  const [cardIdentifier, setCardIdentifier] = React.useState("")
  const [cardChecking, setCardChecking] = React.useState(false)
  const [cardVerified, setCardVerified] = React.useState(false)
  const [cardMessage, setCardMessage] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    setCardIdentifier("")
    setCardVerified(false)
    setCardMessage("")
  }, [reservation?.id, open])

  React.useEffect(() => {
    setCardVerified(false)
    setCardMessage("")
  }, [cardIdentifier])

  if (!reservation) return null

  const balance = Number(reservation.total_amount || 0)

  async function verifyCard() {
    if (!cardIdentifier.trim()) {
      setCardMessage("Enter the RFID card identifier.")
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
      setCardMessage("Card verified and available for assignment.")
    } catch (error) {
      setCardMessage(error.message)
    } finally {
      setCardChecking(false)
    }
  }

  async function handleCheckIn() {
    if (!cardVerified) {
      setCardMessage("Verify the RFID card before checking in.")
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch(
        `${RESERVATIONS_API}${reservation.id}/check-in/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            card_identifier: cardIdentifier.trim(),
          }),
        }
      )

      await readResponse(response)

      onChanged?.("Guest checked in successfully.")
    } catch (error) {
      showToast({
        title: "Unable to check in guest",
        description: error.message,
        variant: "error",
      })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCheckOut() {
    setSubmitting(true)

    try {
      const response = await fetch(
        `${RESERVATIONS_API}${reservation.id}/check-out/`,
        { method: "POST" }
      )

      await readResponse(response)

      onChanged?.("Guest checked out. Room is awaiting inspection.")
    } catch (error) {
      showToast({
        title: "Unable to check out guest",
        description: error.message,
        variant: "error",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const canCheckIn = ["pending", "confirmed"].includes(reservation.status)
  const canCheckOut = reservation.status === "checked_in"

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Reservation ${reservation.reference}`}
      description="Reservation details, guest information and room access."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>

          {["pending", "confirmed"].includes(reservation.status) && (
            <Button variant="outline" onClick={onEdit}>
              Edit reservation
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-5 text-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-foreground">
              {reservation.guest_name || "Guest"}
            </p>
            <p className="text-xs text-muted-foreground">
              {reservation.reference}
            </p>
          </div>

          <StatusBadge status={reservation.status} />
        </div>

        <section className="flex flex-col gap-3">
          <h3 className="font-semibold text-foreground">Stay information</h3>

          <div className="grid grid-cols-2 gap-3 rounded-lg border border-border p-3">
            <div>
              <p className="text-xs text-muted-foreground">Room</p>
              <p className="font-medium text-foreground">
                {reservation.room_number || "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                {reservation.room_category || ""}
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
              <p className="font-medium text-foreground">
                {formatDate(reservation.check_in)}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Check-out</p>
              <p className="font-medium text-foreground">
                {formatDate(reservation.check_out)}
              </p>
            </div>

            {reservation.checked_in_at && (
              <div>
                <p className="text-xs text-muted-foreground">Actual check-in</p>
                <p className="font-medium text-foreground">
                  {formatDate(reservation.checked_in_at)}
                </p>
              </div>
            )}

            {reservation.checked_out_at && (
              <div>
                <p className="text-xs text-muted-foreground">Actual checkout</p>
                <p className="font-medium text-foreground">
                  {formatDate(reservation.checked_out_at)}
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="font-semibold text-foreground">
            Accommodation charges
          </h3>

          <div className="rounded-lg border border-border p-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rate per night</span>
              <span>{formatCurrency(reservation.rate_per_night)}</span>
            </div>

            <div className="mt-2 flex justify-between">
              <span className="text-muted-foreground">Nights</span>
              <span>{reservation.nights ?? "—"}</span>
            </div>

            <div className="mt-2 flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span>{formatCurrency(reservation.discount_amount)}</span>
            </div>

            <div className="mt-3 flex justify-between border-t border-border pt-3">
              <span className="font-semibold">Total amount</span>
              <span className="font-semibold text-primary">
                {formatCurrency(balance)}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Payment records and outstanding balances will be connected to the
            Payments module.
          </p>
        </section>

        {canCheckIn && (
          <section className="flex flex-col gap-3 rounded-lg border border-border p-3">
            <div>
              <h3 className="font-semibold text-foreground">
                Complete guest check-in
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Select a physical RFID card and enter its printed identifier.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <FormInput
                  label="RFID card identifier"
                  value={cardIdentifier}
                  onChange={(event) => setCardIdentifier(event.target.value)}
                  placeholder="e.g. RFID-0008"
                />
              </div>

              <Button
                variant="outline"
                onClick={verifyCard}
                disabled={cardChecking || !cardIdentifier.trim()}
              >
                <FiCreditCard data-icon="inline-start" />
                {cardChecking ? "Checking..." : "Verify card"}
              </Button>
            </div>

            {cardMessage && (
              <p
                className={`text-xs ${
                  cardVerified ? "text-success" : "text-danger"
                }`}
              >
                {cardMessage}
              </p>
            )}

            <Button
              block
              onClick={handleCheckIn}
              disabled={!cardVerified || submitting}
              loading={submitting}
            >
              <FiLogIn data-icon="inline-start" />
              Confirm check-in
            </Button>
          </section>
        )}

        {canCheckOut && (
          <section className="flex flex-col gap-3 rounded-lg border border-border p-3">
            <div>
              <h3 className="font-semibold text-foreground">Guest checkout</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Checking out will revoke the assigned RFID card and move the
                room to Awaiting Inspection.
              </p>
            </div>

            <Button
              block
              onClick={handleCheckOut}
              disabled={submitting}
              loading={submitting}
              variant="destructive"
            >
              <FiLogOut data-icon="inline-start" />
              Complete checkout
            </Button>
          </section>
        )}
      </div>
    </Modal>
  )
}

export default ReservationDetails
