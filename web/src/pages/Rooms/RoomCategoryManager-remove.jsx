import * as React from "react"
import { FiPlus, FiEdit2, FiPower } from "react-icons/fi"

import { Modal } from "@/components/common/Modal"
import { Button } from "@/components/ui/button"
import { FormInput } from "@/components/forms/FormInput"
import { FormTextarea } from "@/components/forms/FormTextarea"
import { StatusBadge } from "@/components/common/StatusBadge"
import { formatCurrency } from "@/lib/format"

export function RoomCategoryManager({
  open,
  onClose,
  categories = [],
  onCreate,
  onUpdate,
  onDelete,
}) {
  const [editingId, setEditingId] = React.useState(null)
  const [showNewForm, setShowNewForm] = React.useState(false)
  const [form, setForm] = React.useState({
    name: "",
    description: "",
    base_rate: "",
    capacity: 1,
  })
  const [errors, setErrors] = React.useState({})
  const [submitting, setSubmitting] = React.useState(false)

  function resetForm() {
    setEditingId(null)
    setShowNewForm(false)
    setForm({
      name: "",
      description: "",
      base_rate: "",
      capacity: 1,
    })
    setErrors({})
  }

  function startNew() {
    setEditingId(null)
    setShowNewForm(true)
    setForm({
      name: "",
      description: "",
      base_rate: "",
      capacity: 1,
    })
    setErrors({})
  }

  function startEdit(category) {
    setEditingId(category.id)
    setShowNewForm(true)
    setForm({
      name: category.name,
      description: category.description || "",
      base_rate: category.base_rate,
      capacity: category.capacity,
    })
    setErrors({})
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSave(event) {
    event.preventDefault()

    const nextErrors = {}

    if (!form.name.trim()) {
      nextErrors.name = "Category name is required."
    }

    if (!form.base_rate || Number(form.base_rate) <= 0) {
      nextErrors.base_rate = "Enter a valid base rate."
    }

    if (!Number.isInteger(Number(form.capacity)) || Number(form.capacity) < 1) {
      nextErrors.capacity = "Capacity must be at least 1."
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length) return

    setSubmitting(true)

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        base_rate: Number(form.base_rate).toFixed(2),
        capacity: Number(form.capacity),
      }

      if (editingId) {
        await onUpdate(editingId, payload)
      } else {
        await onCreate(payload)
      }

      resetForm()
    } catch (error) {
      setErrors((current) => ({
        ...current,
        general: error.message,
      }))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleActive(category) {
    try {
      await onUpdate(category.id, {
        is_active: !category.is_active,
      })
    } catch (error) {
      setErrors((current) => ({
        ...current,
        general: error.message,
      }))
    }
  }

  async function handleDelete(category) {
    if (category.room_count > 0) {
      await handleToggleActive(category)
      return
    }

    const confirmed = window.confirm(`Delete the ${category.name} category?`)

    if (!confirmed) return

    try {
      await onDelete(category)
    } catch (error) {
      setErrors((current) => ({
        ...current,
        general: error.message,
      }))
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Manage room categories"
      description="Define pricing tiers and capacity for room types."
      size="lg"
    >
      <div className="flex flex-col gap-4">
        {!showNewForm ? (
          <>
            <div className="flex justify-end">
              <Button onClick={startNew}>
                <FiPlus data-icon="inline-start" />
                Add category
              </Button>
            </div>

            {categories.length === 0 ? (
              <div className="rounded-md border border-border p-6 text-center text-sm text-muted-foreground">
                No room categories have been created yet.
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">
                          {category.name}
                        </p>

                        <StatusBadge
                          status={category.is_active ? "Active" : "Inactive"}
                        />
                      </div>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatCurrency(Number(category.base_rate), "GHS")} /
                        night · {category.capacity} guest(s) ·{" "}
                        {category.room_count} room(s)
                      </p>

                      {category.description && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {category.description}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => startEdit(category)}
                        aria-label="Edit category"
                      >
                        <FiEdit2 />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(category)}
                        aria-label={
                          category.is_active
                            ? "Deactivate category"
                            : "Delete category"
                        }
                      >
                        <FiPower />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <FormInput
              label="Category name"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              error={errors.name}
              required
            />

            <FormTextarea
              label="Description"
              value={form.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
            />

            <div className="grid grid-cols-2 gap-3">
              <FormInput
                label="Base rate / night"
                type="number"
                min="0.01"
                step="0.01"
                value={form.base_rate}
                onChange={(event) =>
                  updateField("base_rate", event.target.value)
                }
                error={errors.base_rate}
                required
              />

              <FormInput
                label="Guest capacity"
                type="number"
                min={1}
                value={form.capacity}
                onChange={(event) =>
                  updateField("capacity", event.target.value)
                }
                error={errors.capacity}
                required
              />
            </div>

            {errors.general && (
              <p className="text-sm text-destructive">{errors.general}</p>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={submitting}
              >
                Back
              </Button>

              <Button type="submit" disabled={submitting}>
                {submitting
                  ? "Saving..."
                  : editingId
                    ? "Save changes"
                    : "Create category"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  )
}
