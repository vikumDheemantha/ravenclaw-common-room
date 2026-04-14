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
import { useFirstPersonControls } from '../hooks/useFirstPersonControls'
import { useInteraction } from '../hooks/useInteraction'

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

  useEffect(() => {
    onFocusChange(!!focused)
  }, [focused, onFocusChange])

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
      <ambientLight intensity={0.15} />
      <pointLight position={[2, 3, 2]} intensity={1.2} color="#ffd8a0" distance={14} decay={1.6} />
      <pointLight position={[0, 10, 0]} intensity={0.25} color="#7a95d6" distance={30} decay={1} />

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
