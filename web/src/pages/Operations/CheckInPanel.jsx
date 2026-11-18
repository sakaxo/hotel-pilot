import * as React from "react";
import { FiCheckCircle, FiCreditCard, FiSearch } from "react-icons/fi";
import { useAppData } from "@/context/AppDataContext";
import { useToast } from "@/context/ToastContext";
import { SearchInput } from "@/components/common/SearchInput";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { FormSelect } from "@/components/forms/FormSelect";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, maskCardUid } from "@/lib/format";
export function CheckInPanel() {
    const { data, getGuest, getRoom, getRoomCategory, checkInReservation } = useAppData();
    const { showToast } = useToast();
    const [search, setSearch] = React.useState("");
    const [selectedReservation, setSelectedReservation] = React.useState(null);
    const [cardId, setCardId] = React.useState("");
    const [cardUidInput, setCardUidInput] = React.useState("");
    const [lastCheckIn, setLastCheckIn] = React.useState(null);
    const eligibleReservations = React.useMemo(() => data.reservations.filter((r) => r.status === "Confirmed" || r.status === "Pending"), [data.reservations]);
    const filteredReservations = React.useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term)
            return eligibleReservations.slice(0, 6);
        return eligibleReservations.filter((r) => {
            const guest = getGuest(r.guestId);
            return (r.reference.toLowerCase().includes(term) ||
                (guest && `${guest.firstName} ${guest.lastName}`.toLowerCase().includes(term)));
        });
    }, [eligibleReservations, search, getGuest]);
    const availableCards = data.rfidCards.filter((c) => c.status === "Available");
    function handleScan() {
        if (availableCards.length === 0) {
            showToast({ title: "No available cards in inventory", variant: "error" });
            return;
        }
        const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
        setCardId(randomCard.id);
        setCardUidInput(randomCard.uid);
        showToast({ title: "Card scanned", description: `Detected card ${randomCard.reference}`, variant: "success" });
    }
    function handleManualEntry(value) {
        setCardUidInput(value);
        const match = availableCards.find((c) => c.uid.toLowerCase() === value.toLowerCase() || c.reference.toLowerCase() === value.toLowerCase());
        setCardId(match?.id ?? "");
    }
    function handleConfirm() {
        if (!selectedReservation || !cardId)
            return;
        checkInReservation(selectedReservation.id, cardId);
        setLastCheckIn(selectedReservation);
        showToast({
            title: "Guest checked in",
            description: `${getGuest(selectedReservation.guestId)?.firstName ?? "Guest"} has been checked in to room ${getRoom(selectedReservation.roomId)?.number}.`,
            variant: "success",
        });
        setSelectedReservation(null);
        setCardId("");
        setCardUidInput("");
        setSearch("");
    }
    if (lastCheckIn) {
        const guest = getGuest(lastCheckIn.guestId);
        const room = getRoom(lastCheckIn.roomId);
        return (<div className="flex flex-col items-center gap-3 rounded-lg border border-success/30 bg-success/5 px-6 py-10 text-center">
        <FiCheckCircle className="size-10 text-success"/>
        <h3 className="text-lg font-semibold text-foreground">Check-in complete</h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          {guest?.firstName} {guest?.lastName} has been checked in to room {room?.number}. The RFID
          card is now active for this stay.
        </p>
        <Button onClick={() => setLastCheckIn(null)}>Check in another guest</Button>
      </div>);
    }
    if (!selectedReservation) {
        return (<div className="flex flex-col gap-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by reservation reference or guest name..."/>
        {filteredReservations.length === 0 ? (<EmptyState icon={<FiSearch />} title="No matching reservations" description="Search for a confirmed or pending reservation to begin check-in."/>) : (<ul className="divide-y divide-border rounded-lg border border-border bg-card">
            {filteredReservations.map((r) => {
                    const guest = getGuest(r.guestId);
                    const room = getRoom(r.roomId);
                    return (<li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {guest ? `${guest.firstName} ${guest.lastName}` : "Guest"} · {r.reference}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Room {room?.number} · {formatDate(r.checkInDate)} – {formatDate(r.checkOutDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={r.status}/>
                    <Button size="sm" onClick={() => setSelectedReservation(r)}>
                      Select
                    </Button>
                  </div>
                </li>);
                })}
          </ul>)}
      </div>);
    }
    const guest = getGuest(selectedReservation.guestId);
    const room = getRoom(selectedReservation.roomId);
    const category = getRoomCategory(room?.categoryId);
    const balance = selectedReservation.totalAmount - selectedReservation.amountPaid;
    return (<div className="flex flex-col gap-4">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Guest &amp; reservation details</h3>
          <Button variant="ghost" size="sm" onClick={() => setSelectedReservation(null)}>
            Change reservation
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Guest</p>
            <p className="font-medium text-foreground">
              {guest?.firstName} {guest?.lastName}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Reservation</p>
            <p className="font-medium text-foreground">{selectedReservation.reference}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Allocated room</p>
            <p className="font-medium text-foreground">
              Room {room?.number} · {category?.name}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Stay dates</p>
            <p className="font-medium text-foreground">
              {formatDate(selectedReservation.checkInDate)} – {formatDate(selectedReservation.checkOutDate)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total amount</p>
            <p className="font-medium text-foreground">{formatCurrency(selectedReservation.totalAmount)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Balance due</p>
            <p className={`font-medium ${balance > 0 ? "text-danger" : "text-success"}`}>
              {formatCurrency(Math.max(0, balance))}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Assign RFID card</h3>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <FormSelect label="Available card" containerClassName="flex-1" placeholder="Select a card" value={cardId} onChange={(e) => {
            setCardId(e.target.value);
            const card = availableCards.find((c) => c.id === e.target.value);
            setCardUidInput(card?.uid ?? "");
        }} options={availableCards.map((c) => ({ label: `${c.reference} · ${maskCardUid(c.uid)}`, value: c.id }))}/>
          <Button type="button" variant="outline" onClick={handleScan}>
            <FiCreditCard data-icon="inline-start"/> Simulate scan
          </Button>
        </div>
        <div className="mt-3">
          <p className="mb-1.5 text-xs text-muted-foreground">Or enter card reference / UID manually</p>
          <input value={cardUidInput} onChange={(e) => handleManualEntry(e.target.value)} placeholder="e.g. CRD-108" className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"/>
        </div>
      </div>

      <div className="flex justify-end">
        <Button size="lg" disabled={!cardId} onClick={handleConfirm}>
          Confirm check-in
        </Button>
      </div>
    </div>);
}
