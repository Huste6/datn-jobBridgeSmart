import { beforeEach, describe, expect, it } from 'vitest'

import { clearStoredAccessToken, getStoredAccessToken } from '../../../src/features/auth/api/auth'

describe('auth token storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null when no token exists', () => {
    expect(getStoredAccessToken()).toBeNull()
  })

  it('reads token from localStorage', () => {
    localStorage.setItem('jobbridge_access_token', 'token-123')

    expect(getStoredAccessToken()).toBe('token-123')
  })

  it('clears token from localStorage', () => {
    localStorage.setItem('jobbridge_access_token', 'token-abc')

    clearStoredAccessToken()

    expect(getStoredAccessToken()).toBeNull()
  })
})
