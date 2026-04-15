import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useFBX } from '@react-three/drei'
import { InteractableObject } from '../interaction/InteractableObject'
import { registerCollider, unregisterCollider } from '../../store/collidersRegistry'
import mainFbxUrl  from '../../Assets/models/BookShelf_main.fbx'
import upperFbxUrl from '../../Assets/models/BookShelf_upper_floor.fbx'

interface Props {
  id: string
  position: [number, number, number]
  rotationY?: number
  /** 'main' uses BookShelf_main.fbx; 'upper' uses BookShelf_upper_floor.fbx */
  variant?: 'main' | 'upper'
  modelUrl?: string
}

/** Target width in world units for each model — tune independently. */
const TARGET_WIDTH_MAIN  = 6.0   // BookShelf_main — larger ground-floor unit
const TARGET_WIDTH_UPPER = 3.5   // BookShelf_upper_floor

interface ShelfTransform {
  clone:      THREE.Object3D
  modelScale: number
  ox: number
  oy: number
  oz: number
  scaledW: number
  scaledD: number
}

// ─── Upper-shelf MTL material map ────────────────────────────────────────────
// Derived from BookShelf_upper_floor.mtl (no external texture images).
// Ns → roughness via: 1 - sqrt(Ns/1000).  illum 3 = metallic reflection.
//
// The 14 Leather.* entries are individual book spines; the MTL gives them all
// the same neutral grey, so we cycle through a Ravenclaw-toned palette instead.
const BOOK_SPINE_COLORS = [
  '#1a2f6e', '#6b2020', '#2a5c2a', '#5c3d1a', '#1a4a3a',
  '#4a1a4a', '#5c4a10', '#2a2a50', '#4a2510', '#1a3a5c',
  '#3a1010', '#2a4a2a', '#50501a', '#1a1a40',
]

function makeStd(color: string, roughness: number, metalness = 0): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color, roughness, metalness,
    transparent: false, opacity: 1, depthWrite: true, side: THREE.FrontSide,
  })
}

// Map MTL material name → Three.js material.
// Leather.001 … Leather.013 are generated dynamically below.
const UPPER_MTL: Record<string, THREE.MeshStandardMaterial> = {
  Gold:          makeStd('#cd7f32', 0.25, 0.75),   // Ns 488, illum 3 → metallic bronze
  Wood:          makeStd('#4a3010', 0.55, 0.0),    // Ns 225, illum 2 → dark walnut
  Wood_Dust:     makeStd('#6a5030', 0.65, 0.0),    // same Ns, dusty lighter tone
  book_bounding: makeStd('#2a1a0a', 0.75, 0.0),    // Ns 225 → dark binding
  torn_paper:    makeStd('#e8dcc0', 0.90, 0.0),    // illum 1 → aged paper
}
// Base Leather (index 0) + Leather.001 … Leather.013
BOOK_SPINE_COLORS.forEach((col, i) => {
  const key = i === 0 ? 'Leather' : `Leather.${String(i).padStart(3, '0')}`
  UPPER_MTL[key] = makeStd(col, 0.60, 0.0)         // Ns 357, illum 3 (book spines)
})

// ─── Generic transform builder (used for the main shelf) ─────────────────────
function buildTransform(fbx: THREE.Group): ShelfTransform {
  const c = fbx.clone(true)

  c.traverse(child => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh
      mesh.castShadow    = true
      mesh.receiveShadow = true
      const fixMat = (m: THREE.Material) => {
        const mat    = m.clone()
        mat.transparent = false
        mat.opacity     = 1.0
        mat.depthWrite  = true
        mat.side        = THREE.FrontSide
        return mat
      }
      mesh.material = Array.isArray(mesh.material)
        ? (mesh.material as THREE.Material[]).map(fixMat)
        : fixMat(mesh.material as THREE.Material)
    }
  })

  c.updateMatrixWorld(true)
  const box  = new THREE.Box3().setFromObject(c)
  const size = box.getSize(new THREE.Vector3())
  const ctr  = box.getCenter(new THREE.Vector3())
  const s = TARGET_WIDTH_MAIN / Math.max(size.x, size.z, 0.001)

  return {
    clone: c, modelScale: s,
    ox: -ctr.x * s, oy: -box.min.y * s, oz: -ctr.z * s,
    scaledW: size.x * s, scaledD: size.z * s,
  }
}

