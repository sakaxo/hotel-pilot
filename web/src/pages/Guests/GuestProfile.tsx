import * as React from "react"
import { Modal } from "@/components/common/Modal"
import { StatusBadge } from "@/components/common/StatusBadge"
import { EmptyState } from "@/components/common/EmptyState"
import { Button } from "@/components/ui/button"
import { useAppData } from "@/context/AppDataContext"
import { formatCurrency, formatDate } from "@/lib/format"
import { maskCardUid } from "@/lib/format"
import { useSyncOnChange } from "@/hooks/useSyncOnChange"
import type { Guest } from "@/types"

type Tab = "overview" | "reservations" | "payments" | "cards"

export function GuestProfile({
  open,
  onClose,
  guest,
  onEdit,
}: {
  open: boolean
  onClose: () => void
  guest: Guest | null
  onEdit: () => void
}) {
  const { data, getRoom } = useAppData()
  const [tab, setTab] = React.useState<Tab>("overview")

  useSyncOnChange(open ? (guest?.id ?? "none") : null, (key) => {
    if (key !== null) setTab("overview")
  })

  if (!guest) return null

  const reservations = data.reservations.filter((r) => r.guestId === guest.id)
  const payments = data.payments.filter((p) => p.guestId === guest.id)
  const cards = data.rfidCards.filter((c) => c.history.length > 0 && c.assignedGuestId === guest.id)
  const pastCards = data.rfidCards.filter(
    (c) => c.assignedGuestId !== guest.id && reservations.some((r) => r.id === c.reservationId)
  )

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "overview", label: "Overview" },
    { id: "reservations", label: `Reservations (${reservations.length})` },
    { id: "payments", label: `Payments (${payments.length})` },
    { id: "cards", label: "RFID cards" },
  ]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${guest.firstName} ${guest.lastName}`}
      description={guest.email}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onEdit}>Edit profile</Button>
        </>
      }
    >
      <div className="mb-4 flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Phone</p>
            <p className="font-medium text-foreground">{guest.phone || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Nationality</p>
            <p className="font-medium text-foreground">{guest.nationality || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Identification</p>
            <p className="font-medium text-foreground">
              {guest.idType ? `${guest.idType} · ${guest.idNumber}` : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Registered</p>
            <p className="font-medium text-foreground">{formatDate(guest.registrationDate)}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-muted-foreground">Address</p>
            <p className="font-medium text-foreground">{guest.address || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total stays</p>
            <p className="font-medium text-foreground">
              {reservations.filter((r) => r.status === "Checked Out").length}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <StatusBadge status={guest.status} />
          </div>
        </div>
      )}

      {tab === "reservations" &&
        (reservations.length === 0 ? (
          <EmptyState title="No reservations" description="This guest has no reservation history yet." className="border-0 py-8" />
        ) : (
          <ul className="divide-y divide-border text-sm">
            {reservations.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                <div>
                  <p className="font-medium text-foreground">
                    {r.reference} · Room {getRoom(r.roomId)?.number ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(r.checkInDate)} – {formatDate(r.checkOutDate)}
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        ))}

      {tab === "payments" &&
        (payments.length === 0 ? (
          <EmptyState title="No payments" description="No payment records for this guest yet." className="border-0 py-8" />
        ) : (
          <ul className="divide-y divide-border text-sm">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                <div>
                  <p className="font-medium text-foreground">{p.reference}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(p.date)} · {p.method}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">{formatCurrency(p.amount)}</p>
                  <StatusBadge status={p.status} />
                </div>
              </li>
            ))}
          </ul>
        ))}

      {tab === "cards" &&
        (cards.length === 0 && pastCards.length === 0 ? (
          <EmptyState title="No RFID card assignments" description="No cards have been assigned to this guest." className="border-0 py-8" />
        ) : (
          <ul className="divide-y divide-border text-sm">
            {[...cards, ...pastCards].map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                <div>
                  <p className="font-medium text-foreground">{c.reference}</p>
                  <p className="text-xs text-muted-foreground">{maskCardUid(c.uid)}</p>
                </div>
                <StatusBadge status={c.status} />
              </li>
            ))}
          </ul>
        ))}
    </Modal>
  )
}
