import { describe, it, expect } from 'vitest'
import { resolveMovement, type AABB } from './collision'

describe('resolveMovement', () => {
  const playerRadius = 0.4
  const wall: AABB = { minX: 5, maxX: 6, minZ: -5, maxZ: 5 }

  it('returns the desired position when no colliders intersect', () => {
    const result = resolveMovement(
      { x: 0, z: 0 },
      { x: 1, z: 0 },
      playerRadius,
      [wall],
    )
    expect(result).toEqual({ x: 1, z: 0 })
  })

  it('blocks movement through a wall on the X axis', () => {
    const result = resolveMovement(
      { x: 4, z: 0 },
      { x: 5.2, z: 0 },
      playerRadius,
      [wall],
    )
    // Player radius 0.4 means closest allowed x = 5 - 0.4 = 4.6
    expect(result.x).toBeCloseTo(4.6, 5)
    expect(result.z).toBe(0)
  })

  it('allows sliding along a wall (Z moves even if X is blocked)', () => {
    const result = resolveMovement(
      { x: 4.6, z: 0 },
      { x: 5.5, z: 2 },
      playerRadius,
      [wall],
    )
    expect(result.x).toBeCloseTo(4.6, 5)
    expect(result.z).toBe(2)
  })

  it('keeps the player inside a circular boundary', () => {
    const result = resolveMovement(
      { x: 0, z: 0 },
      { x: 100, z: 0 },
      playerRadius,
      [],
      { circularRadius: 20 },
    )
    expect(Math.hypot(result.x, result.z)).toBeLessThanOrEqual(20 - playerRadius + 1e-6)
  })

  it('handles two adjacent walls correctly (most restrictive wins)', () => {
    // wall1 and wall2 are close enough that the desired position x=4.5 overlaps both
    const wall1: AABB = { minX: 3, maxX: 4.4, minZ: -5, maxZ: 5 }
    const wall2: AABB = { minX: 4.5, maxX: 5.5, minZ: -5, maxZ: 5 }
    // Player at x=1 moves to x=4.5 — circle overlaps both walls (gap=0.1 < radius=0.4)
    // Most restrictive constraint from the left: wall1.minX - r = 3 - 0.4 = 2.6
    const result = resolveMovement(
      { x: 1, z: 0 },
      { x: 4.5, z: 0 },
      0.4,
      [wall1, wall2],
    )
    // Should stop at the near face of wall1 (x=3) minus radius: 3 - 0.4 = 2.6
    expect(result.x).toBeCloseTo(2.6, 5)
  })
})
