import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { whenStatus, type WhenInput } from './when.ts'

const today = '2026-11-14'

describe('whenStatus', () => {
  const cases: [string, WhenInput, string | undefined][] = [
    ['a past due date is overdue', { due: '2026-11-06' }, 'overdue'],
    ['overdue wins over waiting', { due: '2026-11-06', waiting: true }, 'overdue'],
    ['waiting wins over a future date', { due: '2026-11-20', waiting: true }, 'waiting'],
    ['a due date of today is today', { due: '2026-11-14' }, 'today'],
    ['a date with a time still counts as its day', { due: '2026-11-14T08:00' }, 'today'],
    ['a future due date is due', { due: '2026-11-20' }, 'due'],
    ['someday with no date is someday', { someday: true }, 'someday'],
    ['no date and no someday has no When', {}, undefined],
  ]

  for (const [name, input, expected] of cases) {
    it(name, () => assert.equal(whenStatus(input, today), expected))
  }
})
