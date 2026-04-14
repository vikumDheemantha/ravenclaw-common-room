import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

interface Options {
  /** Angle (atan2(x,z)) at the BOTTOM of the staircase (y = 0). */
  startAngle: number
  /** Angle at the TOP of the staircase (y = topY).  startAngle > endAngle (clockwise arc). */
  endAngle: number
  /** Minimum distance from the room origin to be "on" the staircase. */
  innerRadius: number
  /** Maximum distance from the room origin to be "on" the staircase. */
  outerRadius: number
  /** Height of the upper floor. */
  topY: number
  enabled?: boolean
}

/**
 * Drives the player's floor height based on their angular position on the
 * grand curved wall staircase.
 *
 * Convention: `atan2(x, z)` — angle 0 = South (+Z), increasing CCW.
 * The staircase runs CLOCKWISE (startAngle > endAngle), e.g. SE → NW.
 *
 * Returns a ref whose `.current` is the current floor height (0 = ground,
 * topY = upper floor).  Pass it to `useFirstPersonControls({ floorYRef })`.
 */
export function useStaircaseElevation({
  startAngle,
  endAngle,
  innerRadius,
  outerRadius,
  topY,
  enabled = true,
}: Options) {
  const { camera } = useThree()
  const floorY     = useRef(0)
  const floorLevel = useRef<0 | 1>(0)   // 0 = ground floor, 1 = upper floor

  const BUFFER = 0.9    // extra zone margin for smooth entry
  const span   = startAngle - endAngle  // positive (clockwise)

  useFrame(() => {
    if (!enabled) return

    const px   = camera.position.x
    const pz   = camera.position.z
    const dist = Math.sqrt(px * px + pz * pz)

    if (dist >= innerRadius - BUFFER && dist <= outerRadius + BUFFER) {
      // Inside the staircase radial band — check angular position.
      const angle = Math.atan2(px, pz)

      // Clockwise progress: 0 at startAngle (bottom), 1 at endAngle (top).
      let relAngle = startAngle - angle
      // Normalise to handle the ±π boundary crossing.
      if (relAngle >  Math.PI) relAngle -= 2 * Math.PI
      if (relAngle < -Math.PI) relAngle += 2 * Math.PI
      const progress = relAngle / span

      if (progress >= 0 && progress <= 1) {
        // Player is actively on the staircase arc.
        floorY.current = progress * topY
        if (progress > 0.95) floorLevel.current = 1
        if (progress < 0.05) floorLevel.current = 0
      } else {
        // In the radial zone but beside the arc — hold the current floor level.
        floorY.current = floorLevel.current === 1 ? topY : 0
      }
    } else {
      // Outside the staircase zone — hold the current floor level.
      floorY.current = floorLevel.current === 1 ? topY : 0
    }
  })

  return floorY
}
