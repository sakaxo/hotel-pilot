import * as React from "react"

import { useSearchParams, useNavigate } from "react-router-dom"

import { FiCheckCircle, FiGrid, FiPlus, FiTool, FiClock } from "react-icons/fi"

import { PageHeader } from "@/components/common/PageHeader"
import { SearchInput } from "@/components/common/SearchInput"
import { FilterDropdown } from "@/components/common/FilterDropdown"
import { StatCard } from "@/components/common/StatCard"
import { StatusBadge } from "@/components/common/StatusBadge"
import { EmptyState } from "@/components/common/EmptyState"
import { Pagination } from "@/components/common/Pagination"
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/format"
import { useToast } from "@/context/ToastContext"

import { RoomForm } from "@/pages/Rooms/RoomForm"
import { RoomDetails } from "@/pages/Rooms/RoomDetails"

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "")

const ROOMS_API = `${API_BASE_URL}/api/rooms/`
const CATEGORIES_API = `${API_BASE_URL}/api/rooms/categories/`
const PAGE_SIZE = 8

const ROOM_STATUSES = [
  { label: "Available", value: "available" },
  { label: "Occupied", value: "occupied" },
  { label: "Awaiting Inspection", value: "awaiting_inspection" },
  { label: "Maintenance", value: "maintenance" },
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

export function RoomsList() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const [search, setSearch] = React.useState(searchParams.get("q") ?? "")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [categoryFilter, setCategoryFilter] = React.useState("all")

  const [rooms, setRooms] = React.useState([])
  const [categories, setCategories] = React.useState([])
  const [stats, setStats] = React.useState({
    total: 0,
    available: 0,
    occupied: 0,
    awaiting_inspection: 0,
    maintenance: 0,
  })

  const [page, setPage] = React.useState(1)
  const [totalItems, setTotalItems] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")

  const [formOpen, setFormOpen] = React.useState(false)
  const [editingRoom, setEditingRoom] = React.useState(null)
  const [viewingRoom, setViewingRoom] = React.useState(null)
  const [submitting, setSubmitting] = React.useState(false)

  const [roomToDelete, setRoomToDelete] = React.useState(null)

  const pageCount = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))

  React.useEffect(() => {
    setSearch(searchParams.get("q") ?? "")
  }, [searchParams])

  const fetchCategories = React.useCallback(async () => {
    const response = await fetch(`${CATEGORIES_API}?active=true&page_size=100`)

    const data = await readResponse(response)
    setCategories(data.results ?? [])
  }, [])

  const fetchRooms = React.useCallback(async () => {
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

      if (categoryFilter !== "all") {
        params.set("category", categoryFilter)
      }

      const response = await fetch(`${ROOMS_API}?${params}`)
      const data = await readResponse(response)

      setRooms(data.results ?? [])
      setTotalItems(data.count ?? 0)

      if (data.stats) {
        setStats(data.stats)
      }
    } catch (err) {
      setError(err.message)

      showToast({
        title: "Unable to load rooms",
        description: err.message,
        variant: "error",
      })
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, categoryFilter, showToast])

  React.useEffect(() => {
    fetchCategories().catch((err) => {
      showToast({
        title: "Unable to load room categories",
        description: err.message,
        variant: "error",
      })
    })
  }, [fetchCategories, showToast])

  React.useEffect(() => {
    fetchRooms()
  }, [fetchRooms])

  function handleSearch(value) {
    setSearch(value)
    setPage(1)
    setSearchParams(value ? { q: value } : {})
  }

  async function handleSaveRoom(payload) {
    setSubmitting(true)

    try {
      const isEditing = Boolean(editingRoom)

      const response = await fetch(
        isEditing ? `${ROOMS_API}${editingRoom.id}/` : ROOMS_API,
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )

      await readResponse(response)

      showToast({
        title: isEditing ? "Room updated" : "Room added",
        variant: "success",
      })

      setFormOpen(false)
      setEditingRoom(null)
      await fetchRooms()
    } catch (err) {
      showToast({
        title: "Unable to save room",
        description: err.message,
        variant: "error",
      })

      throw err
    } finally {
      setSubmitting(false)
    }
  }

  function requestDeleteRoom(room) {
    setViewingRoom(null)
    setRoomToDelete(room)
  }

  async function handleDeleteRoom() {
    if (!roomToDelete) return

    try {
      const response = await fetch(`${ROOMS_API}${roomToDelete.id}/`, {
        method: "DELETE",
      })

      if (!response.ok && response.status !== 204) {
        await readResponse(response)
      }

      showToast({
        title: "Room deleted",
        variant: "success",
      })

      setRoomToDelete(null)
      await fetchRooms()
    } catch (err) {
      showToast({
        title: "Unable to delete room",
        description: err.message,
        variant: "error",
      })
    }
  }

  async function handleStatusUpdate(room, roomStatus) {
    const response = await fetch(`${ROOMS_API}${room.id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: roomStatus,
      }),
    })

    const updatedRoom = await readResponse(response)

    setViewingRoom(updatedRoom)

    showToast({
      title: "Room status updated",
      variant: "success",
    })

    await fetchRooms()
  }

  function openEditRoom(room) {
    setViewingRoom(null)
    setEditingRoom(room)
    setFormOpen(true)
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Rooms"
        description="Monitor room availability, occupancy and maintenance across the hotel."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => navigate("/rooms/categories")}
            >
              Room categories
            </Button>

            <Button
              onClick={() => {
                setEditingRoom(null)
                setFormOpen(true)
              }}
            >
              <FiPlus data-icon="inline-start" />
              Add room
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Total rooms"
          value={stats.total}
          icon={<FiGrid />}
          accent="primary"
        />

        <StatCard
          label="Available"
          value={stats.available}
          icon={<FiCheckCircle />}
          accent="success"
        />

        <StatCard
          label="Occupied"
          value={stats.occupied}
          icon={<FiGrid />}
          accent="info"
        />

        <StatCard
          label="Awaiting inspection"
          value={stats.awaiting_inspection}
          icon={<FiClock />}
          accent="warning"
        />

        <StatCard
          label="Maintenance"
          value={stats.maintenance}
          icon={<FiTool />}
          accent="danger"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder="Search by room number or category..."
          className="w-full sm:max-w-sm"
        />

        <div className="flex flex-wrap items-center gap-2">
          <FilterDropdown
            label="Status"
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value)
              setPage(1)
            }}
            options={ROOM_STATUSES}
          />

          <FilterDropdown
            label="Category"
            value={categoryFilter}
            onChange={(value) => {
              setCategoryFilter(value)
              setPage(1)
            }}
            options={categories.map((category) => ({
              label: category.name,
              value: String(category.id),
            }))}
          />
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Loading rooms...
        </div>
      ) : error && rooms.length === 0 ? (
        <EmptyState title="Unable to load rooms" description={error} />
      ) : rooms.length === 0 ? (
        <EmptyState
          title="No rooms found"
          description="Try adjusting your search or filters."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {rooms.map((room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => setViewingRoom(room)}
                className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3.5 text-left shadow-sm transition-colors hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-lg font-semibold text-foreground">
                    {room.number}
                  </p>

                  <StatusBadge status={room.status} />
                </div>

                <p className="text-xs text-muted-foreground">
                  {room.category_name}
                </p>

                <p className="text-sm font-medium text-foreground">
                  {formatCurrency(Number(room.rate), "GHS")}/night
                </p>

                <p className="truncate text-xs text-muted-foreground">
                  Floor {room.floor}
                </p>
              </button>
            ))}
          </div>

          <Pagination
            page={page}
            pageCount={pageCount}
            totalItems={totalItems}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}

      <RoomForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditingRoom(null)
        }}
        room={editingRoom}
        categories={categories}
        onSubmit={handleSaveRoom}
        isSubmitting={submitting}
      />

      <RoomDetails
        open={Boolean(viewingRoom)}
        onClose={() => setViewingRoom(null)}
        room={viewingRoom}
        onEdit={() => openEditRoom(viewingRoom)}
        onDelete={requestDeleteRoom}
        onUpdateStatus={handleStatusUpdate}
      />

      <ConfirmationDialog
        open={Boolean(roomToDelete)}
        onClose={() => setRoomToDelete(null)}
        onConfirm={handleDeleteRoom}
        title="Delete room?"
        description={
          roomToDelete
            ? `Are you sure you want to delete room ${roomToDelete.number}? This action cannot be undone.`
            : "Are you sure you want to proceed with this action?"
        }
        confirmLabel="Delete room"
        cancelLabel="Cancel"
        variant="destructive"
      />
    </div>
  )
}
