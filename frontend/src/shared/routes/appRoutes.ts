export type UserRole = 'seeker' | 'recruiter'

export type AppPage =
    | 'landing'
    | 'hrLanding'
    | 'hrCompanyCreate'
    | 'hrCompanyProfile'
    | 'hrCompanyJobs'
    | 'hrJobManagement'
    | 'hrJobCandidates'
    | 'hrCandidateReview'
    | 'jobsList'
    | 'applications'
    | 'login'
    | 'register'
    | 'unauthorized'
    | 'forbidden'
    | 'notfound'
    | 'roleSelect'
    | 'basicProfile'
    | 'appProfile'

export function pathFromPage(page: AppPage): string {
    switch (page) {
        case 'landing':
            return '/'
        case 'hrLanding':
            return '/hr/company/create'
        case 'hrCompanyCreate':
            return '/hr/company/create'
        case 'hrCompanyProfile':
            return '/hr/company/profile'
        case 'hrCompanyJobs':
            return '/hr/jobs'
        case 'hrJobManagement':
            return '/hr/jobs/manage'
        case 'hrJobCandidates':
            return '/hr/jobs/candidates'
        case 'hrCandidateReview':
            return '/hr/candidates/review'
        case 'jobsList':
            return '/jobs'
        case 'applications':
            return '/applications'
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
        case 'roleSelect':
            return '/onboarding/role'
        case 'basicProfile':
            return '/onboarding/profile'
        case 'appProfile':
            return '/profile'
        default:
            return '/404'
    }
}

export function pageFromPath(pathname: string): AppPage {
    switch (pathname) {
        case '/':
            return 'landing'
        case '/hr':
            return 'hrCompanyCreate'
        case '/hr/company/create':
            return 'hrCompanyCreate'
        case '/hr/company/profile':
            return 'hrCompanyProfile'
        case '/hr/jobs':
            return 'hrCompanyJobs'
        case '/hr/jobs/manage':
            return 'hrJobManagement'
        case '/hr/jobs/candidates':
            return 'hrJobCandidates'
        case '/hr/candidates/review':
            return 'hrCandidateReview'
        case '/jobs':
            return 'jobsList'
        case '/applications':
            return 'applications'
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
        case '/onboarding/role':
            return 'roleSelect'
        case '/onboarding/profile':
            return 'basicProfile'
        case '/profile':
            return 'appProfile'
        default:
            return 'notfound'
    }
}

export function isProtectedPage(page: AppPage): boolean {
    return page === 'hrLanding'
        || page === 'hrCompanyCreate'
        || page === 'hrCompanyProfile'
        || page === 'hrCompanyJobs'
        || page === 'hrJobManagement'
        || page === 'hrJobCandidates'
        || page === 'hrCandidateReview'
        || page === 'roleSelect'
        || page === 'basicProfile'
        || page === 'appProfile'
        || page === 'applications'
}

export function isAppPage(): boolean {
    return false
}

export function defaultAppPageForRole(role: UserRole): AppPage {
    return role === 'recruiter' ? 'hrCompanyCreate' : 'landing'
}
