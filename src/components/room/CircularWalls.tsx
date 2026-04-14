import * as THREE from 'three'

interface Props {
  radius?: number
  height?: number
  windowCount?: number
  /**
   * When provided, windows are split into a ground-floor tier (y = 0 → mezzanineY)
   * and an upper-floor tier (y = mezzanineY → height) with proportional sizing.
   * When omitted, a single tall window row is drawn as before.
   */
  mezzanineY?: number
}

interface WindowTier {
  centerY: number
  winHeight: number
  winWidth: number
}

function buildTiers(height: number, mezzanineY?: number): WindowTier[] {
  if (mezzanineY) {
    // Ground floor windows
    const gWinH  = (mezzanineY - 1.4) * 0.74
    const gBot   = 0.7
    // Upper floor windows (taller story → taller windows)
    const uWinH  = (height - mezzanineY - 1.8) * 0.62
    const uBot   = mezzanineY + 0.8
    return [
      { centerY: gBot + gWinH / 2, winHeight: gWinH, winWidth: 2.0 },
      { centerY: uBot + uWinH / 2, winHeight: uWinH, winWidth: 2.2 },
    ]
  }
  const winH = height * 0.75
  const bot  = height * 0.05
  return [{ centerY: bot + winH / 2, winHeight: winH, winWidth: 2.2 }]
}

export function CircularWalls({
  radius     = 20,
  height     = 12,
  windowCount = 6,
  mezzanineY,
}: Props) {
  const tiers = buildTiers(height, mezzanineY)

  return (
    <group>
      {/* Cylinder — floor-aligned (y = 0 → y = height) */}
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[radius, radius, height, 64, 1, true]} />
        <meshStandardMaterial color="#d7cdb9" side={THREE.BackSide} roughness={0.95} />
      </mesh>

      {tiers.map((tier, tierIdx) =>
        Array.from({ length: windowCount }, (_, i) => {
          const a    = (i / windowCount) * Math.PI * 2
          const wx   = Math.cos(a) * (radius - 0.05)
          const wz   = Math.sin(a) * (radius - 0.05)
          const rotY = -a + Math.PI / 2
          const { centerY, winHeight: wh, winWidth: ww } = tier

          return (
            <group key={`${tierIdx}-${i}`} position={[wx, centerY, wz]} rotation={[0, rotY, 0]}>
              {/* Sky/mountain panel */}
              <mesh position={[0, 0, -0.02]}>
                <planeGeometry args={[ww, wh]} />
                <meshBasicMaterial color="#7aa3c7" />
              </mesh>
              {/* Arched top */}
              <mesh position={[0, wh / 2 - 0.35, 0]}>
                <torusGeometry args={[ww / 2, 0.07, 8, 24, Math.PI]} />
                <meshStandardMaterial color="#3a2e20" />
              </mesh>
              {/* Left drape */}
              <mesh position={[-(ww / 2 + 0.28), 0, 0.04]}>
                <boxGeometry args={[0.17, wh, 0.13]} />
                <meshStandardMaterial color="#14306b" roughness={0.85} />
              </mesh>
              {/* Right drape */}
              <mesh position={[ww / 2 + 0.28, 0, 0.04]}>
                <boxGeometry args={[0.17, wh, 0.13]} />
                <meshStandardMaterial color="#14306b" roughness={0.85} />
              </mesh>
              {/* Sill */}
              <mesh position={[0, -(wh / 2), 0.09]}>
                <boxGeometry args={[ww + 0.65, 0.17, 0.28]} />
                <meshStandardMaterial color="#3a2e20" />
              </mesh>
            </group>
          )
        }),
      )}
    </group>
  )
}
