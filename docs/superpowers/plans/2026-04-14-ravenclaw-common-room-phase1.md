# Ravenclaw Common Room — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-playable, first-person 3D Ravenclaw Common Room with all canonical elements, basic object tooltips, and an iconic eagle-knocker entry — no multiplayer, no avatars, no riddle mechanic yet.

**Architecture:** Vite SPA with React + TypeScript + React Three Fiber. Two scenes (Entry, CommonRoom) toggled by a Zustand store. Room built from Three.js primitives with a GLTF upgrade seam (`modelUrl` prop) on every object component. First-person WASD + PointerLock controls. AABB collision. Raycast-based object interaction with React UI overlay for tooltips.

**Tech Stack:** Vite 5, React 18, TypeScript 5, `@react-three/fiber` 8, `@react-three/drei` 9, `three` 0.160+, `zustand` 4, Vitest + React Testing Library.

**Design spec:** `docs/superpowers/specs/2026-04-14-ravenclaw-common-room-design.md`

---

## File Structure (Target)

```
ravenclaw-common-room/
├── public/textures/                 (texture placeholders)
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── App.module.css
│   ├── store/useGameStore.ts
│   ├── types/index.ts
│   ├── utils/
│   │   ├── collision.ts             (AABB math, pure)
│   │   └── collision.test.ts
│   ├── hooks/
│   │   ├── useFirstPersonControls.ts
│   │   ├── useFirstPersonControls.test.ts
│   │   ├── useInteraction.ts
│   │   └── useInteraction.test.ts
│   ├── scenes/
│   │   ├── EntryScene.tsx
│   │   └── CommonRoomScene.tsx
│   ├── components/
│   │   ├── room/
│   │   │   ├── Dome.tsx
│   │   │   ├── CircularWalls.tsx
│   │   │   ├── Floor.tsx
│   │   │   ├── BookshelfWall.tsx
│   │   │   ├── Statue.tsx
│   │   │   ├── WritingDesk.tsx
│   │   │   ├── Armchair.tsx
│   │   │   └── GlobeStand.tsx
│   │   ├── interaction/
│   │   │   ├── InteractableObject.tsx
│   │   │   └── Crosshair.tsx
│   │   └── ui/
│   │       ├── TooltipCard.tsx
│   │       ├── TooltipCard.module.css
│   │       ├── HUD.tsx
│   │       └── FadeOverlay.tsx
│   └── vite-env.d.ts
├── index.html
├── vite.config.ts
├── vitest.config.ts
├── tsconfig.json
└── package.json
```

---

## Task 1: Scaffold Vite + React + TypeScript Project

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`, `.gitignore`

- [ ] **Step 1: Scaffold the Vite template**

Run from project root (which currently only has `images/` and `docs/`):

```bash
cd /Users/vikumdheemantha/Projects/ravenclaw-common-room
npm create vite@latest . -- --template react-ts
```

When prompted about the non-empty directory, choose "Ignore files and continue".

- [ ] **Step 2: Install runtime dependencies**

```bash
npm install three @react-three/fiber @react-three/drei zustand
npm install -D @types/three
```

- [ ] **Step 3: Install test dependencies**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/ui
```

- [ ] **Step 4: Verify dev server starts**

Run `npm run dev` and confirm Vite starts on `http://localhost:5173` with the default React template. Press Ctrl+C to stop.

Expected: `VITE v5.x.x ready in N ms` and a default page loads.

- [ ] **Step 5: Clean the template boilerplate**

Replace `src/App.tsx` with:

```tsx
export default function App() {
  return <div>Ravenclaw Common Room — Phase 1</div>
}
```

Delete: `src/App.css`, `src/index.css`, `src/assets/react.svg`, `public/vite.svg`.

Replace `src/main.tsx` with:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

Update `index.html` title to `<title>Ravenclaw Common Room</title>` and remove the `vite.svg` favicon link.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TypeScript project with R3F deps"
```

---

## Task 2: Configure Vitest

**Files:**
- Create: `vitest.config.ts`, `src/test/setup.ts`
- Modify: `package.json` (add `test` script)
- Test: `src/test/smoke.test.ts` (delete after verifying)

- [ ] **Step 1: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

- [ ] **Step 2: Create `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 3: Add test scripts to `package.json`**

In the `scripts` block, add:

```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 4: Write a smoke test**

Create `src/test/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest'

