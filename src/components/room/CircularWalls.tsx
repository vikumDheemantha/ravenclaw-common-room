import * as THREE from 'three'

interface Props {
  radius?: number
  height?: number
  windowCount?: number
}

// We fake arched windows by placing sky panels around the cylinder wall
// between stone-coloured wall segments. Each window has drapes and a sill.
export function CircularWalls({
  radius = 20,
  height = 12,
  windowCount = 6,
}: Props) {
  // No AABB colliders needed — outer boundary is enforced by the circular
  // boundary option in useFirstPersonControls. This component is purely visual.

  const windowWidth = 2.2
  const windowHeight = height * 0.75
  const windowBottom = height * 0.05

  return (
    <group>
      {/* Cylinder interior wall (stone colour) */}
      <mesh>
        <cylinderGeometry args={[radius, radius, height, 64, 1, true]} />
        <meshStandardMaterial color="#d7cdb9" side={THREE.BackSide} roughness={0.95} />
      </mesh>

      {/* Windows + drapes distributed around */}
      {Array.from({ length: windowCount }).map((_, i) => {
        const a = (i / windowCount) * Math.PI * 2
        const wx = Math.cos(a) * (radius - 0.05)
        const wz = Math.sin(a) * (radius - 0.05)
        const rotY = -a + Math.PI / 2

        return (
          <group key={i} position={[wx, windowBottom + windowHeight / 2, wz]} rotation={[0, rotY, 0]}>
            {/* Sky/mountain panel seen through the window */}
            <mesh position={[0, 0, -0.02]}>
              <planeGeometry args={[windowWidth, windowHeight]} />
              <meshBasicMaterial color="#7aa3c7" />
            </mesh>
            {/* Arch frame - top arc */}
            <mesh position={[0, windowHeight / 2 - 0.4, 0]}>
              <torusGeometry args={[windowWidth / 2, 0.08, 8, 24, Math.PI]} />
              <meshStandardMaterial color="#3a2e20" />
            </mesh>
            {/* Left drape */}
            <mesh position={[-windowWidth / 2 - 0.35, 0, 0.05]}>
              <boxGeometry args={[0.2, windowHeight, 0.15]} />
              <meshStandardMaterial color="#14306b" roughness={0.85} />
            </mesh>
            {/* Right drape */}
            <mesh position={[windowWidth / 2 + 0.35, 0, 0.05]}>
              <boxGeometry args={[0.2, windowHeight, 0.15]} />
              <meshStandardMaterial color="#14306b" roughness={0.85} />
            </mesh>
            {/* Sill */}
            <mesh position={[0, -windowHeight / 2, 0.1]}>
              <boxGeometry args={[windowWidth + 0.8, 0.2, 0.35]} />
              <meshStandardMaterial color="#3a2e20" />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}
