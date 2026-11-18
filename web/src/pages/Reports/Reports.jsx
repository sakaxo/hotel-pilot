import * as React from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, } from "recharts";
import { FiDownload, FiPrinter } from "react-icons/fi";
import { useAppData } from "@/context/AppDataContext";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ChartCard } from "@/components/charts/ChartCard";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/forms/FormTextarea";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { exportToCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";
const TABS = [
    { id: "occupancy", label: "Occupancy" },
    { id: "revenue", label: "Revenue" },
    { id: "reservations", label: "Reservations" },
    { id: "guests", label: "Guests" },
    { id: "payments", label: "Payments" },
    { id: "access", label: "RFID Access" },
];
const ROOM_STATUS_COLORS = {
    Available: "#23966B",
    Occupied: "#3986C9",
    Reserved: "#E8A34A",
    Cleaning: "#75838D",
    Maintenance: "#D9534F",
};
function toDateStr(d) {
    return d.toISOString().slice(0, 10);
}
function inRange(dateStr, from, to) {
    const d = dateStr.slice(0, 10);
    return d >= from && d <= to;
}
export function Reports() {
    const { data, getGuest, getRoom, getRoomCategory } = useAppData();
    const [tab, setTab] = React.useState("occupancy");
    const [from, setFrom] = React.useState(() => toDateStr(new Date(Date.now() - 29 * 86400000)));
    const [to, setTo] = React.useState(() => toDateStr(new Date()));
    const reservationsInRange = React.useMemo(() => data.reservations.filter((r) => inRange(r.checkInDate, from, to)), [data.reservations, from, to]);
    const paymentsInRange = React.useMemo(() => data.payments.filter((p) => inRange(p.date, from, to)), [data.payments, from, to]);
    const guestsInRange = React.useMemo(() => data.guests.filter((g) => inRange(g.registrationDate, from, to)), [data.guests, from, to]);
    const accessLogsInRange = React.useMemo(() => data.accessLogs.filter((l) => inRange(l.timestamp, from, to)), [data.accessLogs, from, to]);
    const revenueInRange = paymentsInRange.filter((p) => p.status === "Paid").reduce((sum, p) => sum + p.amount, 0);
    const roomStats = React.useMemo(() => {
        const counts = {
            Available: 0,
            Occupied: 0,
            Reserved: 0,
            Cleaning: 0,
            Maintenance: 0,
        };
        data.rooms.forEach((r) => (counts[r.status] += 1));
        return counts;
    }, [data.rooms]);
    const revenueByDay = React.useMemo(() => {
        const days = [];
        const start = new Date(from);
        const end = new Date(to);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            days.push({ date: toDateStr(d), label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), revenue: 0 });
        }
        paymentsInRange
            .filter((p) => p.status === "Paid")
            .forEach((p) => {
            const match = days.find((day) => day.date === p.date.slice(0, 10));
            if (match)
                match.revenue += p.amount;
        });
        return days;
    }, [from, to, paymentsInRange]);
    const reservationsByDay = React.useMemo(() => {
        const days = [];
        const start = new Date(from);
        const end = new Date(to);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            days.push({ date: toDateStr(d), label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), count: 0 });
        }
        reservationsInRange.forEach((r) => {
            const match = days.find((day) => day.date === r.checkInDate);
            if (match)
                match.count += 1;
        });
        return days;
    }, [from, to, reservationsInRange]);
    const paymentStatusBreakdown = React.useMemo(() => {
        const counts = {};
        paymentsInRange.forEach((p) => {
            counts[p.status] = (counts[p.status] ?? 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [paymentsInRange]);
    function handleExportCsv() {
        switch (tab) {
            case "occupancy":
                exportToCsv("occupancy-report", data.rooms.map((r) => ({
                    room: r.number,
                    category: getRoomCategory(r.categoryId)?.name ?? "",
                    floor: r.floor,
                    status: r.status,
                })));
                break;
            case "revenue":
            case "payments":
                exportToCsv("payments-report", paymentsInRange.map((p) => ({
                    reference: p.reference,
                    guest: `${getGuest(p.guestId)?.firstName ?? ""} ${getGuest(p.guestId)?.lastName ?? ""}`,
                    amount: p.amount,
                    method: p.method,
                    status: p.status,
                    date: p.date,
                })));
                break;
            case "reservations":
                exportToCsv("reservations-report", reservationsInRange.map((r) => ({
                    reference: r.reference,
                    guest: `${getGuest(r.guestId)?.firstName ?? ""} ${getGuest(r.guestId)?.lastName ?? ""}`,
                    room: getRoom(r.roomId)?.number ?? "",
                    checkIn: r.checkInDate,
                    checkOut: r.checkOutDate,
                    status: r.status,
                    total: r.totalAmount,
                })));
                break;
            case "guests":
                exportToCsv("guests-report", guestsInRange.map((g) => ({
                    name: `${g.firstName} ${g.lastName}`,
                    email: g.email,
                    phone: g.phone,
                    nationality: g.nationality,
                    registered: g.registrationDate,
                })));
                break;
            case "access":
                exportToCsv("access-logs-report", accessLogsInRange.map((l) => ({
                    reference: l.reference,
                    room: getRoom(l.roomId)?.number ?? "",
                    result: l.result,
                    timestamp: l.timestamp,
                })));
                break;
        }
    }
    const occupancyColumns = [
        { key: "number", header: "Room", render: (r) => r.number },
        { key: "category", header: "Category", render: (r) => getRoomCategory(r.categoryId)?.name ?? "—" },
        { key: "floor", header: "Floor", render: (r) => r.floor },
        { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status}/> },
    ];
    const reservationColumns = [
        { key: "reference", header: "Reference", render: (r) => r.reference },
        { key: "guest", header: "Guest", render: (r) => `${getGuest(r.guestId)?.firstName ?? ""} ${getGuest(r.guestId)?.lastName ?? ""}` },
        { key: "room", header: "Room", render: (r) => getRoom(r.roomId)?.number ?? "—" },
        { key: "checkIn", header: "Check-in", render: (r) => formatDate(r.checkInDate) },
        { key: "total", header: "Total", render: (r) => formatCurrency(r.totalAmount) },
        { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status}/> },
    ];
    const guestColumns = [
        { key: "name", header: "Guest", render: (g) => `${g.firstName} ${g.lastName}` },
        { key: "email", header: "Email", render: (g) => g.email },
        { key: "registered", header: "Registered", render: (g) => formatDate(g.registrationDate) },
    ];
    const paymentColumns = [
        { key: "reference", header: "Reference", render: (p) => p.reference },
        { key: "guest", header: "Guest", render: (p) => `${getGuest(p.guestId)?.firstName ?? ""} ${getGuest(p.guestId)?.lastName ?? ""}` },
        { key: "amount", header: "Amount", render: (p) => formatCurrency(p.amount) },
        { key: "date", header: "Date", render: (p) => formatDate(p.date) },
        { key: "status", header: "Status", render: (p) => <StatusBadge status={p.status}/> },
    ];
    const accessColumns = [
        { key: "reference", header: "Event", render: (l) => l.reference },
        { key: "room", header: "Room", render: (l) => getRoom(l.roomId)?.number ?? "—" },
        { key: "timestamp", header: "Timestamp", render: (l) => formatDateTime(l.timestamp) },
        { key: "result", header: "Result", render: (l) => <StatusBadge status={l.result}/> },
    ];
    return (<div className="flex flex-col gap-5">
      <PageHeader title="Reports & Analytics" description="Generate operational insights across hotel activity." actions={<>
            <Button variant="outline" onClick={handleExportCsv}>
              <FiDownload data-icon="inline-start"/> Export CSV
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <FiPrinter data-icon="inline-start"/> Export PDF
            </Button>
          </>}/>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-3">
        <DatePicker label="From" value={from} onChange={(e) => setFrom(e.target.value)} containerClassName="w-40"/>
        <DatePicker label="To" value={to} onChange={(e) => setTo(e.target.value)} containerClassName="w-40"/>
      </div>

      <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1">
        {TABS.map((t) => (<button key={t.id} type="button" onClick={() => setTab(t.id)} className={cn("rounded-md px-3 py-1.5 text-sm font-medium transition-colors", tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
            {t.label}
          </button>))}
      </div>

      {tab === "occupancy" && (<>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {Object.keys(roomStats).map((status) => (<StatCard key={status} label={status} value={roomStats[status]}/>))}
          </div>
          <ChartCard title="Occupancy distribution" description="Current room status breakdown">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={Object.keys(roomStats).map((s) => ({ name: s, value: roomStats[s] }))} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95}>
                  {Object.keys(roomStats).map((s) => (<Cell key={s} fill={ROOM_STATUS_COLORS[s]}/>))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
          <DataTable columns={occupancyColumns} rows={data.rooms} keyExtractor={(r) => r.id} pageSize={8}/>
        </>)}

      {(tab === "revenue" || tab === "payments") && (<>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard label="Revenue in range" value={formatCurrency(revenueInRange)} accent="success"/>
            <StatCard label="Transactions" value={paymentsInRange.length} accent="primary"/>
            <StatCard label="Outstanding balance" value={formatCurrency(reservationsInRange.reduce((sum, r) => sum + Math.max(0, r.totalAmount - r.amountPaid), 0))} accent="danger"/>
          </div>
          {tab === "revenue" ? (<ChartCard title="Revenue trend" description={`Payments received between ${formatDate(from)} and ${formatDate(to)}`}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={revenueByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={Math.ceil(revenueByDay.length / 10)}/>
                  <YAxis tick={{ fontSize: 11 }} width={48}/>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))}/>
                  <Bar dataKey="revenue" fill="#16A6A0" radius={[4, 4, 0, 0]}/>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>) : (<ChartCard title="Payment status breakdown" description="Distribution of payment statuses in range">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={paymentStatusBreakdown} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95}>
                    {paymentStatusBreakdown.map((entry, i) => (<Cell key={entry.name} fill={["#23966B", "#E8A34A", "#3986C9", "#D9534F", "#75838D"][i % 5]}/>))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>)}
          <DataTable columns={paymentColumns} rows={paymentsInRange} keyExtractor={(p) => p.id} pageSize={8}/>
        </>)}

      {tab === "reservations" && (<>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Reservations in range" value={reservationsInRange.length} accent="primary"/>
            <StatCard label="Confirmed" value={reservationsInRange.filter((r) => r.status === "Confirmed").length} accent="info"/>
            <StatCard label="Checked in" value={reservationsInRange.filter((r) => r.status === "Checked In").length} accent="success"/>
            <StatCard label="Cancelled" value={reservationsInRange.filter((r) => r.status === "Cancelled").length} accent="danger"/>
          </div>
          <ChartCard title="Reservation volume" description="New reservations by check-in date">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={reservationsByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={Math.ceil(reservationsByDay.length / 10)}/>
                <YAxis tick={{ fontSize: 11 }} width={32} allowDecimals={false}/>
                <Tooltip />
                <Bar dataKey="count" fill="#3986C9" radius={[4, 4, 0, 0]}/>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <DataTable columns={reservationColumns} rows={reservationsInRange} keyExtractor={(r) => r.id} pageSize={8}/>
        </>)}

      {tab === "guests" && (<>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard label="New guests in range" value={guestsInRange.length} accent="primary"/>
            <StatCard label="Total registered guests" value={data.guests.length} accent="info"/>
            <StatCard label="Active guests" value={data.guests.filter((g) => g.status === "Active").length} accent="success"/>
          </div>
          <DataTable columns={guestColumns} rows={guestsInRange} keyExtractor={(g) => g.id} pageSize={10}/>
        </>)}

      {tab === "access" && (<>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard label="Events in range" value={accessLogsInRange.length} accent="primary"/>
            <StatCard label="Granted" value={accessLogsInRange.filter((l) => l.result === "Granted").length} accent="success"/>
            <StatCard label="Denied" value={accessLogsInRange.filter((l) => l.result === "Denied").length} accent="danger"/>
          </div>
          <DataTable columns={accessColumns} rows={accessLogsInRange} keyExtractor={(l) => l.id} pageSize={10}/>
        </>)}
    </div>);
}
