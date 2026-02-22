import { useState, useEffect, useCallback } from 'react'

export function useDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const [summary, alerts] = await Promise.all([
        fetch('/api/dashboard').then(r => r.json()),
        fetch('/api/dashboard/alerts').then(r => r.json()),
      ])
      setData({ ...summary, alerts })
      setError(null)
    } catch (e) {
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 30_000)
    return () => clearInterval(interval)
  }, [refresh])

  return { data, loading, error, refresh }
}