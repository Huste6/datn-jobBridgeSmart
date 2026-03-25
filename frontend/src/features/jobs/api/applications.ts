export type ApplicationStatus = 'submitted' | 'reviewing' | 'interview' | 'offered' | 'rejected'

export type SavedApplication = {
    id: string
    job_id: string
    status: ApplicationStatus
    cv_url?: string
    applied_at: string
    updated_at: string
}

function getApiBaseUrl(): string {
    return import.meta.env.VITE_API_BASE_URL ?? ''
}

function buildUrl(path: string): string {
    const base = getApiBaseUrl().replace(/\/+$/, '')
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return `${base}${normalizedPath}`
}

function getStoredAccessToken(): string | null {
    return localStorage.getItem('jobbridge_access_token')
}

export async function getSavedApplications(): Promise<SavedApplication[]> {
    const token = getStoredAccessToken()
    if (!token) return []

    const response = await fetch(buildUrl('/api/applications/me'), {
        headers: { Authorization: `Bearer ${token}` }
    })
    
    if (!response.ok) return []
    const data = await response.json()
    if (Array.isArray(data)) {
        return (data as SavedApplication[]).sort((a, b) => +new Date(b.applied_at) - +new Date(a.applied_at))
    }
    return []
}

export async function hasApplied(jobId: string): Promise<boolean> {
    const apps = await getSavedApplications()
    return apps.some((item) => item.job_id === jobId)
}

export async function applyToJob(jobId: string): Promise<SavedApplication> {
    const token = getStoredAccessToken()
    if (!token) throw new Error('Not authenticated')

    const response = await fetch(buildUrl('/api/applications'), {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ job_id: jobId })
    })

    if (!response.ok) {
        let errMsg = 'Could not apply to job'
        try {
            const body = await response.json()
            if (body.error) errMsg = body.error
        } catch {}
        throw new Error(errMsg)
    }

    return await response.json() as SavedApplication
}

export function ensureDemoApplications(jobIds: string[]): void {
    void jobIds
}
