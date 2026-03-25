import { useCallback, useEffect, useState } from 'react'
import LandingPage from './pages/public/LandingPage'
import HrCompanyCreatePage from './pages/hr/HrCompanyCreatePage'
import HrCompanyProfilePage from './pages/hr/HrCompanyProfilePage'
import HrCompanyJobsPage from './pages/hr/HrCompanyJobsPage'
import HrJobManagementPage from './pages/hr/HrJobManagementPage'
import HrJobCandidatesPage from './pages/hr/HrJobCandidatesPage'
import HrCandidateReviewPage from './pages/hr/HrCandidateReviewPage'
import LoginPage from './pages/public/LoginPage'
import RegisterPage from './pages/public/RegisterPage'
import UnauthorizedPage from './pages/errors/UnauthorizedPage'
import ForbiddenPage from './pages/errors/ForbiddenPage'
import NotFoundPage from './pages/errors/NotFoundPage'
import RoleSelectPage from './pages/onboarding/RoleSelectPage'
import BasicProfilePage from './pages/onboarding/BasicProfilePage'
import JobsListPage from './pages/app/JobsListPage'
import ProfilePage from './pages/app/ProfilePage'
import CandidateApplicationsPage from './pages/app/CandidateApplicationsPage'
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminUserManagementPage from './pages/admin/AdminUserManagementPage'
import AdminCompanyManagementPage from './pages/admin/AdminCompanyManagementPage'
import AdminLayout from './layouts/AdminLayout'
import { clearStoredAccessToken, completeOnboarding, fetchMe, getStoredAccessToken } from './features/auth/api/auth'
import type { AuthUser } from './features/auth/api/auth'
import {
  defaultAppPageForRole,
  isProtectedPage,
  pageFromPath,
  pathFromPage,
} from './shared/routes/appRoutes'
import type { AppPage, UserRole } from './shared/routes/appRoutes'

function toUserRole(rawRole: string): UserRole | null {
  if (rawRole === 'recruiter' || rawRole === 'seeker' || rawRole === 'admin') {
    return rawRole
  }
  return null
}

