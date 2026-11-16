import { describe, expect, it } from 'vitest'

import { fixtureKey } from './fixtures.js'

describe('fixtureKey', () => {
  it('keeps nested values, so each day gets its own key', () => {
    const monday = fixtureKey({ timeRange: { startTime: '2026-11-16' } })
    const tuesday = fixtureKey({ timeRange: { startTime: '2026-11-17' } })

    expect(monday).not.toBe(tuesday)
  })

  it('ignores key order at every level', () => {
    expect(fixtureKey({ b: 1, a: { d: 2, c: 3 } })).toBe(
      fixtureKey({ a: { c: 3, d: 2 }, b: 1 })
    )
  })
})
