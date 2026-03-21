import type { UserRole } from '../../shared/routes/appRoutes'

export type UserMeta = {
    role?: UserRole
    profileCompleted: boolean
    phone?: string
    city?: string
    headline?: string
}

function storageKey(userId: string): string {
    return `jobbridge_user_meta_${userId}`
}

export function getUserMeta(userId: string): UserMeta {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) {
        return { profileCompleted: false }
    }

    try {
        const parsed = JSON.parse(raw) as UserMeta
        return {
            role: parsed.role,
            profileCompleted: Boolean(parsed.profileCompleted),
            phone: parsed.phone,
            city: parsed.city,
            headline: parsed.headline,
        }
    } catch {
        return { profileCompleted: false }
    }
}

export function setUserMeta(userId: string, value: UserMeta): void {
    localStorage.setItem(storageKey(userId), JSON.stringify(value))
}
