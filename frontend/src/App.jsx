import { useEffect, useState } from 'react'
import './App.css'
import HomePage from './pages/HomePage.jsx'
import SubscriptionPlatformPage from './pages/subscription/SubscriptionPlatformPage.jsx'
import SignInPage from './pages/auth/SignInPage.jsx'
import SignUpPage from './pages/auth/SignUpPage.jsx'
import DashboardPage from './pages/dashboard/DashboardPage.jsx'
import TermsPage from './pages/legal/TermsPage.jsx'
import PrivacyPage from './pages/legal/PrivacyPage.jsx'
import CookiePage from './pages/legal/CookiePage.jsx'
import { getCurrentPage } from './utils/navigation.js'
import { setTokens } from './api/client.js'

function App() {
  // Store tokens synchronously during init so child effects find them immediately
  const [page, setPage] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    const access = params.get('access')
    const refresh = params.get('refresh')
    const targetPage = params.get('page')
    if (access && refresh) {
      setTokens({ access, refresh })
      const dest = targetPage === 'dashboard' ? '/dashboard' : '/signup'
      window.history.replaceState({}, '', dest)
      return targetPage || 'dashboard'
    }
    return getCurrentPage()
  })

  const navigate = (targetPage) => {
    const path = targetPage === 'home' ? '/' : `/${targetPage}`
    window.history.pushState({}, '', path)
    setPage(targetPage)
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const authError = params.get('auth_error')
    if (authError) {
      window.history.replaceState({}, '', '/')
      setPage('signin')
    }
  }, [])

  useEffect(() => {
    const onPop = () => setPage(getCurrentPage())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  if (page === 'pricing' || page === 'subscription') return <SubscriptionPlatformPage onNavigate={navigate} />
  if (page === 'signin') return <SignInPage onNavigate={navigate} />
  if (page === 'signup') return <SignUpPage onNavigate={navigate} />
  if (page === 'dashboard') return <DashboardPage onNavigate={navigate} />
  if (page === 'terms') return <TermsPage onNavigate={navigate} />
  if (page === 'privacy') return <PrivacyPage onNavigate={navigate} />
  if (page === 'cookies') return <CookiePage onNavigate={navigate} />
  if (page === 'reset-password') return <ResetPasswordPage onNavigate={navigate} />
  if (page === 'home') return <HomePage onNavigate={navigate} />
  return <NotFoundPage onNavigate={navigate} />
}

function ResetPasswordPage({ onNavigate }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const params = new URLSearchParams(window.location.search)
  const uid = params.get('uid') || ''
  const token = params.get('token') || ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/auth/reset-password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, token, new_password: password }),
      })
      const data = await res.json()
      if (data.success) setStatus('Password reset successfully! You can now sign in.')
      else setError(data.error || 'Reset failed.')
    } catch { setError('Network error. Please try again.') }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#04080f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif', color: '#e8edf5' }}>
      <div style={{ background: '#080d18', border: '1px solid #1a2540', borderRadius: 16, padding: '2.5rem', width: '100%', maxWidth: 420 }}>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, marginBottom: '1.5rem', color: '#00d4ff' }}>Reset Password</h2>
        {status ? (
          <div>
            <p style={{ color: '#3ecf8e', marginBottom: '1.5rem' }}>{status}</p>
            <button onClick={() => onNavigate('signin')} style={{ background: '#00d4ff', border: 'none', borderRadius: 9, padding: '.75rem 1.5rem', color: '#04080f', fontWeight: 700, cursor: 'pointer', width: '100%' }}>Sign In</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input type="password" placeholder="New password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} style={{ background: '#0d1525', border: '1px solid #1a2540', borderRadius: 9, padding: '.75rem 1rem', color: '#e8edf5', fontSize: '.9rem' }} />
            <input type="password" placeholder="Confirm new password" value={confirm} onChange={e => setConfirm(e.target.value)} required style={{ background: '#0d1525', border: '1px solid #1a2540', borderRadius: 9, padding: '.75rem 1rem', color: '#e8edf5', fontSize: '.9rem' }} />
            {error && <p style={{ color: '#f05f5f', fontSize: '.82rem' }}>{error}</p>}
            <button type="submit" disabled={loading} style={{ background: '#00d4ff', border: 'none', borderRadius: 9, padding: '.75rem', color: '#04080f', fontWeight: 700, cursor: loading ? 'wait' : 'pointer' }}>{loading ? 'Resetting...' : 'Reset Password'}</button>
          </form>
        )}
      </div>
    </div>
  )
}

function NotFoundPage({ onNavigate }) {
  return (
    <div style={{ minHeight: '100vh', background: '#04080f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif', color: '#e8edf5', gap: '1.5rem' }}>
      <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '6rem', color: '#1a2540', lineHeight: 1 }}>404</div>
      <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#e8edf5' }}>Page not found</div>
      <div style={{ fontSize: '.9rem', color: '#6b7a94', textAlign: 'center', maxWidth: 400 }}>The page you're looking for doesn't exist or has been moved.</div>
      <button onClick={() => onNavigate('home')} style={{ background: 'linear-gradient(135deg,#00d4ff,#0099cc)', border: 'none', borderRadius: 9, padding: '.75rem 2rem', color: '#04080f', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '.9rem', cursor: 'pointer', marginTop: '.5rem' }}>Go Home</button>
    </div>
  )
}

export default App
