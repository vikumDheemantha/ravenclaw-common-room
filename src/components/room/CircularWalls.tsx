import { useMemo } from 'react'
import * as THREE from 'three'
import { useTexture, useFBX } from '@react-three/drei'
import brickTexUrl from '../../Assets/texture/brick-wall-background-texture.jpg'
import windowFbxUrl from '../../Assets/models/gothic-kit/SM_Window.fbx'

interface Props {
  radius?: number
  height?: number
  windowCount?: number
  /**
   * When provided, windows are split into a ground-floor tier (y = 0 → mezzanineY)
   * and an upper-floor tier (y = mezzanineY → height).
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
    const gWinH = (mezzanineY - 0.6) * 0.95   // taller ground-floor windows
    const gBot  = 1.0
    const uWinH = (height - mezzanineY - 1.4) * 0.93   // taller upper-floor windows
    const uBot  = mezzanineY + 0.7
    return [
      { centerY: gBot + gWinH / 2, winHeight: gWinH, winWidth: 3.8, floorY: 0,          ceilingY: mezzanineY },
      { centerY: uBot + uWinH / 2, winHeight: uWinH, winWidth: 4.2, floorY: mezzanineY, ceilingY: height     },
    ]
  }
  const winH = height * 0.78
  const bot  = height * 0.04
  return [{ centerY: bot + winH / 2, winHeight: winH, winWidth: 3.0, floorY: 0, ceilingY: height }]
}

/**
 * Gothic arch shape — sized to match the FBX frame's interior opening.
 * Slightly inset from the slot dimensions so it fits inside the stone border.
 */
function makeGothicArch(w: number, h: number): THREE.Shape {
  const half    = h / 2
  const springY = h * 0.60 - half
  const R       = w
  const shape   = new THREE.Shape()
  shape.moveTo(-w / 2, -half)
  shape.lineTo(-w / 2,  springY)
  shape.absarc( w / 2, springY, R, Math.PI,       (2 * Math.PI) / 3, true)
  shape.absarc(-w / 2, springY, R, Math.PI / 3,   0,                 true)
  shape.lineTo( w / 2, -half)
  shape.closePath()
  return shape
}

// ─── FBX window instance ───────────────────────────────────────────────────
// useFBX caches by URL — one network request shared by all instances.
// Each instance clones the cached tree so transforms are independent.
// Scale is auto-computed from the FBX bounding box so the model always fits
// the window slot width, regardless of the original export units.

interface WindowModelProps {
  winWidth:  number
  winHeight: number
  wallTex:   THREE.Texture
}

function WindowModel({ winWidth, winHeight, wallTex }: WindowModelProps) {
  const fbx = useFBX(windowFbxUrl)

  const { clone, sx, sy, cx, cy } = useMemo(() => {
    const c = fbx.clone(true)

    c.traverse(child => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.material = new THREE.MeshStandardMaterial({
          map:       wallTex,
          color:     '#d8d0c0',
          roughness: 0.90,
          metalness: 0.0,
        })
        mesh.castShadow    = true
        mesh.receiveShadow = true
      }
    })

    c.updateMatrixWorld(true)
    const box  = new THREE.Box3().setFromObject(c)
    const size = box.getSize(new THREE.Vector3())
    const ctr  = box.getCenter(new THREE.Vector3())

    // Independent X and Y scales so width and height are controlled separately.
    // Z scale follows X so depth stays proportional to width.
    const nativeW = Math.max(size.x, size.z, 0.001)
    const nativeH = Math.max(size.y,          0.02)
    const scaleX  = winWidth  / nativeW
    const scaleY  = winHeight / nativeH

    return { clone: c, sx: scaleX, sy: scaleY, cx: ctr.x, cy: ctr.y }
  }, [fbx, wallTex, winWidth, winHeight])

  // local -Z faces player; FBX at z=-0.12 is in front of the sky plane at z=-0.05.
  return (
    <primitive
      object={clone}
      scale={[sx, sy, sx]}
      position={[-cx * sx, -cy * sy, -0.12]}
      rotation={[0, Math.PI, 0]}
    />
  )
}

// ─── Main component ────────────────────────────────────────────────────────

