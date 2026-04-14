export interface AABB {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

export interface Point2 {
  x: number
  z: number
}

interface ResolveOptions {
  /** Optional hard circular outer boundary. Player is clamped to radius - playerRadius. */
  circularRadius?: number
}

function collidesAABB(px: number, pz: number, r: number, box: AABB): boolean {
  const closestX = Math.max(box.minX, Math.min(px, box.maxX))
  const closestZ = Math.max(box.minZ, Math.min(pz, box.maxZ))
  const dx = px - closestX
  const dz = pz - closestZ
  return dx * dx + dz * dz < r * r
}

function resolveAxis(
  start: number,
  desired: number,
  other: number,
  axis: 'x' | 'z',
  r: number,
  boxes: AABB[],
): number {
  let pos = desired
  for (const b of boxes) {
    const px = axis === 'x' ? pos : other
    const pz = axis === 'z' ? pos : other
    if (collidesAABB(px, pz, r, b)) {
      if (axis === 'x') {
        pos = desired > start ? b.minX - r : b.maxX + r
      } else {
        pos = desired > start ? b.minZ - r : b.maxZ + r
      }
    }
  }
  return pos
}

export function resolveMovement(
  from: Point2,
  to: Point2,
  playerRadius: number,
  boxes: AABB[],
  options: ResolveOptions = {},
): Point2 {
  // Resolve X first, then Z, so the player can slide along walls.
  const x = resolveAxis(from.x, to.x, from.z, 'x', playerRadius, boxes)
  const z = resolveAxis(from.z, to.z, x, 'z', playerRadius, boxes)

  if (options.circularRadius !== undefined) {
    const maxR = options.circularRadius - playerRadius
    const dist = Math.hypot(x, z)
    if (dist > maxR) {
      const scale = maxR / dist
      return { x: x * scale, z: z * scale }
    }
  }

  return { x, z }
}
