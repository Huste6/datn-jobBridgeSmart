import { describe, expect, it } from 'vitest'

import {
  defaultAppPageForRole,
  isProtectedPage,
  pageFromPath,
  pathFromPage,
  type AppPage,
} from '../../../src/shared/routes/appRoutes'

describe('appRoutes', () => {
  it('maps known pages to paths', () => {
    expect(pathFromPage('landing')).toBe('/')
    expect(pathFromPage('jobsList')).toBe('/jobs')
    expect(pathFromPage('adminDashboard')).toBe('/admin/dashboard')
  })

  it('maps known paths to pages', () => {
    expect(pageFromPath('/')).toBe('landing')
    expect(pageFromPath('/hr/jobs/manage')).toBe('hrJobManagement')
    expect(pageFromPath('/admin/users')).toBe('adminUsers')
  })

  it('returns notfound for unknown path', () => {
    expect(pageFromPath('/unknown/path')).toBe('notfound')
  })

  it('identifies protected pages correctly', () => {
    const protectedPages: AppPage[] = ['hrCompanyCreate', 'applications', 'adminDashboard']
    for (const page of protectedPages) {
      expect(isProtectedPage(page)).toBe(true)
    }

    expect(isProtectedPage('landing')).toBe(false)
    expect(isProtectedPage('login')).toBe(false)
  })

  it('returns default page per role', () => {
    expect(defaultAppPageForRole('recruiter')).toBe('hrCompanyCreate')
    expect(defaultAppPageForRole('admin')).toBe('adminDashboard')
    expect(defaultAppPageForRole('seeker')).toBe('landing')
    expect(defaultAppPageForRole('something-else')).toBe('landing')
  })
})
