export type UserRole = 'seeker' | 'recruiter'

export type AppPage =
    | 'landing'
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
    return page === 'roleSelect'
        || page === 'basicProfile'
        || page === 'appProfile'
        || page === 'applications'
}

export function isAppPage(): boolean {
    return false
}

export function defaultAppPageForRole(role: UserRole): AppPage {
    return role === 'recruiter' ? 'landing' : 'landing'
}
