import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Props {
  radius?: number
  height?: number
  modelUrl?: string
}

export function Dome({ radius = 20, height = 12 }: Props) {
  const domeRef = useRef<THREE.Group>(null)

  // Generate random star points as a Points object
  const starsGeom = useMemo(() => {
    const geom = new THREE.BufferGeometry()
    const count = 400
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      // Distribute on upper hemisphere just inside the dome
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random()) // 0..π/2 for upper hemisphere
      const r = radius * 0.98
      positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.cos(phi)
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
    }
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geom
  }, [radius])

  // Slow rotation (~1 RPM = 2π / 60 rad/s)
  useFrame((_, delta) => {
    if (domeRef.current) {
      domeRef.current.rotation.y += delta * (Math.PI * 2) / 60
    }
  })

  return (
    <group ref={domeRef} position={[0, height, 0]}>
      {/* Dome shell (interior-facing) */}
      <mesh>
        <sphereGeometry args={[radius, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#0b1030"
          side={THREE.BackSide}
          roughness={1}
          metalness={0}
        />
      </mesh>
      {/* Stars */}
      <points geometry={starsGeom}>
        <pointsMaterial
          color="#fce89a"
          size={0.12}
          sizeAttenuation
          transparent
          opacity={0.95}
        />
      </points>
    </group>
  )
}
