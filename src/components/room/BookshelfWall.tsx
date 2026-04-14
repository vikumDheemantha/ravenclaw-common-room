import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { InteractableObject } from '../interaction/InteractableObject'
import { registerCollider, unregisterCollider } from '../../store/collidersRegistry'

interface Props {
  id: string
  position: [number, number, number]
  rotationY?: number
  width?: number
  height?: number
  depth?: number
  modelUrl?: string
}

const BOOK_PALETTE = ['#14306b', '#8b4a2b', '#b8860b', '#3a2e20', '#2a4d8f', '#6b2c2c']

export function BookshelfWall({
  id,
  position,
  rotationY = 0,
  width = 4,
  height = 5,
  depth = 0.6,
}: Props) {
  const groupRef = useRef<THREE.Group>(null)

  const books = useMemo(() => {
    const rows = 4
    const rowHeight = height / (rows + 0.5)
    const items: Array<{
      pos: [number, number, number]
      size: [number, number, number]
      color: string
    }> = []
    for (let r = 0; r < rows; r++) {
      let x = -width / 2 + 0.15
      while (x < width / 2 - 0.15) {
        const bookW = 0.12 + Math.random() * 0.18
        const bookH = rowHeight * (0.7 + Math.random() * 0.25)
        items.push({
          pos: [x + bookW / 2, -height / 2 + (r + 0.5) * rowHeight, depth / 2 - 0.05],
          size: [bookW, bookH, 0.2],
          color: BOOK_PALETTE[Math.floor(Math.random() * BOOK_PALETTE.length)],
        })
        x += bookW + 0.015
      }
    }
    return items
  }, [width, height, depth])

  useEffect(() => {
    const cos = Math.cos(rotationY)
    const sin = Math.sin(rotationY)
    const halfW = Math.abs(cos) * (width / 2) + Math.abs(sin) * (depth / 2)
    const halfD = Math.abs(sin) * (width / 2) + Math.abs(cos) * (depth / 2)
    const colliderId = `shelf-${id}`
    registerCollider(colliderId, {
      minX: position[0] - halfW,
      maxX: position[0] + halfW,
      minZ: position[2] - halfD,
      maxZ: position[2] + halfD,
    })
    return () => unregisterCollider(colliderId)
  }, [id, position, rotationY, width, depth])

  return (
    <InteractableObject
      descriptor={{
        id,
        title: 'Ancient Library',
        description:
          'Rows of ancient texts — Arithmancy, Astronomy, the works of Merlin himself.',
      }}
      position={position}
    >
      <group ref={groupRef} rotation={[0, rotationY, 0]}>
        {/* Wooden frame */}
        <mesh position={[0, height / 2, 0]}>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial color="#3a2e20" roughness={0.9} />
        </mesh>
        {/* Books */}
        {books.map((b, i) => (
          <mesh key={i} position={[b.pos[0], b.pos[1] + height / 2, b.pos[2]]}>
            <boxGeometry args={b.size} />
            <meshStandardMaterial color={b.color} roughness={0.8} />
          </mesh>
        ))}
      </group>
    </InteractableObject>
  )
}
