import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { PointerLockControls, ContactShadows } from '@react-three/drei'
import { Dome } from '../components/room/Dome'
import { CircularWalls } from '../components/room/CircularWalls'
import { Floor } from '../components/room/Floor'
import { BookshelfWall } from '../components/room/BookshelfWall'
import { Statue } from '../components/room/Statue'
import { WritingDesk } from '../components/room/WritingDesk'
import { Armchair } from '../components/room/Armchair'
import { GlobeStand } from '../components/room/GlobeStand'
import {
  CircularStaircase,
  STAIR_START_ANGLE,
  STAIR_END_ANGLE,
  STAIR_INNER_R,
  STAIR_OUTER_R,
  STAIR_TOP_Y,
} from '../components/room/CircularStaircase'
import { MezzanineFloor, MEZZANINE_Y } from '../components/room/MezzanineFloor'
import { InteractableObject } from '../components/interaction/InteractableObject'
import { useFirstPersonControls } from '../hooks/useFirstPersonControls'
import { useInteraction } from '../hooks/useInteraction'
import { useStaircaseElevation } from '../hooks/useStaircaseElevation'
import { useGameStore } from '../store/useGameStore'
import { registerCollider, unregisterCollider } from '../store/collidersRegistry'

interface Props {
  onFocusChange: (focused: boolean) => void
}

const RADIUS = 20
const HEIGHT = 20   // two generous stories: ground (0→8) + upper (8→20) + dome

