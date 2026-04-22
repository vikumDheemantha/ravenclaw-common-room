import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useFBX, useTexture } from '@react-three/drei'
import { registerCollider, unregisterCollider } from '../../store/collidersRegistry'
import tableFbxUrl from '../../Assets/models/round_table_1.fbx'
import colorUrl    from '../../Assets/texture/round_table_1/round_table_1_Color.png'
import normalUrl   from '../../Assets/texture/round_table_1/round_table_1_Normal.png'

interface Props {
  id: string
  position: [number, number, number]
  modelUrl?: string
}

/** Table diameter in world units (scales to roughly 1.3 m for a 1.7 m player). */
const TARGET_WIDTH = 1.3

export function RoundTable({ id, position }: Props) {
  const fbx = useFBX(tableFbxUrl)
  const [colorTex, normalTex] = useTexture([colorUrl, normalUrl])

  const { clone, modelScale, ox, oy, oz } = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      map:       colorTex,
      normalMap: normalTex,
      roughness: 0.65,
      metalness: 0.05,
    })

    const c = fbx.clone(true)
    c.traverse(child => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.material      = mat
        mesh.castShadow    = true
        mesh.receiveShadow = true
      }
    })

    // Correct Z-up → Y-up orientation before measuring bounding box so that
    // the footprint (XZ) and floor offset (min Y) are both computed correctly.
    c.rotation.x = -Math.PI / 2
    c.updateMatrixWorld(true)
    const box  = new THREE.Box3().setFromObject(c)
    const size = box.getSize(new THREE.Vector3())
    const ctr  = box.getCenter(new THREE.Vector3())
    const s    = TARGET_WIDTH / Math.max(size.x, size.z, 0.001)

    return {
      clone:      c,
      modelScale: s,
      ox: -ctr.x * s,
      oy: -box.min.y * s,
      oz: -ctr.z * s,
    }
  }, [fbx, colorTex, normalTex])

  // Square AABB slightly larger than the table top for collision.
  useEffect(() => {
    const half = TARGET_WIDTH / 2 + 0.1
    registerCollider(`table-${id}`, {
      minX: position[0] - half,
      maxX: position[0] + half,
      minZ: position[2] - half,
      maxZ: position[2] + half,
    })
    return () => unregisterCollider(`table-${id}`)
  }, [id, position])

  return (
    <group position={position}>
      <primitive object={clone} scale={modelScale} position={[ox, oy, oz]} />
    </group>
  )
}
