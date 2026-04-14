export type SceneId = 'entry' | 'common-room'

export interface Tooltip {
  title: string
  description: string
}

export interface InteractableDescriptor {
  id: string
  title: string
  description: string
}
