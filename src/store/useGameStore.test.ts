import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './useGameStore'

describe('useGameStore', () => {
  beforeEach(() => {
    useGameStore.setState({ scene: 'entry', tooltip: null, interactionOpen: false })
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

  it('starts with interactionOpen false', () => {
    const state = useGameStore.getState()
    expect(state.interactionOpen).toBe(false)
  })

  it('can open and close the interaction popup', () => {
    useGameStore.getState().setInteractionOpen(true)
    expect(useGameStore.getState().interactionOpen).toBe(true)
    useGameStore.getState().setInteractionOpen(false)
    expect(useGameStore.getState().interactionOpen).toBe(false)
  })

  it('resets interactionOpen in beforeEach', () => {
    // Verifies beforeEach covers the new field
    expect(useGameStore.getState().interactionOpen).toBe(false)
  })
})
