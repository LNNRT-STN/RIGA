const storageKey = 'kbc-tour-closed'

/** The tour opens on a first visit. Closing it is remembered, so a presenter only closes it once. */
export function tourWasClosed() {
  if (new URLSearchParams(window.location.search).has('tour')) return false
  try {
    return window.localStorage.getItem(storageKey) === '1'
  } catch {
    return false
  }
}

export function rememberTourClosed(closed: boolean) {
  try {
    if (closed) window.localStorage.setItem(storageKey, '1')
    else window.localStorage.removeItem(storageKey)
  } catch {
    // Private windows can refuse storage; the tour then simply opens again next time.
  }
}
