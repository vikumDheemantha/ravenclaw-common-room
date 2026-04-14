import { useEffect } from 'react'
import { InteractableObject } from '../interaction/InteractableObject'
import { registerCollider, unregisterCollider } from '../../store/collidersRegistry'

interface Props {
  id: string
  position: [number, number, number]
  rotationY?: number
  modelUrl?: string
}

export function Armchair({ id, position, rotationY = 0 }: Props) {
  useEffect(() => {
    registerCollider(`chair-${id}`, {
      minX: position[0] - 0.55,
      maxX: position[0] + 0.55,
      minZ: position[2] - 0.55,
      maxZ: position[2] + 0.55,
    })
    return () => unregisterCollider(`chair-${id}`)
  }, [id, position])

  const velvet = '#14306b'

  return (
    <InteractableObject
      descriptor={{
        id,
        title: 'Velvet Armchair',
        description:
          'The velvet is worn soft from centuries of students reading by firelight.',
      }}
      position={position}
    >
      <group rotation={[0, rotationY, 0]}>
        {/* Seat */}
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[1.0, 0.25, 1.0]} />
          <meshStandardMaterial color={velvet} roughness={0.85} />
        </mesh>
        {/* Backrest */}
        <mesh position={[0, 1.0, -0.4]}>
          <boxGeometry args={[1.0, 1.0, 0.2]} />
          <meshStandardMaterial color={velvet} roughness={0.85} />
        </mesh>
        {/* Arms */}
        <mesh position={[-0.45, 0.75, 0]}>
          <boxGeometry args={[0.18, 0.6, 1.0]} />
          <meshStandardMaterial color={velvet} roughness={0.85} />
        </mesh>
        <mesh position={[0.45, 0.75, 0]}>
          <boxGeometry args={[0.18, 0.6, 1.0]} />
          <meshStandardMaterial color={velvet} roughness={0.85} />
        </mesh>
      </group>
    </InteractableObject>
  )
}
