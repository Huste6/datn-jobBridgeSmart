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

function getApiBaseUrl(): string {
    return import.meta.env.VITE_API_BASE_URL ?? ""
}

function buildUrl(path: string): string {
    return `${getApiBaseUrl()}${path}`
}

export async function fetchJobs(): Promise<Job[]> {
    const response = await fetch(buildUrl("/api/jobs"), {
        headers: {
            "Content-Type": "application/json",
        },
    })
    
    if (!response.ok) {
        throw new Error("Failed to fetch jobs")
    }
    
    return await response.json()
}

