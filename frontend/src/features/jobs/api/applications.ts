export type ApplicationStatus = 'submitted' | 'reviewing' | 'interview' | 'offered' | 'rejected'

export type SavedApplication = {
    job_id: string
    status: ApplicationStatus
    applied_at: string
    updated_at: string
}

const STORAGE_KEY = 'jobbridge_applications_v2'

function canUseStorage(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readRaw(): SavedApplication[] {
    if (!canUseStorage()) {
        return []
    }

    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
        return []
    }

    try {
        const parsed = JSON.parse(raw) as SavedApplication[]
        if (!Array.isArray(parsed)) {
            return []
        }
        return parsed.filter((item) => typeof item?.job_id === 'string')
    } catch {
        return []
    }
}

function writeRaw(items: SavedApplication[]): void {
    if (!canUseStorage()) {
        return
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function getSavedApplications(): SavedApplication[] {
    return readRaw().sort((a, b) => +new Date(b.applied_at) - +new Date(a.applied_at))
}

export function hasApplied(jobId: string): boolean {
    return readRaw().some((item) => item.job_id === jobId)
}

export function applyToJob(jobId: string): SavedApplication {
    const now = new Date().toISOString()
    const current = readRaw()
    const existing = current.find((item) => item.job_id === jobId)

    if (existing) {
        return existing
    }

    const created: SavedApplication = {
        job_id: jobId,
        status: 'submitted',
        applied_at: now,
        updated_at: now,
    }

    writeRaw([created, ...current])
    return created
}

export function ensureDemoApplications(jobIds: string[]): void {
    void jobIds
}
