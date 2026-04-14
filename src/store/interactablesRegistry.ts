import * as THREE from 'three'
import type { InteractableDescriptor } from '../types'

interface Entry {
  descriptor: InteractableDescriptor
  object: THREE.Object3D
}

const registry = new Map<string, Entry>()

export function registerInteractable(
  id: string,
  descriptor: InteractableDescriptor,
  object: THREE.Object3D,
): void {
  registry.set(id, { descriptor, object })
}

export function unregisterInteractable(id: string): void {
  registry.delete(id)
}

export function clearAllInteractables(): void {
  registry.clear()
}

/**
 * Find the nearest interactable in front of the camera within the given range.
 * "In front" is defined as being within ~45° of the camera's forward vector.
 */
export function findNearestInteractable(
  camera: THREE.Camera,
  maxDistance: number,
): InteractableDescriptor | null {
  const camPos = new THREE.Vector3()
  camera.getWorldPosition(camPos)
  const camDir = new THREE.Vector3()
  camera.getWorldDirection(camDir)

  const cosThreshold = Math.cos(Math.PI / 4) // 45° cone

  let best: { descriptor: InteractableDescriptor; dist: number } | null = null
  const toObj = new THREE.Vector3()

  for (const { descriptor, object } of registry.values()) {
    object.getWorldPosition(toObj)
    toObj.sub(camPos)
    const dist = toObj.length()
    if (dist === 0 || dist > maxDistance) continue
    toObj.normalize()
    if (toObj.dot(camDir) < cosThreshold) continue
    if (!best || dist < best.dist) {
      best = { descriptor, dist }
    }
  }

  return best ? best.descriptor : null
}
