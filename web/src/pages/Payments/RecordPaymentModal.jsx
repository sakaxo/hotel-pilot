import * as React from "react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/forms/FormInput";
import { FormSelect } from "@/components/forms/FormSelect";
import { FormTextarea } from "@/components/forms/FormTextarea";
import { useAppData } from "@/context/AppDataContext";
import { useToast } from "@/context/ToastContext";
import { useSyncOnChange } from "@/hooks/useSyncOnChange";
import { formatCurrency } from "@/lib/format";
const METHODS = ["Cash", "Card", "Bank Transfer", "Mobile Money", "Paystack"];
export function RecordPaymentModal({ open, onClose }) {
    const { data, getGuest, getRoom, recordPayment } = useAppData();
    const { showToast } = useToast();
    const [reservationId, setReservationId] = React.useState("");
    const [amount, setAmount] = React.useState(0);
    const [method, setMethod] = React.useState("Cash");
    const [notes, setNotes] = React.useState("");
    const [error, setError] = React.useState("");
    const payableReservations = data.reservations.filter((r) => r.status !== "Cancelled" && r.totalAmount - r.amountPaid > 0);
    useSyncOnChange(open, (isOpen) => {
        if (!isOpen) {
            setReservationId("");
            setAmount(0);
            setMethod("Cash");
            setNotes("");
            setError("");
        }
    });
    const reservation = data.reservations.find((r) => r.id === reservationId);
    const balance = reservation ? reservation.totalAmount - reservation.amountPaid : 0;
    function handleSubmit(e) {
        e.preventDefault();
        if (!reservation) {
            setError("Select a reservation.");
            return;
        }
        if (amount <= 0) {
            setError("Enter an amount greater than 0.");
            return;
        }
        recordPayment(reservation.id, amount, method, notes);
        showToast({ title: "Payment recorded", description: formatCurrency(amount), variant: "success" });
        onClose();
    }
    return (<Modal open={open} onClose={onClose} title="Record payment" description="Simulate recording a payment against a reservation." size="md" footer={<>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Record payment</Button>
        </>}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormSelect label="Reservation" placeholder="Select a reservation with an outstanding balance" value={reservationId} onChange={(e) => {
            setReservationId(e.target.value);
            const r = data.reservations.find((res) => res.id === e.target.value);
            if (r)
                setAmount(r.totalAmount - r.amountPaid);
            setError("");
        }} options={payableReservations.map((r) => {
            const guest = getGuest(r.guestId);
            const room = getRoom(r.roomId);
            return {
                label: `${r.reference} · ${guest ? `${guest.firstName} ${guest.lastName}` : "Guest"} · Room ${room?.number}`,
                value: r.id,
            };
        })}/>
        {reservation && (<p className="text-xs text-muted-foreground">Outstanding balance: {formatCurrency(balance)}</p>)}
        <div className="grid grid-cols-2 gap-3">
          <FormInput label="Amount" type="number" min={1} value={amount} onChange={(e) => setAmount(Number(e.target.value))}/>
          <FormSelect label="Payment method" value={method} onChange={(e) => setMethod(e.target.value)} options={METHODS.map((m) => ({ label: m, value: m }))}/>
        </div>
        <FormTextarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes"/>
        {error && <p className="text-xs text-danger">{error}</p>}
      </form>
    </Modal>);
}
