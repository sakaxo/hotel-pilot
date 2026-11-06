import * as React from "react"
import { useNavigate } from "react-router-dom"
import { FiSearch } from "react-icons/fi"
import { useAppData } from "@/context/AppDataContext"

interface SearchResult {
  id: string
  label: string
  description: string
  to: string
}

export function GlobalSearch() {
  const { data } = useAppData()
  const navigate = useNavigate()
  const [query, setQuery] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const results = React.useMemo<SearchResult[]>(() => {
    const term = query.trim().toLowerCase()
    if (term.length < 2) return []

    const guestMatches: SearchResult[] = data.guests
      .filter((g) => `${g.firstName} ${g.lastName} ${g.email}`.toLowerCase().includes(term))
      .slice(0, 3)
      .map((g) => ({
        id: g.id,
        label: `${g.firstName} ${g.lastName}`,
        description: g.email,
        to: `/guests?q=${encodeURIComponent(g.firstName + " " + g.lastName)}`,
      }))

    const reservationMatches: SearchResult[] = data.reservations
      .filter((r) => r.reference.toLowerCase().includes(term))
      .slice(0, 3)
      .map((r) => ({
        id: r.id,
        label: r.reference,
        description: "Reservation",
        to: `/reservations?q=${encodeURIComponent(r.reference)}`,
      }))

    const roomMatches: SearchResult[] = data.rooms
      .filter((r) => r.number.toLowerCase().includes(term))
      .slice(0, 3)
      .map((r) => ({
        id: r.id,
        label: `Room ${r.number}`,
        description: r.status,
        to: `/rooms?q=${encodeURIComponent(r.number)}`,
      }))

    return [...guestMatches, ...reservationMatches, ...roomMatches]
  }, [query, data.guests, data.reservations, data.rooms])

  return (
    <div ref={containerRef} className="relative hidden w-full max-w-xs sm:block">
      <FiSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search guests, rooms, reservations..."
        className="h-9 w-full rounded-md border border-border bg-background py-2 pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
      />
      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 z-30 mt-1 w-full overflow-hidden rounded-md border border-border bg-card shadow-lg">
          {results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">No matches found.</p>
          ) : (
            results.map((result) => (
              <button
                key={`${result.to}-${result.id}`}
                type="button"
                onClick={() => {
                  navigate(result.to)
                  setOpen(false)
                  setQuery("")
                }}
                className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-muted/50"
              >
                <span className="text-sm font-medium text-foreground">{result.label}</span>
                <span className="text-xs text-muted-foreground">{result.description}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
