import { useEffect, useState } from 'react'
import './App.css'
import HomePage from './pages/HomePage.jsx'
import SubscriptionPlatformPage from './pages/subscription/SubscriptionPlatformPage.jsx'
import SignInPage from './pages/auth/SignInPage.jsx'
import SignUpPage from './pages/auth/SignUpPage.jsx'
import DashboardPage from './pages/dashboard/DashboardPage.jsx'
import { getCurrentPage } from './utils/navigation.js'
import { setTokens } from './api/client.js'

function App() {
  const [page, setPage] = useState(() => getCurrentPage())

  const navigate = (targetPage) => {
    const path = targetPage === 'home' ? '/' : `/${targetPage}`
    window.history.pushState({}, '', path)
    setPage(targetPage)
  }

  useEffect(() => {
    // Handle Facebook OAuth callback — backend redirects to
    // /?page=dashboard&access=xxx&refresh=xxx  (or page=signup for new users)
    const params = new URLSearchParams(window.location.search)
    const access = params.get('access')
    const refresh = params.get('refresh')
    const targetPage = params.get('page')
    const authError = params.get('auth_error')

    if (access && refresh) {
      setTokens({ access, refresh })
      // Clean the URL so tokens don't stay in history
      window.history.replaceState({}, '', targetPage === 'dashboard' ? '/dashboard' : '/signup')
      setPage(targetPage || 'dashboard')
      return
    }

    if (authError) {
      window.history.replaceState({}, '', '/signin')
      setPage('signin')
      return
    }

    const onPop = () => setPage(getCurrentPage())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    const onPop = () => setPage(getCurrentPage())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  if (page === 'pricing') return <SubscriptionPlatformPage onNavigate={navigate} />
  if (page === 'signin') return <SignInPage onNavigate={navigate} />
  if (page === 'signup') return <SignUpPage onNavigate={navigate} />
  if (page === 'dashboard') return <DashboardPage onNavigate={navigate} />
  return <HomePage onNavigate={navigate} />
}

export default App
