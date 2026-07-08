export type AuthUser = {
    id: string
    email: string
    full_name: string
    role: string
    avatar_url?: string
    phone?: string
    city?: string
    headline?: string
    cv_url?: string
    profile_completed: boolean
    is_locked: boolean
    created_at: string
}

type AuthResponse = {
    access_token: string
    user: AuthUser
}

type MeResponse = {
    user: AuthUser
}

const TOKEN_STORAGE_KEY = 'jobbridge_access_token'
let meCache: AuthUser | null = null
let meCacheToken: string | null = null
let inFlightMeRequest: Promise<AuthUser> | null = null

function getApiBaseUrl(): string {
    return import.meta.env.VITE_API_BASE_URL ?? ''
}

function buildUrl(path: string): string {
    const base = getApiBaseUrl().replace(/\/+$/, '')
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return `${base}${normalizedPath}`
}

function clearMeCache(): void {
    meCache = null
    meCacheToken = null
    inFlightMeRequest = null
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(buildUrl(path), {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            ...(init?.headers ?? {}),
        },
    })

    const body = (await response.json().catch(() => ({}))) as { error?: string }
    if (!response.ok) {
        throw new Error(body.error ?? 'Request failed')
    }

    return body as T
}

export function getStoredAccessToken(): string | null {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function clearStoredAccessToken(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    clearMeCache()
}

function saveAccessToken(token: string): void {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
    clearMeCache()
}

export async function registerUser(payload: {
    email: string
    password: string
    full_name: string
}): Promise<AuthUser> {
    const data = await request<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
    })

    saveAccessToken(data.access_token)
    meCache = data.user
    meCacheToken = data.access_token
    return data.user
}

export async function loginUser(payload: {
    email: string
    password: string
}): Promise<AuthUser> {
    const data = await request<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
    })

    saveAccessToken(data.access_token)
    meCache = data.user
    meCacheToken = data.access_token
    return data.user
}

export async function fetchMe(options?: { force?: boolean }): Promise<AuthUser> {
    const token = getStoredAccessToken()
    if (!token) {
        throw new Error('Missing access token')
    }

    if (!options?.force && meCache && meCacheToken === token) {
        return meCache
    }

    if (!options?.force && inFlightMeRequest) {
        return inFlightMeRequest
    }

    inFlightMeRequest = (async () => {
        const data = await request<MeResponse>('/api/users/me', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })

        meCache = data.user
        meCacheToken = token
        return data.user
    })()

    try {
        return await inFlightMeRequest
    } finally {
        inFlightMeRequest = null
    }
}

export async function completeOnboarding(payload: {
    role: 'seeker' | 'recruiter'
    full_name: string
    phone: string
    city: string
    headline: string
}): Promise<AuthUser> {
    const token = getStoredAccessToken()
    if (!token) {
        throw new Error('Missing access token')
    }

    const data = await request<AuthResponse>('/api/users/me/onboarding', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    })

    saveAccessToken(data.access_token)
    meCache = data.user
    meCacheToken = data.access_token
    return data.user
}

export async function updateMe(payload: {
    full_name?: string
    phone?: string
    city?: string
    headline?: string
    avatar_url?: string
}): Promise<AuthUser> {
    const token = getStoredAccessToken()
    if (!token) {
        throw new Error('Missing access token')
    }

    const data = await request<MeResponse>('/api/users/me', {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    })

    meCache = data.user
    meCacheToken = token
    return data.user
}

export async function uploadAvatar(file: File): Promise<AuthUser> {
    const token = getStoredAccessToken()
    if (!token) {
        throw new Error('Missing access token')
    }

    const formData = new FormData()
    formData.append('avatar', file)

    const response = await fetch(buildUrl('/api/users/me/avatar'), {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    })

    const body = (await response.json().catch(() => ({}))) as { error?: string; user?: AuthUser }
    if (!response.ok || !body.user) {
        throw new Error(body.error ?? 'Upload avatar failed')
    }

    meCache = body.user
    meCacheToken = token
    return body.user
}

export async function uploadCV(file: File): Promise<AuthUser> {
    const token = getStoredAccessToken()
    if (!token) {
        throw new Error('Missing access token')
    }

    const formData = new FormData()
    formData.append('cv', file)

    const response = await fetch(buildUrl('/api/users/me/cv'), {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    })

    const body = (await response.json().catch(() => ({}))) as { error?: string; user?: AuthUser }
    if (!response.ok || !body.user) {
        throw new Error(body.error ?? 'Upload CV failed')
    }

    meCache = body.user
    meCacheToken = token
    return body.user
}

export type AdminStats = {
    total_users: number
    total_companies: number
    total_jobs: number
}

export async function fetchAdminStats(): Promise<AdminStats> {
    const token = getStoredAccessToken()
    return request<AdminStats>('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
    })
}

export type AdminUsersResponse = {
    users: AuthUser[]
    total: number
    page: number
    limit: number
}

export async function fetchAdminUsers(params: {
    page?: number
    limit?: number
    q?: string
}): Promise<AdminUsersResponse> {
    const token = getStoredAccessToken()
    const urlParams = new URLSearchParams()
    if (params.page) urlParams.set('page', params.page.toString())
    if (params.limit) urlParams.set('limit', params.limit.toString())
    if (params.q) urlParams.set('q', params.q)

    return request<AdminUsersResponse>(`/api/admin/users?${urlParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
    })
}

export async function toggleUserLock(userId: string, isLocked: boolean): Promise<void> {
    const token = getStoredAccessToken()
    await request(`/api/admin/users/${userId}/lock`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_locked: isLocked }),
    })
}

export type AdminCompaniesResponse = {
    companies: any[] // You can define a more specific Company type if needed
    total: number
    page: number
    limit: number
}

export async function fetchAdminCompanies(params: {
    page?: number
    limit?: number
    q?: string
    status?: string
}): Promise<AdminCompaniesResponse> {
    const token = getStoredAccessToken()
    const urlParams = new URLSearchParams()
    if (params.page) urlParams.set('page', params.page.toString())
    if (params.limit) urlParams.set('limit', params.limit.toString())
    if (params.q) urlParams.set('q', params.q)
    if (params.status) urlParams.set('status', params.status)

    return request<AdminCompaniesResponse>(`/api/admin/companies?${urlParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
    })
}

export async function approveCompany(companyId: string, status: 'approved' | 'rejected'): Promise<void> {
    const token = getStoredAccessToken()
    await request(`/api/admin/companies/${companyId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
    })
}

export async function toggleCompanyLock(companyId: string, isLocked: boolean): Promise<void> {
    const token = getStoredAccessToken()
    await request(`/api/admin/companies/${companyId}/lock`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_locked: isLocked }),
    })
}
