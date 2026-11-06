import * as React from "react"
import { FiCheckCircle, FiDollarSign, FiPlus, FiRotateCcw } from "react-icons/fi"
import { useAppData } from "@/context/AppDataContext"
import { PageHeader } from "@/components/common/PageHeader"
import { SearchInput } from "@/components/common/SearchInput"
import { FilterDropdown } from "@/components/common/FilterDropdown"
import { StatCard } from "@/components/common/StatCard"
import { StatusBadge } from "@/components/common/StatusBadge"
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDateTime } from "@/lib/format"
import { RecordPaymentModal } from "@/pages/Payments/RecordPaymentModal"
import { ReceiptModal } from "@/pages/Payments/ReceiptModal"
import type { Payment, PaymentMethod, PaymentStatus } from "@/types"

const PAYMENT_STATUSES: PaymentStatus[] = ["Paid", "Pending", "Failed", "Refunded", "Partially Paid"]
const PAYMENT_METHODS: PaymentMethod[] = ["Cash", "Card", "Bank Transfer", "Mobile Money", "Paystack"]

export function Payments() {
  const { data, getGuest, getReservation } = useAppData()

  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [methodFilter, setMethodFilter] = React.useState("all")
  const [recordOpen, setRecordOpen] = React.useState(false)
  const [receiptPayment, setReceiptPayment] = React.useState<Payment | null>(null)

  const totalRevenue = data.payments.filter((p) => p.status === "Paid").reduce((sum, p) => sum + p.amount, 0)
  const outstandingBalance = data.reservations
    .filter((r) => r.status !== "Cancelled")
    .reduce((sum, r) => sum + Math.max(0, r.totalAmount - r.amountPaid), 0)
  const refunds = data.payments.filter((p) => p.status === "Refunded").reduce((sum, p) => sum + p.amount, 0)

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase()
    return data.payments.filter((p) => {
      const guest = getGuest(p.guestId)
      const matchesSearch =
        !term ||
        p.reference.toLowerCase().includes(term) ||
        (guest && `${guest.firstName} ${guest.lastName}`.toLowerCase().includes(term)) ||
        getReservation(p.reservationId)?.reference.toLowerCase().includes(term)
      const matchesStatus = statusFilter === "all" || p.status === statusFilter
      const matchesMethod = methodFilter === "all" || p.method === methodFilter
      return matchesSearch && matchesStatus && matchesMethod
    })
  }, [data.payments, search, statusFilter, methodFilter, getGuest, getReservation])

  const sorted = [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const columns: DataTableColumn<Payment>[] = [
    { key: "reference", header: "Reference", render: (p) => <span className="font-medium">{p.reference}</span> },
    {
      key: "guest",
      header: "Guest",
      render: (p) => {
        const guest = getGuest(p.guestId)
        return guest ? `${guest.firstName} ${guest.lastName}` : "—"
      },
    },
    { key: "reservation", header: "Reservation", render: (p) => getReservation(p.reservationId)?.reference ?? "—" },
    { key: "amount", header: "Amount", render: (p) => formatCurrency(p.amount) },
    { key: "method", header: "Method", render: (p) => p.method },
    { key: "date", header: "Date", render: (p) => formatDateTime(p.date) },
    { key: "status", header: "Status", render: (p) => <StatusBadge status={p.status} /> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (p) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => setReceiptPayment(p)}>
            View receipt
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Payments"
        description="Track revenue, outstanding balances and transaction history."
        actions={
          <Button onClick={() => setRecordOpen(true)}>
            <FiPlus data-icon="inline-start" /> Record payment
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total revenue" value={formatCurrency(totalRevenue)} icon={<FiDollarSign />} accent="success" />
        <StatCard label="Payments received" value={data.payments.filter((p) => p.status === "Paid").length} icon={<FiCheckCircle />} accent="info" />
        <StatCard label="Outstanding balances" value={formatCurrency(outstandingBalance)} icon={<FiDollarSign />} accent="danger" />
        <StatCard label="Refunds" value={formatCurrency(refunds)} icon={<FiRotateCcw />} accent="warning" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by reference, guest or reservation..."
          className="w-full sm:max-w-sm"
        />
        <div className="flex flex-wrap items-center gap-2">
          <FilterDropdown
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={PAYMENT_STATUSES.map((s) => ({ label: s, value: s }))}
          />
          <FilterDropdown
            label="Method"
            value={methodFilter}
            onChange={setMethodFilter}
            options={PAYMENT_METHODS.map((m) => ({ label: m, value: m }))}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={sorted}
        keyExtractor={(p) => p.id}
        pageSize={8}
        onRowClick={(p) => setReceiptPayment(p)}
        emptyTitle="No transactions found"
        emptyDescription="Try adjusting your search or filters."
      />

      <RecordPaymentModal open={recordOpen} onClose={() => setRecordOpen(false)} />
      <ReceiptModal open={!!receiptPayment} onClose={() => setReceiptPayment(null)} payment={receiptPayment} />
    </div>
  )
}
