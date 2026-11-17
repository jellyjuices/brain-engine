import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { isFirstStep, isLastStep, startSteps, stepProgress, stepReducer } from './steps.ts'

describe('builder steps', () => {
  it('starts on the first step', () => {
    assert.deepEqual(startSteps(2), { step: 0, count: 2, skipped: [] })
  })

  it('resumes at the step it was left on', () => {
    assert.equal(startSteps(5, 3).step, 3)
  })

  it('never resumes past the last step', () => {
    assert.equal(startSteps(2, 9).step, 1)
  })

  it('moves to the next step', () => {
    assert.equal(stepReducer(startSteps(2), { type: 'next' }).step, 1)
  })

  it('stays on the last step on next', () => {
    assert.equal(stepReducer(startSteps(2, 1), { type: 'next' }).step, 1)
  })

  it('goes back one step', () => {
    assert.equal(stepReducer(startSteps(3, 2), { type: 'back' }).step, 1)
  })

  it('stays on the first step on back', () => {
    assert.equal(stepReducer(startSteps(3), { type: 'back' }).step, 0)
  })

  it('remembers a skipped step', () => {
    assert.deepEqual(stepReducer(startSteps(3), { type: 'skip' }).skipped, [0])
  })

  it('forgets a skip once the step is answered', () => {
    const skipped = stepReducer(startSteps(3), { type: 'skip' })
    const back = stepReducer(skipped, { type: 'back' })
    assert.deepEqual(stepReducer(back, { type: 'next' }).skipped, [])
  })

  it('jumps to a chosen step', () => {
    assert.equal(stepReducer(startSteps(4), { type: 'go', step: 2 }).step, 2)
  })

  it('knows the first and last step', () => {
    assert.deepEqual([isFirstStep(startSteps(2)), isLastStep(startSteps(2, 1))], [true, true])
  })

  it('counts progress through the steps', () => {
    assert.equal(stepProgress(startSteps(5, 2)), 60)
  })
})
