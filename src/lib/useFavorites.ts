'use client'
import { useState, useEffect, useCallback } from 'react'

interface Channel {
  id: string
  name: string
  country: string
  quality?: string
  url: string
  logo?: string
}

const STORAGE_KEY = 'tv-favorites'

export function useFavorites() {
  const [favorites, setFavorites] = useState<Channel[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setFavorites(JSON.parse(raw))
    } catch {}
  }, [])

  const toggle = useCallback((ch: Channel) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.id === ch.id)
      const next = exists ? prev.filter(f => f.id !== ch.id) : [...prev, ch]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const isFav = useCallback((id: string) => favorites.some(f => f.id === id), [favorites])

  return { favorites, toggleFavorite: toggle, isFavorite: isFav }
}