describe('vitest smoke', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 5: Run tests**

```bash
npm run test:run
```

Expected: 1 test passes.

- [ ] **Step 6: Delete the smoke test and commit**

```bash
rm src/test/smoke.test.ts
git add -A
git commit -m "chore: configure Vitest with jsdom + testing-library"
```

---

## Task 3: Core Types + Zustand Store (TDD)

**Files:**
- Create: `src/types/index.ts`
- Create: `src/store/useGameStore.ts`
- Test: `src/store/useGameStore.test.ts`

- [ ] **Step 1: Define types in `src/types/index.ts`**

```ts
export type SceneId = 'entry' | 'common-room'

export interface Tooltip {
  title: string
  description: string
}

export interface InteractableDescriptor {
  id: string
  title: string
  description: string
}
```

- [ ] **Step 2: Write failing test `src/store/useGameStore.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './useGameStore'

describe('useGameStore', () => {
  beforeEach(() => {
    useGameStore.setState({ scene: 'entry', tooltip: null })
  })

  it('starts in the entry scene with no tooltip', () => {
    const state = useGameStore.getState()
    expect(state.scene).toBe('entry')
    expect(state.tooltip).toBeNull()
  })

  it('can change scene', () => {
    useGameStore.getState().setScene('common-room')
    expect(useGameStore.getState().scene).toBe('common-room')
  })

  it('can set and clear tooltips', () => {
    useGameStore.getState().setTooltip({ title: 'Eagle', description: 'Knock.' })
    expect(useGameStore.getState().tooltip).toEqual({
      title: 'Eagle',
      description: 'Knock.',
    })
    useGameStore.getState().setTooltip(null)
    expect(useGameStore.getState().tooltip).toBeNull()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npm run test:run -- src/store/useGameStore.test.ts
```

Expected: FAIL — module `./useGameStore` not found.

- [ ] **Step 4: Implement `src/store/useGameStore.ts`**

```ts
import { create } from 'zustand'
import type { SceneId, Tooltip } from '../types'

interface GameStore {
  scene: SceneId
  tooltip: Tooltip | null
  setScene: (s: SceneId) => void
  setTooltip: (t: Tooltip | null) => void
}

export const useGameStore = create<GameStore>((set) => ({
  scene: 'entry',
  tooltip: null,
  setScene: (scene) => set({ scene }),
  setTooltip: (tooltip) => set({ tooltip }),
}))
```

- [ ] **Step 5: Run test to verify pass**

```bash
npm run test:run -- src/store/useGameStore.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add core types and Zustand game store"
```

---

## Task 4: AABB Collision Utility (TDD)

**Files:**
- Create: `src/utils/collision.ts`
- Test: `src/utils/collision.test.ts`

- [ ] **Step 1: Write failing test `src/utils/collision.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { resolveMovement, type AABB } from './collision'

describe('resolveMovement', () => {
  const playerRadius = 0.4
  const wall: AABB = { minX: 5, maxX: 6, minZ: -5, maxZ: 5 }

  it('returns the desired position when no colliders intersect', () => {
    const result = resolveMovement(
      { x: 0, z: 0 },
      { x: 1, z: 0 },
      playerRadius,
      [wall],
    )
    expect(result).toEqual({ x: 1, z: 0 })
  })

  it('blocks movement through a wall on the X axis', () => {
    const result = resolveMovement(
      { x: 4, z: 0 },
      { x: 5.2, z: 0 },
      playerRadius,
      [wall],
    )
    // Player radius 0.4 means closest allowed x = 5 - 0.4 = 4.6
    expect(result.x).toBeCloseTo(4.6, 5)
    expect(result.z).toBe(0)
  })

  it('allows sliding along a wall (Z moves even if X is blocked)', () => {
    const result = resolveMovement(
      { x: 4.6, z: 0 },
      { x: 5.5, z: 2 },
      playerRadius,
      [wall],
    )
    expect(result.x).toBeCloseTo(4.6, 5)
    expect(result.z).toBe(2)
  })

  it('keeps the player inside a circular boundary', () => {
    const result = resolveMovement(
      { x: 0, z: 0 },
      { x: 100, z: 0 },
      playerRadius,
      [],
      { circularRadius: 20 },
    )
    expect(Math.hypot(result.x, result.z)).toBeLessThanOrEqual(20 - playerRadius + 1e-6)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- src/utils/collision.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/utils/collision.ts`**

```ts
export interface AABB {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

export interface Point2 {
  x: number
  z: number
}

interface ResolveOptions {
  /** Optional hard circular outer boundary. Player is clamped to radius - playerRadius. */
  circularRadius?: number
}

function collidesAABB(px: number, pz: number, r: number, box: AABB): boolean {
  const closestX = Math.max(box.minX, Math.min(px, box.maxX))
  const closestZ = Math.max(box.minZ, Math.min(pz, box.maxZ))
  const dx = px - closestX
  const dz = pz - closestZ
  return dx * dx + dz * dz < r * r
}

function resolveAxis(
  start: number,
  desired: number,
  other: number,
  axis: 'x' | 'z',
  r: number,
  boxes: AABB[],
): number {
  let pos = desired
  for (const b of boxes) {
    const px = axis === 'x' ? pos : other
    const pz = axis === 'z' ? pos : other
    if (collidesAABB(px, pz, r, b)) {
      if (axis === 'x') {
        pos = desired > start ? b.minX - r : b.maxX + r
      } else {
        pos = desired > start ? b.minZ - r : b.maxZ + r
      }
    }
  }
  return pos
}

export function resolveMovement(
  from: Point2,
  to: Point2,
  playerRadius: number,
  boxes: AABB[],
  options: ResolveOptions = {},
): Point2 {
  // Resolve X first, then Z, so the player can slide along walls.
  const x = resolveAxis(from.x, to.x, from.z, 'x', playerRadius, boxes)
  const z = resolveAxis(from.z, to.z, x, 'z', playerRadius, boxes)

  if (options.circularRadius !== undefined) {
    const maxR = options.circularRadius - playerRadius
    const dist = Math.hypot(x, z)
    if (dist > maxR) {
      const scale = maxR / dist
      return { x: x * scale, z: z * scale }
    }
  }

  return { x, z }
}
```

- [ ] **Step 4: Run test to verify pass**

```bash
npm run test:run -- src/utils/collision.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add AABB + circular-boundary collision resolver"
```

---

## Task 5: Interactables Registry + `useInteraction` Hook (TDD)

**Files:**
- Create: `src/store/interactablesRegistry.ts`
- Test: `src/store/interactablesRegistry.test.ts`

This lightweight registry holds the set of currently-registered interactable meshes. Room components register themselves on mount, unregister on unmount. The interaction hook queries this registry.

- [ ] **Step 1: Write failing test `src/store/interactablesRegistry.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import * as THREE from 'three'
import {
  registerInteractable,
  unregisterInteractable,
  findNearestInteractable,
  clearAllInteractables,
} from './interactablesRegistry'

describe('interactablesRegistry', () => {
  beforeEach(() => clearAllInteractables())

  function makeMesh(x: number, y: number, z: number): THREE.Object3D {
    const mesh = new THREE.Object3D()
    mesh.position.set(x, y, z)
    return mesh
  }

  it('returns null when there are no interactables', () => {
    const camera = new THREE.PerspectiveCamera()
    expect(findNearestInteractable(camera, 4)).toBeNull()
  })

  it('finds the nearest interactable in front of the camera within range', () => {
    const mesh = makeMesh(0, 0, -2)
    registerInteractable('test', { id: 'test', title: 'T', description: 'D' }, mesh)

    const camera = new THREE.PerspectiveCamera()
    camera.position.set(0, 0, 0)
    camera.lookAt(0, 0, -1)
    camera.updateMatrixWorld()

    const hit = findNearestInteractable(camera, 4)
    expect(hit?.id).toBe('test')
  })

  it('ignores interactables outside the range', () => {
    const mesh = makeMesh(0, 0, -10)
    registerInteractable('far', { id: 'far', title: 'F', description: 'D' }, mesh)

    const camera = new THREE.PerspectiveCamera()
    camera.position.set(0, 0, 0)
    camera.lookAt(0, 0, -1)
    camera.updateMatrixWorld()

    expect(findNearestInteractable(camera, 4)).toBeNull()
  })

  it('unregisters cleanly', () => {
    const mesh = makeMesh(0, 0, -2)
    registerInteractable('gone', { id: 'gone', title: 'G', description: 'D' }, mesh)
    unregisterInteractable('gone')

    const camera = new THREE.PerspectiveCamera()
    camera.position.set(0, 0, 0)
    camera.lookAt(0, 0, -1)
    camera.updateMatrixWorld()

    expect(findNearestInteractable(camera, 4)).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- src/store/interactablesRegistry.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/store/interactablesRegistry.ts`**

```ts
import * as THREE from 'three'
import type { InteractableDescriptor } from '../types'

interface Entry {
  descriptor: InteractableDescriptor
  object: THREE.Object3D
}

const registry = new Map<string, Entry>()

export function registerInteractable(
  id: string,
  descriptor: InteractableDescriptor,
  object: THREE.Object3D,
): void {
  registry.set(id, { descriptor, object })
}

export function unregisterInteractable(id: string): void {
  registry.delete(id)
}

export function clearAllInteractables(): void {
  registry.clear()
}

/**
 * Find the nearest interactable in front of the camera within the given range.
 * "In front" is defined as being within ~45° of the camera's forward vector.
 */
export function findNearestInteractable(
  camera: THREE.Camera,
  maxDistance: number,
): InteractableDescriptor | null {
  const camPos = new THREE.Vector3()
  camera.getWorldPosition(camPos)
  const camDir = new THREE.Vector3()
  camera.getWorldDirection(camDir)

  const cosThreshold = Math.cos(Math.PI / 4) // 45° cone

  let best: { descriptor: InteractableDescriptor; dist: number } | null = null
  const toObj = new THREE.Vector3()

  for (const { descriptor, object } of registry.values()) {
    object.getWorldPosition(toObj)
    toObj.sub(camPos)
    const dist = toObj.length()
    if (dist === 0 || dist > maxDistance) continue
    toObj.normalize()
    if (toObj.dot(camDir) < cosThreshold) continue
    if (!best || dist < best.dist) {
      best = { descriptor, dist }
    }
  }

  return best ? best.descriptor : null
}
```

- [ ] **Step 4: Run test to verify pass**

```bash
npm run test:run -- src/store/interactablesRegistry.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add interactables registry with nearest-in-front lookup"
```

---

## Task 6: Collider Registry (same pattern for collision AABBs)

**Files:**
- Create: `src/store/collidersRegistry.ts`
- Test: `src/store/collidersRegistry.test.ts`

- [ ] **Step 1: Write failing test `src/store/collidersRegistry.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import {
  registerCollider,
  unregisterCollider,
  getAllColliders,
  clearAllColliders,
} from './collidersRegistry'

describe('collidersRegistry', () => {
  beforeEach(() => clearAllColliders())

  it('stores and retrieves colliders', () => {
    registerCollider('wall', { minX: 0, maxX: 1, minZ: 0, maxZ: 1 })
    expect(getAllColliders()).toHaveLength(1)
  })

  it('unregisters colliders', () => {
    registerCollider('wall', { minX: 0, maxX: 1, minZ: 0, maxZ: 1 })
    unregisterCollider('wall')
    expect(getAllColliders()).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- src/store/collidersRegistry.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/store/collidersRegistry.ts`**

```ts
import type { AABB } from '../utils/collision'

const colliders = new Map<string, AABB>()

export function registerCollider(id: string, box: AABB): void {
  colliders.set(id, box)
}

export function unregisterCollider(id: string): void {
  colliders.delete(id)
}

export function getAllColliders(): AABB[] {
  return Array.from(colliders.values())
}

export function clearAllColliders(): void {
  colliders.clear()
}
```

- [ ] **Step 4: Run test to verify pass**

```bash
npm run test:run -- src/store/collidersRegistry.test.ts
```

Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add colliders registry"
```

---

## Task 7: First-Person Controls Hook

**Files:**
- Create: `src/hooks/useFirstPersonControls.ts`

Note: This hook combines keyboard input and per-frame camera movement with collision. No unit test — it's tightly coupled to R3F's `useFrame` and PointerLock which are painful to mock. Verification is manual during scene integration (Task 15).

- [ ] **Step 1: Implement `src/hooks/useFirstPersonControls.ts`**

```ts
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
}: Options = {}) {
  const { camera } = useThree()
  const keys = useRef<KeyState>({
    forward: false,
    back: false,
    left: false,
    right: false,
  })

  useEffect(() => {
    camera.position.y = eyeHeight
  }, [camera, eyeHeight])

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
    right.current.set(forward.current.z, 0, -forward.current.x) // cross with up

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
    camera.position.y = eyeHeight
  })
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add first-person WASD controls hook with collision"
```

---

## Task 8: `InteractableObject` Component + Crosshair

**Files:**
- Create: `src/components/interaction/InteractableObject.tsx`
- Create: `src/components/interaction/Crosshair.tsx`
- Create: `src/components/interaction/Crosshair.module.css`
- Create: `src/hooks/useInteraction.ts`

- [ ] **Step 1: Implement `src/hooks/useInteraction.ts`**

```ts
import { useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { findNearestInteractable } from '../store/interactablesRegistry'
import { useGameStore } from '../store/useGameStore'
import type { InteractableDescriptor } from '../types'

const INTERACT_RANGE = 4

export function useInteraction(enabled = true) {
  const { camera } = useThree()
  const [focused, setFocused] = useState<InteractableDescriptor | null>(null)
  const setTooltip = useGameStore((s) => s.setTooltip)

  useFrame(() => {
    if (!enabled) {
      if (focused) setFocused(null)
      return
    }
    const next = findNearestInteractable(camera, INTERACT_RANGE)
    setFocused((prev) => (prev?.id === next?.id ? prev : next))
  })

  useEffect(() => {
    if (!enabled) return
    const trigger = () => {
      if (focused) {
        setTooltip({ title: focused.title, description: focused.description })
      } else {
        setTooltip(null)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyE') trigger()
      if (e.code === 'Escape') setTooltip(null)
    }
    const onClick = () => trigger()
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onClick)
    }
  }, [focused, enabled, setTooltip])

  return focused
}
```

- [ ] **Step 2: Implement `src/components/interaction/InteractableObject.tsx`**

```tsx
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import {
  registerInteractable,
  unregisterInteractable,
} from '../../store/interactablesRegistry'
import type { InteractableDescriptor } from '../../types'

