import * as React from "react"
import { FiCreditCard, FiPlus, FiSlash } from "react-icons/fi"
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
import { formatDate, maskCardUid } from "@/lib/format"
import { RfidCardRegisterModal } from "@/pages/Access/RfidCardRegisterModal"
import { RfidCardAssignModal } from "@/pages/Access/RfidCardAssignModal"
import { RfidCardDetails } from "@/pages/Access/RfidCardDetails"
import { RfidCardReplaceModal } from "@/pages/Access/RfidCardReplaceModal"
import type { CardStatus, RfidCard } from "@/types"

const CARD_STATUSES: CardStatus[] = ["Available", "Assigned", "Blocked", "Lost"]

export function RfidCards() {
  const { data, getGuest, getRoom, blockCard, markCardLost } = useAppData()
  const { showToast } = useToast()

  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [registerOpen, setRegisterOpen] = React.useState(false)
  const [assignCard, setAssignCard] = React.useState<RfidCard | null>(null)
  const [viewingCard, setViewingCard] = React.useState<RfidCard | null>(null)
  const [replacingCard, setReplacingCard] = React.useState<RfidCard | null>(null)
  const [blockingCard, setBlockingCard] = React.useState<RfidCard | null>(null)
  const [losingCard, setLosingCard] = React.useState<RfidCard | null>(null)

  const stats = React.useMemo(() => {
    const counts: Record<CardStatus, number> = { Available: 0, Assigned: 0, Blocked: 0, Lost: 0 }
    data.rfidCards.forEach((c) => (counts[c.status] += 1))
    return counts
  }, [data.rfidCards])

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase()
    return data.rfidCards.filter((c) => {
      const guest = getGuest(c.assignedGuestId)
      const matchesSearch =
        !term ||
        c.reference.toLowerCase().includes(term) ||
        c.uid.toLowerCase().includes(term) ||
        (guest && `${guest.firstName} ${guest.lastName}`.toLowerCase().includes(term))
      const matchesStatus = statusFilter === "all" || c.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [data.rfidCards, search, statusFilter, getGuest])

  const columns: DataTableColumn<RfidCard>[] = [
    { key: "reference", header: "Card reference", render: (c) => <span className="font-medium">{c.reference}</span> },
    { key: "uid", header: "Identifier", render: (c) => maskCardUid(c.uid) },
    {
      key: "guest",
      header: "Assigned guest",
      render: (c) => {
        const guest = getGuest(c.assignedGuestId)
        return guest ? `${guest.firstName} ${guest.lastName}` : "—"
      },
    },
    { key: "room", header: "Assigned room", render: (c) => getRoom(c.assignedRoomId)?.number ?? "—" },
    { key: "assigned", header: "Assigned", render: (c) => (c.assignedDate ? formatDate(c.assignedDate) : "—") },
    { key: "expiry", header: "Expiry", render: (c) => (c.expiryDate ? formatDate(c.expiryDate) : "—") },
    { key: "status", header: "Status", render: (c) => <StatusBadge status={c.status} /> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (c) => (
        <div className="flex flex-wrap justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => setViewingCard(c)}>
            Details
          </Button>
          {(c.status === "Available" || c.status === "Assigned") && (
            <Button variant="ghost" size="sm" onClick={() => setAssignCard(c)}>
              {c.status === "Assigned" ? "Reassign" : "Assign"}
            </Button>
          )}
          {c.status !== "Blocked" && c.status !== "Lost" && (
            <Button variant="ghost" size="sm" className="text-danger" onClick={() => setBlockingCard(c)}>
              Block
            </Button>
          )}
          {c.status !== "Lost" && (
            <Button variant="ghost" size="sm" className="text-danger" onClick={() => setLosingCard(c)}>
              Mark lost
            </Button>
          )}
          {(c.status === "Blocked" || c.status === "Lost") && (
            <Button variant="ghost" size="sm" onClick={() => setReplacingCard(c)}>
              Replace
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="RFID Cards"
        description="Manage the shared inventory of reusable access cards."
        actions={
          <Button onClick={() => setRegisterOpen(true)}>
            <FiPlus data-icon="inline-start" /> Register card
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total cards" value={data.rfidCards.length} icon={<FiCreditCard />} accent="primary" />
        <StatCard label="Available" value={stats.Available} icon={<FiCreditCard />} accent="success" />
        <StatCard label="Assigned" value={stats.Assigned} icon={<FiCreditCard />} accent="info" />
        <StatCard label="Blocked / Lost" value={stats.Blocked + stats.Lost} icon={<FiSlash />} accent="danger" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by card reference, UID or guest..."
          className="w-full sm:max-w-sm"
        />
        <FilterDropdown
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={CARD_STATUSES.map((s) => ({ label: s, value: s }))}
        />
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        keyExtractor={(c) => c.id}
        pageSize={8}
        onRowClick={(c) => setViewingCard(c)}
        emptyTitle="No cards found"
        emptyDescription="Try adjusting your search or filters."
      />

      <RfidCardRegisterModal open={registerOpen} onClose={() => setRegisterOpen(false)} />
      <RfidCardAssignModal open={!!assignCard} onClose={() => setAssignCard(null)} card={assignCard} />
      <RfidCardDetails open={!!viewingCard} onClose={() => setViewingCard(null)} card={viewingCard} />
      <RfidCardReplaceModal open={!!replacingCard} onClose={() => setReplacingCard(null)} card={replacingCard} />

      <ConfirmationDialog
        open={!!blockingCard}
        onClose={() => setBlockingCard(null)}
        onConfirm={() => {
          if (blockingCard) {
            blockCard(blockingCard.id)
            showToast({ title: `Card ${blockingCard.reference} blocked`, variant: "info" })
          }
        }}
        title="Block this card?"
        description="The card will no longer grant access until replaced or unblocked."
        confirmLabel="Block card"
        variant="destructive"
      />

      <ConfirmationDialog
        open={!!losingCard}
        onClose={() => setLosingCard(null)}
        onConfirm={() => {
          if (losingCard) {
            markCardLost(losingCard.id)
            showToast({ title: `Card ${losingCard.reference} marked as lost`, variant: "info" })
          }
        }}
        title="Mark card as lost?"
        description="This card will be flagged as lost and removed from active inventory until replaced."
        confirmLabel="Mark as lost"
        variant="destructive"
      />
    </div>
  )
}
