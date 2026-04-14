import { useMemo } from 'react'
import * as THREE from 'three'
import { useTexture } from '@react-three/drei'
import brickTexUrl from '../../Assets/texture/brick-wall-background-texture.jpg'

interface Props {
  radius?: number
  height?: number
  windowCount?: number
  /**
   * When provided, windows are split into a ground-floor tier (y = 0 → mezzanineY)
   * and an upper-floor tier (y = mezzanineY → height) with proportional sizing.
   * When omitted, a single tall window row is drawn.
   */
  mezzanineY?: number
}

interface WindowTier {
  centerY: number
  winHeight: number
  winWidth: number
  floorY: number
  ceilingY: number
}

function buildTiers(height: number, mezzanineY?: number): WindowTier[] {
  if (mezzanineY) {
    const gWinH = (mezzanineY - 1.2) * 0.82
    const gBot  = 0.5
    const uWinH = (height - mezzanineY - 1.4) * 0.72
    const uBot  = mezzanineY + 0.6
    return [
      { centerY: gBot + gWinH / 2, winHeight: gWinH, winWidth: 2.8, floorY: 0,          ceilingY: mezzanineY },
      { centerY: uBot + uWinH / 2, winHeight: uWinH, winWidth: 3.0, floorY: mezzanineY, ceilingY: height     },
    ]
  }
  const winH = height * 0.78
  const bot  = height * 0.04
  return [{ centerY: bot + winH / 2, winHeight: winH, winWidth: 3.0, floorY: 0, ceilingY: height }]
}

/**
 * Gothic equilateral pointed-arch shape centred at (0,0).
 */
function makeGothicArch(w: number, h: number): THREE.Shape {
  const half    = h / 2
  const springY = h * 0.60 - half
  const R       = w

  const shape = new THREE.Shape()
  shape.moveTo(-w / 2, -half)
  shape.lineTo(-w / 2,  springY)
  shape.absarc( w / 2, springY, R, Math.PI,       (2 * Math.PI) / 3, true)
  shape.absarc(-w / 2, springY, R, Math.PI / 3,   0,                 true)
  shape.lineTo( w / 2, -half)
  shape.closePath()
  return shape
}

/**
 * Stone arch frame: outer arch minus inner arch (hole).
 */
function makeArchFrame(w: number, h: number, fw: number): THREE.Shape {
  const outer = makeGothicArch(w + fw * 2, h + fw)
  const inner = makeGothicArch(w, h)
  outer.holes.push(inner)
  return outer
}

