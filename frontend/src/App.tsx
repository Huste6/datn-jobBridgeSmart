import { useCallback, useEffect, useState } from 'react'
import LandingPage from './pages/public/LandingPage'
import LoginPage from './pages/public/LoginPage'
import RegisterPage from './pages/public/RegisterPage'
import UnauthorizedPage from './pages/errors/UnauthorizedPage'
import ForbiddenPage from './pages/errors/ForbiddenPage'
import NotFoundPage from './pages/errors/NotFoundPage'
import RoleSelectPage from './pages/onboarding/RoleSelectPage'
import BasicProfilePage from './pages/onboarding/BasicProfilePage'
import AppLayout from './layouts/AppLayout'
import AppHomeContent from './pages/app/AppHomeContent'
import { clearStoredAccessToken, fetchMe, getStoredAccessToken } from './features/auth/api/auth'
import type { AuthUser } from './features/auth/api/auth'
import {
  defaultAppPageForRole,
  isAppPage,
  isProtectedPage,
  pageFromPath,
  pathFromPage,
} from './shared/routes/appRoutes'
import type { AppPage, UserRole } from './shared/routes/appRoutes'
import { getUserMeta, setUserMeta } from './features/auth/userMeta'
import type { UserMeta } from './features/auth/userMeta'

function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>(() => pageFromPath(window.location.pathname))
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [userMeta, setLocalUserMeta] = useState<UserMeta>({ profileCompleted: false })
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  const navigate = useCallback((page: AppPage, options?: { replace?: boolean }) => {
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
  }, [])

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
    const syncFromStorage = async () => {
      const token = getStoredAccessToken()
      if (!token) {
        setIsBootstrapping(false)
        return
      }

      try {
        const user = await fetchMe()
        setCurrentUser(user)
        setLocalUserMeta(getUserMeta(user.id))
      } catch {
        clearStoredAccessToken()
        setCurrentUser(null)
        setLocalUserMeta({ profileCompleted: false })
      } finally {
        setIsBootstrapping(false)
      }
    }

    syncFromStorage()
  }, [])

  useEffect(() => {
    if (isBootstrapping) {
      return
    }

    if (isProtectedPage(currentPage) && !currentUser) {
      navigate('unauthorized', { replace: true })
      return
    }

    if (!currentUser) {
      return
    }

    const role = userMeta.role
    if (!role && currentPage !== 'roleSelect') {
      navigate('roleSelect', { replace: true })
      return
    }

    if (role && !userMeta.profileCompleted && currentPage !== 'basicProfile' && currentPage !== 'roleSelect') {
      navigate('basicProfile', { replace: true })
      return
    }

    if (currentPage === 'roleSelect' && role && userMeta.profileCompleted) {
      navigate(defaultAppPageForRole(role), { replace: true })
      return
    }

    if (currentPage === 'basicProfile' && role && userMeta.profileCompleted) {
      navigate(defaultAppPageForRole(role), { replace: true })
      return
    }

    if (isAppPage(currentPage) && role) {
      const seekerOnly = currentPage === 'appJobs' || currentPage === 'appApplications'
      const recruiterOnly = currentPage === 'appRecruitment' || currentPage === 'appCandidates'
      if ((seekerOnly && role !== 'seeker') || (recruiterOnly && role !== 'recruiter')) {
        navigate('forbidden', { replace: true })
      }
    }
  }, [currentPage, currentUser, isBootstrapping, userMeta, navigate])

  const handleAuthSuccess = (user: AuthUser) => {
    const meta = getUserMeta(user.id)
    setCurrentUser(user)
    setLocalUserMeta(meta)

    if (!meta.role) {
      navigate('roleSelect', { replace: true })
      return
    }

    if (!meta.profileCompleted) {
      navigate('basicProfile', { replace: true })
      return
    }

    navigate(defaultAppPageForRole(meta.role), { replace: true })
  }

  const updateUserMeta = (next: UserMeta) => {
    if (!currentUser) {
      return
    }
    setUserMeta(currentUser.id, next)
    setLocalUserMeta(next)
  }

  const handleSelectRole = (role: UserRole) => {
    const nextMeta: UserMeta = {
      ...userMeta,
      role,
      profileCompleted: userMeta.profileCompleted,
    }
    updateUserMeta(nextMeta)
    navigate('basicProfile')
  }

  const handleProfileSubmit = (payload: { phone: string; city: string; headline: string }) => {
    const nextMeta: UserMeta = {
      ...userMeta,
      profileCompleted: true,
      phone: payload.phone,
      city: payload.city,
      headline: payload.headline,
    }
    updateUserMeta(nextMeta)

    if (nextMeta.role) {
      navigate(defaultAppPageForRole(nextMeta.role), { replace: true })
    } else {
      navigate('roleSelect', { replace: true })
    }
  }

  const handleLogout = () => {
    clearStoredAccessToken()
    setCurrentUser(null)
    setLocalUserMeta({ profileCompleted: false })
    navigate('landing')
  }

  const renderAppContent = () => {
    const role = userMeta.role
    if (!currentUser || !role) {
      return null
    }

    let title = 'Dashboard'
    let subtitle = 'Theo dõi nhanh thông tin tổng quan của bạn trên JobBridge AI.'

    if (currentPage === 'appJobs') {
      title = 'Danh sách việc làm phù hợp'
      subtitle = 'Khám phá cơ hội việc làm được cá nhân hóa theo hồ sơ của bạn.'
    } else if (currentPage === 'appApplications') {
      title = 'Đơn ứng tuyển của tôi'
      subtitle = 'Theo dõi trạng thái từng đơn ứng tuyển theo thời gian thực.'
    } else if (currentPage === 'appRecruitment') {
      title = 'Tin tuyển dụng'
      subtitle = 'Quản lý bài đăng tuyển dụng và hiệu quả tiếp cận ứng viên.'
    } else if (currentPage === 'appCandidates') {
      title = 'Kho ứng viên'
      subtitle = 'Xem và lọc danh sách ứng viên tiềm năng cho doanh nghiệp.'
    }

    return (
      <AppLayout
        currentUser={currentUser}
        role={role}
        currentPage={currentPage}
        onNavigate={navigate}
        onLogout={handleLogout}
      >
        <AppHomeContent title={title} subtitle={subtitle} />
      </AppLayout>
    )
  }

  if (isBootstrapping) {
    return <div className="min-h-screen grid place-items-center text-slate-600">Loading...</div>
  }

  return (
    <>
      {currentPage === 'landing' && <LandingPage onNavigate={navigate} currentUser={currentUser} onLogout={handleLogout} />}
      {currentPage === 'login' && <LoginPage onNavigate={navigate} onAuthSuccess={handleAuthSuccess} />}
      {currentPage === 'register' && <RegisterPage onNavigate={navigate} onAuthSuccess={handleAuthSuccess} />}
      {currentPage === 'roleSelect' && <RoleSelectPage onNavigate={navigate} onSelectRole={handleSelectRole} />}
      {currentPage === 'basicProfile' && <BasicProfilePage defaultName={currentUser?.full_name ?? ''} onNavigate={navigate} onSubmitProfile={handleProfileSubmit} />}
      {isAppPage(currentPage) && renderAppContent()}
      {currentPage === 'unauthorized' && <UnauthorizedPage onNavigate={navigate} />}
      {currentPage === 'forbidden' && <ForbiddenPage onNavigate={navigate} />}
      {currentPage === 'notfound' && <NotFoundPage onNavigate={navigate} />}
    </>
  )
}

export default App

