import * as React from "react"
import { useSearchParams } from "react-router-dom"
import { FiCalendar, FiPlus } from "react-icons/fi"
import { useAppData } from "@/context/AppDataContext"
import { useToast } from "@/context/ToastContext"
import { PageHeader } from "@/components/common/PageHeader"
import { SearchInput } from "@/components/common/SearchInput"
import { FilterDropdown } from "@/components/common/FilterDropdown"
import { StatCard } from "@/components/common/StatCard"
import { StatusBadge } from "@/components/common/StatusBadge"
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog"
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/format"
import { useSyncOnChange } from "@/hooks/useSyncOnChange"
import { ReservationForm } from "@/pages/Reservations/ReservationForm"
import { ReservationDetails } from "@/pages/Reservations/ReservationDetails"
import type { Reservation } from "@/types"

const RESERVATION_STATUSES = ["Pending", "Confirmed", "Checked In", "Checked Out", "Cancelled"]
const PAYMENT_STATUSES = ["Pending", "Partially Paid", "Paid", "Refunded", "Failed"]

export function ReservationsList() {
  const { data, getGuest, getRoom, cancelReservation } = useAppData()
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const [search, setSearch] = React.useState(searchParams.get("q") ?? "")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [paymentFilter, setPaymentFilter] = React.useState("all")
  const [formOpen, setFormOpen] = React.useState(false)
  const [editingReservation, setEditingReservation] = React.useState<Reservation | null>(null)
  const [viewingReservation, setViewingReservation] = React.useState<Reservation | null>(null)
  const [cancellingReservation, setCancellingReservation] = React.useState<Reservation | null>(null)

  useSyncOnChange(searchParams.get("q"), (q) => {
    if (q) setSearch(q)
  })

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase()
    return data.reservations.filter((r) => {
      const guest = getGuest(r.guestId)
      const room = getRoom(r.roomId)
      const matchesSearch =
        !term ||
        r.reference.toLowerCase().includes(term) ||
        room?.number.toLowerCase().includes(term) ||
        (guest && `${guest.firstName} ${guest.lastName}`.toLowerCase().includes(term))
      const matchesStatus = statusFilter === "all" || r.status === statusFilter
      const matchesPayment = paymentFilter === "all" || r.paymentStatus === paymentFilter
      return matchesSearch && matchesStatus && matchesPayment
    })
  }, [data.reservations, search, statusFilter, paymentFilter, getGuest, getRoom])

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const activeCount = data.reservations.filter((r) => r.status === "Checked In").length
  const pendingCount = data.reservations.filter((r) => r.status === "Pending").length
  const upcomingCount = data.reservations.filter((r) => r.status === "Confirmed").length

  const columns: DataTableColumn<Reservation>[] = [
    { key: "reference", header: "Reference", render: (r) => <span className="font-medium">{r.reference}</span> },
    {
      key: "guest",
      header: "Guest",
      render: (r) => {
        const guest = getGuest(r.guestId)
        return guest ? `${guest.firstName} ${guest.lastName}` : "—"
      },
    },
    {
      key: "room",
      header: "Room",
      render: (r) => getRoom(r.roomId)?.number ?? "—",
    },
    { key: "checkIn", header: "Check-in", render: (r) => formatDate(r.checkInDate) },
    { key: "checkOut", header: "Check-out", render: (r) => formatDate(r.checkOutDate) },
    { key: "guests", header: "Guests", render: (r) => `${r.adults + r.children}` },
    { key: "total", header: "Total", render: (r) => formatCurrency(r.totalAmount) },
    { key: "payment", header: "Payment", render: (r) => <StatusBadge status={r.paymentStatus} /> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (r) => (
        <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => setViewingReservation(r)}>
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingReservation(r)
              setFormOpen(true)
            }}
          >
            Edit
          </Button>
          {r.status !== "Cancelled" && r.status !== "Checked Out" && (
            <Button variant="ghost" size="sm" className="text-danger" onClick={() => setCancellingReservation(r)}>
              Cancel
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Reservations"
        description="Manage bookings, confirmations, and reservation statuses."
        actions={
          <Button
            onClick={() => {
              setEditingReservation(null)
              setFormOpen(true)
            }}
          >
            <FiPlus data-icon="inline-start" /> Add reservation
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total reservations" value={data.reservations.length} icon={<FiCalendar />} accent="primary" />
        <StatCard label="Checked in" value={activeCount} icon={<FiCalendar />} accent="info" />
        <StatCard label="Upcoming (confirmed)" value={upcomingCount} icon={<FiCalendar />} accent="warning" />
        <StatCard label="Pending" value={pendingCount} icon={<FiCalendar />} accent="danger" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v)
            setSearchParams(v ? { q: v } : {})
          }}
          placeholder="Search by guest, reference or room..."
          className="w-full sm:max-w-sm"
        />
        <div className="flex flex-wrap items-center gap-2">
          <FilterDropdown
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={RESERVATION_STATUSES.map((s) => ({ label: s, value: s }))}
          />
          <FilterDropdown
            label="Payment"
            value={paymentFilter}
            onChange={setPaymentFilter}
            options={PAYMENT_STATUSES.map((s) => ({ label: s, value: s }))}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={sorted}
        keyExtractor={(r) => r.id}
        pageSize={8}
        onRowClick={(r) => setViewingReservation(r)}
        emptyTitle="No reservations found"
        emptyDescription="Try adjusting your filters or add a new reservation."
      />

      <ReservationForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditingReservation(null)
        }}
        reservation={editingReservation}
      />

      <ReservationDetails
        open={!!viewingReservation}
        onClose={() => setViewingReservation(null)}
        reservation={viewingReservation}
        onEdit={() => {
          if (viewingReservation) {
            setEditingReservation(viewingReservation)
            setFormOpen(true)
            setViewingReservation(null)
          }
        }}
      />

      <ConfirmationDialog
        open={!!cancellingReservation}
        onClose={() => setCancellingReservation(null)}
        onConfirm={() => {
          if (cancellingReservation) {
            cancelReservation(cancellingReservation.id)
            showToast({ title: "Reservation cancelled", variant: "info" })
          }
        }}
        title="Cancel reservation"
        description={`Are you sure you want to cancel reservation ${cancellingReservation?.reference}? This action cannot be undone.`}
        confirmLabel="Cancel reservation"
        variant="destructive"
      />
    </div>
  )
}
