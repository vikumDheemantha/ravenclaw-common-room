import * as THREE from 'three'

/**
 * Geometry constants shared with useStaircaseElevation and CommonRoomScene.
 */
export const STAIR_START_ANGLE = Math.PI / 4        // SE — bottom of staircase (y = 0)
export const STAIR_END_ANGLE   = -3 * Math.PI / 4   // NW — top  of staircase (y = STAIR_TOP_Y)
export const STAIR_INNER_R     = 14                  // inner walkable edge
export const STAIR_OUTER_R     = 18.5                // outer edge (flush with wall area)
export const STAIR_TOP_Y       = 8                   // must equal MEZZANINE_Y

const STEPS      = 24
const MID_R      = (STAIR_INNER_R + STAIR_OUTER_R) / 2            // 16.25
const STEP_RISE  = STAIR_TOP_Y / STEPS                             // 0.333
const STEP_DEPTH = STAIR_OUTER_R - STAIR_INNER_R                   // 4.5
const D_THETA    = (STAIR_END_ANGLE - STAIR_START_ANGLE) / STEPS   // –π/24 (clockwise)
const STEP_W     = Math.abs(D_THETA) * MID_R * 1.02               // ≈ 2.17 (slight overlap)

const POST_EVERY  = 3
const POST_COLOR  = '#6b4a26'
const STEP_COLOR  = '#3d2e1a'

/** Pre-compute a rotation Euler that aligns a cylinder's Y-axis to a chord vector. */
function chordEuler(
  x1: number, y1: number, z1: number,
  x2: number, y2: number, z2: number,
): THREE.Euler {
  const dir = new THREE.Vector3(x2 - x1, y2 - y1, z2 - z1).normalize()
  const q   = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
  return new THREE.Euler().setFromQuaternion(q)
}

/**
 * Grand curved staircase that follows the circular room wall from SE (ground)
 * to NW (upper floor).  Pure geometry — no colliders.
 */
export function CircularStaircase() {
  // Pre-compute post geometry so we only do it once per render
  const outerPosts: JSX.Element[] = []
  const innerPosts: JSX.Element[] = []
  const outerRails: JSX.Element[] = []
  const innerRails: JSX.Element[] = []

  for (let i = 0; i < STEPS; i++) {
    const angle = STAIR_START_ANGLE + i * D_THETA
    const yBase = i * STEP_RISE

    if (i % POST_EVERY === 0) {
      const postY = yBase + STEP_RISE + 0.42

      outerPosts.push(
        <mesh
          key={`op-${i}`}
          position={[Math.sin(angle) * (STAIR_OUTER_R - 0.12), postY, Math.cos(angle) * (STAIR_OUTER_R - 0.12)]}
        >
          <cylinderGeometry args={[0.045, 0.045, 0.84, 8]} />
          <meshStandardMaterial color={POST_COLOR} roughness={0.7} />
        </mesh>,
      )

      innerPosts.push(
        <mesh
          key={`ip-${i}`}
          position={[Math.sin(angle) * (STAIR_INNER_R + 0.12), postY, Math.cos(angle) * (STAIR_INNER_R + 0.12)]}
        >
          <cylinderGeometry args={[0.045, 0.045, 0.84, 8]} />
          <meshStandardMaterial color={POST_COLOR} roughness={0.7} />
        </mesh>,
      )

      // Handrail chord to the NEXT post
      const iNext = i + POST_EVERY
      if (iNext < STEPS) {
        const aNext = STAIR_START_ANGLE + iNext * D_THETA
        const yNext = iNext * STEP_RISE + STEP_RISE + 0.84
        const yTop  = yBase + STEP_RISE + 0.84

        // Outer rail
        const ox1 = Math.sin(angle) * (STAIR_OUTER_R - 0.12), oz1 = Math.cos(angle) * (STAIR_OUTER_R - 0.12)
        const ox2 = Math.sin(aNext) * (STAIR_OUTER_R - 0.12), oz2 = Math.cos(aNext) * (STAIR_OUTER_R - 0.12)
        const oLen = Math.sqrt((ox2-ox1)**2 + (yNext-yTop)**2 + (oz2-oz1)**2)
        const oE   = chordEuler(ox1, yTop, oz1, ox2, yNext, oz2)
        outerRails.push(
          <mesh key={`or-${i}`} position={[(ox1+ox2)/2, (yTop+yNext)/2, (oz1+oz2)/2]} rotation={oE}>
            <cylinderGeometry args={[0.045, 0.045, oLen, 6]} />
            <meshStandardMaterial color={POST_COLOR} roughness={0.65} />
          </mesh>,
        )

        // Inner rail
        const ix1 = Math.sin(angle) * (STAIR_INNER_R + 0.12), iz1 = Math.cos(angle) * (STAIR_INNER_R + 0.12)
        const ix2 = Math.sin(aNext) * (STAIR_INNER_R + 0.12), iz2 = Math.cos(aNext) * (STAIR_INNER_R + 0.12)
        const iLen = Math.sqrt((ix2-ix1)**2 + (yNext-yTop)**2 + (iz2-iz1)**2)
        const iE   = chordEuler(ix1, yTop, iz1, ix2, yNext, iz2)
        innerRails.push(
          <mesh key={`ir-${i}`} position={[(ix1+ix2)/2, (yTop+yNext)/2, (iz1+iz2)/2]} rotation={iE}>
            <cylinderGeometry args={[0.045, 0.045, iLen, 6]} />
            <meshStandardMaterial color={POST_COLOR} roughness={0.65} />
          </mesh>,
        )
      }
    }
  }

  return (
    <group>
      {/* ── Steps ── */}
      {Array.from({ length: STEPS }, (_, i) => {
        const angle = STAIR_START_ANGLE + i * D_THETA
        const yBase = i * STEP_RISE
        return (
          <mesh
            key={i}
            position={[
              Math.sin(angle) * MID_R,
              yBase + STEP_RISE * 0.5,
              Math.cos(angle) * MID_R,
            ]}
            rotation={[0, -angle, 0]}
          >
            <boxGeometry args={[STEP_W, STEP_RISE, STEP_DEPTH]} />
            <meshStandardMaterial color={STEP_COLOR} roughness={0.9} />
          </mesh>
        )
      })}

      {outerPosts}
      {innerPosts}
      {outerRails}
      {innerRails}
    </group>
  )
}
