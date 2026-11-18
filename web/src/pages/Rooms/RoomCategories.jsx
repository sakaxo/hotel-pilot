import * as React from "react"
import { useNavigate } from "react-router-dom"
import { FiArrowLeft, FiEdit2, FiPlus, FiPower, FiTrash2 } from "react-icons/fi"

import { PageHeader } from "@/components/common/PageHeader"
import { SearchInput } from "@/components/common/SearchInput"
import { FilterDropdown } from "@/components/common/FilterDropdown"
import { StatCard } from "@/components/common/StatCard"
import { StatusBadge } from "@/components/common/StatusBadge"
import { EmptyState } from "@/components/common/EmptyState"
import { Pagination } from "@/components/common/Pagination"
import { Modal } from "@/components/common/Modal"
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog"

import { FormInput } from "@/components/forms/FormInput"
import { FormTextarea } from "@/components/forms/FormTextarea"
import { Button } from "@/components/ui/button"

import { formatCurrency } from "@/lib/format"
import { useToast } from "@/context/ToastContext"

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "")

const API_URL = `${API_BASE_URL}/api/rooms/categories/`
const PAGE_SIZE = 8

const EMPTY_FORM = {
  name: "",
  description: "",
  base_rate: "",
  capacity: 1,
}

async function readResponse(response) {
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message =
      data.detail ||
      Object.values(data).flat().filter(Boolean).join(" ") ||
      "Something went wrong. Please try again."

    throw new Error(message)
  }

  return data
}

