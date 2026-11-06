import * as React from "react"

/**
 * Runs `sync` during render whenever `value` changes, following React's
 * "adjusting state when a prop changes" pattern. This intentionally avoids
 * calling setState inside a useEffect (which would cause an extra render
 * pass) by updating state synchronously in the render body, guarded by a
 * comparison against the previously seen value.
 */
export function useSyncOnChange<T>(value: T, sync: (value: T) => void): void {
  const [prev, setPrev] = React.useState(value)
  if (!Object.is(prev, value)) {
    setPrev(value)
    sync(value)
  }
}
