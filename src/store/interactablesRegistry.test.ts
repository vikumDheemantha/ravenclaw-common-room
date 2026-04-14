import { describe, it, expect, beforeEach } from 'vitest'
import * as THREE from 'three'
import {
  registerInteractable,
  unregisterInteractable,
  findNearestInteractable,
  clearAllInteractables,
} from './interactablesRegistry'

describe('interactablesRegistry', () => {
  beforeEach(() => clearAllInteractables())

  function makeMesh(x: number, y: number, z: number): THREE.Object3D {
    const mesh = new THREE.Object3D()
    mesh.position.set(x, y, z)
    return mesh
  }

  it('returns null when there are no interactables', () => {
    const camera = new THREE.PerspectiveCamera()
    expect(findNearestInteractable(camera, 4)).toBeNull()
  })

  it('finds the nearest interactable in front of the camera within range', () => {
    const mesh = makeMesh(0, 0, -2)
    registerInteractable('test', { id: 'test', title: 'T', description: 'D' }, mesh)

    const camera = new THREE.PerspectiveCamera()
    camera.position.set(0, 0, 0)
    camera.lookAt(0, 0, -1)
    camera.updateMatrixWorld()

    const hit = findNearestInteractable(camera, 4)
    expect(hit?.id).toBe('test')
  })

  it('ignores interactables outside the range', () => {
    const mesh = makeMesh(0, 0, -10)
    registerInteractable('far', { id: 'far', title: 'F', description: 'D' }, mesh)

    const camera = new THREE.PerspectiveCamera()
    camera.position.set(0, 0, 0)
    camera.lookAt(0, 0, -1)
    camera.updateMatrixWorld()

    expect(findNearestInteractable(camera, 4)).toBeNull()
  })

  it('unregisters cleanly', () => {
    const mesh = makeMesh(0, 0, -2)
    registerInteractable('gone', { id: 'gone', title: 'G', description: 'D' }, mesh)
    unregisterInteractable('gone')

    const camera = new THREE.PerspectiveCamera()
    camera.position.set(0, 0, 0)
    camera.lookAt(0, 0, -1)
    camera.updateMatrixWorld()

    expect(findNearestInteractable(camera, 4)).toBeNull()
  })
})
