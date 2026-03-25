export type CompanyProfile = {
    name: string
    taxCode: string
    website: string
    industry: string
    size: string
    location: string
    description: string
}

export type CompanyJob = {
    id: string
    title: string
    company: string
    location: string
    employmentType: string
    salaryRange: string
    experienceLevel: string
    description: string
    responsibilities: string[]
    requirements: string[]
    benefits: string[]
    tags: string[]
    status: 'open' | 'closed'
    updatedAt: string
}

export type JobCandidate = {
    id: string
    jobId: string
    fullName: string
    email: string
    phone: string
    summary: string
    skills: string[]
    yearsOfExperience: number
    stage: 'new' | 'screening' | 'interview' | 'offer' | 'rejected'
    manualScore: number
    notes: string
    updatedAt: string
}

const SELECTED_JOB_KEY = 'jobbridge_hr_selected_job_id'
const SELECTED_CANDIDATE_KEY = 'jobbridge_hr_selected_candidate_id'

type CompanyPayload = {
    name: string
    tax_code: string
    website: string
    industry: string
    size: string
    location: string
    description: string
}

type CompanyResponse = {
    company: CompanyPayload | null
}

type RecruiterJobPayload = {
    id: string
    title: string
    company: string
    location: string
    salary: string
    employment_type: string
    experience_level: string
    description: string
    responsibilities: string[]
    requirements: string[]
    benefits: string[]
    tags: string[]
    status?: 'open' | 'closed'
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

function toApiPayload(profile: CompanyProfile): CompanyPayload {
    return {
        name: profile.name,
        tax_code: profile.taxCode,
        website: profile.website,
        industry: profile.industry,
        size: profile.size,
        location: profile.location,
        description: profile.description,
    }
}

function fromApiPayload(payload: CompanyPayload): CompanyProfile {
    return {
        name: payload.name,
        taxCode: payload.tax_code,
        website: payload.website,
        industry: payload.industry,
        size: payload.size,
        location: payload.location,
        description: payload.description,
    }
}

function fromRecruiterJobPayload(payload: RecruiterJobPayload): CompanyJob {
    return {
        id: payload.id,
        title: payload.title,
        company: payload.company || '',
        location: payload.location,
        salaryRange: payload.salary,
        employmentType: payload.employment_type,
        experienceLevel: payload.experience_level || '',
        description: payload.description,
        responsibilities: payload.responsibilities || [],
        requirements: payload.requirements || [],
        benefits: payload.benefits || [],
        tags: payload.tags || [],
        status: payload.status ?? 'open',
        updatedAt: payload.updated_at,
    }
}

function toRecruiterJobPayload(payload: Omit<CompanyJob, 'id' | 'updatedAt'>): {
    title: string
    company: string
    location: string
    salary: string
    employment_type: string
    experience_level: string
    description: string
    responsibilities: string[]
    requirements: string[]
    benefits: string[]
    tags: string[]
    status: 'open' | 'closed'
} {
    return {
        title: payload.title,
        company: payload.company,
        location: payload.location,
        salary: payload.salaryRange,
        employment_type: payload.employmentType,
        experience_level: payload.experienceLevel,
        description: payload.description,
        responsibilities: payload.responsibilities,
        requirements: payload.requirements,
        benefits: payload.benefits,
        tags: payload.tags,
        status: payload.status,
    }
}

async function requestCompany(path: string, init?: RequestInit): Promise<CompanyResponse> {
    const token = getStoredAccessToken()
    if (!token) {
        throw new Error('Missing access token')
    }

    const response = await fetch(buildUrl(path), {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...(init?.headers ?? {}),
        },
    })

    const body = (await response.json().catch(() => ({}))) as { error?: string; company?: CompanyPayload | null }
    if (!response.ok) {
        throw new Error(body.error ?? 'Request failed')
    }

    return { company: body.company ?? null }
}



export async function fetchCompanyProfile(): Promise<CompanyProfile | null> {
    const data = await requestCompany('/api/hr/company')
    return data.company ? fromApiPayload(data.company) : null
}

export async function createCompanyProfile(payload: CompanyProfile): Promise<CompanyProfile> {
    const data = await requestCompany('/api/hr/company', {
        method: 'POST',
        body: JSON.stringify(toApiPayload(payload)),
    })

    if (!data.company) {
        throw new Error('Could not create company')
    }

    return fromApiPayload(data.company)
}

export async function updateCompanyProfile(payload: CompanyProfile): Promise<CompanyProfile> {
    const data = await requestCompany('/api/hr/company', {
        method: 'PUT',
        body: JSON.stringify(toApiPayload(payload)),
    })

    if (!data.company) {
        throw new Error('Could not update company')
    }

    return fromApiPayload(data.company)
}