interface Props {
  descriptor: InteractableDescriptor
  children: React.ReactNode
  position?: [number, number, number]
}

export function InteractableObject({ descriptor, children, position }: Props) {
  const groupRef = useRef<THREE.Group>(null)

  useEffect(() => {
    const group = groupRef.current
    if (!group) return
    registerInteractable(descriptor.id, descriptor, group)
    return () => unregisterInteractable(descriptor.id)
  }, [descriptor])

  return (
    <group ref={groupRef} position={position}>
      {children}
    </group>
  )
}
```

- [ ] **Step 3: Implement Crosshair CSS + component**

`src/components/interaction/Crosshair.module.css`:

```css
.crosshair {
  position: fixed;
  top: 50%;
  left: 50%;
  width: 10px;
  height: 10px;
  margin-left: -5px;
  margin-top: -5px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.6);
  pointer-events: none;
  transition: background-color 120ms ease, transform 120ms ease;
}

.focused {
  background: #CD7F32;
  transform: scale(1.4);
}
```

`src/components/interaction/Crosshair.tsx`:

```tsx
import styles from './Crosshair.module.css'

interface Props {
  focused: boolean
}

export function Crosshair({ focused }: Props) {
  return <div className={`${styles.crosshair} ${focused ? styles.focused : ''}`} />
}
```

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add InteractableObject, useInteraction hook, and Crosshair"
```