export function RoomCategories() {
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [categories, setCategories] = React.useState([])
  const [search, setSearch] = React.useState("")
  const [activeFilter, setActiveFilter] = React.useState("all")

  const [page, setPage] = React.useState(1)
  const [totalItems, setTotalItems] = React.useState(0)

  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)

  const [modalOpen, setModalOpen] = React.useState(false)
  const [editingCategory, setEditingCategory] = React.useState(null)

  const [form, setForm] = React.useState(EMPTY_FORM)
  const [errors, setErrors] = React.useState({})

  const [categoryToDelete, setCategoryToDelete] = React.useState(null)

  const pageCount = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))

  const fetchCategories = React.useCallback(async () => {
    setLoading(true)

    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(PAGE_SIZE),
      })

      if (search.trim()) {
        params.set("search", search.trim())
      }

      if (activeFilter !== "all") {
        params.set("active", activeFilter)
      }

      const response = await fetch(`${API_URL}?${params}`)
      const data = await readResponse(response)

      setCategories(data.results ?? [])
      setTotalItems(data.count ?? 0)
    } catch (error) {
      showToast({
        title: "Unable to load categories",
        description: error.message,
        variant: "error",
      })
    } finally {
      setLoading(false)
    }
  }, [page, search, activeFilter, showToast])

  React.useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function openCreateModal() {
    setEditingCategory(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setModalOpen(true)
  }

  function openEditModal(category) {
    setEditingCategory(category)

    setForm({
      name: category.name,
      description: category.description || "",
      base_rate: category.base_rate,
      capacity: category.capacity,
    })

    setErrors({})
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingCategory(null)
    setForm(EMPTY_FORM)
    setErrors({})
  }

  async function handleSubmit(event) {
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

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setSubmitting(true)

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        base_rate: Number(form.base_rate).toFixed(2),
        capacity: Number(form.capacity),
      }

      const response = await fetch(
        editingCategory ? `${API_URL}${editingCategory.id}/` : API_URL,
        {
          method: editingCategory ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      )

      await readResponse(response)

      showToast({
        title: editingCategory ? "Category updated" : "Category created",
        variant: "success",
      })

      closeModal()
      await fetchCategories()
    } catch (error) {
      setErrors({
        general: error.message,
      })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleActive(category) {
    try {
      const response = await fetch(`${API_URL}${category.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_active: !category.is_active,
        }),
      })

      await readResponse(response)

      showToast({
        title: category.is_active
          ? "Category deactivated"
          : "Category activated",
        variant: "success",
      })

      await fetchCategories()
    } catch (error) {
      showToast({
        title: "Unable to update category",
        description: error.message,
        variant: "error",
      })
    }
  }

  function requestDelete(category) {
    if (category.room_count > 0) {
      showToast({
        title: "Category is in use",
        description: "Deactivate this category instead of deleting it.",
        variant: "error",
      })

      return
    }

    setCategoryToDelete(category)
  }

  async function handleDelete() {
    if (!categoryToDelete) return

    try {
      const response = await fetch(`${API_URL}${categoryToDelete.id}/`, {
        method: "DELETE",
      })

      if (!response.ok && response.status !== 204) {
        await readResponse(response)
      }

      showToast({
        title: "Category deleted",
        variant: "success",
      })

      setCategoryToDelete(null)
      await fetchCategories()
    } catch (error) {
      showToast({
        title: "Unable to delete category",
        description: error.message,
        variant: "error",
      })
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Room Categories"
        description="Manage room types, nightly rates and guest capacity."
        actions={
          <>
            <Button variant="outline" onClick={() => navigate("/rooms")}>
              <FiArrowLeft data-icon="inline-start" />
              Back to rooms
            </Button>

            <Button onClick={openCreateModal}>
              <FiPlus data-icon="inline-start" />
              Add category
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="Categories shown"
          value={categories.length}
          icon={<FiPlus />}
          accent="primary"
        />

        <StatCard
          label="Rooms in these categories"
          value={categories.reduce(
            (total, category) => total + (category.room_count || 0),
            0
          )}
          icon={<FiPower />}
          accent="info"
        />

        <StatCard
          label="Active on this page"
          value={categories.filter((category) => category.is_active).length}
          icon={<FiPower />}
          accent="success"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value)
            setPage(1)
          }}
          placeholder="Search categories..."
          className="w-full sm:max-w-sm"
        />

        <FilterDropdown
          label="Status"
          value={activeFilter}
          onChange={(value) => {
            setActiveFilter(value)
            setPage(1)
          }}
          options={[
            { label: "Active", value: "true" },
            { label: "Inactive", value: "false" },
          ]}
        />
      </div>

      {loading ? (
        <div className="rounded-lg border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Loading room categories...
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          title="No categories found"
          description="Create a room category or adjust your search and filters."
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="hidden grid-cols-[1.5fr_1fr_0.8fr_0.8fr_auto] gap-4 border-b border-border bg-muted/30 px-4 py-3 text-xs font-medium text-muted-foreground md:grid">
              <span>Category</span>
              <span>Base rate / night</span>
              <span>Capacity</span>
              <span>Rooms</span>
              <span className="text-right">Actions</span>
            </div>

            {categories.map((category) => (
              <div
                key={category.id}
                className="grid grid-cols-1 gap-3 border-b border-border px-4 py-4 last:border-b-0 md:grid-cols-[1.5fr_1fr_0.8fr_0.8fr_auto] md:items-center md:gap-4"
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

                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {category.description || "No description provided"}
                  </p>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground md:hidden">
                    Base rate / night:{" "}
                  </span>

                  <span className="text-sm font-medium text-foreground">
                    {formatCurrency(Number(category.base_rate), "GHS")}
                  </span>
                </div>

                <p className="text-sm text-foreground">
                  <span className="text-xs text-muted-foreground md:hidden">
                    Capacity:{" "}
                  </span>
                  {category.capacity} guest(s)
                </p>

                <p className="text-sm text-foreground">
                  <span className="text-xs text-muted-foreground md:hidden">
                    Rooms:{" "}
                  </span>
                  {category.room_count ?? 0}
                </p>

                <div className="flex items-center gap-1 md:justify-end">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openEditModal(category)}
                    aria-label="Edit category"
                  >
                    <FiEdit2 />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleToggleActive(category)}
                    aria-label={
                      category.is_active
                        ? "Deactivate category"
                        : "Activate category"
                    }
                  >
                    <FiPower />
                  </Button>

                  {!category.room_count && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => requestDelete(category)}
                      aria-label="Delete category"
                    >
                      <FiTrash2 />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Pagination
            page={page}
            pageCount={pageCount}
            totalItems={totalItems}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingCategory ? "Edit category" : "Add room category"}
        description="Define the category's pricing and guest capacity."
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>

            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting
                ? "Saving..."
                : editingCategory
                  ? "Save changes"
                  : "Create category"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            onChange={(event) => updateField("description", event.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormInput
              label="Base rate / night"
              type="number"
              min="0.01"
              step="0.01"
              value={form.base_rate}
              onChange={(event) => updateField("base_rate", event.target.value)}
              error={errors.base_rate}
              required
            />

            <FormInput
              label="Guest capacity"
              type="number"
              min={1}
              value={form.capacity}
              onChange={(event) => updateField("capacity", event.target.value)}
              error={errors.capacity}
              required
            />
          </div>

          {errors.general && (
            <p className="text-sm text-destructive">{errors.general}</p>
          )}
        </form>
      </Modal>

      <ConfirmationDialog
        open={Boolean(categoryToDelete)}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleDelete}
        title="Delete room category?"
        description={
          categoryToDelete
            ? `Are you sure you want to delete "${categoryToDelete.name}"? This action cannot be undone.`
            : "Are you sure you want to proceed with this action?"
        }
        confirmLabel="Delete category"
        cancelLabel="Cancel"
        variant="destructive"
      />
    </div>
  )
}
