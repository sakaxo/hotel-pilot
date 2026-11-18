import * as React from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { FiPlus, FiUsers } from "react-icons/fi"

import { PageHeader } from "@/components/common/PageHeader"
import { SearchInput } from "@/components/common/SearchInput"
import { FilterDropdown } from "@/components/common/FilterDropdown"
import { StatCard } from "@/components/common/StatCard"
import { StatusBadge } from "@/components/common/StatusBadge"
import { Pagination } from "@/components/common/Pagination"
import { DataTable } from "@/components/tables/DataTable"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/format"
import { useToast } from "@/context/ToastContext"

import { GuestForm } from "@/pages/Guests/GuestForm"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const GUESTS_API = `${API_BASE_URL}/api/guests/`
const PAGE_SIZE = 8

const GUEST_STATUSES = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
]

async function readResponse(response) {
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message =
      data.detail ||
      Object.values(data).flat().filter(Boolean).join(" ") ||
      "Something went wrong. Please try again."

    throw new Error(message)
  }

  return data
}

function formatGuestName(guest) {
  return `${guest.first_name} ${guest.last_name}`.trim()
}

export function GuestsList() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const [search, setSearch] = React.useState(searchParams.get("q") ?? "")
  const [statusFilter, setStatusFilter] = React.useState("all")

  const [guests, setGuests] = React.useState([])
  const [stats, setStats] = React.useState({
    total: 0,
    active: 0,
    inactive: 0,
  })

  const [page, setPage] = React.useState(1)
  const [totalItems, setTotalItems] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")

  const [formOpen, setFormOpen] = React.useState(false)
  const [editingGuest, setEditingGuest] = React.useState(null)
  const [submitting, setSubmitting] = React.useState(false)

  const pageCount = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))

  React.useEffect(() => {
    setSearch(searchParams.get("q") ?? "")
    setPage(1)
  }, [searchParams])

  const fetchGuests = React.useCallback(async () => {
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

      const response = await fetch(`${GUESTS_API}?${params}`)
      const data = await readResponse(response)

      setGuests(data.results ?? [])
      setTotalItems(data.count ?? 0)

      if (data.stats) {
        setStats(data.stats)
      }
    } catch (err) {
      setError(err.message)

      showToast({
        title: "Unable to load guests",
        description: err.message,
        variant: "error",
      })
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, showToast])

  React.useEffect(() => {
    fetchGuests()
  }, [fetchGuests])

  function handleSearch(value) {
    setSearch(value)
    setPage(1)
    setSearchParams(value ? { q: value } : {})
  }

  async function handleSaveGuest(payload) {
    setSubmitting(true)

    try {
      const isEditing = Boolean(editingGuest)

      const response = await fetch(
        isEditing ? `${GUESTS_API}${editingGuest.id}/` : GUESTS_API,
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      )

      await readResponse(response)

      showToast({
        title: isEditing ? "Guest profile updated" : "Guest registered",
        variant: "success",
      })

      setFormOpen(false)
      setEditingGuest(null)

      if (!isEditing && page !== 1) {
        setPage(1)
      } else {
        await fetchGuests()
      }
    } catch (err) {
      showToast({
        title: "Unable to save guest",
        description: err.message,
        variant: "error",
      })

      throw err
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    {
      key: "name",
      header: "Guest",
      render: (guest) => (
        <div>
          <p className="font-medium text-foreground">
            {formatGuestName(guest)}
          </p>
          <p className="text-xs text-muted-foreground">{guest.email}</p>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (guest) => guest.phone || "—",
    },
    {
      key: "nationality",
      header: "Nationality",
      render: (guest) => guest.nationality || "—",
    },
    {
      key: "registered",
      header: "Registered",
      render: (guest) => formatDate(guest.created_at),
    },
    {
      key: "status",
      header: "Status",
      render: (guest) => <StatusBadge status={guest.status} />,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (guest) => (
        <div
          className="flex justify-end gap-1.5"
          onClick={(event) => event.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/guests/${guest.id}`)}
          >
            View profile
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingGuest(guest)
              setFormOpen(true)
            }}
          >
            Edit
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Guests"
        description="Directory of registered hotel guests and their information."
        actions={
          <Button
            onClick={() => {
              setEditingGuest(null)
              setFormOpen(true)
            }}
          >
            <FiPlus data-icon="inline-start" />
            Register guest
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Total guests"
          value={stats.total}
          icon={<FiUsers />}
          accent="primary"
        />

        <StatCard
          label="Active guests"
          value={stats.active}
          icon={<FiUsers />}
          accent="success"
        />

        <StatCard
          label="Inactive guests"
          value={stats.inactive}
          icon={<FiUsers />}
          accent="warning"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder="Search by name, email or phone..."
          className="w-full sm:max-w-sm"
        />

        <FilterDropdown
          label="Status"
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value)
            setPage(1)
          }}
          options={GUEST_STATUSES}
        />
      </div>

      {loading ? (
        <div className="rounded-lg border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Loading guests...
        </div>
      ) : error && guests.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-10 text-center">
          <p className="text-sm font-medium text-foreground">
            Unable to load guests
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={fetchGuests}
          >
            Try again
          </Button>
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={guests}
            keyExtractor={(guest) => guest.id}
            onRowClick={(guest) => navigate(`/guests/${guest.id}`)}
            emptyTitle="No guests found"
            emptyDescription="Try adjusting your search, or register a new guest."
          />

          <Pagination
            page={page}
            pageCount={pageCount}
            totalItems={totalItems}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}

      <GuestForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditingGuest(null)
        }}
        guest={editingGuest}
        onSubmit={handleSaveGuest}
        isSubmitting={submitting}
      />
    </div>
  )
}