---

## Task 9: Tooltip Card + HUD + Fade Overlay

**Files:**
- Create: `src/components/ui/TooltipCard.tsx`
- Create: `src/components/ui/TooltipCard.module.css`
- Create: `src/components/ui/HUD.tsx`
- Create: `src/components/ui/FadeOverlay.tsx`
- Create: `src/components/ui/FadeOverlay.module.css`

- [ ] **Step 1: Create `TooltipCard.module.css`**

```css
.card {
  position: fixed;
  top: 58%;
  left: 50%;
  transform: translateX(-50%);
  max-width: 420px;
  padding: 16px 20px;
  background: linear-gradient(180deg, #f4e9cf 0%, #e7d6a8 100%);
  border: 2px solid #CD7F32;
  border-radius: 6px;
  color: #0E1A40;
  font-family: Georgia, 'Times New Roman', serif;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.5);
  pointer-events: none;
  opacity: 0;
  transition: opacity 180ms ease;
}

.visible {
  opacity: 1;
}

.title {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.description {
  margin: 0;
  font-size: 15px;
  line-height: 1.45;
  font-style: italic;
}
```

- [ ] **Step 2: Create `TooltipCard.tsx`**

```tsx
import styles from './TooltipCard.module.css'
import type { Tooltip } from '../../types'

interface Props {
  tooltip: Tooltip | null
}

export function TooltipCard({ tooltip }: Props) {
  return (
    <div
      className={`${styles.card} ${tooltip ? styles.visible : ''}`}
      role="status"
      aria-live="polite"
    >
      <h2 className={styles.title}>{tooltip?.title ?? ''}</h2>
      <p className={styles.description}>{tooltip?.description ?? ''}</p>
    </div>
  )
}
```

- [ ] **Step 3: Create `FadeOverlay.module.css`**

```css
.overlay {
  position: fixed;
  inset: 0;
  background: black;
  pointer-events: none;
  opacity: 0;
  transition: opacity 500ms ease;
  z-index: 10;
}

.visible {
  opacity: 1;
}
```

- [ ] **Step 4: Create `FadeOverlay.tsx`**

```tsx
import styles from './FadeOverlay.module.css'

interface Props {
  visible: boolean
}

export function FadeOverlay({ visible }: Props) {
  return <div className={`${styles.overlay} ${visible ? styles.visible : ''}`} />
}
```

- [ ] **Step 5: Create `HUD.tsx`**

```tsx
import { Crosshair } from '../interaction/Crosshair'
import { TooltipCard } from './TooltipCard'
import { useGameStore } from '../../store/useGameStore'

interface Props {
  crosshairFocused: boolean
}

export function HUD({ crosshairFocused }: Props) {
  const tooltip = useGameStore((s) => s.tooltip)
  return (
    <>
      <Crosshair focused={crosshairFocused} />
      <TooltipCard tooltip={tooltip} />
    </>
  )
}
```

- [ ] **Step 6: Typecheck + Commit**

```bash
npx tsc --noEmit
git add -A
git commit -m "feat: add TooltipCard, HUD, and FadeOverlay UI components"
```

---

## Task 10: Room — Floor Component

**Files:**
- Create: `src/components/room/Floor.tsx`

The floor is a circular plane with a deep blue base and a bronze crest rendered as a separate ring mesh. No texture files yet — colours and shape only.

- [ ] **Step 1: Implement `src/components/room/Floor.tsx`**

