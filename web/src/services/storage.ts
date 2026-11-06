// Thin wrapper around localStorage with JSON (de)serialisation and safe fallbacks.
// Centralising persistence here keeps the rest of the app storage-agnostic so it
// can later be swapped for real API calls without touching component code.

const STORAGE_PREFIX = "hotelpilot"

export function storageKey(name: string): string {
  return `${STORAGE_PREFIX}:${name}`
}

export function readFromStorage<T>(name: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = window.localStorage.getItem(storageKey(name))
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch (error) {
    console.warn(`HotelPilot: failed to read "${name}" from storage`, error)
    return fallback
  }
}

export function writeToStorage<T>(name: string, value: T): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(storageKey(name), JSON.stringify(value))
  } catch (error) {
    console.warn(`HotelPilot: failed to persist "${name}" to storage`, error)
  }
}

export function clearStorage(name: string): void {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(storageKey(name))
}
