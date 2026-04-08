import { beforeEach, describe, expect, it } from 'vitest'

import {
  getSelectedCandidateId,
  getSelectedJobId,
  setSelectedCandidateId,
  setSelectedJobId,
} from '../../../src/features/hr/api/hrRecruiter'

describe('hr recruiter local storage helpers', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('sets and gets selected job id', () => {
    setSelectedJobId('job-001')

    expect(getSelectedJobId()).toBe('job-001')
  })

  it('removes selected job id when null is passed', () => {
    setSelectedJobId('job-001')
    setSelectedJobId(null)

    expect(getSelectedJobId()).toBeNull()
  })

  it('sets and gets selected candidate id', () => {
    setSelectedCandidateId('candidate-007')

    expect(getSelectedCandidateId()).toBe('candidate-007')
  })

  it('removes selected candidate id when null is passed', () => {
    setSelectedCandidateId('candidate-007')
    setSelectedCandidateId(null)

    expect(getSelectedCandidateId()).toBeNull()
  })
})
