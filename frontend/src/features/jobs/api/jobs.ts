export type Job = {
    id: string
    title: string
    company: string
    location: string
    salary: string
    tags: string[]
    posted_at: string
    created_at: string
    updated_at: string
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