export function CircularWalls({
  radius      = 20,
  height      = 12,
  windowCount = 10,
  mezzanineY,
}: Props) {
  const tiers = useMemo(() => buildTiers(height, mezzanineY), [height, mezzanineY])

  const tierShapes = useMemo(() =>
    tiers.map(t => ({
      sky:   makeGothicArch(t.winWidth, t.winHeight),
      frame: makeArchFrame(t.winWidth, t.winHeight, 0.24),
    })),
  [tiers])

  // Load brick texture; Vite returns a resolved URL for the import.
  const brickTex = useTexture(brickTexUrl)

  // Tile the texture to match the real-world scale of the cylinder:
  //   circumference ≈ 2πr ≈ 125.7 u  →  each tile covers ~2.5 u  →  ~50 repeats
  //   height = 20 u                   →  ~8 vertical repeats
  // Using a clone so that if multiple wall instances existed they don't share state.
  const wallTex = useMemo(() => {
    const t = brickTex.clone()
    t.wrapS = THREE.RepeatWrapping
    t.wrapT = THREE.RepeatWrapping
    t.repeat.set(
      Math.round((2 * Math.PI * radius) / 2.5),
      Math.round(height / 2.5),
    )
    t.needsUpdate = true
    return t
  }, [brickTex, radius, height])

  // A slightly darkened/tinted clone for the bump map so the mortar lines read
  // as recessed without needing a separate asset.
  const bumpTex = useMemo(() => {
    const t = wallTex.clone()
    t.needsUpdate = true
    return t
  }, [wallTex])

  return (
    <group>
      {/* Cylinder — floor-aligned (y = 0 → y = height) */}
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[radius, radius, height, 64, 1, true]} />
        <meshStandardMaterial
          map={wallTex}
          bumpMap={bumpTex}
          bumpScale={0.04}
          side={THREE.BackSide}
          roughness={0.88}
          color="#ffffff"      /* white = no tint multiplication, texture shows true */
          emissive="#3a2a18"   /* faint self-illumination lifts deep shadow pockets */
          emissiveIntensity={0.12}
        />
      </mesh>

      {/* ── 4 shared window-ambient lights per tier (N/E/S/W), not one per window ── */}
      {tiers.map((tier, tierIdx) =>
        [0, 1, 2, 3].map(q => {
          const a  = (q / 4) * Math.PI * 2
          // Place 4 u inside the wall so the light covers the adjacent window bays
          const lx = Math.cos(a) * (radius - 4)
          const lz = Math.sin(a) * (radius - 4)
          return (
            <pointLight
              key={`wl-${tierIdx}-${q}`}
              position={[lx, tier.centerY, lz]}
              intensity={14}
              color="#9bbdd4"
              distance={18}
              decay={2}
            />
          )
        })
      )}

      {/* ── Windows ── */}
      {tiers.map((tier, tierIdx) => {
        const { centerY, winHeight: wh, winWidth: ww, floorY, ceilingY } = tier
        const { sky, frame } = tierShapes[tierIdx]

        const curtainH  = ceilingY - floorY
        const curtainCY = (floorY + ceilingY) / 2 - centerY

        return Array.from({ length: windowCount }, (_, i) => {
          const a    = (i / windowCount) * Math.PI * 2
          const wx   = Math.cos(a) * (radius - 0.05)
          const wz   = Math.sin(a) * (radius - 0.05)
          const rotY = -a + Math.PI / 2

          return (
            <group key={`${tierIdx}-${i}`} position={[wx, centerY, wz]} rotation={[0, rotY, 0]}>
              {/* Sky panel — emissive so it reads as a light source */}
              <mesh position={[0, 0, -0.04]}>
                <shapeGeometry args={[sky, 32]} />
                <meshStandardMaterial
                  color="#5a96c0"
                  emissive="#7ab8e0"
                  emissiveIntensity={1.4}
                  side={THREE.DoubleSide}
                  roughness={0.2}
                />
              </mesh>

              {/* Stone arch frame — shares the same brick texture for continuity */}
              <mesh position={[0, 0, 0.02]}>
                <shapeGeometry args={[frame, 32]} />
                <meshStandardMaterial
                  map={wallTex}
                  color="#d0c8b8"
                  roughness={0.92}
                  side={THREE.DoubleSide}
                />
              </mesh>

              {/* Keystone accent */}
              <mesh position={[0, wh / 2 - 0.12, 0.04]}>
                <boxGeometry args={[0.20, 0.24, 0.10]} />
                <meshStandardMaterial color="#b0a48a" roughness={0.85} />
              </mesh>

              {/* Left floor-to-ceiling curtain */}
              <mesh position={[-(ww / 2 + 0.42), curtainCY, 0.26]}>
                <boxGeometry args={[0.36, curtainH, 0.15]} />
                <meshStandardMaterial color="#14306b" roughness={0.88} />
              </mesh>

              {/* Right floor-to-ceiling curtain */}
              <mesh position={[ww / 2 + 0.42, curtainCY, 0.26]}>
                <boxGeometry args={[0.36, curtainH, 0.15]} />
                <meshStandardMaterial color="#14306b" roughness={0.88} />
              </mesh>

              {/* Sill */}
              <mesh position={[0, -(wh / 2), 0.11]}>
                <boxGeometry args={[ww + 0.72, 0.18, 0.32]} />
                <meshStandardMaterial color="#a09074" roughness={0.85} />
              </mesh>
            </group>
          )
        })
      })}
    </group>
  )
}