export function CircularWalls({
  radius      = 20,
  height      = 12,
  windowCount = 10,
  mezzanineY,
}: Props) {
  const tiers = useMemo(() => buildTiers(height, mezzanineY), [height, mezzanineY])

  // Arch-shaped sky backing per tier — inset ~12% so it sits inside the stone border.
  const tierArchShapes = useMemo(() =>
    tiers.map(t => makeGothicArch(t.winWidth * 0.88, t.winHeight * 0.88)),
  [tiers])

  const brickTex = useTexture(brickTexUrl)

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

  const bumpTex = useMemo(() => {
    const t = wallTex.clone()
    t.needsUpdate = true
    return t
  }, [wallTex])

  return (
    <group>
      {/* Cylinder wall — floor-aligned (y = 0 → y = height) */}
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[radius, radius, height, 64, 1, true]} />
        <meshStandardMaterial
          map={wallTex}
          bumpMap={bumpTex}
          bumpScale={0.04}
          side={THREE.BackSide}
          roughness={0.88}
          color="#ffffff"
          emissive="#3a2a18"
          emissiveIntensity={0.12}
        />
      </mesh>

      {/* 4 shared window-ambient lights per tier (N / E / S / W) */}
      {tiers.map((tier, tierIdx) =>
        [0, 1, 2, 3].map(q => {
          const a = (q / 4) * Math.PI * 2
          return (
            <pointLight
              key={`wl-${tierIdx}-${q}`}
              position={[Math.cos(a) * (radius - 4), tier.centerY, Math.sin(a) * (radius - 4)]}
              intensity={14}
              color="#9bbdd4"
              distance={18}
              decay={2}
            />
          )
        })
      )}

      {/* Windows */}
      {tiers.map((tier, tierIdx) => {
        const { centerY, winHeight: wh, winWidth: ww, floorY, ceilingY } = tier
        const archShape = tierArchShapes[tierIdx]

        const curtainH  = ceilingY - floorY
        const curtainCY = (floorY + ceilingY) / 2 - centerY

        return Array.from({ length: windowCount }, (_, i) => {
          const a    = (i / windowCount) * Math.PI * 2
          const wx   = Math.cos(a) * (radius - 0.05)
          const wz   = Math.sin(a) * (radius - 0.05)
          const rotY = -a + Math.PI / 2

          return (
            <group key={`${tierIdx}-${i}`} position={[wx, centerY, wz]} rotation={[0, rotY, 0]}>
              {/*
               * Emissive sky backing — plain rectangle at z = -0.05.
               * Depth order (player → wall): FBX frame (z=-0.12) → sky rect (z=-0.05) → cylinder (z≈+0.04)
               * The FBX stone parts are closer so they occlude this; the arch opening has no
               * FBX geometry, so the sky rectangle shows through correctly.
               * A plain rect is safer than an arch shape because it fully fills any opening
               * regardless of FBX orientation, and is clipped by the cylinder wall from the sides.
               */}
              {/* Arch-shaped sky backing — inset so it fits inside the stone border.
                  rotation=[0,π,0] flips the shape to face the player (local -Z). */}
              <mesh position={[0, 0, -0.05]} rotation={[0, Math.PI, 0]}>
                <shapeGeometry args={[archShape, 32]} />
                <meshStandardMaterial
                  color="#5a96c0"
                  emissive="#7ab8e0"
                  emissiveIntensity={1.4}
                  roughness={0.2}
                />
              </mesh>

              {/* FBX gothic window frame — auto-scaled to fit this tier's slot */}
              <WindowModel winWidth={ww} winHeight={wh} wallTex={wallTex} />

              {/* Left floor-to-ceiling curtain */}
              <mesh position={[-(ww / 2 + 0.42), curtainCY, -0.30]}>
                <boxGeometry args={[0.36, curtainH, 0.15]} />
                <meshStandardMaterial color="#14306b" roughness={0.88} />
              </mesh>

              {/* Right floor-to-ceiling curtain */}
              <mesh position={[ww / 2 + 0.42, curtainCY, -0.30]}>
                <boxGeometry args={[0.36, curtainH, 0.15]} />
                <meshStandardMaterial color="#14306b" roughness={0.88} />
              </mesh>

            </group>
          )
        })
      })}
    </group>
  )
}
