import { useState, useCallback } from 'react'

export function useContextMenu() {
  const [contextMenu, setContextMenu] = useState(null)
  const openMenu = useCallback((opts) => setContextMenu(opts), [])
  const closeMenu = useCallback(() => setContextMenu(null), [])
  return { contextMenu, openMenu, closeMenu }
}
