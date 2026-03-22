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

const COMPANY_KEY = 'jobbridge_hr_company_profile'
const JOBS_KEY = 'jobbridge_hr_company_jobs'
const CANDIDATES_KEY = 'jobbridge_hr_job_candidates'
const SELECTED_JOB_KEY = 'jobbridge_hr_selected_job_id'
const SELECTED_CANDIDATE_KEY = 'jobbridge_hr_selected_candidate_id'

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

const defaultCompany: CompanyProfile = {
    name: 'TechCorp VN',
    taxCode: '0312345678',
    website: 'https://techcorp.vn',
    industry: 'Software',
    size: '100-300',
    location: 'Ho Chi Minh',
    description: 'Cong ty cong nghe tap trung vao phat trien san pham SaaS cho thi truong Dong Nam A.',
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
    if (!localStorage.getItem(COMPANY_KEY)) {
        localStorage.setItem(COMPANY_KEY, JSON.stringify(defaultCompany))
    }

    if (!localStorage.getItem(JOBS_KEY)) {
        localStorage.setItem(JOBS_KEY, JSON.stringify(defaultJobs))
    }

    if (!localStorage.getItem(CANDIDATES_KEY)) {
        localStorage.setItem(CANDIDATES_KEY, JSON.stringify(defaultCandidates))
    }
}

export function getCompanyProfile(): CompanyProfile | null {
    ensureSeeded()
    return parseOrDefault<CompanyProfile | null>(localStorage.getItem(COMPANY_KEY), null)
}

export function saveCompanyProfile(payload: CompanyProfile): CompanyProfile {
    localStorage.setItem(COMPANY_KEY, JSON.stringify(payload))
    return payload
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
