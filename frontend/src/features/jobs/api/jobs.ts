export type Job = {
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
    posted_at: string
    created_at: string
    updated_at: string
}

export type FetchJobsQuery = {
    q?: string
    location?: string
    salaryBand?: 'all' | 'under20' | '20to35' | '35to50' | 'over50'
    employmentTypes?: string[]
    experienceLevels?: string[]
    sort?: 'newest' | 'title' | 'company'
}

let jobsCache: Job[] | null = null
let inFlightJobsRequest: Promise<Job[]> | null = null

function getApiBaseUrl(): string {
    return import.meta.env.VITE_API_BASE_URL ?? ""
}

function buildUrl(path: string): string {
    const base = getApiBaseUrl().replace(/\/+$/, "")
    const normalizedPath = path.startsWith("/") ? path : `/${path}`
    return `${base}${normalizedPath}`
}

export async function fetchJobs(options?: { force?: boolean }): Promise<Job[]> {
    if (!options?.force && jobsCache) {
        return jobsCache
    }

    if (!options?.force && inFlightJobsRequest) {
        return inFlightJobsRequest
    }

    const url = buildUrl("/api/jobs")
    inFlightJobsRequest = (async () => {
        let response: Response

        try {
            response = await fetch(url, { cache: "no-store" })
        } catch (error) {
            const message = error instanceof Error ? error.message : "Network error"
            throw new Error(`Could not reach jobs API (${url}): ${message}`)
        }

        if (!response.ok) {
            throw new Error(`Failed to fetch jobs (${response.status})`)
        }

        const data = (await response.json()) as Job[]
        jobsCache = data
        return data
    })()

    try {
        return await inFlightJobsRequest
    } finally {
        inFlightJobsRequest = null
    }
}

export async function fetchJobsByQuery(query: FetchJobsQuery): Promise<Job[]> {
    const params = new URLSearchParams()

    if (query.q?.trim()) {
        params.set('q', query.q.trim())
    }

    if (query.location?.trim()) {
        params.set('location', query.location.trim())
    }

    if (query.salaryBand && query.salaryBand !== 'all') {
        params.set('salary_band', query.salaryBand)
    }

    if (query.sort && query.sort !== 'newest') {
        params.set('sort', query.sort)
    }

    ; (query.employmentTypes || []).forEach((item) => {
        if (item.trim()) {
            params.append('employment_type', item)
        }
    })

        ; (query.experienceLevels || []).forEach((item) => {
            if (item.trim()) {
                params.append('experience_level', item)
            }
        })

    const queryString = params.toString()
    const url = buildUrl(`/api/jobs${queryString ? `?${queryString}` : ''}`)

    let response: Response
    try {
        response = await fetch(url, { cache: 'no-store' })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Network error'
        throw new Error(`Could not reach jobs API (${url}): ${message}`)
    }

    if (!response.ok) {
        throw new Error(`Failed to fetch jobs (${response.status})`)
    }

    return (await response.json()) as Job[]
}

