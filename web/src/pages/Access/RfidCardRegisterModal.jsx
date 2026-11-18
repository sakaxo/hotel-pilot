import * as React from "react"
import { FiCreditCard } from "react-icons/fi"
import { Modal } from "@/components/common/Modal"
import { Button } from "@/components/ui/button"
import { useSyncOnChange } from "@/hooks/useSyncOnChange"

export function RfidCardRegisterModal({
  open,
  onClose,
  onSubmit,
  isSubmitting = false,
  card = null,
}) {
  const [identifier, setIdentifier] = React.useState("")
  const [error, setError] = React.useState("")

  const isEditing = Boolean(card)

  useSyncOnChange(open, (isOpen) => {
    if (isOpen) {
      setIdentifier(card?.card_identifier || "")
      setError("")
    }
  })

  async function handleSubmit(event) {
    event.preventDefault()

    if (!identifier.trim()) {
      setError("Enter the card identifier.")
      return
    }

    setError("")

    try {
      await onSubmit({
        card_identifier: identifier.trim(),
      })
    } catch (err) {
      setError(err.message || "Unable to save this card.")
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit RFID card" : "Register RFID card"}
      description={
        isEditing
          ? "Update the physical card identifier."
          : "Add a new reusable card to the hotel's inventory."
      }
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>

          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : isEditing
                ? "Save changes"
                : "Register card"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="text-sm font-medium text-foreground">
            Card identifier
          </label>

          <div className="relative mt-1.5">
            <FiCreditCard className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />

            <input
              value={identifier}
              onChange={(event) => {
                setIdentifier(event.target.value)
                setError("")
              }}
              placeholder="Enter RFID card identifier"
              disabled={isSubmitting}
              className="h-9 w-full rounded-md border border-border bg-background pr-3 pl-9 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
            />
          </div>
        </div>

        {error && <p className="text-xs text-danger">{error}</p>}
      </form>
    </Modal>
  )
}
