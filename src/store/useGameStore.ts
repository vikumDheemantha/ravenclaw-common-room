import { create } from 'zustand'
import type { SceneId, Tooltip } from '../types'

interface GameStore {
  scene: SceneId
  tooltip: Tooltip | null
  setScene: (s: SceneId) => void
  setTooltip: (t: Tooltip | null) => void
}

export const useGameStore = create<GameStore>((set) => ({
  scene: 'entry',
  tooltip: null,
  setScene: (scene) => set({ scene }),
  setTooltip: (tooltip) => set({ tooltip }),
}))
