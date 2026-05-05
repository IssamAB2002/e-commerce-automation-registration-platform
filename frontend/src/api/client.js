const BASE = import.meta.env.VITE_API_URL || ''

export const getTokens = () => ({
  access: localStorage.getItem('access_token'),
  refresh: localStorage.getItem('refresh_token'),
})

export const setTokens = ({ access, refresh }) => {
  localStorage.setItem('access_token', access)
  if (refresh) localStorage.setItem('refresh_token', refresh)
}

export const clearTokens = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}

export const isAuthenticated = () => !!localStorage.getItem('access_token')

async function refreshAccessToken() {
  const { refresh } = getTokens()
  if (!refresh) throw new Error('No refresh token')

  const res = await fetch(`${BASE}/api/auth/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  })

  if (!res.ok) {
    clearTokens()
    throw new Error('Session expired')
  }

  const data = await res.json()
  setTokens({ access: data.access, refresh: data.refresh })
  return data.access
}

export async function request(path, options = {}) {
  const { access } = getTokens()
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (access) headers['Authorization'] = `Bearer ${access}`

  let res = await fetch(`${BASE}${path}`, { ...options, headers })

  if (res.status === 401) {
    try {
      const newAccess = await refreshAccessToken()
      headers['Authorization'] = `Bearer ${newAccess}`
      res = await fetch(`${BASE}${path}`, { ...options, headers })
    } catch {
      clearTokens()
      window.location.href = '/signin'
      throw new Error('Session expired')
    }
  }

  if (res.status === 204) return null

  const data = await res.json().catch(() => ({}))

  if (!res.ok) throw data

  return data
}
