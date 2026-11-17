import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { percentOf } from './percent.ts'

describe('percentOf', () => {
  const cases: [number, number, number][] = [
    [5, 12, 42],
    [0, 12, 0],
    [12, 12, 100],
    [14, 12, 100],
    [3, 0, 0],
  ]

  for (const [done, total, expected] of cases) {
    it(`${done} of ${total} is ${expected}%`, () => assert.equal(percentOf(done, total), expected))
  }
})
