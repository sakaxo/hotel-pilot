import * as React from "react"
import { FiActivity, FiCheckCircle, FiXCircle } from "react-icons/fi"
import { useAppData } from "@/context/AppDataContext"
import { PageHeader } from "@/components/common/PageHeader"
import { SearchInput } from "@/components/common/SearchInput"
import { FilterDropdown } from "@/components/common/FilterDropdown"
import { StatCard } from "@/components/common/StatCard"
import { StatusBadge } from "@/components/common/StatusBadge"
import { Modal } from "@/components/common/Modal"
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/forms/FormTextarea"
import { formatDateTime, maskCardUid } from "@/lib/format"
import type { AccessLog } from "@/types"

export function AccessLogs() {
  const { data, getGuest, getRoom } = useAppData()

  const [search, setSearch] = React.useState("")
  const [roomFilter, setRoomFilter] = React.useState("all")
  const [resultFilter, setResultFilter] = React.useState("all")
  const [dateFilter, setDateFilter] = React.useState("")
  const [viewingLog, setViewingLog] = React.useState<AccessLog | null>(null)

  const grantedCount = data.accessLogs.filter((l) => l.result === "Granted").length
  const deniedCount = data.accessLogs.filter((l) => l.result === "Denied").length

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase()
    return data.accessLogs.filter((log) => {
      const room = getRoom(log.roomId)
      const guest = getGuest(log.guestId)
      const matchesSearch =
        !term ||
        log.reference.toLowerCase().includes(term) ||
        room?.number.toLowerCase().includes(term) ||
        (guest && `${guest.firstName} ${guest.lastName}`.toLowerCase().includes(term))
      const matchesRoom = roomFilter === "all" || log.roomId === roomFilter
      const matchesResult = resultFilter === "all" || log.result === resultFilter
      const matchesDate = !dateFilter || log.timestamp.slice(0, 10) === dateFilter
      return matchesSearch && matchesRoom && matchesResult && matchesDate
    })
  }, [data.accessLogs, search, roomFilter, resultFilter, dateFilter, getGuest, getRoom])

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  const columns: DataTableColumn<AccessLog>[] = [
    { key: "reference", header: "Event", render: (l) => <span className="font-medium">{l.reference}</span> },
    { key: "room", header: "Room", render: (l) => getRoom(l.roomId)?.number ?? "—" },
    {
      key: "card",
      header: "Card",
      render: (l) => {
        const card = data.rfidCards.find((c) => c.id === l.cardId)
        return card ? maskCardUid(card.uid) : "—"
      },
    },
    {
      key: "guest",
      header: "Guest",
      render: (l) => {
        const guest = getGuest(l.guestId)
        return guest ? `${guest.firstName} ${guest.lastName}` : "—"
      },
    },
    { key: "timestamp", header: "Timestamp", render: (l) => formatDateTime(l.timestamp) },
    { key: "result", header: "Result", render: (l) => <StatusBadge status={l.result} /> },
  ]

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Access Logs" description="Review simulated RFID door access activity." />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Total events" value={data.accessLogs.length} icon={<FiActivity />} accent="primary" />
        <StatCard label="Granted" value={grantedCount} icon={<FiCheckCircle />} accent="success" />
        <StatCard label="Denied" value={deniedCount} icon={<FiXCircle />} accent="danger" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by event, room or guest..."
          className="w-full sm:max-w-xs"
        />
        <div className="flex flex-wrap items-center gap-2">
          <FilterDropdown
            label="Room"
            value={roomFilter}
            onChange={setRoomFilter}
            options={data.rooms.map((r) => ({ label: `Room ${r.number}`, value: r.id }))}
          />
          <FilterDropdown
            label="Result"
            value={resultFilter}
            onChange={setResultFilter}
            options={[
              { label: "Granted", value: "Granted" },
              { label: "Denied", value: "Denied" },
            ]}
          />
          <DatePicker
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            containerClassName="flex-row items-center gap-2"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={sorted}
        keyExtractor={(l) => l.id}
        pageSize={10}
        onRowClick={(l) => setViewingLog(l)}
        emptyTitle="No access events found"
        emptyDescription="Try adjusting your search or filters."
      />

      <Modal
        open={!!viewingLog}
        onClose={() => setViewingLog(null)}
        title={viewingLog?.reference ?? ""}
        description="Access event details"
        size="sm"
        footer={
          <Button variant="outline" onClick={() => setViewingLog(null)}>
            Close
          </Button>
        }
      >
        {viewingLog && (
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">Result</p>
              <StatusBadge status={viewingLog.result} />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">Room</p>
              <p className="font-medium text-foreground">{getRoom(viewingLog.roomId)?.number ?? "—"}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">Guest</p>
              <p className="font-medium text-foreground">
                {getGuest(viewingLog.guestId)
                  ? `${getGuest(viewingLog.guestId)?.firstName} ${getGuest(viewingLog.guestId)?.lastName}`
                  : "—"}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">Timestamp</p>
              <p className="font-medium text-foreground">{formatDateTime(viewingLog.timestamp)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Description</p>
              <p className="font-medium text-foreground">{viewingLog.description}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
