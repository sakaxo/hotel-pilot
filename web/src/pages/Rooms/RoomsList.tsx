import * as React from "react"
import { useSearchParams } from "react-router-dom"
import { FiCheckCircle, FiGrid, FiPlus, FiTool, FiUsers } from "react-icons/fi"
import { useAppData } from "@/context/AppDataContext"
import { PageHeader } from "@/components/common/PageHeader"
import { SearchInput } from "@/components/common/SearchInput"
import { FilterDropdown } from "@/components/common/FilterDropdown"
import { StatCard } from "@/components/common/StatCard"
import { StatusBadge } from "@/components/common/StatusBadge"
import { EmptyState } from "@/components/common/EmptyState"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/format"
import { useSyncOnChange } from "@/hooks/useSyncOnChange"
import { RoomForm } from "@/pages/Rooms/RoomForm"
import { RoomDetails } from "@/pages/Rooms/RoomDetails"
import { RoomCategoryManager } from "@/pages/Rooms/RoomCategoryManager"
import type { Room, RoomStatus } from "@/types"

const ROOM_STATUSES: RoomStatus[] = ["Available", "Occupied", "Reserved", "Cleaning", "Maintenance"]

export function RoomsList() {
  const { data, getRoomCategory, getGuest } = useAppData()
  const [searchParams, setSearchParams] = useSearchParams()

  const [search, setSearch] = React.useState(searchParams.get("q") ?? "")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [categoryFilter, setCategoryFilter] = React.useState("all")
  const [formOpen, setFormOpen] = React.useState(false)
  const [editingRoom, setEditingRoom] = React.useState<Room | null>(null)
  const [viewingRoom, setViewingRoom] = React.useState<Room | null>(null)
  const [categoryManagerOpen, setCategoryManagerOpen] = React.useState(false)

  useSyncOnChange(searchParams.get("q"), (q) => {
    if (q) setSearch(q)
  })

  const roomStats = React.useMemo(() => {
    const counts: Record<RoomStatus, number> = {
      Available: 0,
      Occupied: 0,
      Reserved: 0,
      Cleaning: 0,
      Maintenance: 0,
    }
    data.rooms.forEach((r) => (counts[r.status] += 1))
    return counts
  }, [data.rooms])

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase()
    return [...data.rooms]
      .sort((a, b) => a.number.localeCompare(b.number))
      .filter((r) => {
        const matchesSearch = !term || r.number.toLowerCase().includes(term)
        const matchesStatus = statusFilter === "all" || r.status === statusFilter
        const matchesCategory = categoryFilter === "all" || r.categoryId === categoryFilter
        return matchesSearch && matchesStatus && matchesCategory
      })
  }, [data.rooms, search, statusFilter, categoryFilter])

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Rooms"
        description="Monitor room status, rates and housekeeping across the hotel."
        actions={
          <>
            <Button variant="outline" onClick={() => setCategoryManagerOpen(true)}>
              Manage categories
            </Button>
            <Button
              onClick={() => {
                setEditingRoom(null)
                setFormOpen(true)
              }}
            >
              <FiPlus data-icon="inline-start" /> Add room
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total rooms" value={data.rooms.length} icon={<FiGrid />} accent="primary" />
        <StatCard label="Available" value={roomStats.Available} icon={<FiCheckCircle />} accent="success" />
        <StatCard label="Occupied" value={roomStats.Occupied} icon={<FiUsers />} accent="info" />
        <StatCard label="Reserved" value={roomStats.Reserved} icon={<FiGrid />} accent="warning" />
        <StatCard label="Cleaning / Maintenance" value={roomStats.Cleaning + roomStats.Maintenance} icon={<FiTool />} accent="danger" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v)
            setSearchParams(v ? { q: v } : {})
          }}
          placeholder="Search by room number..."
          className="w-full sm:max-w-sm"
        />
        <div className="flex flex-wrap items-center gap-2">
          <FilterDropdown
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={ROOM_STATUSES.map((s) => ({ label: s, value: s }))}
          />
          <FilterDropdown
            label="Category"
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={data.roomCategories.map((c) => ({ label: c.name, value: c.id }))}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No rooms found" description="Try adjusting your search or filters." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((room) => {
            const category = getRoomCategory(room.categoryId)
            const guest = getGuest(room.currentGuestId)
            return (
              <button
                key={room.id}
                type="button"
                onClick={() => setViewingRoom(room)}
                className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3.5 text-left shadow-sm transition-colors hover:border-primary/40"
              >
                <div className="flex items-start justify-between">
                  <p className="text-lg font-semibold text-foreground">{room.number}</p>
                  <StatusBadge status={room.status} />
                </div>
                <p className="text-xs text-muted-foreground">{category?.name}</p>
                <p className="text-sm font-medium text-foreground">{formatCurrency(room.rate)}/night</p>
                <p className="truncate text-xs text-muted-foreground">
                  {guest ? `${guest.firstName} ${guest.lastName}` : "No current guest"}
                </p>
              </button>
            )
          })}
        </div>
      )}

      <RoomForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditingRoom(null)
        }}
        room={editingRoom}
      />

      <RoomDetails
        open={!!viewingRoom}
        onClose={() => setViewingRoom(null)}
        room={viewingRoom}
        onEdit={() => {
          if (viewingRoom) {
            setEditingRoom(viewingRoom)
            setFormOpen(true)
            setViewingRoom(null)
          }
        }}
      />

      <RoomCategoryManager open={categoryManagerOpen} onClose={() => setCategoryManagerOpen(false)} />
    </div>
  )
}
