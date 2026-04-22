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
import { RoundTable } from '../components/room/RoundTable'
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
const HEIGHT = 16   // two stories: grand ground floor (0→8) + gallery mezzanine (8→16) + dome

// ─── Table-and-chair group layout ────────────────────────────────────────────
// Each group: one round table with chairs evenly spaced around it.
// Angles use the standard (x=cosA, z=sinA) convention; chairs face inward via
// rotationY = atan2(-cosA, -sinA).
interface TableGroup {
  tableId:   string
  tablePos:  [number, number, number]
  chairCount: number
  chairRadius: number
  startAngle: number
}

const TABLE_GROUPS: TableGroup[] = [
  // Centre-south — main gathering spot (4 chairs, slightly offset for organic feel)
  { tableId: 'centre', tablePos: [0,  0, 7], chairCount: 4, chairRadius: 1.5, startAngle: Math.PI / 4 },
  // East alcove — quieter reading pair-plus (3 chairs)
  { tableId: 'east',   tablePos: [9,  0, 1], chairCount: 3, chairRadius: 1.4, startAngle: Math.PI },
  // West alcove — mirror of east (3 chairs)
  { tableId: 'west',   tablePos: [-9, 0, 1], chairCount: 3, chairRadius: 1.4, startAngle: 0 },
]