function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>(() => pageFromPath(window.location.pathname))
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
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
        setSelectedRole(toUserRole(user.role))
      } catch {
        clearStoredAccessToken()
        setCurrentUser(null)
        setSelectedRole(null)
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

    const role = selectedRole ?? toUserRole(currentUser.role)
    const profileCompleted = currentUser.profile_completed
    const isHrPage = currentPage === 'hrLanding'
      || currentPage === 'hrCompanyCreate'
      || currentPage === 'hrCompanyProfile'
      || currentPage === 'hrCompanyJobs'
      || currentPage === 'hrJobManagement'
      || currentPage === 'hrJobCandidates'
      || currentPage === 'hrCandidateReview'

    if (isHrPage && role === 'seeker') {
      navigate('forbidden', { replace: true })
      return
    }

    const isAdminPage = currentPage === 'adminDashboard' || currentPage === 'adminUsers' || currentPage === 'adminCompanies'
    if (isAdminPage && role !== 'admin') {
      navigate('forbidden', { replace: true })
      return
    }

    if (!role && currentPage !== 'roleSelect') {
      navigate('roleSelect', { replace: true })
      return
    }

    if (role && !profileCompleted && currentPage !== 'basicProfile' && currentPage !== 'roleSelect') {
      navigate('basicProfile', { replace: true })
      return
    }

    if (currentPage === 'roleSelect' && role && profileCompleted) {
      navigate(defaultAppPageForRole(role), { replace: true })
      return
    }

  }, [currentPage, currentUser, isBootstrapping, selectedRole, navigate])

  const handleAuthSuccess = (user: AuthUser) => {
    setCurrentUser(user)
    const role = toUserRole(user.role)
    setSelectedRole(role)

    if (!role) {
      navigate('roleSelect', { replace: true })
      return
    }

    if (!user.profile_completed) {
      navigate('basicProfile', { replace: true })
      return
    }

    navigate(defaultAppPageForRole(role), { replace: true })
  }

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role)
    navigate('basicProfile')
  }

  const handleProfileSubmit = async (payload: {
    full_name: string
    phone: string
    city: string
    headline: string
  }) => {
    if (!currentUser) {
      navigate('unauthorized', { replace: true })
      return
    }

    const role = selectedRole ?? toUserRole(currentUser.role)
    if (!role) {
      navigate('roleSelect', { replace: true })
      return
    }

    const updatedUser = await completeOnboarding({
      role: role as any,
      full_name: payload.full_name,
      phone: payload.phone,
      city: payload.city,
      headline: payload.headline,
    })
    setCurrentUser(updatedUser)
    setSelectedRole(toUserRole(updatedUser.role) ?? role)

    navigate(defaultAppPageForRole(role), { replace: true })
  }

  const handleLogout = () => {
    clearStoredAccessToken()
    setCurrentUser(null)
    setSelectedRole(null)
    navigate('landing')
  }

  if (isBootstrapping) {
    return <div className="min-h-screen grid place-items-center text-slate-600">Loading...</div>
  }

  return (
    <>
      {currentPage === 'landing' && <LandingPage onNavigate={navigate} currentUser={currentUser} onLogout={handleLogout} />}
      {currentPage === 'hrCompanyCreate' && currentUser && <HrCompanyCreatePage onNavigate={navigate} currentUser={currentUser} onLogout={handleLogout} />}
      {currentPage === 'hrCompanyProfile' && currentUser && <HrCompanyProfilePage onNavigate={navigate} currentUser={currentUser} onLogout={handleLogout} />}
      {currentPage === 'hrCompanyJobs' && currentUser && <HrCompanyJobsPage onNavigate={navigate} currentUser={currentUser} onLogout={handleLogout} />}
      {currentPage === 'hrJobManagement' && currentUser && <HrJobManagementPage onNavigate={navigate} currentUser={currentUser} onLogout={handleLogout} />}
      {currentPage === 'hrJobCandidates' && currentUser && <HrJobCandidatesPage onNavigate={navigate} currentUser={currentUser} onLogout={handleLogout} />}
      {currentPage === 'hrCandidateReview' && currentUser && <HrCandidateReviewPage onNavigate={navigate} currentUser={currentUser} onLogout={handleLogout} />}
      {currentPage === 'jobsList' && (
        <JobsListPage
          onNavigate={navigate}
          currentUser={currentUser}
          role={selectedRole ?? (currentUser ? toUserRole(currentUser.role) : null)}
          onLogout={handleLogout}
        />
      )}
      {currentPage === 'applications' && currentUser && (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
          <div className="max-w-6xl mx-auto">
            <CandidateApplicationsPage onNavigate={navigate} />
          </div>
        </div>
      )}
      {currentPage === 'login' && <LoginPage onNavigate={navigate} onAuthSuccess={handleAuthSuccess} />}
      {currentPage === 'register' && <RegisterPage onNavigate={navigate} onAuthSuccess={handleAuthSuccess} />}
      {currentPage === 'roleSelect' && <RoleSelectPage onNavigate={navigate} onSelectRole={handleSelectRole} />}
      {currentPage === 'basicProfile' && <BasicProfilePage defaultName={currentUser?.full_name ?? ''} onNavigate={navigate} onSubmitProfile={handleProfileSubmit} />}
      {currentPage === 'appProfile' && currentUser && (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
          <div className="max-w-4xl mx-auto">
            <ProfilePage
              currentUser={currentUser}
              onNavigate={navigate}
              onUserUpdated={(nextUser) => {
                setCurrentUser(nextUser)
                setSelectedRole(toUserRole(nextUser.role))
              }}
            />
          </div>
        </div>
      )}
      {currentPage === 'adminLogin' && <AdminLoginPage onNavigate={navigate} onAuthSuccess={handleAuthSuccess} />}
      {(currentPage === 'adminDashboard' || currentPage === 'adminUsers' || currentPage === 'adminCompanies') && currentUser && (
        <AdminLayout currentPage={currentPage} onNavigate={navigate} onLogout={handleLogout}>
          {currentPage === 'adminDashboard' && <AdminDashboardPage />}
          {currentPage === 'adminUsers' && <AdminUserManagementPage />}
          {currentPage === 'adminCompanies' && <AdminCompanyManagementPage />}
        </AdminLayout>
      )}
      {currentPage === 'unauthorized' && <UnauthorizedPage onNavigate={navigate} />}
      {currentPage === 'forbidden' && <ForbiddenPage onNavigate={navigate} />}
      {currentPage === 'notfound' && <NotFoundPage onNavigate={navigate} />}
    </>
  )
}

export default App

