export type AiCoachRole = 'assistant' | 'user'

export type AiCoachMessage = {
    role: AiCoachRole
    content: string
}

export type AiCoachResponse = {
    reply: string
    job_id: string
    cv_url?: string
    cv_ready: boolean
    cv_text_used: boolean
    model: string
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

export async function coachInterview(input: {
    jobId: string
    message: string
    history: AiCoachMessage[]
}): Promise<AiCoachResponse> {
    const token = getStoredAccessToken()
    if (!token) {
        throw new Error('Not authenticated')
    }

    const response = await fetch(buildUrl('/api/ai/interview-coach'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            job_id: input.jobId,
            message: input.message,
            history: input.history,
        }),
    })

    if (!response.ok) {
        let errMsg = 'AI service is unavailable'
        try {
            const body = await response.json()
            if (typeof body?.error === 'string' && body.error.trim()) {
                errMsg = body.error.trim()
            }
            if (typeof body?.detail === 'string' && body.detail.trim()) {
                errMsg = `${errMsg}: ${body.detail.trim()}`
            }
        } catch {
            // keep default error message
        }
        throw new Error(errMsg)
    }

    return (await response.json()) as AiCoachResponse
}
