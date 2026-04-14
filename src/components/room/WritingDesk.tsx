import { useEffect } from 'react'
import { InteractableObject } from '../interaction/InteractableObject'
import { registerCollider, unregisterCollider } from '../../store/collidersRegistry'

interface Props {
  id: string
  position: [number, number, number]
  rotationY?: number
  modelUrl?: string
}

export function WritingDesk({ id, position, rotationY = 0 }: Props) {
  useEffect(() => {
    registerCollider(`desk-${id}`, {
      minX: position[0] - 0.9,
      maxX: position[0] + 0.9,
      minZ: position[2] - 0.6,
      maxZ: position[2] + 0.6,
    })
    return () => unregisterCollider(`desk-${id}`)
  }, [id, position])

  return (
    <InteractableObject
      descriptor={{
        id,
        title: 'Writing Desk',
        description:
          'Quills, parchment, and half-finished star charts. Someone was here recently.',
      }}
      position={position}
    >
      <group rotation={[0, rotationY, 0]}>
        {/* Top */}
        <mesh position={[0, 0.9, 0]}>
          <boxGeometry args={[1.6, 0.08, 1.0]} />
          <meshStandardMaterial color="#4a3422" roughness={0.85} />
        </mesh>
        {/* 4 legs */}
        {([[-0.7, 0.4, -0.45], [0.7, 0.4, -0.45], [-0.7, 0.4, 0.45], [0.7, 0.4, 0.45]] as [number, number, number][]).map((p, i) => (
          <mesh key={i} position={p}>
            <boxGeometry args={[0.1, 0.85, 0.1]} />
            <meshStandardMaterial color="#3a2818" roughness={0.9} />
          </mesh>
        ))}
        {/* Candle */}
        <mesh position={[0.55, 1.05, 0.2]}>
          <cylinderGeometry args={[0.05, 0.05, 0.22, 12]} />
          <meshStandardMaterial color="#f1e3bb" emissive="#e0b060" emissiveIntensity={0.6} />
        </mesh>
      </group>
    </InteractableObject>
  )
}
