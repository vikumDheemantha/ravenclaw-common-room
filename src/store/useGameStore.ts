import { create } from 'zustand'
import type { SceneId, Tooltip } from '../types'

interface GameStore {
  scene: SceneId
  tooltip: Tooltip | null
  interactionOpen: boolean
  setScene: (s: SceneId) => void
  setTooltip: (t: Tooltip | null) => void
  setInteractionOpen: (open: boolean) => void
}

export const useGameStore = create<GameStore>((set) => ({
  scene: 'entry',
  tooltip: null,
  interactionOpen: false,
  setScene: (scene) => set({ scene }),
  setTooltip: (tooltip) => set({ tooltip }),
  setInteractionOpen: (interactionOpen) => set({ interactionOpen }),
}))
