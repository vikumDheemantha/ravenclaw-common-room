import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './useGameStore'

describe('useGameStore', () => {
  beforeEach(() => {
    useGameStore.setState({ scene: 'entry', tooltip: null })
  })

  it('starts in the entry scene with no tooltip', () => {
    const state = useGameStore.getState()
    expect(state.scene).toBe('entry')
    expect(state.tooltip).toBeNull()
  })

  it('can change scene', () => {
    useGameStore.getState().setScene('common-room')
    expect(useGameStore.getState().scene).toBe('common-room')
  })

  it('can set and clear tooltips', () => {
    useGameStore.getState().setTooltip({ title: 'Eagle', description: 'Knock.' })
    expect(useGameStore.getState().tooltip).toEqual({
      title: 'Eagle',
      description: 'Knock.',
    })
    useGameStore.getState().setTooltip(null)
    expect(useGameStore.getState().tooltip).toBeNull()
  })
})
