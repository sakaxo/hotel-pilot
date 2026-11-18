import * as React from "react";
import { FiCreditCard } from "react-icons/fi";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/context/AppDataContext";
import { useToast } from "@/context/ToastContext";
import { useSyncOnChange } from "@/hooks/useSyncOnChange";
function generateUid() {
    const segment = () => Math.floor(Math.random() * 256)
        .toString(16)
        .toUpperCase()
        .padStart(2, "0");
    return `04:${segment()}:${segment()}:${segment()}:${segment()}`;
}
export function RfidCardReplaceModal({ open, onClose, card, }) {
    const { replaceCard } = useAppData();
    const { showToast } = useToast();
    const [uid, setUid] = React.useState("");
    useSyncOnChange(open, (isOpen) => {
        if (isOpen)
            setUid(generateUid());
    });
    if (!card)
        return null;
    function handleSubmit(e) {
        e.preventDefault();
        if (!card)
            return;
        replaceCard(card.id, uid.trim() || generateUid());
        showToast({ title: "Card replaced", description: "A new card has been issued.", variant: "success" });
        onClose();
    }
    return (<Modal open={open} onClose={onClose} title="Replace RFID card" description={`Issue a replacement for ${card.reference}`} size="sm" footer={<>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Issue replacement</Button>
        </>}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          {card.assignedGuestId
            ? "The new card will inherit this guest's current room assignment."
            : "The new card will be added to available inventory."}
        </p>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="text-sm font-medium text-foreground">New card identifier (UID)</label>
            <input value={uid} onChange={(e) => setUid(e.target.value)} className="mt-1.5 h-9 w-full rounded-md border border-border bg-background px-3 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"/>
          </div>
          <Button type="button" variant="outline" onClick={() => setUid(generateUid())}>
            <FiCreditCard data-icon="inline-start"/> Generate
          </Button>
        </div>
      </form>
    </Modal>);
}