```tsx
interface Props {
  radius?: number
  modelUrl?: string
}

export function Floor({ radius = 20 }: Props) {
  return (
    <group>
      {/* Main carpet */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[radius, 64]} />
        <meshStandardMaterial color="#1a3a7a" roughness={0.9} />
      </mesh>
      {/* Outer bronze ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <ringGeometry args={[radius - 1.5, radius - 1.3, 64]} />
        <meshStandardMaterial color="#CD7F32" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Centre crest ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <ringGeometry args={[1.8, 2.2, 64]} />
        <meshStandardMaterial color="#CD7F32" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Crest centre disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <circleGeometry args={[1.8, 48]} />
        <meshStandardMaterial color="#0E1A40" />
      </mesh>
    </group>
  )
}
```

- [ ] **Step 2: Typecheck + Commit**

```bash
npx tsc --noEmit
git add -A
git commit -m "feat: add Floor room component with bronze accents and crest"
```

---

## Task 11: Room — Dome Component (Star Ceiling)

**Files:**
- Create: `src/components/room/Dome.tsx`

- [ ] **Step 1: Implement `src/components/room/Dome.tsx`**

```tsx
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Props {
  radius?: number
  height?: number
  modelUrl?: string
}

export function Dome({ radius = 20, height = 12 }: Props) {
  const domeRef = useRef<THREE.Group>(null)

  // Generate random star points as a Points object
  const starsGeom = useMemo(() => {
    const geom = new THREE.BufferGeometry()
    const count = 400
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      // Distribute on upper hemisphere just inside the dome
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random()) // 0..π/2 for upper hemisphere
      const r = radius * 0.98
      positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.cos(phi)
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
    }
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geom
  }, [radius])

  // Slow rotation (~1 RPM = 2π / 60 rad/s)
  useFrame((_, delta) => {
    if (domeRef.current) {
      domeRef.current.rotation.y += delta * (Math.PI * 2) / 60
    }
  })

  return (
    <group ref={domeRef} position={[0, height, 0]}>
      {/* Dome shell (interior-facing) */}
      <mesh>
        <sphereGeometry args={[radius, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#0b1030"
          side={THREE.BackSide}
          roughness={1}
          metalness={0}
        />
      </mesh>
      {/* Stars */}
      <points geometry={starsGeom}>
        <pointsMaterial
          color="#fce89a"
          size={0.12}
          sizeAttenuation
          transparent
          opacity={0.95}
        />
      </points>
    </group>
  )
}
```

- [ ] **Step 2: Typecheck + Commit**

```bash
npx tsc --noEmit
git add -A
git commit -m "feat: add Dome component with rotating star ceiling"
```

---

## Task 12: Room — Circular Walls with Arched Windows

**Files:**
- Create: `src/components/room/CircularWalls.tsx`

- [ ] **Step 1: Implement `src/components/room/CircularWalls.tsx`**

```tsx
import { useEffect } from 'react'
import * as THREE from 'three'
import { registerCollider, unregisterCollider } from '../../store/collidersRegistry'

interface Props {
  radius?: number
  height?: number
  windowCount?: number
}

// Single arched window: two vertical drapes + a bright "sky" panel visible behind the arch cutout.
// Since we can't cheaply cut holes in a cylinder wall, we fake it by building the wall as segments
// between the windows, and rendering a sky panel where a window "would" be.
export function CircularWalls({
  radius = 20,
  height = 12,
  windowCount = 6,
}: Props) {
  // No AABB colliders needed — outer boundary is enforced by the circular
  // boundary option in useFirstPersonControls. This component is purely visual.

  const windowWidth = 2.2
  const windowHeight = height * 0.75
  const windowBottom = height * 0.05

  return (
    <group>
      {/* Cylinder interior wall (stone colour) */}
      <mesh>
        <cylinderGeometry args={[radius, radius, height, 64, 1, true]} />
        <meshStandardMaterial color="#d7cdb9" side={THREE.BackSide} roughness={0.95} />
      </mesh>

      {/* Windows + drapes distributed around */}
      {Array.from({ length: windowCount }).map((_, i) => {
        const a = (i / windowCount) * Math.PI * 2
        const wx = Math.cos(a) * (radius - 0.05)
        const wz = Math.sin(a) * (radius - 0.05)
        const rotY = -a + Math.PI / 2

        return (
          <group key={i} position={[wx, windowBottom + windowHeight / 2, wz]} rotation={[0, rotY, 0]}>
            {/* Sky/mountain panel seen through the window */}
            <mesh position={[0, 0, -0.02]}>
              <planeGeometry args={[windowWidth, windowHeight]} />
              <meshBasicMaterial color="#7aa3c7" />
            </mesh>
            {/* Arch frame - top arc */}
            <mesh position={[0, windowHeight / 2 - 0.4, 0]}>
              <torusGeometry args={[windowWidth / 2, 0.08, 8, 24, Math.PI]} />
              <meshStandardMaterial color="#3a2e20" />
            </mesh>
            {/* Left drape */}
            <mesh position={[-windowWidth / 2 - 0.35, 0, 0.05]}>
              <boxGeometry args={[0.2, windowHeight, 0.15]} />
              <meshStandardMaterial color="#14306b" roughness={0.85} />
            </mesh>
            {/* Right drape */}
            <mesh position={[windowWidth / 2 + 0.35, 0, 0.05]}>
              <boxGeometry args={[0.2, windowHeight, 0.15]} />
              <meshStandardMaterial color="#14306b" roughness={0.85} />
            </mesh>
            {/* Sill */}
            <mesh position={[0, -windowHeight / 2, 0.1]}>
              <boxGeometry args={[windowWidth + 0.8, 0.2, 0.35]} />
              <meshStandardMaterial color="#3a2e20" />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}
```

- [ ] **Step 2: Typecheck + Commit**

```bash
npx tsc --noEmit
git add -A
git commit -m "feat: add circular walls with arched windows and drapes"
```

---

## Task 13: Room — BookshelfWall Component

**Files:**
- Create: `src/components/room/BookshelfWall.tsx`

