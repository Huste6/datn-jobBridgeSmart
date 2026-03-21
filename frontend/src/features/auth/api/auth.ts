export type AuthUser = {
    id: string
    email: string
    full_name: string
    role: string
    avatar_url?: string
    phone?: string
    city?: string
    headline?: string
    profile_completed: boolean
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

function getApiBaseUrl(): string {
    return import.meta.env.VITE_API_BASE_URL ?? ''
}

function buildUrl(path: string): string {
    return `${getApiBaseUrl()}${path}`
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
}

function saveAccessToken(token: string): void {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
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
    return data.user
}

export async function fetchMe(): Promise<AuthUser> {
    const token = getStoredAccessToken()
    if (!token) {
        throw new Error('Missing access token')
    }

    const data = await request<MeResponse>('/api/users/me', {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })

    return data.user
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

    const data = await request<MeResponse>('/api/users/me/onboarding', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    })

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

    return body.user
}
