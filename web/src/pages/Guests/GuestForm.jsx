import * as React from "react"

import { Modal } from "@/components/common/Modal"
import { Button } from "@/components/ui/button"
import { FormInput } from "@/components/forms/FormInput"
import { FormSelect } from "@/components/forms/FormSelect"
import { FormTextarea } from "@/components/forms/FormTextarea"
import { useSyncOnChange } from "@/hooks/useSyncOnChange"

const ID_TYPES = ["Passport", "National ID", "Driver's Licence", "Voter's Card"]

export function GuestForm({
  open,
  onClose,
  guest,
  onSubmit,
  isSubmitting = false,
}) {
  const isEditing = Boolean(guest)

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

  const [errors, setErrors] = React.useState({})

  useSyncOnChange(open ? (guest?.id ?? "new") : null, (key) => {
    if (key === null) return

    if (guest) {
      setForm({
        firstName: guest.first_name ?? "",
        lastName: guest.last_name ?? "",
        email: guest.email ?? "",
        phone: guest.phone ?? "",
        nationality: guest.nationality ?? "",
        idType: guest.id_type ?? "",
        idNumber: guest.id_number ?? "",
        address: guest.address ?? "",
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

  function update(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function validate() {
    const nextErrors = {}

    if (!form.firstName.trim()) {
      nextErrors.firstName = "First name is required."
    }

    if (!form.lastName.trim()) {
      nextErrors.lastName = "Last name is required."
    }

    if (!form.email.trim()) {
      nextErrors.email = "Email is required."
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address."
    }

    if (!form.phone.trim()) {
      nextErrors.phone = "Phone number is required."
    }

    if (form.idType && !form.idNumber.trim()) {
      nextErrors.idNumber = "Enter the identification number."
    }

    setErrors(nextErrors)

    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!validate()) return

    const payload = {
      first_name: form.firstName.trim(),
      last_name: form.lastName.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      nationality: form.nationality.trim(),
      id_type: form.idType,
      id_number: form.idNumber.trim(),
      address: form.address.trim(),
    }

    try {
      await onSubmit(payload)
    } catch (error) {
      // The parent displays the API error.
    }
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

          <Button type="submit" form="guest-form" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : isEditing
                ? "Save changes"
                : "Register guest"}
          </Button>
        </>
      }
    >
      <form
        id="guest-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormInput
            label="First name"
            value={form.firstName}
            onChange={(event) => update("firstName", event.target.value)}
            error={errors.firstName}
            required
          />

          <FormInput
            label="Last name"
            value={form.lastName}
            onChange={(event) => update("lastName", event.target.value)}
            error={errors.lastName}
            required
          />

          <FormInput
            label="Email address"
            type="email"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
            error={errors.email}
            required
          />

          <FormInput
            label="Phone number"
            value={form.phone}
            onChange={(event) => update("phone", event.target.value)}
            error={errors.phone}
            required
          />

          <FormInput
            label="Nationality"
            value={form.nationality}
            onChange={(event) => update("nationality", event.target.value)}
          />

          <FormSelect
            label="Identification type"
            placeholder="Select ID type"
            value={form.idType}
            onChange={(event) => update("idType", event.target.value)}
            options={ID_TYPES.map((type) => ({
              label: type,
              value: type,
            }))}
          />

          <FormInput
            label="Identification number"
            value={form.idNumber}
            onChange={(event) => update("idNumber", event.target.value)}
            error={errors.idNumber}
          />
        </div>

        <FormTextarea
          label="Address"
          value={form.address}
          onChange={(event) => update("address", event.target.value)}
          placeholder="Residential address"
        />
      </form>
    </Modal>
  )
}
