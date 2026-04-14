import { useEffect } from 'react'
import { PointerLockControls } from '@react-three/drei'
import { InteractableObject } from '../components/interaction/InteractableObject'
import { useFirstPersonControls } from '../hooks/useFirstPersonControls'
import { useInteraction } from '../hooks/useInteraction'
import { useGameStore } from '../store/useGameStore'
import {
  registerCollider,
  unregisterCollider,
  clearAllColliders,
} from '../store/collidersRegistry'

interface Props {
  onFocusChange: (focused: boolean) => void
  onEnter: () => void
}

export function EntryScene({ onFocusChange, onEnter }: Props) {
  useFirstPersonControls()
  const focused = useInteraction()
  const tooltip = useGameStore((s) => s.tooltip)

  useEffect(() => {
    onFocusChange(!!focused)
  }, [focused, onFocusChange])

  // When the knocker tooltip appears, trigger the transition to the common room.
  useEffect(() => {
    if (tooltip?.title === 'The Eagle Knocker') {
      const timer = setTimeout(onEnter, 1500)
      return () => clearTimeout(timer)
    }
  }, [tooltip, onEnter])

  // Corridor colliders (two side walls + back wall)
  useEffect(() => {
    clearAllColliders()
    registerCollider('corridor-left',  { minX: -2.5, maxX: -2.0, minZ: -10, maxZ: 1 })
    registerCollider('corridor-right', { minX: 2.0,  maxX: 2.5,  minZ: -10, maxZ: 1 })
    registerCollider('corridor-back',  { minX: -2.5, maxX: 2.5,  minZ: 0.5, maxZ: 1 })
    return () => clearAllColliders()
  }, [])

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 3, -4]} intensity={0.8} color="#e0b060" distance={10} />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -4]}>
        <planeGeometry args={[5, 12]} />
        <meshStandardMaterial color="#3a3530" roughness={1} />
      </mesh>
      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3.5, -4]}>
        <planeGeometry args={[5, 12]} />
        <meshStandardMaterial color="#2a2620" roughness={1} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-2.25, 1.75, -4]}>
        <boxGeometry args={[0.5, 3.5, 12]} />
        <meshStandardMaterial color="#5a5048" roughness={0.95} />
      </mesh>
      {/* Right wall */}
      <mesh position={[2.25, 1.75, -4]}>
        <boxGeometry args={[0.5, 3.5, 12]} />
        <meshStandardMaterial color="#5a5048" roughness={0.95} />
      </mesh>
      {/* Back wall (behind player) */}
      <mesh position={[0, 1.75, 1]}>
        <boxGeometry args={[5, 3.5, 0.5]} />
        <meshStandardMaterial color="#5a5048" roughness={0.95} />
      </mesh>
      {/* Door */}
      <mesh position={[0, 1.5, -9.9]}>
        <boxGeometry args={[2.4, 3, 0.2]} />
        <meshStandardMaterial color="#4a3422" roughness={0.9} />
      </mesh>

      {/* Eagle Knocker — a small bronze disc on the door */}
      <InteractableObject
        descriptor={{
          id: 'eagle-knocker',
          title: 'The Eagle Knocker',
          description: "The bronze eagle blinks. 'Knock, and answer wisely.'",
        }}
        position={[0, 1.7, -9.75]}
      >
        <mesh>
          <cylinderGeometry args={[0.22, 0.22, 0.05, 24]} />
          <meshStandardMaterial color="#CD7F32" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.12, 0.18, 16]} />
          <meshStandardMaterial color="#b0692a" metalness={0.7} roughness={0.3} />
        </mesh>
      </InteractableObject>

      {/* ±80° vertical look clamp */}
      <PointerLockControls
        minPolarAngle={Math.PI * 10 / 180}
        maxPolarAngle={Math.PI * 170 / 180}
      />
    </>
  )
}
