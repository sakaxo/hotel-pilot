import * as React from "react"
import { useSearchParams } from "react-router-dom"
import { FiPlus, FiUsers } from "react-icons/fi"
import { useAppData } from "@/context/AppDataContext"
import { PageHeader } from "@/components/common/PageHeader"
import { SearchInput } from "@/components/common/SearchInput"
import { FilterDropdown } from "@/components/common/FilterDropdown"
import { StatCard } from "@/components/common/StatCard"
import { StatusBadge } from "@/components/common/StatusBadge"
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/format"
import { useSyncOnChange } from "@/hooks/useSyncOnChange"
import { GuestForm } from "@/pages/Guests/GuestForm"
import { GuestProfile } from "@/pages/Guests/GuestProfile"
import type { Guest } from "@/types"

export function GuestsList() {
  const { data } = useAppData()
  const [searchParams, setSearchParams] = useSearchParams()

  const [search, setSearch] = React.useState(searchParams.get("q") ?? "")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [formOpen, setFormOpen] = React.useState(false)
  const [editingGuest, setEditingGuest] = React.useState<Guest | null>(null)
  const [viewingGuest, setViewingGuest] = React.useState<Guest | null>(null)

  useSyncOnChange(searchParams.get("q"), (q) => {
    if (q) setSearch(q)
  })

  const stayCountByGuest = React.useMemo(() => {
    const map = new Map<string, number>()
    data.reservations.forEach((r) => {
      if (r.status === "Checked Out") {
        map.set(r.guestId, (map.get(r.guestId) ?? 0) + 1)
      }
    })
    return map
  }, [data.reservations])

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase()
    return data.guests.filter((g) => {
      const matchesSearch =
        !term ||
        `${g.firstName} ${g.lastName} ${g.email} ${g.phone}`.toLowerCase().includes(term)
      const matchesStatus = statusFilter === "all" || g.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [data.guests, search, statusFilter])

  const columns: DataTableColumn<Guest>[] = [
    {
      key: "name",
      header: "Guest",
      render: (g) => (
        <div>
          <p className="font-medium text-foreground">
            {g.firstName} {g.lastName}
          </p>
          <p className="text-xs text-muted-foreground">{g.email}</p>
        </div>
      ),
    },
    { key: "phone", header: "Phone", render: (g) => g.phone || "—" },
    { key: "nationality", header: "Nationality", render: (g) => g.nationality || "—" },
    { key: "registered", header: "Registered", render: (g) => formatDate(g.registrationDate) },
    { key: "stays", header: "Total stays", render: (g) => stayCountByGuest.get(g.id) ?? 0 },
    { key: "status", header: "Status", render: (g) => <StatusBadge status={g.status} /> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (g) => (
        <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => setViewingGuest(g)}>
            View profile
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingGuest(g)
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
        description="Directory of registered hotel guests and their history."
        actions={
          <Button
            onClick={() => {
              setEditingGuest(null)
              setFormOpen(true)
            }}
          >
            <FiPlus data-icon="inline-start" /> Register guest
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Total guests" value={data.guests.length} icon={<FiUsers />} accent="primary" />
        <StatCard
          label="Active guests"
          value={data.guests.filter((g) => g.status === "Active").length}
          icon={<FiUsers />}
          accent="success"
        />
        <StatCard
          label="Currently staying"
          value={data.rooms.filter((r) => r.status === "Occupied").length}
          icon={<FiUsers />}
          accent="info"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v)
            setSearchParams(v ? { q: v } : {})
          }}
          placeholder="Search by name, email or phone..."
          className="w-full sm:max-w-sm"
        />
        <FilterDropdown
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: "Active", value: "Active" },
            { label: "Inactive", value: "Inactive" },
          ]}
        />
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        keyExtractor={(g) => g.id}
        pageSize={8}
        onRowClick={(g) => setViewingGuest(g)}
        emptyTitle="No guests found"
        emptyDescription="Try adjusting your search, or register a new guest."
      />

      <GuestForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditingGuest(null)
        }}
        guest={editingGuest}
      />

      <GuestProfile
        open={!!viewingGuest}
        onClose={() => setViewingGuest(null)}
        guest={viewingGuest}
        onEdit={() => {
          if (viewingGuest) {
            setEditingGuest(viewingGuest)
            setFormOpen(true)
            setViewingGuest(null)
          }
        }}
      />
    </div>
  )
}
