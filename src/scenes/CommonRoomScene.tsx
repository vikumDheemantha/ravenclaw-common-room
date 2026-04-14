import { useEffect } from 'react'
import { PointerLockControls, ContactShadows } from '@react-three/drei'
import { Dome } from '../components/room/Dome'
import { CircularWalls } from '../components/room/CircularWalls'
import { Floor } from '../components/room/Floor'
import { BookshelfWall } from '../components/room/BookshelfWall'
import { Statue } from '../components/room/Statue'
import { WritingDesk } from '../components/room/WritingDesk'
import { Armchair } from '../components/room/Armchair'
import { GlobeStand } from '../components/room/GlobeStand'
import { InteractableObject } from '../components/interaction/InteractableObject'
import { useFirstPersonControls } from '../hooks/useFirstPersonControls'
import { useInteraction } from '../hooks/useInteraction'
import { useGameStore } from '../store/useGameStore'
import { registerCollider, unregisterCollider } from '../store/collidersRegistry'

interface Props {
  onFocusChange: (focused: boolean) => void
}

const RADIUS = 20
const HEIGHT = 12

export function CommonRoomScene({ onFocusChange }: Props) {
  useFirstPersonControls({
    circularBoundary: RADIUS,
  })
  const focused = useInteraction()
  const setScene = useGameStore((s) => s.setScene)

  // Block the door opening so the player can't walk into the circular wall gap
  useEffect(() => {
    registerCollider('entrance-door-block', { minX: -1.4, maxX: 1.4, minZ: -20.5, maxZ: -18.8 })
    return () => unregisterCollider('entrance-door-block')
  }, [])

  useEffect(() => {
    onFocusChange(!!focused)
  }, [focused, onFocusChange])

  // When the entrance door tooltip appears, transition back to the entry scene
  const tooltip = useGameStore((s) => s.tooltip)
  useEffect(() => {
    if (tooltip?.title === 'Tower Entrance') {
      const timer = setTimeout(() => setScene('entry'), 1200)
      return () => clearTimeout(timer)
    }
  }, [tooltip, setScene])

  // Positions for 4 bookshelves at N/E/S/W, back-aligned to the inner wall surface
  const shelfDist = RADIUS - 0.6
  const shelfPositions: Array<{
    id: string
    position: [number, number, number]
    rotationY: number
  }> = [
    { id: 'shelf-n', position: [0, 0, -shelfDist], rotationY: 0 },
    { id: 'shelf-e', position: [shelfDist, 0, 0], rotationY: -Math.PI / 2 },
    { id: 'shelf-s', position: [0, 0, shelfDist], rotationY: Math.PI },
    { id: 'shelf-w', position: [-shelfDist, 0, 0], rotationY: Math.PI / 2 },
  ]

  return (
    <>
      <ambientLight intensity={1.2} />
      <pointLight position={[2, 3, 2]} intensity={20} color="#ffd8a0" distance={16} decay={1.6} />
      <pointLight position={[0, 10, 0]} intensity={5} color="#7a95d6" distance={35} decay={1} />

      <Floor radius={RADIUS} />
      <CircularWalls radius={RADIUS} height={HEIGHT} />
      <Dome radius={RADIUS} height={HEIGHT} />

      {shelfPositions.map((s) => (
        <BookshelfWall key={s.id} {...s} />
      ))}

      <Statue position={[0, 0, -RADIUS * 0.55]} />
      <WritingDesk id="desk-1" position={[3, 0, -4]} rotationY={-Math.PI / 6} />
      <Armchair id="chair-1" position={[-2, 0, 2]} rotationY={Math.PI / 4} />
      <Armchair id="chair-2" position={[2, 0, 2]} rotationY={-Math.PI / 4} />
      <Armchair id="chair-3" position={[-3, 0, -2]} rotationY={Math.PI / 2.5} />
      <Armchair id="chair-4" position={[3, 0, 0]} rotationY={-Math.PI / 2} />
      <GlobeStand id="globe-1" position={[4.5, 0, -4]} />

      {/* Tower Entrance Door — at the north edge of the circular room */}
      <InteractableObject
        descriptor={{
          id: 'tower-entrance',
          title: 'Tower Entrance',
          description: 'The bronze eagle knocker glints on the tower door. Press E to return to the entrance.',
        }}
        position={[0, 1.7, -19.2]}
      >
        {/* Door frame left side */}
        <mesh position={[-1.5, 0, 0]}>
          <boxGeometry args={[0.3, 3, 0.2]} />
          <meshStandardMaterial color="#4a3422" roughness={0.9} />
        </mesh>
        {/* Door frame right side */}
        <mesh position={[1.5, 0, 0]}>
          <boxGeometry args={[0.3, 3, 0.2]} />
          <meshStandardMaterial color="#4a3422" roughness={0.9} />
        </mesh>
        {/* Door frame top (arch) */}
        <mesh position={[0, 1.5, 0]}>
          <boxGeometry args={[3.3, 0.3, 0.2]} />
          <meshStandardMaterial color="#4a3422" roughness={0.9} />
        </mesh>
        {/* Door panel — fills the frame opening */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2.7, 2.8, 0.12]} />
          <meshStandardMaterial color="#3d2a18" roughness={0.85} />
        </mesh>
        {/* Horizontal panel rail (middle cross-bar) */}
        <mesh position={[0, 0.2, 0.07]}>
          <boxGeometry args={[2.5, 0.1, 0.05]} />
          <meshStandardMaterial color="#2e1f10" roughness={0.9} />
        </mesh>
        {/* Eagle knocker on the door */}
        <mesh position={[0, 0.5, 0.15]}>
          <cylinderGeometry args={[0.22, 0.22, 0.05, 24]} />
          <meshStandardMaterial color="#CD7F32" metalness={0.8} roughness={0.3} />
        </mesh>
      </InteractableObject>

      {/* Ground shadows for visual grounding */}
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.35}
        scale={40}
        blur={1.5}
        far={8}
      />

      {/* ±80° vertical look clamp: minPolarAngle = 10°, maxPolarAngle = 170° */}
      <PointerLockControls
        minPolarAngle={Math.PI * 10 / 180}
        maxPolarAngle={Math.PI * 170 / 180}
      />
    </>
  )
}
