import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { InteractableObject } from '../interaction/InteractableObject'
import { registerCollider, unregisterCollider } from '../../store/collidersRegistry'

interface Props {
  id: string
  position: [number, number, number]
  modelUrl?: string
}

export function GlobeStand({ id, position }: Props) {
  const globeRef = useRef<THREE.Mesh>(null)

  useEffect(() => {
    registerCollider(`globe-${id}`, {
      minX: position[0] - 0.5,
      maxX: position[0] + 0.5,
      minZ: position[2] - 0.5,
      maxZ: position[2] + 0.5,
    })
    return () => unregisterCollider(`globe-${id}`)
  }, [id, position])

  useFrame((_, delta) => {
    if (globeRef.current) globeRef.current.rotation.y += delta * 0.25
  })

  return (
    <InteractableObject
      descriptor={{
        id,
        title: 'Celestial Globe',
        description:
          'A celestial globe, charmed to reflect the night sky above Hogwarts in real time.',
      }}
      position={position}
    >
      {/* Tripod base */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.05, 0.3, 0.8, 12]} />
        <meshStandardMaterial color="#3a2818" roughness={0.9} />
      </mesh>
      {/* Globe */}
      <mesh ref={globeRef} position={[0, 1.05, 0]}>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshStandardMaterial color="#0b1030" emissive="#23306b" emissiveIntensity={0.3} />
      </mesh>
    </InteractableObject>
  )
}
