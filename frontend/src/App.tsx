import { useEffect, useState } from 'react'
import LandingPage from './LandingPage'
import LoginPage from './LoginPage'
import RegisterPage from './RegisterPage'
import { clearStoredAccessToken, fetchMe, getStoredAccessToken } from './api/auth'
import type { AuthUser } from './api/auth'

type Page = 'landing' | 'login' | 'register'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing')
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  const navigate = (page: Page) => {
    setCurrentPage(page)
    window.scrollTo(0, 0)
  }

  useEffect(() => {
    const token = getStoredAccessToken()
    if (!token) {
      setIsBootstrapping(false)
      return
    }

    fetchMe()
      .then((user) => {
        setCurrentUser(user)
      })
      .catch(() => {
        clearStoredAccessToken()
        setCurrentUser(null)
      })
      .finally(() => {
        setIsBootstrapping(false)
      })
  }, [])

  const handleAuthSuccess = (user: AuthUser) => {
    setCurrentUser(user)
    navigate('landing')
  }

  const handleLogout = () => {
    clearStoredAccessToken()
    setCurrentUser(null)
    navigate('landing')
  }

  if (isBootstrapping) {
    return <div className="min-h-screen grid place-items-center text-slate-600">Loading...</div>
  }

  return (
    <>
      {currentPage === 'landing' && <LandingPage onNavigate={navigate} currentUser={currentUser} onLogout={handleLogout} />}
      {currentPage === 'login' && <LoginPage onNavigate={navigate} onAuthSuccess={handleAuthSuccess} />}
      {currentPage === 'register' && <RegisterPage onNavigate={navigate} onAuthSuccess={handleAuthSuccess} />}
    </>
  )
}

export default App

