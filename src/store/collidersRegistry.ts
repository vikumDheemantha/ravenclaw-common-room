import type { AABB } from '../utils/collision'

const colliders = new Map<string, AABB>()

export function registerCollider(id: string, box: AABB): void {
  colliders.set(id, box)
}

export function unregisterCollider(id: string): void {
  colliders.delete(id)
}

export function getAllColliders(): AABB[] {
  return Array.from(colliders.values())
}

export function clearAllColliders(): void {
  colliders.clear()
}