- [ ] **Step 1: Implement `src/components/room/BookshelfWall.tsx`**

```tsx
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
    // Collider is a box in world space. Approximate by placing the AABB
    // at the bookshelf centre with size = rotated bounding box.
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
```

- [ ] **Step 2: Typecheck + Commit**

```bash
npx tsc --noEmit
git add -A
git commit -m "feat: add BookshelfWall component with procedural books and collider"
```

---

## Task 14: Room — Statue, WritingDesk, Armchair, GlobeStand

**Files:**
- Create: `src/components/room/Statue.tsx`
- Create: `src/components/room/WritingDesk.tsx`
- Create: `src/components/room/Armchair.tsx`
- Create: `src/components/room/GlobeStand.tsx`

- [ ] **Step 1: Create `src/components/room/Statue.tsx`**

```tsx
import { useEffect } from 'react'
import { InteractableObject } from '../interaction/InteractableObject'
import { registerCollider, unregisterCollider } from '../../store/collidersRegistry'

interface Props {
  position: [number, number, number]
  modelUrl?: string
}

export function Statue({ position }: Props) {
  useEffect(() => {
    registerCollider('statue', {
      minX: position[0] - 0.8,
      maxX: position[0] + 0.8,
      minZ: position[2] - 0.8,
      maxZ: position[2] + 0.8,
    })
    return () => unregisterCollider('statue')
  }, [position])

  return (
    <InteractableObject
      descriptor={{
        id: 'statue',
        title: 'Rowena Ravenclaw',
        description:
          'Founder of this house, seeker of wisdom above all else. Her diadem is said to grant great wisdom to its wearer.',
      }}
      position={position}
    >
      {/* Plinth */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.7, 0.8, 0.8, 16]} />
        <meshStandardMaterial color="#e8e3d9" roughness={0.4} />
      </mesh>
      {/* Body */}
      <mesh position={[0, 2.0, 0]}>
        <capsuleGeometry args={[0.45, 1.8, 8, 16]} />
        <meshStandardMaterial color="#f0ece3" roughness={0.35} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 3.3, 0]}>
        <sphereGeometry args={[0.32, 24, 24]} />
        <meshStandardMaterial color="#f0ece3" roughness={0.35} />
      </mesh>
    </InteractableObject>
  )
}
```

- [ ] **Step 2: Create `src/components/room/WritingDesk.tsx`**

```tsx
import { useEffect } from 'react'
import { InteractableObject } from '../interaction/InteractableObject'
import { registerCollider, unregisterCollider } from '../../store/collidersRegistry'

interface Props {
  id: string
  position: [number, number, number]
  rotationY?: number
  modelUrl?: string
}

export function WritingDesk({ id, position, rotationY = 0 }: Props) {
  useEffect(() => {
    registerCollider(`desk-${id}`, {
      minX: position[0] - 0.9,
      maxX: position[0] + 0.9,
      minZ: position[2] - 0.6,
      maxZ: position[2] + 0.6,
    })
    return () => unregisterCollider(`desk-${id}`)
  }, [id, position])

  return (
    <InteractableObject
      descriptor={{
        id,
        title: 'Writing Desk',
        description:
          'Quills, parchment, and half-finished star charts. Someone was here recently.',
      }}
      position={position}
    >
      <group rotation={[0, rotationY, 0]}>
        {/* Top */}
        <mesh position={[0, 0.9, 0]}>
          <boxGeometry args={[1.6, 0.08, 1.0]} />
          <meshStandardMaterial color="#4a3422" roughness={0.85} />
        </mesh>
        {/* 4 legs */}
        {[[-0.7, 0.4, -0.45], [0.7, 0.4, -0.45], [-0.7, 0.4, 0.45], [0.7, 0.4, 0.45]].map((p, i) => (
          <mesh key={i} position={p as [number, number, number]}>
            <boxGeometry args={[0.1, 0.85, 0.1]} />
            <meshStandardMaterial color="#3a2818" roughness={0.9} />
          </mesh>
        ))}
        {/* Candle */}
        <mesh position={[0.55, 1.05, 0.2]}>
          <cylinderGeometry args={[0.05, 0.05, 0.22, 12]} />
          <meshStandardMaterial color="#f1e3bb" emissive="#e0b060" emissiveIntensity={0.6} />
        </mesh>
      </group>
    </InteractableObject>
  )
}
```

- [ ] **Step 3: Create `src/components/room/Armchair.tsx`**

```tsx
import { useEffect } from 'react'
import { InteractableObject } from '../interaction/InteractableObject'
import { registerCollider, unregisterCollider } from '../../store/collidersRegistry'

interface Props {
  id: string
  position: [number, number, number]
  rotationY?: number
  modelUrl?: string
}

export function Armchair({ id, position, rotationY = 0 }: Props) {
  useEffect(() => {
    registerCollider(`chair-${id}`, {
      minX: position[0] - 0.55,
      maxX: position[0] + 0.55,
      minZ: position[2] - 0.55,
      maxZ: position[2] + 0.55,
    })
    return () => unregisterCollider(`chair-${id}`)
  }, [id, position])

  const velvet = '#14306b'

  return (
    <InteractableObject
      descriptor={{
        id,
        title: 'Velvet Armchair',
        description:
          'The velvet is worn soft from centuries of students reading by firelight.',
      }}
      position={position}
    >
      <group rotation={[0, rotationY, 0]}>
        {/* Seat */}
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[1.0, 0.25, 1.0]} />
          <meshStandardMaterial color={velvet} roughness={0.85} />
        </mesh>
        {/* Backrest */}
        <mesh position={[0, 1.0, -0.4]}>
          <boxGeometry args={[1.0, 1.0, 0.2]} />
          <meshStandardMaterial color={velvet} roughness={0.85} />
        </mesh>
        {/* Arms */}
        <mesh position={[-0.45, 0.75, 0]}>
          <boxGeometry args={[0.18, 0.6, 1.0]} />
          <meshStandardMaterial color={velvet} roughness={0.85} />
        </mesh>
        <mesh position={[0.45, 0.75, 0]}>
          <boxGeometry args={[0.18, 0.6, 1.0]} />
          <meshStandardMaterial color={velvet} roughness={0.85} />
        </mesh>
      </group>
    </InteractableObject>
  )
}
```