export async function listCompanyJobs(): Promise<CompanyJob[]> {
    const token = getStoredAccessToken()
    if (!token) {
        throw new Error('Missing access token')
    }

    const response = await fetch(buildUrl('/api/jobs/my'), {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
    })

    const body = (await response.json().catch(() => [])) as RecruiterJobPayload[] | { error?: string }
    if (!response.ok) {
        if (!Array.isArray(body) && body?.error) {
            throw new Error(body.error)
        }
        throw new Error('Could not load recruiter jobs')
    }

    if (!Array.isArray(body)) {
        return []
    }

    return body.map(fromRecruiterJobPayload)
}

export async function getCompanyJobById(jobId: string): Promise<CompanyJob | null> {
    const jobs = await listCompanyJobs()
    return jobs.find((job) => job.id === jobId) ?? null
}

export async function createCompanyJob(payload: Omit<CompanyJob, 'id' | 'updatedAt'>): Promise<CompanyJob> {
    const token = getStoredAccessToken()
    if (!token) {
        throw new Error('Missing access token')
    }

    const response = await fetch(buildUrl('/api/jobs/my'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(toRecruiterJobPayload(payload)),
    })

    const body = (await response.json().catch(() => ({}))) as RecruiterJobPayload | { error?: string }
    if (!response.ok) {
        if ('error' in body && body.error) {
            throw new Error(body.error)
        }
        throw new Error('Could not create recruiter job')
    }

    return fromRecruiterJobPayload(body as RecruiterJobPayload)
}

export async function updateCompanyJob(jobId: string, payload: Omit<CompanyJob, 'id' | 'updatedAt'>): Promise<CompanyJob | null> {
    const token = getStoredAccessToken()
    if (!token) {
        throw new Error('Missing access token')
    }

    const response = await fetch(buildUrl(`/api/jobs/my/${jobId}`), {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(toRecruiterJobPayload(payload)),
    })

    const body = (await response.json().catch(() => ({}))) as RecruiterJobPayload | { error?: string }
    if (!response.ok) {
        if ('error' in body && body.error) {
            throw new Error(body.error)
        }
        throw new Error('Could not update recruiter job')
    }

    return fromRecruiterJobPayload(body as RecruiterJobPayload)
}

export async function deleteCompanyJob(jobId: string): Promise<void> {
    const token = getStoredAccessToken()
    if (!token) {
        throw new Error('Missing access token')
    }

    const response = await fetch(buildUrl(`/api/jobs/my/${jobId}`), {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })

    if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? 'Could not delete recruiter job')
    }


    if (getSelectedJobId() === jobId) {
        localStorage.removeItem(SELECTED_JOB_KEY)
    }
}

export async function listJobCandidates(jobId?: string): Promise<JobCandidate[]> {
    if (!jobId) {
        return []
    }

    const token = getStoredAccessToken()
    if (!token) {
        throw new Error('Missing access token')
    }

    const response = await fetch(buildUrl(`/api/applications/job/${jobId}`), {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
    })

    const body = (await response.json().catch(() => [])) as JobCandidate[] | { error?: string }
    if (!response.ok) {
        if (!Array.isArray(body) && body?.error) {
            throw new Error(body.error)
        }
        throw new Error('Could not load candidates')
    }

    if (!Array.isArray(body)) {
        return []
    }

    return body
}

export async function getCandidateById(candidateId: string): Promise<JobCandidate | null> {
    const jobId = getSelectedJobId()
    if (!jobId) return null
    const candidates = await listJobCandidates(jobId)
    return candidates.find(c => c.id === candidateId) || null
}

export async function updateCandidateReview(candidateId: string, payload: {
    stage: JobCandidate['stage']
    manualScore: number
    notes: string
}): Promise<JobCandidate | null> {
    const token = getStoredAccessToken()
    if (!token) return null

    let status = 'reviewing'
    if (payload.stage === 'screening') status = 'reviewing'
    else if (payload.stage === 'interview') status = 'interview'
    else if (payload.stage === 'offer') status = 'offered'
    else if (payload.stage === 'rejected') status = 'rejected'
    else if (payload.stage === 'new') status = 'submitted'

    const response = await fetch(buildUrl(`/api/applications/${candidateId}/status`), {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
    })

    if (!response.ok) return null
    return getCandidateById(candidateId)
}

export function setSelectedJobId(jobId: string | null): void {
    if (!jobId) {
        localStorage.removeItem(SELECTED_JOB_KEY)
        return
    }

    localStorage.setItem(SELECTED_JOB_KEY, jobId)
}

export function getSelectedJobId(): string | null {
    return localStorage.getItem(SELECTED_JOB_KEY)
}

export function setSelectedCandidateId(candidateId: string | null): void {
    if (!candidateId) {
        localStorage.removeItem(SELECTED_CANDIDATE_KEY)
        return
    }

    localStorage.setItem(SELECTED_CANDIDATE_KEY, candidateId)
}

export function getSelectedCandidateId(): string | null {
    return localStorage.getItem(SELECTED_CANDIDATE_KEY)
}
