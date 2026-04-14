import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { resolveMovement } from '../utils/collision'
import { getAllColliders } from '../store/collidersRegistry'

interface Options {
  walkSpeed?: number
  eyeHeight?: number
  playerRadius?: number
  circularBoundary?: number
  enabled?: boolean
  /**
   * When provided, camera.y is set to `floorYRef.current + eyeHeight` each
   * frame instead of the fixed `eyeHeight`.  Lets the staircase elevation hook
   * drive the player's vertical position without coupling the two hooks.
   */
  floorYRef?: React.MutableRefObject<number>
}

interface KeyState {
  forward: boolean
  back: boolean
  left: boolean
  right: boolean
}

export function useFirstPersonControls({
  walkSpeed = 5,
  eyeHeight = 1.7,
  playerRadius = 0.4,
  circularBoundary,
  enabled = true,
  floorYRef,
}: Options = {}) {
  const { camera } = useThree()
  const keys = useRef<KeyState>({
    forward: false,
    back: false,
    left: false,
    right: false,
  })

  useEffect(() => {
    camera.position.y = (floorYRef?.current ?? 0) + eyeHeight
  }, [camera, eyeHeight, floorYRef])

  useEffect(() => {
    if (!enabled) return
    const onDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp':    keys.current.forward = true; break
        case 'KeyS': case 'ArrowDown':  keys.current.back = true; break
        case 'KeyA': case 'ArrowLeft':  keys.current.left = true; break
        case 'KeyD': case 'ArrowRight': keys.current.right = true; break
      }
    }
    const onUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp':    keys.current.forward = false; break
        case 'KeyS': case 'ArrowDown':  keys.current.back = false; break
        case 'KeyA': case 'ArrowLeft':  keys.current.left = false; break
        case 'KeyD': case 'ArrowRight': keys.current.right = false; break
      }
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [enabled])

  const forward = useRef(new THREE.Vector3())
  const right = useRef(new THREE.Vector3())

  useFrame((_, delta) => {
    if (!enabled) return
    const k = keys.current
    const anyHeld = k.forward || k.back || k.left || k.right
    if (!anyHeld) return

    camera.getWorldDirection(forward.current)
    forward.current.y = 0
    forward.current.normalize()
    right.current.set(-forward.current.z, 0, forward.current.x) // cross with up

    const move = new THREE.Vector3()
    if (k.forward) move.add(forward.current)
    if (k.back) move.sub(forward.current)
    if (k.right) move.add(right.current)
    if (k.left) move.sub(right.current)

    if (move.lengthSq() === 0) return
    move.normalize().multiplyScalar(walkSpeed * delta)

    const resolved = resolveMovement(
      { x: camera.position.x, z: camera.position.z },
      { x: camera.position.x + move.x, z: camera.position.z + move.z },
      playerRadius,
      getAllColliders(),
      circularBoundary ? { circularRadius: circularBoundary } : {},
    )

    camera.position.x = resolved.x
    camera.position.z = resolved.z
    camera.position.y = (floorYRef?.current ?? 0) + eyeHeight
  })
}
