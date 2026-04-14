import { describe, it, expect, beforeEach } from 'vitest'
import {
  registerCollider,
  unregisterCollider,
  getAllColliders,
  clearAllColliders,
} from './collidersRegistry'

describe('collidersRegistry', () => {
  beforeEach(() => clearAllColliders())

  it('stores and retrieves colliders', () => {
    registerCollider('wall', { minX: 0, maxX: 1, minZ: 0, maxZ: 1 })
    expect(getAllColliders()).toHaveLength(1)
  })

  it('unregisters colliders', () => {
    registerCollider('wall', { minX: 0, maxX: 1, minZ: 0, maxZ: 1 })
    unregisterCollider('wall')
    expect(getAllColliders()).toHaveLength(0)
  })
})
