import * as React from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  FiArrowLeft,
  FiEdit2,
  FiUser,
  FiCalendar,
  FiCreditCard,
  FiClock,
} from "react-icons/fi"

import { StatusBadge } from "@/components/common/StatusBadge"
import { EmptyState } from "@/components/common/EmptyState"
import { Button } from "@/components/ui/button"
import { GuestForm } from "@/pages/Guests/GuestForm"
import { formatDate } from "@/lib/format"
import { useToast } from "@/context/ToastContext"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const GUESTS_API = `${API_BASE_URL}/api/guests/`

const TABS = [
  { id: "overview", label: "Overview", icon: FiUser },
  { id: "reservations", label: "Reservations", icon: FiCalendar },
  { id: "payments", label: "Payments", icon: FiCreditCard },
]

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

function DetailItem({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium break-words text-foreground">
        {value || "—"}
      </p>
    </div>
  )
}

export function GuestProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [guest, setGuest] = React.useState(null)
  const [activeTab, setActiveTab] = React.useState("overview")
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")

  const [editOpen, setEditOpen] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  const fetchGuest = React.useCallback(async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch(`${GUESTS_API}${id}/`)
      const data = await readResponse(response)

      setGuest(data)
    } catch (err) {
      setError(err.message)

      showToast({
        title: "Unable to load guest profile",
        description: err.message,
        variant: "error",
      })
    } finally {
      setLoading(false)
    }
  }, [id, showToast])

  React.useEffect(() => {
    setActiveTab("overview")
    fetchGuest()
  }, [fetchGuest])

  async function handleSaveGuest(payload) {
    setSubmitting(true)

    try {
      const response = await fetch(`${GUESTS_API}${id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const updatedGuest = await readResponse(response)

      setGuest(updatedGuest)
      setEditOpen(false)

      showToast({
        title: "Guest profile updated",
        variant: "success",
      })
    } catch (err) {
      showToast({
        title: "Unable to update guest",
        description: err.message,
        variant: "error",
      })

      throw err
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Loading guest profile...
      </div>
    )
  }

  if (error || !guest) {
    return (
      <div className="rounded-lg border border-border bg-card p-10 text-center">
        <p className="text-sm font-medium text-foreground">
          Unable to load guest profile
        </p>

        <p className="mt-1 text-sm text-muted-foreground">
          {error || "The requested guest could not be found."}
        </p>

        <div className="mt-4 flex justify-center gap-2">
          <Button variant="outline" onClick={() => navigate("/guests")}>
            <FiArrowLeft data-icon="inline-start" />
            Back to guests
          </Button>

          <Button onClick={fetchGuest}>Try again</Button>
        </div>
      </div>
    )
  }

  const fullName = `${guest.first_name} ${guest.last_name}`.trim()

  const initials = `${guest.first_name?.[0] ?? ""}${
    guest.last_name?.[0] ?? ""
  }`.toUpperCase()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/guests")}
          className="mb-4 -ml-2"
        >
          <FiArrowLeft data-icon="inline-start" />
          Back to guests
        </Button>

        <div className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
              {initials || <FiUser />}
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold text-foreground">
                {fullName}
              </h1>

              <p className="mt-1 truncate text-sm text-muted-foreground">
                {guest.email}
              </p>

              <div className="mt-2">
                <StatusBadge status={guest.status} />
              </div>
            </div>
          </div>

          <Button onClick={() => setEditOpen(true)}>
            <FiEdit2 data-icon="inline-start" />
            Edit profile
          </Button>
        </div>
      </div>

      <div className="border-b border-border">
        <nav
          className="-mb-px flex gap-5 overflow-x-auto"
          aria-label="Guest profile sections"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="size-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {activeTab === "overview" && (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <FiUser className="size-4" />
                <p className="text-xs font-medium">Guest status</p>
              </div>

              <div className="mt-3">
                <StatusBadge status={guest.status} />
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <FiCalendar className="size-4" />
                <p className="text-xs font-medium">Registration date</p>
              </div>

              <p className="mt-3 text-sm font-semibold text-foreground">
                {formatDate(guest.created_at)}
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <FiClock className="size-4" />
                <p className="text-xs font-medium">Last updated</p>
              </div>

              <p className="mt-3 text-sm font-semibold text-foreground">
                {formatDate(guest.updated_at)}
              </p>
            </div>
          </div>

          <section className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-semibold text-foreground">
                Personal information
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                The guest's personal and contact details.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-x-8 gap-y-6 p-5 sm:grid-cols-2">
              <DetailItem label="First name" value={guest.first_name} />
              <DetailItem label="Last name" value={guest.last_name} />
              <DetailItem label="Email address" value={guest.email} />
              <DetailItem label="Phone number" value={guest.phone} />
              <DetailItem label="Nationality" value={guest.nationality} />
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-semibold text-foreground">
                Identification details
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Identification information provided during registration.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-x-8 gap-y-6 p-5 sm:grid-cols-2">
              <DetailItem label="Identification type" value={guest.id_type} />

              <DetailItem
                label="Identification number"
                value={guest.id_number}
              />

              <div className="sm:col-span-2">
                <DetailItem label="Address" value={guest.address} />
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === "reservations" && (
        <section className="rounded-lg border border-border bg-card p-5">
          <EmptyState
            title="No reservation history"
            description="Reservations associated with this guest will appear here once the Reservations module is connected."
            className="border-0 py-8"
          />
        </section>
      )}

      {activeTab === "payments" && (
        <section className="rounded-lg border border-border bg-card p-5">
          <EmptyState
            title="No payment history"
            description="Payments associated with this guest will appear here once the Payments module is connected."
            className="border-0 py-8"
          />
        </section>
      )}

      <GuestForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        guest={guest}
        onSubmit={handleSaveGuest}
        isSubmitting={submitting}
      />
    </div>
  )
}

export default GuestProfile