function buildChairs(group: TableGroup) {
  const { tableId, tablePos, chairCount, chairRadius, startAngle } = group
  return Array.from({ length: chairCount }, (_, i) => {
    const a = startAngle + (i / chairCount) * Math.PI * 2
    return {
      id:        `chair-${tableId}-${i}`,
      position:  [
        tablePos[0] + Math.cos(a) * chairRadius,
        0,
        tablePos[2] + Math.sin(a) * chairRadius,
      ] as [number, number, number],
      rotationY: Math.atan2(-Math.cos(a), -Math.sin(a)),
    }
  })
}

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

  const focused             = useInteraction()
  const setScene            = useGameStore((s) => s.setScene)
  const setInteractionOpen  = useGameStore((s) => s.setInteractionOpen)

  useEffect(() => {
    onFocusChange(!!focused)
  }, [focused, onFocusChange])

  // Return to the entry corridor only when the player explicitly interacts (presses E)
  // near the entrance door — not merely by walking past it.
  const tooltip             = useGameStore((s) => s.tooltip)
  const interactionOpen     = useGameStore((s) => s.interactionOpen)
  useEffect(() => {
    if (interactionOpen && tooltip?.title === 'Tower Entrance') {
      const timer = setTimeout(() => {
        setScene('entry')
        setInteractionOpen(false)
      }, 1200)
      return () => clearTimeout(timer)
    }
  }, [interactionOpen, tooltip, setScene, setInteractionOpen])

  // Fixed colliders: entrance-door gap blocker only.
  // The staircase has no central pole so no pole collider is needed.
  useEffect(() => {
    registerCollider('entrance-door-block', { minX: -1.4, maxX: 1.4, minZ: -20.5, maxZ: -18.8 })
    return () => unregisterCollider('entrance-door-block')
  }, [])

  // Bookshelves sit at midpoints between windows (windows at (i/10)·2π).
  // The 270° north slot is skipped — entrance door + statue occupy that wall.
  const shelfDist = RADIUS - 0.6
  const A_SE  = 3  * Math.PI / 10   // 54°  — between i=1 (36°) and i=2 (72°)
  const A_SW  = 7  * Math.PI / 10   // 126° — between i=3 (108°) and i=4 (144°)
  const A_ESE = 1  * Math.PI / 10   // 18°  — between i=0 (0°) and i=1 (36°)
  const A_WSW = 9  * Math.PI / 10   // 162° — between i=4 (144°) and i=5 (180°)
  const A_WNW = 11 * Math.PI / 10   // 198° — between i=5 (180°) and i=6 (216°)
  const A_NW  = 13 * Math.PI / 10   // 234° — between i=6 (216°) and i=7 (252°)
  const A_NE  = 17 * Math.PI / 10   // 306° — between i=8 (288°) and i=9 (324°)
  const A_ENE = 19 * Math.PI / 10   // 342° — between i=9 (324°) and i=0 (0°)

  const wallPos = (a: number): [number, number, number] =>
    [Math.cos(a) * shelfDist, 0, Math.sin(a) * shelfDist]
  const wallRot = (a: number) => Math.atan2(-Math.cos(a), -Math.sin(a))

  const shelfPositions: Array<{
    id: string
    position: [number, number, number]
    rotationY: number
    variant: 'main' | 'upper'
  }> = [
    // ── South cluster (original three) ──────────────────────────────────────
    { id: 'shelf-s',   position: [0, 0, shelfDist], rotationY: Math.PI,       variant: 'main'  },
    { id: 'shelf-se',  position: wallPos(A_SE),      rotationY: wallRot(A_SE), variant: 'main'  },
    { id: 'shelf-sw',  position: wallPos(A_SW),      rotationY: wallRot(A_SW), variant: 'upper' },
    // ── East & west flanks ──────────────────────────────────────────────────
    { id: 'shelf-ese', position: wallPos(A_ESE),     rotationY: wallRot(A_ESE), variant: 'main'  },
    { id: 'shelf-wsw', position: wallPos(A_WSW),     rotationY: wallRot(A_WSW), variant: 'main'  },
    { id: 'shelf-wnw', position: wallPos(A_WNW),     rotationY: wallRot(A_WNW), variant: 'upper' },
    // ── North flanks (270° slot skipped — entrance door) ────────────────────
    { id: 'shelf-nw',  position: wallPos(A_NW),      rotationY: wallRot(A_NW),  variant: 'main'  },
    { id: 'shelf-ne',  position: wallPos(A_NE),      rotationY: wallRot(A_NE),  variant: 'main'  },
    { id: 'shelf-ene', position: wallPos(A_ENE),     rotationY: wallRot(A_ENE), variant: 'upper' },
  ]

  // Upper-floor: same XZ positions at mezzanine height, variants swapped for variety.
  const upperShelfPositions = shelfPositions.map((s) => ({
    ...s,
    id: `${s.id}-upper`,
    position: [s.position[0], MEZZANINE_Y, s.position[2]] as [number, number, number],
    variant: (s.variant === 'main' ? 'upper' : 'main') as 'main' | 'upper',
  }))

  return (
    <>
      {/* ══ LIGHTING ════════════════════════════════════════════════════════
           Two-storey strategy
           ─────────────────────────────────────────────────────────────────
           Bookshelves sit at N/E/S/W (r ≈ 19.4).  Sconces are placed at the
           four diagonal corners (r ≈ 18.4), so every shelf has two warm
           sources within ~15 units, one on each flank.

           Ground floor:  sconces at y = 3.5  (eye-level halo)
           Upper floor:   lanterns at y = 10.5 (2.5 u above mezzanine)
           Both floors share a centre-fill light for the walkable core.
           Dome:          single cool moonlight high in the night sky.
           ════════════════════════════════════════════════════════════════ */}

      {/* Ambient — lifts the shadow floor so nothing is pure black */}
      <ambientLight intensity={1.6} />

      {/* ── Ground floor sconces (diagonal corners, r ≈ 18.4, y = 3.5) ─── */}
      <pointLight position={[ 13, 3.5, -13]} intensity={24} color="#ffc060" distance={30} decay={1.5} />
      <pointLight position={[ 13, 3.5,  13]} intensity={24} color="#ffc060" distance={30} decay={1.5} />
      <pointLight position={[-13, 3.5,  13]} intensity={24} color="#ffc060" distance={30} decay={1.5} />
      <pointLight position={[-13, 3.5, -13]} intensity={24} color="#ffc060" distance={30} decay={1.5} />
      {/* Ground floor centre fill — hearth warmth */}
      <pointLight position={[0, 2.5, 0]} intensity={20} color="#ff9830" distance={22} decay={2} />

      {/* ── Upper floor lanterns (same diagonal corners, y = 11.5 = mezzanine+3.5) ── */}
      <pointLight position={[ 13, 11.5, -13]} intensity={28} color="#ffd0a0" distance={32} decay={1.5} />
      <pointLight position={[ 13, 11.5,  13]} intensity={28} color="#ffd0a0" distance={32} decay={1.5} />
      <pointLight position={[-13, 11.5,  13]} intensity={28} color="#ffd0a0" distance={32} decay={1.5} />
      <pointLight position={[-13, 11.5, -13]} intensity={28} color="#ffd0a0" distance={32} decay={1.5} />
      {/* Upper floor centre fill — lights the inner mezzanine ring */}
      <pointLight position={[0, 10, 0]} intensity={16} color="#ffd8a0" distance={26} decay={2} />

      {/* ── Dome — cool silver-blue moonlight from the night sky ─────────── */}
      <pointLight position={[0, 18, 0]} intensity={10} color="#7080c0" distance={65} decay={1} />

      {/* ── Shell ────────────────────────────────────────────────────────── */}
      <Floor radius={RADIUS} />
      <CircularWalls radius={RADIUS} height={HEIGHT} mezzanineY={MEZZANINE_Y} windowCount={10} />
      <Dome radius={RADIUS} height={HEIGHT} />

      {/* ── Ground-floor furnishings ──────────────────────────────────────── */}
      {shelfPositions.map((s) => (
        <BookshelfWall key={s.id} {...s} />
      ))}

      <Statue position={[0, 0, -RADIUS * 0.55]} />
      <WritingDesk id="desk-1" position={[3, 0, -4]} rotationY={-Math.PI / 6} />
      <GlobeStand  id="globe-1" position={[4.5, 0, -4]} />

      {/* ── Table + chair groups ──────────────────────────────────────────── */}
      {TABLE_GROUPS.map(group => (
        <group key={group.tableId}>
          <RoundTable id={group.tableId} position={group.tablePos} />
          {buildChairs(group).map(chair => (
            <Armchair key={chair.id} {...chair} />
          ))}
        </group>
      ))}

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
