import * as React from "react"
import { Modal } from "@/components/common/Modal"
import { Button } from "@/components/ui/button"
import { FormInput } from "@/components/forms/FormInput"
import { FormSelect } from "@/components/forms/FormSelect"
import { useAppData } from "@/context/AppDataContext"
import { useToast } from "@/context/ToastContext"
import { ALL_ROLES } from "@/context/AuthContext"
import { useSyncOnChange } from "@/hooks/useSyncOnChange"
import type { StaffDepartment, StaffMember } from "@/types"

const DEPARTMENTS: StaffDepartment[] = ["Management", "Front Desk", "Housekeeping", "Accounts", "Security"]

export function StaffForm({
  open,
  onClose,
  staff,
}: {
  open: boolean
  onClose: () => void
  staff?: StaffMember | null
}) {
  const { addStaff, updateStaff } = useAppData()
  const { showToast } = useToast()
  const isEditing = !!staff

  const [form, setForm] = React.useState({
    name: "",
    email: "",
    phone: "",
    role: "Front Desk Staff" as StaffMember["role"],
    department: "Front Desk" as StaffDepartment,
  })
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  useSyncOnChange(open ? (staff?.id ?? "new") : null, (key) => {
    if (key === null) return
    if (staff) {
      setForm({ name: staff.name, email: staff.email, phone: staff.phone, role: staff.role, department: staff.department })
    } else {
      setForm({ name: "", email: "", phone: "", role: "Front Desk Staff", department: "Front Desk" })
    }
    setErrors({})
  })

  function validate(): boolean {
    const nextErrors: Record<string, string> = {}
    if (!form.name.trim()) nextErrors.name = "Full name is required."
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

    if (isEditing && staff) {
      updateStaff(staff.id, form)
      showToast({ title: "Staff details updated", variant: "success" })
    } else {
      addStaff({ ...form, status: "Active", hireDate: new Date().toISOString().slice(0, 10) })
      showToast({ title: "Staff member added", variant: "success" })
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit staff member" : "Add staff member"}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>{isEditing ? "Save changes" : "Add staff member"}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormInput
          label="Full name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          error={errors.name}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <FormInput
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            error={errors.email}
            required
          />
          <FormInput
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            error={errors.phone}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormSelect
            label="Role"
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as StaffMember["role"] }))}
            options={ALL_ROLES.map((r) => ({ label: r, value: r }))}
          />
          <FormSelect
            label="Department"
            value={form.department}
            onChange={(e) => setForm((f) => ({ ...f, department: e.target.value as StaffDepartment }))}
            options={DEPARTMENTS.map((d) => ({ label: d, value: d }))}
          />
        </div>
      </form>
    </Modal>
  )
}
