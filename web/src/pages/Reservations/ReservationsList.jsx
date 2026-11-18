import * as React from "react"
import { useSearchParams } from "react-router-dom"
import { FiCalendar, FiPlus } from "react-icons/fi"

import { useToast } from "@/context/ToastContext"
import { PageHeader } from "@/components/common/PageHeader"
import { SearchInput } from "@/components/common/SearchInput"
import { FilterDropdown } from "@/components/common/FilterDropdown"
import { StatCard } from "@/components/common/StatCard"
import { StatusBadge } from "@/components/common/StatusBadge"
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog"
import { DataTable } from "@/components/tables/DataTable"
import { Pagination } from "@/components/common/Pagination"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/format"

import { ReservationForm } from "@/pages/Reservations/ReservationForm"
import { ReservationDetails } from "@/pages/Reservations/ReservationDetails"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const RESERVATIONS_API = `${API_BASE_URL}/api/reservations/`
const PAGE_SIZE = 8

const RESERVATION_STATUSES = [
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Checked In", value: "checked_in" },
  { label: "Checked Out", value: "checked_out" },
  { label: "Cancelled", value: "cancelled" },
  { label: "No Show", value: "no_show" },
]

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

export function ReservationsList() {
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const [search, setSearch] = React.useState(searchParams.get("q") || "")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [page, setPage] = React.useState(1)

  const [reservations, setReservations] = React.useState([])
  const [stats, setStats] = React.useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    checked_in: 0,
    checked_out: 0,
    cancelled: 0,
    no_show: 0,
  })

  const [totalItems, setTotalItems] = React.useState(0)
  const [pageCount, setPageCount] = React.useState(1)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")

  const [formOpen, setFormOpen] = React.useState(false)
  const [editingReservation, setEditingReservation] = React.useState(null)
  const [viewingReservation, setViewingReservation] = React.useState(null)
  const [cancellingReservation, setCancellingReservation] = React.useState(null)
  const [submitting, setSubmitting] = React.useState(false)

  const fetchReservations = React.useCallback(async () => {
    setLoading(true)
    setError("")

    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(PAGE_SIZE),
      })

      if (search.trim()) {
        params.set("search", search.trim())
      }

      if (statusFilter !== "all") {
        params.set("status", statusFilter)
      }

      const response = await fetch(`${RESERVATIONS_API}?${params.toString()}`)
      const result = await readResponse(response)

      const rows = Array.isArray(result.results) ? result.results : []

      setReservations(rows)
      setTotalItems(result.count ?? rows.length)
      setPageCount(
        Math.max(1, Math.ceil((result.count ?? rows.length) / PAGE_SIZE))
      )

      if (result.stats) {
        setStats(result.stats)
      }
    } catch (err) {
      setError(err.message)
      setReservations([])
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  React.useEffect(() => {
    fetchReservations()
  }, [fetchReservations])

  React.useEffect(() => {
    const query = searchParams.get("q") || ""
    setSearch(query)
  }, [searchParams])

  function handleSearch(value) {
    setSearch(value)
    setPage(1)

    const params = new URLSearchParams(searchParams)

    if (value.trim()) {
      params.set("q", value)
    } else {
      params.delete("q")
    }

    setSearchParams(params, { replace: true })
  }

  function handleStatusChange(value) {
    setStatusFilter(value)
    setPage(1)
  }

  function openCreateForm() {
    setEditingReservation(null)
    setFormOpen(true)
  }

  async function handleReservationSaved(message) {
    setFormOpen(false)
    setEditingReservation(null)
    setViewingReservation(null)
    setPage(1)
    await fetchReservations()
    showToast({
      title: message || "Reservation saved successfully.",
      variant: "success",
    })
  }

  async function handleCancelReservation() {
    if (!cancellingReservation) return

    setSubmitting(true)

    try {
      const response = await fetch(
        `${RESERVATIONS_API}${cancellingReservation.id}/cancel/`,
        { method: "POST" }
      )

      await readResponse(response)

      showToast({
        title: "Reservation cancelled successfully.",
        variant: "success",
      })

      setCancellingReservation(null)
      setViewingReservation(null)
      await fetchReservations()
    } catch (err) {
      showToast({
        title: "Unable to cancel reservation",
        description: err.message,
        variant: "error",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    {
      key: "reference",
      header: "Reference",
      render: (reservation) => (
        <span className="font-medium">{reservation.reference}</span>
      ),
    },
    {
      key: "guest",
      header: "Guest",
      render: (reservation) => reservation.guest_name || "—",
    },
    {
      key: "room",
      header: "Room",
      render: (reservation) => reservation.room_number || "—",
    },
    {
      key: "check_in",
      header: "Check-in",
      render: (reservation) => formatDate(reservation.check_in),
    },
    {
      key: "check_out",
      header: "Check-out",
      render: (reservation) => formatDate(reservation.check_out),
    },
    {
      key: "guests",
      header: "Guests",
      render: (reservation) =>
        `${reservation.adults} adult(s), ${reservation.children} child(ren)`,
    },
    {
      key: "total",
      header: "Total",
      render: (reservation) => formatCurrency(reservation.total_amount),
    },
    {
      key: "status",
      header: "Status",
      render: (reservation) => <StatusBadge status={reservation.status} />,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (reservation) => (
        <div
          className="flex justify-end gap-1.5"
          onClick={(event) => event.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewingReservation(reservation)}
          >
            View
          </Button>

          {["pending", "confirmed"].includes(reservation.status) && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingReservation(reservation)
                  setFormOpen(true)
                }}
              >
                Edit
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-danger"
                onClick={() => setCancellingReservation(reservation)}
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Reservations"
        description="Manage guest bookings, room allocations and check-ins."
        actions={
          <Button onClick={openCreateForm}>
            <FiPlus data-icon="inline-start" />
            New reservation
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total reservations"
          value={stats.total}
          icon={<FiCalendar />}
          accent="primary"
        />
        <StatCard
          label="Checked in"
          value={stats.checked_in}
          icon={<FiCalendar />}
          accent="info"
        />
        <StatCard
          label="Confirmed"
          value={stats.confirmed}
          icon={<FiCalendar />}
          accent="warning"
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          icon={<FiCalendar />}
          accent="danger"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder="Search guest, reference or room..."
          className="w-full sm:max-w-sm"
        />

        <FilterDropdown
          label="Status"
          value={statusFilter}
          onChange={handleStatusChange}
          options={RESERVATION_STATUSES}
        />
      </div>

      {error && (
        <div className="rounded-lg border border-danger/20 bg-danger/5 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        rows={reservations}
        keyExtractor={(reservation) => reservation.id}
        loading={loading}
        onRowClick={setViewingReservation}
        emptyTitle="No reservations found"
        emptyDescription="Try adjusting your filters or create a new reservation."
      />

      {!loading && totalItems > 0 && (
        <Pagination
          page={page}
          pageCount={pageCount}
          totalItems={totalItems}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      )}

      <ReservationForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditingReservation(null)
        }}
        reservation={editingReservation}
        onSaved={handleReservationSaved}
      />

      <ReservationDetails
        open={!!viewingReservation}
        reservation={viewingReservation}
        onClose={() => setViewingReservation(null)}
        onEdit={() => {
          if (!viewingReservation) return
          setEditingReservation(viewingReservation)
          setViewingReservation(null)
          setFormOpen(true)
        }}
        onChanged={async (message) => {
          setViewingReservation(null)
          await fetchReservations()
          showToast({
            title: message,
            variant: "success",
          })
        }}
      />

      <ConfirmationDialog
        open={!!cancellingReservation}
        onClose={() => setCancellingReservation(null)}
        onConfirm={handleCancelReservation}
        title="Cancel reservation"
        description={`Are you sure you want to cancel reservation ${cancellingReservation?.reference}?`}
        confirmLabel="Cancel reservation"
        variant="destructive"
        loading={submitting}
      />
    </div>
  )
}

export default ReservationsList
