import * as React from "react"
import { FiCreditCard, FiPlus, FiSlash } from "react-icons/fi"
import { useToast } from "@/context/ToastContext"
import { PageHeader } from "@/components/common/PageHeader"
import { SearchInput } from "@/components/common/SearchInput"
import { FilterDropdown } from "@/components/common/FilterDropdown"
import { StatCard } from "@/components/common/StatCard"
import { StatusBadge } from "@/components/common/StatusBadge"
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog"
import { DataTable } from "@/components/tables/DataTable"
import { Button } from "@/components/ui/button"
import { formatDate, maskCardUid } from "@/lib/format"
import { RfidCardRegisterModal } from "@/pages/Access/RfidCardRegisterModal"
import { RfidCardDetails } from "@/pages/Access/RfidCardDetails"

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "")

const API_URL = `${API_BASE_URL}/api/access-control/cards/`
const PAGE_SIZE = 8

const CARD_STATUSES = [
  { label: "Available", value: "available" },
  { label: "Disabled", value: "disabled" },
  { label: "Lost", value: "lost" },
]

const STATUS_LABELS = {
  available: "Available",
  disabled: "Disabled",
  lost: "Lost",
}

const ACTIONS = {
  disabled: {
    title: "Disable this card?",
    description: "This card will no longer be available for use.",
    confirmLabel: "Disable card",
  },
  available: {
    title: "Restore this card?",
    description: "This card will be returned to the available inventory.",
    confirmLabel: "Restore card",
  },
  lost: {
    title: "Mark card as lost?",
    description: "This card will be flagged as lost.",
    confirmLabel: "Mark as lost",
  },
}

