import { Modal } from "@/components/common/Modal"
import { StatusBadge } from "@/components/common/StatusBadge"
import { Button } from "@/components/ui/button"
import { formatDate, formatDateTime, maskCardUid } from "@/lib/format"

const STATUS_LABELS = {
  available: "Available",
  disabled: "Disabled",
  lost: "Lost",
}

export function RfidCardDetails({ open, onClose, card, onEdit }) {
  if (!card) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={card.reference}
      description={maskCardUid(card.card_identifier)}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>

          <Button onClick={() => onEdit(card)}>Edit card</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 text-sm">
        <div className="flex items-center justify-between">
          <p className="font-medium text-foreground">Current status</p>

          <StatusBadge status={STATUS_LABELS[card.status] || card.status} />
        </div>

        <div className="divide-y divide-border rounded-md border border-border">
          <div className="flex items-center justify-between gap-3 p-3">
            <span className="text-xs text-muted-foreground">
              Card reference
            </span>
            <span className="font-medium">{card.reference}</span>
          </div>

          <div className="flex items-center justify-between gap-3 p-3">
            <span className="text-xs text-muted-foreground">
              Card identifier
            </span>
            <span className="font-medium break-all">
              {card.card_identifier || "—"}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 p-3">
            <span className="text-xs text-muted-foreground">
              Date registered
            </span>
            <span className="font-medium">
              {card.created_at ? formatDate(card.created_at) : "—"}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 p-3">
            <span className="text-xs text-muted-foreground">Last updated</span>
            <span className="font-medium">
              {card.updated_at ? formatDateTime(card.updated_at) : "—"}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  )
}
