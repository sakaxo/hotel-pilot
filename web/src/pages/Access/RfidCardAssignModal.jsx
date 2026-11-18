import * as React from "react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/forms/FormSelect";
import { useAppData } from "@/context/AppDataContext";
import { useToast } from "@/context/ToastContext";
import { useSyncOnChange } from "@/hooks/useSyncOnChange";
export function RfidCardAssignModal({ open, onClose, card, }) {
    const { data, getGuest, getRoom, assignCard } = useAppData();
    const { showToast } = useToast();
    const [reservationId, setReservationId] = React.useState("");
    useSyncOnChange(open, (isOpen) => {
        if (isOpen)
            setReservationId("");
    });
    if (!card)
        return null;
    const assignedReservationIds = new Set(data.rfidCards.filter((c) => c.reservationId).map((c) => c.reservationId));
    const eligibleReservations = data.reservations.filter((r) => r.status === "Checked In" && !assignedReservationIds.has(r.id));
    function handleSubmit(e) {
        e.preventDefault();
        const reservation = data.reservations.find((r) => r.id === reservationId);
        if (!reservation || !card)
            return;
        assignCard(card.id, reservation.guestId, reservation.roomId, reservation.id, reservation.checkOutDate);
        showToast({ title: `Card ${card.reference} assigned`, variant: "success" });
        onClose();
    }
    return (<Modal open={open} onClose={onClose} title={card.status === "Assigned" ? "Reassign RFID card" : "Assign RFID card"} description={`Card ${card.reference} · ${card.uid}`} size="sm" footer={<>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!reservationId}>
            {card.status === "Assigned" ? "Reassign" : "Assign"}
          </Button>
        </>}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {eligibleReservations.length === 0 ? (<p className="text-sm text-muted-foreground">
            No checked-in guests are currently without an assigned card.
          </p>) : (<FormSelect label="Checked-in guest / room" placeholder="Select a guest" value={reservationId} onChange={(e) => setReservationId(e.target.value)} options={eligibleReservations.map((r) => {
                const guest = getGuest(r.guestId);
                const room = getRoom(r.roomId);
                return {
                    label: `${guest ? `${guest.firstName} ${guest.lastName}` : "Guest"} · Room ${room?.number}`,
                    value: r.id,
                };
            })}/>)}
      </form>
    </Modal>);
}
