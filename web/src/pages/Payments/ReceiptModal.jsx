import { FiPrinter } from "react-icons/fi";
import { Modal } from "@/components/common/Modal";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/context/AppDataContext";
import { formatCurrency, formatDateTime } from "@/lib/format";
export function ReceiptModal({ open, onClose, payment, }) {
    const { getGuest, getReservation, data } = useAppData();
    if (!payment)
        return null;
    const guest = getGuest(payment.guestId);
    const reservation = getReservation(payment.reservationId);
    return (<Modal open={open} onClose={onClose} title="Payment receipt" description={payment.reference} size="sm" footer={<>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => window.print()}>
            <FiPrinter data-icon="inline-start"/> Print
          </Button>
        </>}>
      <div className="flex flex-col gap-4 text-sm">
        <div className="rounded-md border border-dashed border-border p-4 text-center">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {data.settings.hotelName}
          </p>
          <p className="mt-1 text-lg font-semibold text-foreground">{formatCurrency(payment.amount)}</p>
          <StatusBadge status={payment.status} className="mt-1"/>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Receipt reference</p>
            <p className="font-medium text-foreground">{payment.reference}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Date</p>
            <p className="font-medium text-foreground">{formatDateTime(payment.date)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Guest</p>
            <p className="font-medium text-foreground">
              {guest ? `${guest.firstName} ${guest.lastName}` : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Reservation</p>
            <p className="font-medium text-foreground">{reservation?.reference ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Method</p>
            <p className="font-medium text-foreground">{payment.method}</p>
          </div>
        </div>
        {payment.notes && (<div>
            <p className="text-xs text-muted-foreground">Notes</p>
            <p className="font-medium text-foreground">{payment.notes}</p>
          </div>)}
      </div>
    </Modal>);
}
