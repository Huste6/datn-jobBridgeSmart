import { useEffect, useState } from 'react'
import LandingPage from './LandingPage'
import LoginPage from './LoginPage'
import RegisterPage from './RegisterPage'
import UnauthorizedPage from './UnauthorizedPage'
import ForbiddenPage from './ForbiddenPage'
import NotFoundPage from './NotFoundPage'
import { clearStoredAccessToken, fetchMe, getStoredAccessToken } from './api/auth'
import type { AuthUser } from './api/auth'

type Page = 'landing' | 'login' | 'register' | 'unauthorized' | 'forbidden' | 'notfound'

function pathFromPage(page: Page): string {
  switch (page) {
    case 'landing':
      return '/'
    case 'login':
      return '/login'
    case 'register':
      return '/register'
    case 'unauthorized':
      return '/401'
    case 'forbidden':
      return '/403'
    case 'notfound':
      return '/404'
    default:
      return '/'
  }
}

function pageFromPath(pathname: string): Page {
  switch (pathname) {
    case '/':
      return 'landing'
    case '/login':
      return 'login'
    case '/register':
      return 'register'
    case '/401':
      return 'unauthorized'
    case '/403':
      return 'forbidden'
    case '/404':
      return 'notfound'
    default:
      return 'notfound'
  }
}

function App() {
  const [currentPage, setCurrentPage] = useState<Page>(() => pageFromPath(window.location.pathname))
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  const navigate = (page: Page, options?: { replace?: boolean }) => {
    setCurrentPage(page)
    const nextPath = pathFromPage(page)
    if (window.location.pathname !== nextPath) {
      if (options?.replace) {
        window.history.replaceState({}, '', nextPath)
      } else {
        window.history.pushState({}, '', nextPath)
      }
    }
    window.scrollTo(0, 0)
  }

  useEffect(() => {
    const onPopState = () => {
      setCurrentPage(pageFromPath(window.location.pathname))
    }

    window.addEventListener('popstate', onPopState)
    return () => {
      window.removeEventListener('popstate', onPopState)
    }
  }, [])

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
    navigate('landing', { replace: true })
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
      {currentPage === 'unauthorized' && <UnauthorizedPage onNavigate={navigate} />}
      {currentPage === 'forbidden' && <ForbiddenPage onNavigate={navigate} />}
      {currentPage === 'notfound' && <NotFoundPage onNavigate={navigate} />}
    </>
  )
}

export default App