- [ ] **Step 4: Create `src/components/room/GlobeStand.tsx`**

```tsx
import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { InteractableObject } from '../interaction/InteractableObject'
import { registerCollider, unregisterCollider } from '../../store/collidersRegistry'

interface Props {
  id: string
  position: [number, number, number]
  modelUrl?: string
}

export function GlobeStand({ id, position }: Props) {
  const globeRef = useRef<THREE.Mesh>(null)

  useEffect(() => {
    registerCollider(`globe-${id}`, {
      minX: position[0] - 0.5,
      maxX: position[0] + 0.5,
      minZ: position[2] - 0.5,
      maxZ: position[2] + 0.5,
    })
    return () => unregisterCollider(`globe-${id}`)
  }, [id, position])

  useFrame((_, delta) => {
    if (globeRef.current) globeRef.current.rotation.y += delta * 0.25
  })

  return (
    <InteractableObject
      descriptor={{
        id,
        title: 'Celestial Globe',
        description:
          'A celestial globe, charmed to reflect the night sky above Hogwarts in real time.',
      }}
      position={position}
    >
      {/* Tripod base */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.05, 0.3, 0.8, 12]} />
        <meshStandardMaterial color="#3a2818" roughness={0.9} />
      </mesh>
      {/* Globe */}
      <mesh ref={globeRef} position={[0, 1.05, 0]}>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshStandardMaterial color="#0b1030" emissive="#23306b" emissiveIntensity={0.3} />
      </mesh>
    </InteractableObject>
  )
}
```

- [ ] **Step 5: Typecheck + Commit**

```bash
npx tsc --noEmit
git add -A
git commit -m "feat: add Statue, WritingDesk, Armchair, and GlobeStand components"
```

---

## Task 15: CommonRoomScene Assembly

**Files:**
- Create: `src/scenes/CommonRoomScene.tsx`

This scene composes all room components, wires up first-person controls, interaction detection, and the HUD-focused state.

- [ ] **Step 1: Implement `src/scenes/CommonRoomScene.tsx`**

```tsx
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
```

- [ ] **Step 2: Typecheck + Commit**

```bash
npx tsc --noEmit
git add -A
git commit -m "feat: assemble CommonRoomScene with all room components and controls"
```

---

## Task 16: EntryScene (Corridor + Eagle Knocker)

**Files:**
- Create: `src/scenes/EntryScene.tsx`

- [ ] **Step 1: Implement `src/scenes/EntryScene.tsx`**

```tsx
import { useEffect } from 'react'
import { PointerLockControls } from '@react-three/drei'
import { InteractableObject } from '../components/interaction/InteractableObject'
import { useFirstPersonControls } from '../hooks/useFirstPersonControls'
import { useInteraction } from '../hooks/useInteraction'
import { useGameStore } from '../store/useGameStore'
import {
  registerCollider,
  unregisterCollider,
  clearAllColliders,
} from '../store/collidersRegistry'

interface Props {
  onFocusChange: (focused: boolean) => void
  onEnter: () => void
}

export function EntryScene({ onFocusChange, onEnter }: Props) {
  useFirstPersonControls()
  const focused = useInteraction()
  const tooltip = useGameStore((s) => s.tooltip)

  useEffect(() => {
    onFocusChange(!!focused)
  }, [focused, onFocusChange])

  // When the knocker tooltip appears, trigger the transition to the common room.
  useEffect(() => {
    if (tooltip?.title === 'The Eagle Knocker') {
      const timer = setTimeout(onEnter, 1500)
      return () => clearTimeout(timer)
    }
  }, [tooltip, onEnter])

  // Corridor colliders (two side walls + back wall)
  useEffect(() => {
    clearAllColliders()
    registerCollider('corridor-left',  { minX: -2.5, maxX: -2.0, minZ: -10, maxZ: 1 })
    registerCollider('corridor-right', { minX: 2.0,  maxX: 2.5,  minZ: -10, maxZ: 1 })
    registerCollider('corridor-back',  { minX: -2.5, maxX: 2.5,  minZ: 0.5, maxZ: 1 })
    return () => clearAllColliders()
  }, [])

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 3, -4]} intensity={0.8} color="#e0b060" distance={10} />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -4]}>
        <planeGeometry args={[5, 12]} />
        <meshStandardMaterial color="#3a3530" roughness={1} />
      </mesh>
      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3.5, -4]}>
        <planeGeometry args={[5, 12]} />
        <meshStandardMaterial color="#2a2620" roughness={1} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-2.25, 1.75, -4]}>
        <boxGeometry args={[0.5, 3.5, 12]} />
        <meshStandardMaterial color="#5a5048" roughness={0.95} />
      </mesh>
      {/* Right wall */}
      <mesh position={[2.25, 1.75, -4]}>
        <boxGeometry args={[0.5, 3.5, 12]} />
        <meshStandardMaterial color="#5a5048" roughness={0.95} />
      </mesh>
      {/* Back wall (behind player) */}
      <mesh position={[0, 1.75, 1]}>
        <boxGeometry args={[5, 3.5, 0.5]} />
        <meshStandardMaterial color="#5a5048" roughness={0.95} />
      </mesh>
      {/* Door */}
      <mesh position={[0, 1.5, -9.9]}>
        <boxGeometry args={[2.4, 3, 0.2]} />
        <meshStandardMaterial color="#4a3422" roughness={0.9} />
      </mesh>

      {/* Eagle Knocker — a small bronze disc on the door */}
      <InteractableObject
        descriptor={{
          id: 'eagle-knocker',
          title: 'The Eagle Knocker',
          description: "The bronze eagle blinks. 'Knock, and answer wisely.'",
        }}
        position={[0, 1.7, -9.75]}
      >
        <mesh>
          <cylinderGeometry args={[0.22, 0.22, 0.05, 24]} />
          <meshStandardMaterial color="#CD7F32" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.12, 0.18, 16]} />
          <meshStandardMaterial color="#b0692a" metalness={0.7} roughness={0.3} />
        </mesh>
      </InteractableObject>

      {/* ±80° vertical look clamp */}
      <PointerLockControls
        minPolarAngle={Math.PI * 10 / 180}
        maxPolarAngle={Math.PI * 170 / 180}
      />
    </>
  )
}
```

