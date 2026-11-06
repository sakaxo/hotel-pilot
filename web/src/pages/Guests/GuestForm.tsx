import * as React from "react"
import { Modal } from "@/components/common/Modal"
import { Button } from "@/components/ui/button"
import { FormInput } from "@/components/forms/FormInput"
import { FormSelect } from "@/components/forms/FormSelect"
import { FormTextarea } from "@/components/forms/FormTextarea"
import { useAppData } from "@/context/AppDataContext"
import { useToast } from "@/context/ToastContext"
import { useSyncOnChange } from "@/hooks/useSyncOnChange"
import type { Guest } from "@/types"

const ID_TYPES = ["Passport", "National ID", "Driver's Licence", "Voter's Card"]

export function GuestForm({
  open,
  onClose,
  guest,
}: {
  open: boolean
  onClose: () => void
  guest?: Guest | null
}) {
  const { addGuest, updateGuest } = useAppData()
  const { showToast } = useToast()
  const isEditing = !!guest

  const [form, setForm] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    nationality: "",
    idType: "",
    idNumber: "",
    address: "",
  })
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  useSyncOnChange(open ? (guest?.id ?? "new") : null, (key) => {
    if (key === null) return
    if (guest) {
      setForm({
        firstName: guest.firstName,
        lastName: guest.lastName,
        email: guest.email,
        phone: guest.phone,
        nationality: guest.nationality,
        idType: guest.idType,
        idNumber: guest.idNumber,
        address: guest.address,
      })
    } else {
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        nationality: "",
        idType: "",
        idNumber: "",
        address: "",
      })
    }
    setErrors({})
  })

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function validate(): boolean {
    const nextErrors: Record<string, string> = {}
    if (!form.firstName.trim()) nextErrors.firstName = "First name is required."
    if (!form.lastName.trim()) nextErrors.lastName = "Last name is required."
    if (!form.email.trim()) {
      nextErrors.email = "Email is required."
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address."
    }
    if (!form.phone.trim()) nextErrors.phone = "Phone number is required."
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    if (isEditing && guest) {
      updateGuest(guest.id, form)
      showToast({ title: "Guest profile updated", variant: "success" })
    } else {
      addGuest(form)
      showToast({ title: "Guest registered", variant: "success" })
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit guest" : "Register guest"}
      description="Guest contact and identification details."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>{isEditing ? "Save changes" : "Register guest"}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormInput
            label="First name"
            value={form.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            error={errors.firstName}
            required
          />
          <FormInput
            label="Last name"
            value={form.lastName}
            onChange={(e) => update("lastName", e.target.value)}
            error={errors.lastName}
            required
          />
          <FormInput
            label="Email address"
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            error={errors.email}
            required
          />
          <FormInput
            label="Phone number"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            error={errors.phone}
            required
          />
          <FormInput
            label="Nationality"
            value={form.nationality}
            onChange={(e) => update("nationality", e.target.value)}
          />
          <FormSelect
            label="Identification type"
            placeholder="Select ID type"
            value={form.idType}
            onChange={(e) => update("idType", e.target.value)}
            options={ID_TYPES.map((t) => ({ label: t, value: t }))}
          />
          <FormInput
            label="Identification number"
            value={form.idNumber}
            onChange={(e) => update("idNumber", e.target.value)}
          />
        </div>
        <FormTextarea
          label="Address"
          value={form.address}
          onChange={(e) => update("address", e.target.value)}
          placeholder="Residential address"
        />
      </form>
    </Modal>
  )
}
