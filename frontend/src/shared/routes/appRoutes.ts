export type UserRole = 'seeker' | 'recruiter'

export type AppPage =
    | 'landing'
    | 'login'
    | 'register'
    | 'unauthorized'
    | 'forbidden'
    | 'notfound'
    | 'roleSelect'
    | 'basicProfile'
    | 'appProfile'
    | 'appHome'
    | 'appJobs'
    | 'appApplications'
    | 'appRecruitment'
    | 'appCandidates'

export function pathFromPage(page: AppPage): string {
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
        case 'roleSelect':
            return '/onboarding/role'
        case 'basicProfile':
            return '/onboarding/profile'
        case 'appProfile':
            return '/profile'
        case 'appHome':
            return '/app'
        case 'appJobs':
            return '/app/jobs'
        case 'appApplications':
            return '/app/applications'
        case 'appRecruitment':
            return '/app/recruitment'
        case 'appCandidates':
            return '/app/candidates'
        default:
            return '/404'
    }
}

export function pageFromPath(pathname: string): AppPage {
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
        case '/onboarding/role':
            return 'roleSelect'
        case '/onboarding/profile':
            return 'basicProfile'
        case '/profile':
            return 'appProfile'
        case '/app':
            return 'appHome'
        case '/app/jobs':
            return 'appJobs'
        case '/app/applications':
            return 'appApplications'
        case '/app/recruitment':
            return 'appRecruitment'
        case '/app/candidates':
            return 'appCandidates'
        default:
            return 'notfound'
    }
}

export function isProtectedPage(page: AppPage): boolean {
    return page === 'roleSelect'
        || page === 'basicProfile'
        || page === 'appProfile'
        || page === 'appHome'
        || page === 'appJobs'
        || page === 'appApplications'
        || page === 'appRecruitment'
        || page === 'appCandidates'
}

export function isAppPage(page: AppPage): boolean {
    return page === 'appHome'
        || page === 'appJobs'
        || page === 'appApplications'
        || page === 'appRecruitment'
        || page === 'appCandidates'
}

export function defaultAppPageForRole(role: UserRole): AppPage {
    return role === 'recruiter' ? 'appRecruitment' : 'landing'
}
