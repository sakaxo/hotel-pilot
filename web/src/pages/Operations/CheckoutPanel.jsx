import * as React from "react";
import { FiAlertTriangle, FiCheckCircle, FiSearch } from "react-icons/fi";
import { useAppData } from "@/context/AppDataContext";
import { useToast } from "@/context/ToastContext";
import { SearchInput } from "@/components/common/SearchInput";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, maskCardUid } from "@/lib/format";
export function CheckoutPanel() {
    const { data, getGuest, getRoom, checkOutReservation } = useAppData();
    const { showToast } = useToast();
    const [search, setSearch] = React.useState("");
    const [selectedReservation, setSelectedReservation] = React.useState(null);
    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const [lastCheckout, setLastCheckout] = React.useState(null);
    const activeReservations = React.useMemo(() => data.reservations.filter((r) => r.status === "Checked In"), [data.reservations]);
    const filtered = React.useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term)
            return activeReservations;
        return activeReservations.filter((r) => {
            const guest = getGuest(r.guestId);
            const room = getRoom(r.roomId);
            return (r.reference.toLowerCase().includes(term) ||
                room?.number.toLowerCase().includes(term) ||
                (guest && `${guest.firstName} ${guest.lastName}`.toLowerCase().includes(term)));
        });
    }, [activeReservations, search, getGuest, getRoom]);
    function handleCheckout() {
        if (!selectedReservation)
            return;
        checkOutReservation(selectedReservation.id);
        setLastCheckout(selectedReservation);
        showToast({
            title: "Guest checked out",
            description: "RFID authorization revoked and room moved to cleaning.",
            variant: "success",
        });
        setSelectedReservation(null);
        setSearch("");
    }
    if (lastCheckout) {
        const guest = getGuest(lastCheckout.guestId);
        const room = getRoom(lastCheckout.roomId);
        return (<div className="flex flex-col items-center gap-3 rounded-lg border border-success/30 bg-success/5 px-6 py-10 text-center">
        <FiCheckCircle className="size-10 text-success"/>
        <h3 className="text-lg font-semibold text-foreground">Checkout complete</h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          {guest?.firstName} {guest?.lastName} has checked out of room {room?.number}. The RFID card
          has been revoked and returned to available inventory. The room is now in Cleaning status.
        </p>
        <Button onClick={() => setLastCheckout(null)}>Check out another guest</Button>
      </div>);
    }
    if (!selectedReservation) {
        return (<div className="flex flex-col gap-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search active guest, room or reservation..."/>
        {filtered.length === 0 ? (<EmptyState icon={<FiSearch />} title="No active stays found" description="There are no guests currently checked in matching your search."/>) : (<ul className="divide-y divide-border rounded-lg border border-border bg-card">
            {filtered.map((r) => {
                    const guest = getGuest(r.guestId);
                    const room = getRoom(r.roomId);
                    return (<li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {guest ? `${guest.firstName} ${guest.lastName}` : "Guest"} · Room {room?.number}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.reference} · Due out {formatDate(r.checkOutDate)}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => setSelectedReservation(r)}>
                    Select
                  </Button>
                </li>);
                })}
          </ul>)}
      </div>);
    }
    const guest = getGuest(selectedReservation.guestId);
    const room = getRoom(selectedReservation.roomId);
    const balance = selectedReservation.totalAmount - selectedReservation.amountPaid;
    const card = data.rfidCards.find((c) => c.reservationId === selectedReservation.id);
    return (<div className="flex flex-col gap-4">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Guest &amp; stay details</h3>
          <Button variant="ghost" size="sm" onClick={() => setSelectedReservation(null)}>
            Change guest
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
            <p className="text-xs text-muted-foreground">Room</p>
            <p className="font-medium text-foreground">{room?.number}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Stay dates</p>
            <p className="font-medium text-foreground">
              {formatDate(selectedReservation.checkInDate)} – {formatDate(selectedReservation.checkOutDate)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Assigned card</p>
            <p className="font-medium text-foreground">
              {card ? `${card.reference} · ${maskCardUid(card.uid)}` : "—"}
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

        {balance > 0 && (<div className="mt-3 flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2.5 text-sm text-[#8a5a16]">
            <FiAlertTriangle className="mt-0.5 size-4 shrink-0"/>
            <p>This reservation has an outstanding balance of {formatCurrency(balance)}. Consider recording the payment before checkout.</p>
          </div>)}
      </div>

      <div className="flex justify-end">
        <Button size="lg" onClick={() => setConfirmOpen(true)}>
          Confirm checkout
        </Button>
      </div>

      <ConfirmationDialog open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleCheckout} title="Confirm guest checkout" description="This will revoke the guest's RFID card authorization, return the card to available inventory, and set the room status to Cleaning." confirmLabel="Check out guest"/>
    </div>);
}
