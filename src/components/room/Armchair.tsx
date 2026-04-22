import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useFBX } from '@react-three/drei'
import { InteractableObject } from '../interaction/InteractableObject'
import { registerCollider, unregisterCollider } from '../../store/collidersRegistry'
import chairFbxUrl from '../../Assets/models/arm_chair_2.fbx'

interface Props {
  id: string
  position: [number, number, number]
  rotationY?: number
  modelUrl?: string
}

/** Chair width in world units (realistic armchair ≈ 0.85 m). */
const TARGET_WIDTH = 0.85
/** Lift applied on top of the bounding-box floor correction.
 *  arm_chair_2.fbx origin sits above the physical base, so the raw oy
 *  formula leaves the feet clipping through the floor. */
const Y_LIFT = 0.5

export function Armchair({ id, position, rotationY = 0 }: Props) {
  const fbx = useFBX(chairFbxUrl)

  const { clone, modelScale, ox, oy, oz, scaledW, scaledD } = useMemo(() => {
    const c = fbx.clone(true)

    // arm_chair_1.fbx is Y-up (exported from Rhino). No axis rotation needed.
    // DoubleSide handles any winding-order inconsistencies from the Rhino export.
    const mat = new THREE.MeshStandardMaterial({
      color:     '#1e2a5a',
      roughness: 0.80,
      metalness: 0.05,
      side:      THREE.DoubleSide,
    })

    c.traverse(child => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.material      = mat
        mesh.castShadow    = true
        mesh.receiveShadow = true
      }
    })

    c.updateMatrixWorld(true)
    const box  = new THREE.Box3().setFromObject(c)
    const size = box.getSize(new THREE.Vector3())
    const ctr  = box.getCenter(new THREE.Vector3())
    const s    = TARGET_WIDTH / Math.max(size.x, size.z, 0.001)

    return {
      clone:      c,
      modelScale: s,
      ox:      -ctr.x * s,
      oy:      -box.min.y * s + Y_LIFT,
      oz:      -ctr.z * s,
      scaledW: size.x * s,
      scaledD: size.z * s,
    }
  }, [fbx])

  useEffect(() => {
    registerCollider(`chair-${id}`, {
      minX: position[0] - scaledW / 2,
      maxX: position[0] + scaledW / 2,
      minZ: position[2] - scaledD / 2,
      maxZ: position[2] + scaledD / 2,
    })
    return () => unregisterCollider(`chair-${id}`)
  }, [id, position, scaledW, scaledD])

  return (
    <InteractableObject
      descriptor={{
        id,
        title: 'Ravenclaw Armchair',
        description: 'Deep sapphire velvet worn soft from centuries of students reading by firelight.',
      }}
      position={position}
    >
      <group rotation={[0, rotationY, 0]}>
        <primitive
          object={clone}
          scale={modelScale}
          position={[ox, oy, oz]}
        />
      </group>
    </InteractableObject>
  )
}