export function RfidCards() {
  const { showToast } = useToast()

  const [cards, setCards] = React.useState([])
  const [stats, setStats] = React.useState({
    total: 0,
    available: 0,
    disabled: 0,
    lost: 0,
  })

  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState("")

  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [page, setPage] = React.useState(1)
  const [pageCount, setPageCount] = React.useState(1)
  const [totalItems, setTotalItems] = React.useState(0)

  const [registerOpen, setRegisterOpen] = React.useState(false)
  const [editingCard, setEditingCard] = React.useState(null)
  const [viewingCard, setViewingCard] = React.useState(null)
  const [pendingAction, setPendingAction] = React.useState(null)

  // Reset to page one when search or status changes.
  React.useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  // Load the current page from Django.
  React.useEffect(() => {
    const controller = new AbortController()

    const timeout = setTimeout(async () => {
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

        const response = await fetch(`${API_URL}?${params}`, {
          signal: controller.signal,
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(
            result.detail || result.error || "Unable to load cards."
          )
        }

        setCards(result.results || [])
        setStats(
          result.stats || {
            total: 0,
            available: 0,
            disabled: 0,
            lost: 0,
          }
        )

        setTotalItems(result.count || 0)
        setPageCount(Math.max(1, Math.ceil((result.count || 0) / PAGE_SIZE)))
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message)

          showToast({
            title: "Unable to load cards",
            description: err.message,
            variant: "destructive",
          })
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }, 300)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [page, search, statusFilter])

  async function handleSaveCard(cardData) {
    setSubmitting(true)

    const isEditing = Boolean(editingCard)

    try {
      const response = await fetch(
        isEditing ? `${API_URL}${editingCard.id}/` : API_URL,
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(cardData),
        }
      )

      const result = await response.json()

      if (!response.ok) {
        const message =
          result.card_identifier?.[0] ||
          result.detail ||
          result.error ||
          "Unable to save card."

        throw new Error(message)
      }

      setRegisterOpen(false)
      setEditingCard(null)
      setViewingCard(null)

      showToast({
        title: isEditing ? "Card updated" : "Card registered",
        description: `${result.reference} has been saved successfully.`,
        variant: "success",
      })

      await refreshCards()
    } catch (err) {
      showToast({
        title: "Unable to save card",
        description: err.message,
        variant: "destructive",
      })

      throw err
    } finally {
      setSubmitting(false)
    }
  }

  async function refreshCards() {
    // Trigger a fresh request without changing the current filters/page.
    setPage((current) => current)
    await loadLatestCards()
  }

  async function loadLatestCards() {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(PAGE_SIZE),
    })

    if (search.trim()) params.set("search", search.trim())
    if (statusFilter !== "all") params.set("status", statusFilter)

    const response = await fetch(`${API_URL}?${params}`)
    const result = await response.json()

    if (!response.ok) {
      throw new Error("Unable to refresh cards.")
    }

    setCards(result.results || [])
    setStats(result.stats || stats)
    setTotalItems(result.count || 0)
    setPageCount(Math.max(1, Math.ceil((result.count || 0) / PAGE_SIZE)))
  }

  async function handleStatusUpdate() {
    if (!pendingAction) return

    const { card, status: newStatus } = pendingAction
    setSubmitting(true)

    try {
      const response = await fetch(`${API_URL}${card.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.detail || result.error || "Unable to update card."
        )
      }

      setPendingAction(null)
      setViewingCard(null)

      showToast({
        title: "Card status updated",
        description: `${result.reference} is now ${STATUS_LABELS[result.status]}.`,
        variant: "success",
      })

      await refreshCards()
    } catch (err) {
      showToast({
        title: "Update failed",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    {
      key: "reference",
      header: "Card reference",
      render: (card) => <span className="font-medium">{card.reference}</span>,
    },
    {
      key: "identifier",
      header: "Identifier",
      render: (card) => maskCardUid(card.card_identifier),
    },
    {
      key: "registered",
      header: "Date registered",
      render: (card) => (card.created_at ? formatDate(card.created_at) : "—"),
    },
    {
      key: "status",
      header: "Status",
      render: (card) => (
        <StatusBadge status={STATUS_LABELS[card.status] || card.status} />
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (card) => (
        <div
          className="flex flex-wrap justify-end gap-1.5"
          onClick={(event) => event.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewingCard(card)}
          >
            Details
          </Button>

          {card.status === "available" && (
            <Button
              variant="ghost"
              size="sm"
              className="text-danger"
              onClick={() => setPendingAction({ card, status: "disabled" })}
            >
              Disable
            </Button>
          )}

          {card.status === "disabled" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPendingAction({ card, status: "available" })}
            >
              Reactivate
            </Button>
          )}

          {card.status === "lost" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPendingAction({ card, status: "available" })}
            >
              Restore
            </Button>
          )}

          {card.status !== "lost" && (
            <Button
              variant="ghost"
              size="sm"
              className="text-danger"
              onClick={() => setPendingAction({ card, status: "lost" })}
            >
              Mark lost
            </Button>
          )}
        </div>
      ),
    },
  ]

  const confirmation = pendingAction ? ACTIONS[pendingAction.status] : null

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="RFID Cards"
        description="Manage the shared inventory of reusable access cards."
        actions={
          <Button
            onClick={() => {
              setEditingCard(null)
              setRegisterOpen(true)
            }}
          >
            <FiPlus data-icon="inline-start" />
            Register card
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total cards"
          value={stats.total}
          icon={<FiCreditCard />}
          accent="primary"
        />
        <StatCard
          label="Available"
          value={stats.available}
          icon={<FiCreditCard />}
          accent="success"
        />
        <StatCard
          label="Disabled"
          value={stats.disabled}
          icon={<FiSlash />}
          accent="info"
        />
        <StatCard
          label="Lost"
          value={stats.lost}
          icon={<FiSlash />}
          accent="danger"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by card reference or identifier..."
          className="w-full sm:max-w-sm"
        />

        <FilterDropdown
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={CARD_STATUSES}
        />
      </div>

      {error && !loading && (
        <div className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
          <span className="text-muted-foreground">{error}</span>
          <Button variant="outline" size="sm" onClick={refreshCards}>
            Retry
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        rows={cards}
        keyExtractor={(card) => card.id}
        isLoading={loading}
        onRowClick={setViewingCard}
        serverPagination
        page={page}
        pageCount={pageCount}
        totalItems={totalItems}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        emptyTitle="No cards found"
        emptyDescription="Try adjusting your search or filters."
      />

      <RfidCardRegisterModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSubmit={handleSaveCard}
        isSubmitting={submitting}
      />

      <RfidCardRegisterModal
        open={Boolean(editingCard)}
        onClose={() => setEditingCard(null)}
        onSubmit={handleSaveCard}
        isSubmitting={submitting}
        card={editingCard}
      />

      <RfidCardDetails
        open={Boolean(viewingCard)}
        onClose={() => setViewingCard(null)}
        card={viewingCard}
        onEdit={(card) => {
          setViewingCard(null)
          setEditingCard(card)
        }}
      />

      <ConfirmationDialog
        open={Boolean(pendingAction)}
        onClose={() => setPendingAction(null)}
        onConfirm={handleStatusUpdate}
        title={confirmation?.title || ""}
        description={confirmation?.description || ""}
        confirmLabel={confirmation?.confirmLabel || "Confirm"}
        variant="destructive"
      />
    </div>
  )
}