- [ ] **Step 2: Typecheck + Commit**

```bash
npx tsc --noEmit
git add -A
git commit -m "feat: add EntryScene with corridor and eagle knocker"
```

---

## Task 17: App Shell + Scene Router + Fade Transition

**Files:**
- Modify: `src/App.tsx`
- Create: `src/App.module.css`
- Modify: `src/main.tsx` (add global CSS reset)
- Create: `src/styles/global.css`

- [ ] **Step 1: Create `src/styles/global.css`**

```css
* {
  box-sizing: border-box;
}

html, body, #root {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #000;
  color: white;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

canvas {
  display: block;
  outline: none;
}
```

- [ ] **Step 2: Update `src/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './styles/global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 3: Create `src/App.module.css`**

```css
.root {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
}

.startOverlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 16px;
  background: rgba(0, 0, 0, 0.85);
  color: #f4e9cf;
  font-family: Georgia, serif;
  z-index: 20;
  cursor: pointer;
}

.startOverlay h1 {
  font-size: 32px;
  letter-spacing: 1px;
  color: #CD7F32;
}

.startOverlay p {
  font-size: 15px;
  max-width: 480px;
  text-align: center;
  line-height: 1.5;
}
```

- [ ] **Step 4: Replace `src/App.tsx`**

```tsx
import { Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { EntryScene } from './scenes/EntryScene'
import { CommonRoomScene } from './scenes/CommonRoomScene'
import { HUD } from './components/ui/HUD'
import { FadeOverlay } from './components/ui/FadeOverlay'
import { useGameStore } from './store/useGameStore'
import styles from './App.module.css'

export default function App() {
  const scene = useGameStore((s) => s.scene)
  const setScene = useGameStore((s) => s.setScene)
  const setTooltip = useGameStore((s) => s.setTooltip)
  const [focused, setFocused] = useState(false)
  const [fading, setFading] = useState(false)
  const [started, setStarted] = useState(false)

  const handleEnter = () => {
    setFading(true)
    setTimeout(() => {
      setScene('common-room')
      setTooltip(null)
      setTimeout(() => setFading(false), 100)
    }, 550)
  }

  // Reset focus state on scene change
  useEffect(() => setFocused(false), [scene])

  return (
    <div className={styles.root}>
      <Canvas camera={{ fov: 75, near: 0.1, far: 200, position: [0, 1.7, -4] }}>
        <Suspense fallback={null}>
          {scene === 'entry' && (
            <EntryScene onFocusChange={setFocused} onEnter={handleEnter} />
          )}
          {scene === 'common-room' && (
            <CommonRoomScene onFocusChange={setFocused} />
          )}
        </Suspense>
      </Canvas>

      <HUD crosshairFocused={focused} />
      <FadeOverlay visible={fading} />

      {!started && (
        <div className={styles.startOverlay} onClick={() => setStarted(true)}>
          <h1>Ravenclaw Tower</h1>
          <p>
            Click to begin. Use <strong>WASD</strong> or arrow keys to walk,
            <strong> mouse</strong> to look, and press <strong>E</strong> or click
            to interact with objects. Press <strong>Escape</strong> to release the cursor.
          </p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Run dev server and verify manually**

```bash
npm run dev
```

Open `http://localhost:5173`. Check that:
- Start overlay appears; clicking it dismisses
- You see a corridor with a door and bronze eagle knocker
- WASD moves, mouse looks after clicking the canvas
- Approaching the knocker turns the crosshair bronze
- Pressing E shows the tooltip, and ~1.5s later the scene fades to the common room
- In the common room: domed ceiling with stars, 6 arched windows with drapes, bookshelves, statue, desk, armchairs, globe
- All room objects show tooltips when approached and E is pressed
- You cannot walk through walls, bookshelves, or furniture

Press Ctrl+C when done.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: wire up App shell with scene router and fade transition"
```

---

## Task 18: Final Verification & Success Criteria

**Files:** None — verification only.

- [ ] **Step 1: Run the full test suite**

```bash
npm run test:run
```

Expected: all tests pass (store, collision, interactables registry, colliders registry — should be ~13 tests).

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Build production bundle**

```bash
npm run build
```

Expected: build succeeds and outputs `dist/`.

- [ ] **Step 4: Preview production build**

```bash
npm run preview
```

Open the preview URL and walk through the spec's success criteria:

- [ ] Player can load the app in a browser with no install
- [ ] Entry scene shows eagle-knocker door; clicking it transitions to the common room
- [ ] All canonical room elements are visibly present and recognisable (dome with stars, arched windows, bookshelves, statue, furniture, blue carpet)
- [ ] Player can walk freely around the room in first-person
- [ ] Player cannot walk through walls or furniture
- [ ] All interactable objects show a tooltip card when approached and activated with E
- [ ] Crosshair turns bronze when an interactable is in range
- [ ] App runs at ≥30 FPS on a mid-range laptop in Chrome (check Chrome DevTools Performance tab)

Press Ctrl+C when done.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit --allow-empty -m "chore: Phase 1 complete — all success criteria verified"
```

---

## Out-of-Scope Reminders (DO NOT implement now)

- Multiplayer / WebSocket networking
- Character avatars or player bodies
- The eagle knocker riddle mechanic (door opens on any interaction)
- Any GLTF asset loading (the `modelUrl` seam exists but is not used)
- User accounts, persistence, or backend
- Mobile / touch controls
- Audio
