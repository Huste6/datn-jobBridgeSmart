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
    location: string
    employmentType: string
    salaryRange: string
    description: string
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

const JOBS_KEY = 'jobbridge_hr_company_jobs'
const CANDIDATES_KEY = 'jobbridge_hr_job_candidates'
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

function nowIso(): string {
    return new Date().toISOString()
}

function makeId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function parseOrDefault<T>(raw: string | null, fallback: T): T {
    if (!raw) {
        return fallback
    }

    try {
        return JSON.parse(raw) as T
    } catch {
        return fallback
    }
}

const defaultJobs: CompanyJob[] = [
    {
        id: 'job_react_lead',
        title: 'Senior React Developer',
        location: 'Ho Chi Minh',
        employmentType: 'full-time',
        salaryRange: '35-50 trieu',
        description: 'Phat trien giao dien web va toi uu hieu nang cho ung dung doanh nghiep.',
        status: 'open',
        updatedAt: nowIso(),
    },
    {
        id: 'job_golang_backend',
        title: 'Golang Backend Engineer',
        location: 'Ha Noi',
        employmentType: 'full-time',
        salaryRange: '30-45 trieu',
        description: 'Xay dung API microservices va toi uu he thong phan tan.',
        status: 'open',
        updatedAt: nowIso(),
    },
]

const defaultCandidates: JobCandidate[] = [
    {
        id: 'cand_anh_nguyen',
        jobId: 'job_react_lead',
        fullName: 'Nguyen Minh Anh',
        email: 'anh.nguyen@email.com',
        phone: '0901000111',
        summary: 'Front-end engineer voi kinh nghiem xay dung dashboard B2B.',
        skills: ['React', 'TypeScript', 'Testing Library'],
        yearsOfExperience: 4,
        stage: 'screening',
        manualScore: 78,
        notes: 'Can bo sung kinh nghiem voi design system quy mo lon.',
        updatedAt: nowIso(),
    },
    {
        id: 'cand_hoa_tran',
        jobId: 'job_react_lead',
        fullName: 'Tran Thu Hoa',
        email: 'hoa.tran@email.com',
        phone: '0912333444',
        summary: 'Da tung dan dat 2 du an React cho startup fintech.',
        skills: ['React', 'Next.js', 'TailwindCSS'],
        yearsOfExperience: 5,
        stage: 'interview',
        manualScore: 86,
        notes: 'Phu hop van hoa va giao tiep tot, de xuat vao vong manager interview.',
        updatedAt: nowIso(),
    },
    {
        id: 'cand_binh_le',
        jobId: 'job_golang_backend',
        fullName: 'Le Quoc Binh',
        email: 'binh.le@email.com',
        phone: '0988777666',
        summary: 'Backend engineer chuyen microservices va event-driven architecture.',
        skills: ['Golang', 'PostgreSQL', 'Kafka'],
        yearsOfExperience: 6,
        stage: 'new',
        manualScore: 72,
        notes: 'CV tot, can kiem tra them ve system design.',
        updatedAt: nowIso(),
    },
]

function ensureSeeded(): void {
    if (!localStorage.getItem(JOBS_KEY)) {
        localStorage.setItem(JOBS_KEY, JSON.stringify(defaultJobs))
    }

    if (!localStorage.getItem(CANDIDATES_KEY)) {
        localStorage.setItem(CANDIDATES_KEY, JSON.stringify(defaultCandidates))
    }
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

export function listCompanyJobs(): CompanyJob[] {
    ensureSeeded()
    const jobs = parseOrDefault<CompanyJob[]>(localStorage.getItem(JOBS_KEY), [])
    return [...jobs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function getCompanyJobById(jobId: string): CompanyJob | null {
    return listCompanyJobs().find((job) => job.id === jobId) ?? null
}

export function createCompanyJob(payload: Omit<CompanyJob, 'id' | 'updatedAt'>): CompanyJob {
    const nextJob: CompanyJob = {
        ...payload,
        id: makeId('job'),
        updatedAt: nowIso(),
    }

    const nextJobs = [nextJob, ...listCompanyJobs()]
    localStorage.setItem(JOBS_KEY, JSON.stringify(nextJobs))
    return nextJob
}

export function updateCompanyJob(jobId: string, payload: Omit<CompanyJob, 'id' | 'updatedAt'>): CompanyJob | null {
    const jobs = listCompanyJobs()
    let updatedJob: CompanyJob | null = null

    const nextJobs = jobs.map((job) => {
        if (job.id !== jobId) {
            return job
        }

        updatedJob = {
            ...job,
            ...payload,
            updatedAt: nowIso(),
        }
        return updatedJob
    })

    localStorage.setItem(JOBS_KEY, JSON.stringify(nextJobs))
    return updatedJob
}

export function deleteCompanyJob(jobId: string): void {
    const nextJobs = listCompanyJobs().filter((job) => job.id !== jobId)
    localStorage.setItem(JOBS_KEY, JSON.stringify(nextJobs))

    const nextCandidates = listJobCandidates().filter((candidate) => candidate.jobId !== jobId)
    localStorage.setItem(CANDIDATES_KEY, JSON.stringify(nextCandidates))

    if (getSelectedJobId() === jobId) {
        localStorage.removeItem(SELECTED_JOB_KEY)
    }
}

export function listJobCandidates(jobId?: string): JobCandidate[] {
    ensureSeeded()
    const candidates = parseOrDefault<JobCandidate[]>(localStorage.getItem(CANDIDATES_KEY), [])

    const filtered = jobId ? candidates.filter((candidate) => candidate.jobId === jobId) : candidates
    return [...filtered].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function getCandidateById(candidateId: string): JobCandidate | null {
    return listJobCandidates().find((candidate) => candidate.id === candidateId) ?? null
}

export function updateCandidateReview(candidateId: string, payload: {
    stage: JobCandidate['stage']
    manualScore: number
    notes: string
}): JobCandidate | null {
    const candidates = listJobCandidates()
    let updatedCandidate: JobCandidate | null = null

    const nextCandidates = candidates.map((candidate) => {
        if (candidate.id !== candidateId) {
            return candidate
        }

        updatedCandidate = {
            ...candidate,
            stage: payload.stage,
            manualScore: payload.manualScore,
            notes: payload.notes,
            updatedAt: nowIso(),
        }
        return updatedCandidate
    })

    localStorage.setItem(CANDIDATES_KEY, JSON.stringify(nextCandidates))
    return updatedCandidate
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