// ─── Upper-shelf transform builder (applies MTL materials by name) ────────────
function buildUpperTransform(fbx: THREE.Group): ShelfTransform {
  const c = fbx.clone(true)

  c.traverse(child => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh
      mesh.castShadow    = true
      mesh.receiveShadow = true

      const applyMtl = (m: THREE.Material): THREE.Material => {
        const named = UPPER_MTL[m.name]
        if (named) return named          // use MTL-derived material
        // Fallback: clone + force opaque for anything not in the map
        const fallback    = m.clone()
        fallback.transparent = false
        fallback.opacity     = 1.0
        fallback.depthWrite  = true
        fallback.side        = THREE.FrontSide
        return fallback
      }

      mesh.material = Array.isArray(mesh.material)
        ? (mesh.material as THREE.Material[]).map(applyMtl)
        : applyMtl(mesh.material as THREE.Material)
    }
  })

  c.updateMatrixWorld(true)
  const box  = new THREE.Box3().setFromObject(c)
  const size = box.getSize(new THREE.Vector3())
  const ctr  = box.getCenter(new THREE.Vector3())
  const s = TARGET_WIDTH_UPPER / Math.max(size.x, size.z, 0.001)

  return {
    clone: c, modelScale: s,
    ox: -ctr.x * s, oy: -box.min.y * s, oz: -ctr.z * s,
    scaledW: size.x * s, scaledD: size.z * s,
  }
}

export function BookshelfWall({
  id,
  position,
  rotationY = 0,
  variant = 'main',
}: Props) {
  // Both FBX files are always loaded (useFBX caches by URL — one request each).
  const mainFbx  = useFBX(mainFbxUrl)
  const upperFbx = useFBX(upperFbxUrl)

  // Independent transforms per model so each can be tuned separately.
  const mainT  = useMemo(() => buildTransform(mainFbx),       [mainFbx])
  const upperT = useMemo(() => buildUpperTransform(upperFbx), [upperFbx])

  const active = variant === 'main' ? mainT : upperT

  // Register an AABB collider sized to the active variant's footprint.
  useEffect(() => {
    const cos   = Math.cos(rotationY)
    const sin   = Math.sin(rotationY)
    const halfW = Math.abs(cos) * (active.scaledW / 2) + Math.abs(sin) * (active.scaledD / 2)
    const halfD = Math.abs(sin) * (active.scaledW / 2) + Math.abs(cos) * (active.scaledD / 2)
    const colId = `shelf-${id}`
    registerCollider(colId, {
      minX: position[0] - halfW,
      maxX: position[0] + halfW,
      minZ: position[2] - halfD,
      maxZ: position[2] + halfD,
    })
    return () => unregisterCollider(colId)
  }, [id, position, rotationY, active.scaledW, active.scaledD])

  return (
    <InteractableObject
      descriptor={{
        id,
        title: 'Ancient Library',
        description: 'Rows of ancient texts — Arithmancy, Astronomy, the works of Merlin himself.',
      }}
      position={position}
    >
      <group rotation={[0, rotationY, 0]}>

        {/* ── BookShelf_main.fbx ─────────────────────────────────────────────
            Tune rotation={[0, X, 0]} here independently of the upper shelf. */}
        {variant === 'main' && (
          <primitive
            object={mainT.clone}
            scale={mainT.modelScale}
            position={[mainT.ox, mainT.oy, mainT.oz]}
            rotation={[0, Math.PI / 2, 0]}
          />
        )}

        {/* ── BookShelf_upper_floor.fbx ──────────────────────────────────────
            Tune rotation={[0, X, 0]} here independently of the main shelf. */}
        {variant === 'upper' && (
          <primitive
            object={upperT.clone}
            scale={upperT.modelScale}
            position={[upperT.ox, upperT.oy, upperT.oz]}
            rotation={[0, 0, 0]}
          />
        )}

      </group>
    </InteractableObject>
  )
}
