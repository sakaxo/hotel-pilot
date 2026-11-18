import * as React from "react"

import { Modal } from "@/components/common/Modal"
import { Button } from "@/components/ui/button"
import { FormInput } from "@/components/forms/FormInput"
import { FormSelect } from "@/components/forms/FormSelect"
import { useSyncOnChange } from "@/hooks/useSyncOnChange"

export function RoomForm({
  open,
  onClose,
  room,
  categories = [],
  onSubmit,
  isSubmitting = false,
}) {
  const isEditing = Boolean(room)

  const [number, setNumber] = React.useState("")
  const [categoryId, setCategoryId] = React.useState("")
  const [floor, setFloor] = React.useState(1)
  const [rate, setRate] = React.useState("")
  const [errors, setErrors] = React.useState({})

  useSyncOnChange(open ? (room?.id ?? "new") : null, (key) => {
    if (key === null) return

    if (room) {
      setNumber(room.number ?? "")
      setCategoryId(String(room.category ?? ""))
      setFloor(room.floor ?? 1)
      setRate(room.rate ?? "")
    } else {
      const firstCategory = categories[0]

      setNumber("")
      setCategoryId(firstCategory ? String(firstCategory.id) : "")
      setFloor(1)
      setRate(firstCategory?.base_rate ?? "")
    }

    setErrors({})
  })

  function handleCategoryChange(event) {
    const selectedId = event.target.value
    setCategoryId(selectedId)

    const selectedCategory = categories.find(
      (category) => String(category.id) === String(selectedId)
    )

    if (selectedCategory) {
      setRate(selectedCategory.base_rate)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const nextErrors = {}

    if (!number.trim()) {
      nextErrors.number = "Room number is required."
    }

    if (!categoryId) {
      nextErrors.category = "Select a room category."
    }

    if (!Number.isInteger(Number(floor)) || Number(floor) < 1) {
      nextErrors.floor = "Floor must be at least 1."
    }

    if (!rate || Number(rate) <= 0) {
      nextErrors.rate = "Rate must be greater than 0."
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) return

    try {
      await onSubmit({
        number: number.trim().toUpperCase(),
        category: Number(categoryId),
        floor: Number(floor),
        rate: Number(rate).toFixed(2),
      })
    } catch (error) {
      // The parent displays the API error.
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit room" : "Add room"}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="room-form" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : isEditing
                ? "Save changes"
                : "Add room"}
          </Button>
        </>
      }
    >
      <form
        id="room-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <FormInput
            label="Room number"
            value={number}
            onChange={(event) => setNumber(event.target.value)}
            error={errors.number}
            required
          />

          <FormInput
            label="Floor"
            type="number"
            min={1}
            value={floor}
            onChange={(event) => setFloor(event.target.value)}
            error={errors.floor}
            required
          />
        </div>

        <FormSelect
          label="Room category"
          placeholder="Select a category"
          value={categoryId}
          onChange={handleCategoryChange}
          error={errors.category}
          options={categories.map((category) => ({
            label: category.name,
            value: String(category.id),
          }))}
          required
        />

        <FormInput
          label="Room rate / night"
          type="number"
          min="0.01"
          step="0.01"
          value={rate}
          onChange={(event) => setRate(event.target.value)}
          error={errors.rate}
          required
        />
      </form>
    </Modal>
  )
}
