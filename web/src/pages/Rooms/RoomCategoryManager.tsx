import * as React from "react"
import { FiPlus } from "react-icons/fi"
import { Modal } from "@/components/common/Modal"
import { Button } from "@/components/ui/button"
import { FormInput } from "@/components/forms/FormInput"
import { FormTextarea } from "@/components/forms/FormTextarea"
import { useAppData } from "@/context/AppDataContext"
import { useToast } from "@/context/ToastContext"
import { formatCurrency } from "@/lib/format"

export function RoomCategoryManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, addRoomCategory, updateRoomCategory } = useAppData()
  const { showToast } = useToast()
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState({ name: "", description: "", baseRate: 0, capacity: 1 })
  const [showNewForm, setShowNewForm] = React.useState(false)

  function startEdit(id: string) {
    const category = data.roomCategories.find((c) => c.id === id)
    if (!category) return
    setEditingId(id)
    setShowNewForm(false)
    setForm({
      name: category.name,
      description: category.description,
      baseRate: category.baseRate,
      capacity: category.capacity,
    })
  }

  function startNew() {
    setEditingId(null)
    setShowNewForm(true)
    setForm({ name: "", description: "", baseRate: 50, capacity: 1 })
  }

  function handleSave() {
    if (!form.name.trim()) {
      showToast({ title: "Category name is required", variant: "error" })
      return
    }
    if (editingId) {
      updateRoomCategory(editingId, form)
      showToast({ title: "Room category updated", variant: "success" })
    } else {
      addRoomCategory(form)
      showToast({ title: "Room category added", variant: "success" })
    }
    setEditingId(null)
    setShowNewForm(false)
  }

  const isFormOpen = editingId !== null || showNewForm

  return (
    <Modal open={open} onClose={onClose} title="Manage room categories" description="Define pricing tiers and capacity for room types." size="lg">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{data.roomCategories.length} categories</p>
          <Button size="sm" variant="outline" onClick={startNew}>
            <FiPlus data-icon="inline-start" /> New category
          </Button>
        </div>

        {isFormOpen && (
          <div className="rounded-md border border-border p-3">
            <div className="grid grid-cols-2 gap-3">
              <FormInput
                label="Category name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
              <FormInput
                label="Base rate / night"
                type="number"
                min={1}
                value={form.baseRate}
                onChange={(e) => setForm((f) => ({ ...f, baseRate: Number(e.target.value) }))}
              />
              <FormInput
                label="Capacity"
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => setForm((f) => ({ ...f, capacity: Number(e.target.value) }))}
              />
            </div>
            <FormTextarea
              label="Description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              containerClassName="mt-3"
            />
            <div className="mt-3 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingId(null)
                  setShowNewForm(false)
                }}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                {editingId ? "Save changes" : "Add category"}
              </Button>
            </div>
          </div>
        )}

        <ul className="divide-y divide-border rounded-md border border-border">
          {data.roomCategories.map((category) => (
            <li key={category.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
              <div>
                <p className="font-medium text-foreground">{category.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(category.baseRate)}/night · Capacity {category.capacity}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => startEdit(category.id)}>
                Edit
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  )
}
