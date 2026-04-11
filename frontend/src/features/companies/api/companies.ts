export interface Company {
    id: string
    owner_id: string
    name: string
    logo_url?: string
    description?: string
    website?: string
    tax_code?: string
    location?: string
    status: string
    is_locked: boolean
    created_at: string
    updated_at: string
}

function getApiBaseUrl(): string {
    return import.meta.env.VITE_API_BASE_URL ?? ""
}

function buildUrl(path: string): string {
    const base = getApiBaseUrl().replace(/\/+$/, "")
    const normalizedPath = path.startsWith("/") ? path : `/${path}`
    return `${base}${normalizedPath}`
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = buildUrl(path)
    const token = localStorage.getItem('accessToken')

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    }
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }
    if (options?.headers) {
        Object.assign(headers, options.headers)
    }

    const res = await fetch(url, { ...options, headers })
    if (!res.ok) {
        let msg = 'API error'
        try {
            const errBody = await res.json()
            msg = errBody.error || msg
        } catch {
            msg = res.statusText || msg
        }
        throw new Error(msg)
    }
    return res.json() as Promise<T>
}

export async function getPublicCompanies(params?: {
    page?: number
    limit?: number
    q?: string
}): Promise<{ companies: Company[]; total: number; page: number; limit: number }> {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.q) query.set('q', params.q)

    const qs = query.toString()
    return request<{ companies: Company[]; total: number; page: number; limit: number }>(
        `/api/public/companies${qs ? `?${qs}` : ''}`,
        { method: 'GET' }
    )
}

export async function getPublicCompany(id: string): Promise<Company> {
    const res = await request<{ company: Company }>(`/api/public/companies/${id}`, {
        method: 'GET',
    })
    return res.company
}
