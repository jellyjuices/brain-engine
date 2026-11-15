import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mixGradient, mixSplit, splitAreas } from './area-mix.ts'

const six = ['health', 'fitness', 'money', 'home', 'career', 'love-life']

describe('splitAreas', () => {
  const cases: [string[], { shown: string[]; extra: number }][] = [
    [['health'], { shown: ['health'], extra: 0 }],
    [['health', 'fitness'], { shown: ['health', 'fitness'], extra: 0 }],
    [['health', 'fitness', 'money'], { shown: ['health', 'fitness', 'money'], extra: 0 }],
    [six, { shown: ['health', 'fitness', 'money'], extra: 3 }],
    [['health', 'health', 'fitness'], { shown: ['health', 'fitness'], extra: 0 }],
  ]

  for (const [areas, expected] of cases) {
    it(`shows ${expected.shown.length} and counts ${expected.extra} for ${areas.length} areas`, () =>
      assert.deepEqual(splitAreas(areas), expected))
  }
})

describe('mixes for many areas', () => {
  it('splits a small part into at most three bands', () => {
    assert.equal(mixSplit(six).match(/var\(--area-/g)?.length, 3)
  })

  it('blends at most three key colours in a gradient', () => {
    assert.equal(mixGradient(six).match(/var\(--area-/g)?.length, 3)
  })

  it('gives one area a flat gradient of its own colour', () => {
    assert.equal(mixGradient(['health'], 'fill', 90), 'linear-gradient(in oklch 90deg, var(--area-health-fill), var(--area-health-fill))')
  })
})
