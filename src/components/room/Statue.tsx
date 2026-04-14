import { useEffect } from 'react'
import { InteractableObject } from '../interaction/InteractableObject'
import { registerCollider, unregisterCollider } from '../../store/collidersRegistry'

interface Props {
  position: [number, number, number]
  modelUrl?: string
}

export function Statue({ position }: Props) {
  useEffect(() => {
    registerCollider('statue', {
      minX: position[0] - 0.8,
      maxX: position[0] + 0.8,
      minZ: position[2] - 0.8,
      maxZ: position[2] + 0.8,
    })
    return () => unregisterCollider('statue')
  }, [position])

  return (
    <InteractableObject
      descriptor={{
        id: 'statue',
        title: 'Rowena Ravenclaw',
        description:
          'Founder of this house, seeker of wisdom above all else. Her diadem is said to grant great wisdom to its wearer.',
      }}
      position={position}
    >
      {/* Plinth */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.7, 0.8, 0.8, 16]} />
        <meshStandardMaterial color="#e8e3d9" roughness={0.4} />
      </mesh>
      {/* Body */}
      <mesh position={[0, 2.0, 0]}>
        <capsuleGeometry args={[0.45, 1.8, 8, 16]} />
        <meshStandardMaterial color="#f0ece3" roughness={0.35} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 3.3, 0]}>
        <sphereGeometry args={[0.32, 24, 24]} />
        <meshStandardMaterial color="#f0ece3" roughness={0.35} />
      </mesh>
    </InteractableObject>
  )
}
