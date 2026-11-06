import * as React from "react"
import { FiCreditCard } from "react-icons/fi"
import { Modal } from "@/components/common/Modal"
import { Button } from "@/components/ui/button"
import { useAppData } from "@/context/AppDataContext"
import { useToast } from "@/context/ToastContext"
import { useSyncOnChange } from "@/hooks/useSyncOnChange"

function generateUid(): string {
  const segment = () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .toUpperCase()
      .padStart(2, "0")
  return `04:${segment()}:${segment()}:${segment()}:${segment()}`
}

export function RfidCardRegisterModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { registerCard } = useAppData()
  const { showToast } = useToast()
  const [uid, setUid] = React.useState("")
  const [error, setError] = React.useState("")

  useSyncOnChange(open, (isOpen) => {
    if (isOpen) {
      setUid("")
      setError("")
    }
  })

  function handleScan() {
    setUid(generateUid())
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!uid.trim()) {
      setError("Enter or scan a card identifier.")
      return
    }
    registerCard(uid.trim())
    showToast({ title: "Card registered", description: "Added to the available inventory.", variant: "success" })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Register RFID card"
      description="Add a new reusable card to the hotel's inventory."
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Register card</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="text-sm font-medium text-foreground">Card identifier (UID)</label>
            <input
              value={uid}
              onChange={(e) => {
                setUid(e.target.value)
                setError("")
              }}
              placeholder="e.g. 04:1A:A3:5B:20"
              className="mt-1.5 h-9 w-full rounded-md border border-border bg-background px-3 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
            />
          </div>
          <Button type="button" variant="outline" onClick={handleScan}>
            <FiCreditCard data-icon="inline-start" /> Simulate scan
          </Button>
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </form>
    </Modal>
  )
}