export function CommonRoomScene({ onFocusChange }: Props) {
  const { camera } = useThree()

  // Spawn just inside the entrance, facing into the room.
  useEffect(() => {
    camera.position.set(0, 1.7, -16)
  }, [camera])

  // Staircase elevation → controls hook.
  const floorYRef = useStaircaseElevation({
    startAngle:  STAIR_START_ANGLE,
    endAngle:    STAIR_END_ANGLE,
    innerRadius: STAIR_INNER_R,
    outerRadius: STAIR_OUTER_R,
    topY:        STAIR_TOP_Y,
  })

  useFirstPersonControls({
    circularBoundary: RADIUS,
    floorYRef,
  })

  const focused  = useInteraction()
  const setScene = useGameStore((s) => s.setScene)

  useEffect(() => {
    onFocusChange(!!focused)
  }, [focused, onFocusChange])

  // Return to the entry corridor when the player interacts with the entrance door.
  const tooltip = useGameStore((s) => s.tooltip)
  useEffect(() => {
    if (tooltip?.title === 'Tower Entrance') {
      const timer = setTimeout(() => setScene('entry'), 1200)
      return () => clearTimeout(timer)
    }
  }, [tooltip, setScene])

  // Fixed colliders: entrance-door gap blocker only.
  // The staircase has no central pole so no pole collider is needed.
  useEffect(() => {
    registerCollider('entrance-door-block', { minX: -1.4, maxX: 1.4, minZ: -20.5, maxZ: -18.8 })
    return () => unregisterCollider('entrance-door-block')
  }, [])

  // Ground-floor bookshelves — N/E/S/W at the inner wall surface.
  const shelfDist = RADIUS - 0.6
  const shelfPositions: Array<{
    id: string
    position: [number, number, number]
    rotationY: number
  }> = [
    { id: 'shelf-n', position: [0,          0, -shelfDist], rotationY: 0          },
    { id: 'shelf-e', position: [shelfDist,  0,  0         ], rotationY: -Math.PI / 2 },
    { id: 'shelf-s', position: [0,          0,  shelfDist ], rotationY: Math.PI   },
    { id: 'shelf-w', position: [-shelfDist, 0,  0         ], rotationY: Math.PI / 2 },
  ]

  // Upper-floor bookshelves — same XZ wall positions, seated on the mezzanine.
  // Because the XZ bounds are identical to the ground-floor shelves, no new
  // collision AABBs are introduced.
  const upperShelfPositions = shelfPositions.map(s => ({
    ...s,
    id: `${s.id}-upper`,
    position: [s.position[0], MEZZANINE_Y, s.position[2]] as [number, number, number],
  }))

  return (
    <>
      {/* ── Lighting ─────────────────────────────────────────────────────── */}
      <ambientLight intensity={1.1} />
      {/* Warm candlelight — ground floor hearth area */}
      <pointLight position={[2, 3, 2]}    intensity={22}  color="#ffd8a0" distance={18} decay={1.6} />
      {/* Cool moonlight — floods down from the dome */}
      <pointLight position={[0, 14, 0]}   intensity={6}   color="#7a95d6" distance={45} decay={1}   />
      {/* Upper-floor sconce lights */}
      <pointLight position={[-5, 11, -5]} intensity={18}  color="#ffd0a0" distance={20} decay={1.5} />
      <pointLight position={[6,  11,  8]} intensity={14}  color="#ffd8a0" distance={18} decay={1.5} />

      {/* ── Shell ────────────────────────────────────────────────────────── */}
      <Floor radius={RADIUS} />
      <CircularWalls radius={RADIUS} height={HEIGHT} mezzanineY={MEZZANINE_Y} />
      <Dome radius={RADIUS} height={HEIGHT} />

      {/* ── Ground-floor furnishings ──────────────────────────────────────── */}
      {shelfPositions.map((s) => (
        <BookshelfWall key={s.id} {...s} />
      ))}

      <Statue position={[0, 0, -RADIUS * 0.55]} />
      <WritingDesk id="desk-1" position={[3,  0, -4]} rotationY={-Math.PI / 6} />
      <Armchair   id="chair-1" position={[-2, 0,  2]} rotationY={ Math.PI / 4} />
      <Armchair   id="chair-2" position={[ 2, 0,  2]} rotationY={-Math.PI / 4} />
      <Armchair   id="chair-3" position={[-3, 0, -2]} rotationY={ Math.PI / 2.5} />
      <Armchair   id="chair-4" position={[ 3, 0,  0]} rotationY={-Math.PI / 2} />
      <GlobeStand id="globe-1" position={[4.5, 0, -4]} />

      {/* ── Grand wall staircase + mezzanine ─────────────────────────────── */}
      <CircularStaircase />
      <MezzanineFloor />

      {/* ── Upper-floor furnishings ───────────────────────────────────────── */}
      {upperShelfPositions.map((s) => (
        <BookshelfWall key={s.id} {...s} />
      ))}

      {/* Telescope near the NE upper window */}
      <group position={[10, MEZZANINE_Y, -14]}>
        <mesh rotation={[0, 0, -Math.PI / 5]} position={[0, 1.1, 0]}>
          <cylinderGeometry args={[0.09, 0.14, 1.6, 16]} />
          <meshStandardMaterial color="#4a3e22" metalness={0.55} roughness={0.5} />
        </mesh>
        <mesh rotation={[0, 0, -Math.PI / 5]} position={[0.48, 1.6, 0]}>
          <cylinderGeometry args={[0.095, 0.095, 0.08, 16]} />
          <meshStandardMaterial color="#2a1f0e" metalness={0.3} roughness={0.7} />
        </mesh>
        <mesh rotation={[0.35,  0.5, 0]} position={[-0.25, 0.45,  0.2]}>
          <cylinderGeometry args={[0.025, 0.025, 0.95, 8]} />
          <meshStandardMaterial color="#3a2e1a" roughness={0.85} />
        </mesh>
        <mesh rotation={[0.35, -0.5, 0]} position={[0.25,  0.45,  0.2]}>
          <cylinderGeometry args={[0.025, 0.025, 0.95, 8]} />
          <meshStandardMaterial color="#3a2e1a" roughness={0.85} />
        </mesh>
        <mesh rotation={[-0.45, 0, 0]} position={[0, 0.45, -0.25]}>
          <cylinderGeometry args={[0.025, 0.025, 0.95, 8]} />
          <meshStandardMaterial color="#3a2e1a" roughness={0.85} />
        </mesh>
      </group>

      {/* Star chart scroll on the upper reading ledge */}
      <mesh position={[-7, MEZZANINE_Y + 0.02, -16]} rotation={[-Math.PI / 2, 0, 0.3]}>
        <planeGeometry args={[0.6, 0.9]} />
        <meshStandardMaterial color="#f4e9cf" roughness={0.95} />
      </mesh>

      {/* ── Tower Entrance Door ───────────────────────────────────────────── */}
      <InteractableObject
        descriptor={{
          id: 'tower-entrance',
          title: 'Tower Entrance',
          description: 'The bronze eagle knocker glints on the tower door. Press E to return to the entrance.',
        }}
        position={[0, 1.7, -19.2]}
      >
        <mesh position={[-1.5, 0, 0]}>
          <boxGeometry args={[0.3, 3, 0.2]} />
          <meshStandardMaterial color="#4a3422" roughness={0.9} />
        </mesh>
        <mesh position={[1.5, 0, 0]}>
          <boxGeometry args={[0.3, 3, 0.2]} />
          <meshStandardMaterial color="#4a3422" roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.5, 0]}>
          <boxGeometry args={[3.3, 0.3, 0.2]} />
          <meshStandardMaterial color="#4a3422" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2.7, 2.8, 0.12]} />
          <meshStandardMaterial color="#3d2a18" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.2, 0.07]}>
          <boxGeometry args={[2.5, 0.1, 0.05]} />
          <meshStandardMaterial color="#2e1f10" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.5, 0.15]}>
          <cylinderGeometry args={[0.22, 0.22, 0.05, 24]} />
          <meshStandardMaterial color="#CD7F32" metalness={0.8} roughness={0.3} />
        </mesh>
      </InteractableObject>

      {/* ── Ground shadows ────────────────────────────────────────────────── */}
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.35}
        scale={40}
        blur={1.5}
        far={8}
      />

      {/* ── Camera look clamp: ±80° vertical ─────────────────────────────── */}
      <PointerLockControls
        minPolarAngle={Math.PI * 10 / 180}
        maxPolarAngle={Math.PI * 170 / 180}
      />
    </>
  )
}
