import * as React from "react"
import { Link } from "react-router-dom"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  FiAlertTriangle,
  FiCalendar,
  FiCheckCircle,
  FiCreditCard,
  FiDollarSign,
  FiGrid,
  FiLogIn,
  FiLogOut,
  FiUsers,
} from "react-icons/fi"
import { useAppData } from "@/context/AppDataContext"
import { PageHeader } from "@/components/common/PageHeader"
import { StatCard } from "@/components/common/StatCard"
import { StatusBadge } from "@/components/common/StatusBadge"
import { ChartCard } from "@/components/charts/ChartCard"
import { EmptyState } from "@/components/common/EmptyState"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format"
import type { RoomStatus } from "@/types"

const ROOM_STATUS_COLORS: Record<RoomStatus, string> = {
  Available: "#23966B",
  Occupied: "#3986C9",
  Reserved: "#E8A34A",
  Cleaning: "#75838D",
  Maintenance: "#D9534F",
}

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10)
}

export function Dashboard() {
  const { data, getGuest, getRoom } = useAppData()
  const today = toDateStr(new Date())

  const roomStats = React.useMemo(() => {
    const counts: Record<RoomStatus, number> = {
      Available: 0,
      Occupied: 0,
      Reserved: 0,
      Cleaning: 0,
      Maintenance: 0,
    }
    data.rooms.forEach((room) => {
      counts[room.status] += 1
    })
    return counts
  }, [data.rooms])

  const todayCheckIns = React.useMemo(
    () => data.reservations.filter((r) => r.checkInDate === today && r.status !== "Cancelled"),
    [data.reservations, today]
  )
  const todayCheckOuts = React.useMemo(
    () => data.reservations.filter((r) => r.checkOutDate === today && r.status !== "Cancelled"),
    [data.reservations, today]
  )

  const totalRevenue = React.useMemo(
    () => data.payments.filter((p) => p.status === "Paid").reduce((sum, p) => sum + p.amount, 0),
    [data.payments]
  )
  const outstandingBalance = React.useMemo(
    () =>
      data.reservations
        .filter((r) => r.status !== "Cancelled")
        .reduce((sum, r) => sum + Math.max(0, r.totalAmount - r.amountPaid), 0),
    [data.reservations]
  )

  const occupancyChartData = React.useMemo(
    () =>
      (Object.keys(roomStats) as RoomStatus[]).map((status) => ({
        name: status,
        value: roomStats[status],
      })),
    [roomStats]
  )

  const revenueChartData = React.useMemo(() => {
    const days: { date: string; label: string; revenue: number }[] = []
    for (let i = 13; i >= 0; i -= 1) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push({
        date: toDateStr(d),
        label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        revenue: 0,
      })
    }
    data.payments
      .filter((p) => p.status === "Paid")
      .forEach((p) => {
        const dateStr = p.date.slice(0, 10)
        const match = days.find((d) => d.date === dateStr)
        if (match) match.revenue += p.amount
      })
    return days
  }, [data.payments])

  const reservationTrendData = React.useMemo(() => {
    const days: { date: string; label: string; reservations: number }[] = []
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push({
        date: toDateStr(d),
        label: d.toLocaleDateString("en-US", { weekday: "short" }),
        reservations: 0,
      })
    }
    data.reservations.forEach((r) => {
      const dateStr = r.createdAt.slice(0, 10)
      const match = days.find((d) => d.date === dateStr)
      if (match) match.reservations += 1
    })
    return days
  }, [data.reservations])

  const recentReservations = [...data.reservations]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  const recentGuests = [...data.guests]
    .sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime())
    .slice(0, 5)

  const recentAccessLogs = [...data.accessLogs]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5)

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Dashboard"
        description="Overview of today's hotel operations, occupancy and finances."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total rooms" value={data.rooms.length} icon={<FiGrid />} accent="primary" />
        <StatCard label="Available" value={roomStats.Available} icon={<FiCheckCircle />} accent="success" />
        <StatCard label="Occupied" value={roomStats.Occupied} icon={<FiUsers />} accent="info" />
        <StatCard label="Reserved" value={roomStats.Reserved} icon={<FiCalendar />} accent="warning" />
        <StatCard label="Cleaning / Maintenance" value={roomStats.Cleaning + roomStats.Maintenance} icon={<FiAlertTriangle />} accent="danger" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Today's check-ins" value={todayCheckIns.length} icon={<FiLogIn />} accent="info" />
        <StatCard label="Today's check-outs" value={todayCheckOuts.length} icon={<FiLogOut />} accent="warning" />
        <StatCard label="Registered guests" value={data.guests.length} icon={<FiUsers />} accent="primary" />
        <StatCard label="Total revenue" value={formatCurrency(totalRevenue)} icon={<FiDollarSign />} accent="success" />
        <StatCard label="Outstanding payments" value={formatCurrency(outstandingBalance)} icon={<FiCreditCard />} accent="danger" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Occupancy overview" description="Current status of all rooms" className="lg:col-span-1">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={occupancyChartData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                {occupancyChartData.map((entry) => (
                  <Cell key={entry.name} fill={ROOM_STATUS_COLORS[entry.name as RoomStatus]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenue overview" description="Payments received over the last 14 days" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={revenueChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={1} />
              <YAxis tick={{ fontSize: 11 }} width={48} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="revenue" fill="#16A6A0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Reservation trends" description="New reservations created in the last 7 days">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={reservationTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={32} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="reservations" fill="#3986C9" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Recent reservations</h3>
            <Link to="/reservations" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          {recentReservations.length === 0 ? (
            <EmptyState title="No reservations yet" className="border-0 py-8" />
          ) : (
            <ul className="divide-y divide-border">
              {recentReservations.map((r) => {
                const guest = getGuest(r.guestId)
                const room = getRoom(r.roomId)
                return (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {guest ? `${guest.firstName} ${guest.lastName}` : "Guest"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.reference} · Room {room?.number ?? "—"} · {formatDate(r.checkInDate)}
                      </p>
                    </div>
                    <StatusBadge status={r.status} />
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Recent RFID access events</h3>
            <Link to="/access/logs" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          {recentAccessLogs.length === 0 ? (
            <EmptyState title="No access events yet" className="border-0 py-8" />
          ) : (
            <ul className="divide-y divide-border">
              {recentAccessLogs.map((log) => {
                const room = getRoom(log.roomId)
                return (
                  <li key={log.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">Room {room?.number ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(log.timestamp)}</p>
                    </div>
                    <StatusBadge status={log.result} />
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Recent guest activity</h3>
          {recentGuests.length === 0 ? (
            <EmptyState title="No guests registered yet" className="border-0 py-8" />
          ) : (
            <ul className="divide-y divide-border">
              {recentGuests.map((guest) => (
                <li key={guest.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {guest.firstName} {guest.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">Registered {formatDate(guest.registrationDate)}</p>
                  </div>
                  <StatusBadge status={guest.status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Notifications &amp; alerts</h3>
          {data.notifications.length === 0 ? (
            <EmptyState title="No notifications" className="border-0 py-8" />
          ) : (
            <ul className="divide-y divide-border">
              {data.notifications.map((n) => (
                <li key={n.id} className="py-2.5 text-sm">
                  <p className="font-medium text-foreground">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.description}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
