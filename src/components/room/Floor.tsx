import { useMemo } from 'react'
import * as THREE from 'three'
import { useTexture } from '@react-three/drei'
import baseColorUrl from '../../Assets/texture/floor_sample_02/floor_sample_02 Dry_BaseColor.jpg'
import normalUrl    from '../../Assets/texture/floor_sample_02/floor_sample_02 Dry_Normal.jpg'
import aoUrl        from '../../Assets/texture/floor_sample_02/floor_sample_02 Dry_AmbientOcclusion.jpg'
import roughnessUrl from '../../Assets/texture/floor_sample_02/floor_sample_02 Dry_Roughness.jpg'

interface Props {
  radius?: number
  modelUrl?: string
}

/** World-unit side length of each floor tile. */
const TILE_SIZE = 4

/**
 * Returns [x, z, rotationY] for every grid position whose centre sits
 * inside the circular room floor.
 */
function buildGrid(radius: number, step: number): Array<[number, number, number]> {
  const count = Math.ceil(radius / step)
  const result: Array<[number, number, number]> = []
  const limit = radius + 2   // slight inset so tile edges don't poke through the wall base

  for (let ix = -count; ix <= count; ix++) {
    for (let iz = -count; iz <= count; iz++) {
      const x = ix * step
      const z = iz * step
      if (Math.sqrt(x * x + z * z) < limit) {
        // Rotate every other tile 90° for natural cobblestone variety.
        const rotY = ((ix + iz) & 1) ? Math.PI / 2 : 0
        result.push([x, z, rotY])
      }
    }
  }
  return result
}

export function Floor({ radius = 20 }: Props) {
  // Load PBR maps — useTexture suspends until all are ready.
  const [baseColor, normal, ao, roughness] = useTexture([
    baseColorUrl,
    normalUrl,
    aoUrl,
    roughnessUrl,
  ])

  // Single shared material for all tiles.
  const tileMat = useMemo(() => new THREE.MeshStandardMaterial({
    map:          baseColor,
    normalMap:    normal,
    // aoMap uses UV channel 1 — PlaneGeometry only has uv (channel 0),
    // so we assign the same attribute to both slots.
    aoMap:        ao,
    roughnessMap: roughness,
    roughness:    1.0,
    metalness:    0.0,
  }), [baseColor, normal, ao, roughness])

  const tiles = useMemo(() => buildGrid(radius, TILE_SIZE), [radius])

  return (
    <group>
      {/*
       * Dark mortar base disc — fills the perimeter gap where the tile grid
       * doesn't reach and acts as grout between tiles.
       */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[radius, 64]} />
        <meshStandardMaterial color="#3a332a" roughness={0.95} />
      </mesh>

      {/*
       * Flat plane tiles — using PlaneGeometry (not the FBX slab) so there
       * are no side faces to create border artefacts.  The normal map provides
       * the cobblestone depth illusion without any 3-D geometry.
       */}
      {tiles.map(([x, z, rotY], i) => (
        <mesh
          key={i}
          position={[x, 0.005, z]}
          rotation={[-Math.PI / 2, 0, rotY]}
          receiveShadow
          material={tileMat}
        >
          <planeGeometry args={[TILE_SIZE, TILE_SIZE]} />
        </mesh>
      ))}
    </group>
  )
}
