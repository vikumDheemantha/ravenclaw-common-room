# Ravenclaw Common Room — Phase 1: 3D Environment Design

**Date:** 2026-04-14
**Phase:** 1 of N — 3D Environment (solo, no multiplayer)
**Status:** Approved

---

## Overview

A browser-based, first-person 3D experience of the Ravenclaw Common Room from the Harry Potter universe. Phase 1 establishes the playable room: faithful canonical aesthetics, first-person navigation, and basic object interaction (tooltips/descriptions). Multiplayer, character avatars, and game mechanics are deferred to future phases.

---

## Scope

### In Phase 1
- Vite + React + React Three Fiber single-page app
- Entry Scene: corridor with eagle-knocker door
- Common Room Scene: fully navigable circular room
- All canonical room elements present (dome, windows, bookshelves, statue, furniture)
- First-person WASD navigation with pointer-lock mouse-look
- Basic object interaction: approach + E/click → tooltip card
- Scene transition (Entry → Common Room) with fade effect
- Hybrid geometry: Three.js primitives now, GLTF upgrade seams built in

### Out of Phase 1
- Multiplayer / real-time networking
- Character avatar creation
- Eagle knocker riddle mechanic
- Any game mechanics beyond tooltips
- User authentication or persistence
- Mobile / touch controls

---

## Tech Stack

| Layer | Technology |
|---|---|
| Bundler | Vite |
| UI Framework | React + TypeScript |
| 3D Rendering | React Three Fiber (`@react-three/fiber`) |
| 3D Helpers | Drei (`@react-three/drei`) |
| State | Zustand |
| Styling | CSS Modules (UI overlay only) |

---

## Architecture

### App Structure

The app has two scenes managed by a Zustand store (`scene: 'entry' | 'common-room'`). `App.tsx` renders the active scene inside a fullscreen R3F `<Canvas>`. A React overlay (rendered outside the canvas) handles all 2D UI (crosshair, tooltip card, HUD).

```
<App>
  <Canvas>                     ← fullscreen, pointer-lock enabled
    {scene === 'entry'    && <EntryScene />}
    {scene === 'common-room' && <CommonRoomScene />}
  </Canvas>
  <HUD />                      ← crosshair, tooltip card (React overlay)
</App>
```

### State (Zustand)

```ts
interface GameStore {
  scene: 'entry' | 'common-room'
  tooltip: { title: string; description: string } | null
  setScene: (s: SceneId) => void
  setTooltip: (t: Tooltip | null) => void
}
```

Kept flat and minimal in Phase 1. Player position, session, and player list fields are added in Phase 2.

---

## Scene: Entry

A short corridor section with a stone archway and the Ravenclaw tower door. The door features the bronze eagle-shaped knocker.

**Behaviour:**
- Player spawns facing the door
- Approaching and clicking/pressing E on the knocker triggers a short bob animation on the knocker mesh
- The knocker displays its tooltip: *"The bronze eagle blinks. 'Knock, and answer wisely.'"*
- After interaction, a fade-to-black transition plays, then the Common Room Scene loads with the player spawned just inside the door facing inward

**No riddle mechanic in Phase 1.** The door opens on any interaction.

---

## Scene: Common Room

### Room Geometry

The room is a circular tower (~20 units radius, ~12 units tall). Scale is intentionally larger than real-world canonical size to accommodate future multiplayer without altering the aesthetic.

| Element | Geometry | Notes |
|---|---|---|
| Outer walls | `CylinderGeometry` (open-ended) | Houses window cutouts and shelf placement |
| Dome ceiling | `SphereGeometry` (top hemisphere) | Deep navy, slow 1 RPM rotation |
| Star constellations | Canvas texture / emissive points | Gold lines and stars painted on dome interior |
| Floor | `CircleGeometry` | Blue and bronze patterned carpet texture; house crest at centre |
| Arched windows (×6) | Box cutouts with arch mesh overlay | Evenly spaced; mountain panorama env texture behind each |
| Window drapes | Tapered `BoxGeometry` | Blue velvet material, flanking each window |
| Bookshelves (×4) | `BoxGeometry` units | Procedurally varied book spine colours (blue/brown/gold) as texture atlas |
| Rowena Ravenclaw statue | `CylinderGeometry` base + `CapsuleGeometry` body | White/marble material; centre-rear position |
| Writing desk | `BoxGeometry` composite | Positioned near a window |
| Armchairs (×4) | `BoxGeometry` composite | Blue velvet material; clustered near centre |
| Globe stand | `CylinderGeometry` + `SphereGeometry` | Celestial globe, near desk |

### GLTF Upgrade Seam

Every room component accepts an optional `modelUrl?: string` prop. When provided, the component renders the GLTF asset via Drei's `useGLTF` instead of its primitive geometry. The interface is:

```ts
interface RoomObjectProps {
  modelUrl?: string   // path to .glb/.gltf; falls back to primitives if omitted
  position: Vector3
  rotation?: Euler
}
```

This means dropping in a better model requires only passing a `modelUrl` — no structural code changes.

### Lighting

| Light | Type | Purpose |
|---|---|---|
| Ambient | `AmbientLight` (~0.1 intensity) | Soft base fill, prevents pure black shadows |
| Desk lamp | `PointLight` (warm, near desk) | Main warm light source; gives sense of intimacy |
| Star dome glow | Emissive material on dome | Subtle blue-white ambient from above |
| Contact shadows | Drei `<ContactShadows />` | Grounds objects without full shadow maps |

No real-time shadow casting in Phase 1 — kept performant for browser rendering.

---

## Navigation

### Controls
- **Mouse-look:** Drei `<PointerLockControls />` — click canvas to lock, `Escape` to release
- **Movement:** WASD / arrow keys; walks in camera-forward direction at 5 units/second
- **Vertical look clamp:** ±80° (prevents disorienting up/down extremes)
- **No head-bob** in Phase 1

### Collision
Player is modelled as a fixed-radius capsule (~0.4 unit radius). Each frame, movement is checked against axis-aligned bounding boxes of the room cylinder wall and all major furniture. No physics engine — custom AABB collision only.

### Camera
`PerspectiveCamera` at eye height 1.7 units, FOV 75°.

---

## Interaction System

### Detection
A raycast fires forward from the camera every frame. If it hits an `InteractableObject` mesh within **4 units**, the object is considered "in focus."

### Triggering
Press `E` or left-click while an object is in focus to trigger its interaction. The tooltip card appears.

### Crosshair
A small dot/cross rendered as a fixed React overlay element at the viewport centre. Colour: white by default, bronze (`#CD7F32`) when an interactable is in focus.

### Tooltip Card
A React overlay card (not in 3D space) that fades in on interaction. Styled in Ravenclaw blue (`#0E1A40`) and bronze with a subtle parchment texture. Dismissed by pressing `E`, clicking, or moving out of range.

### Interactable Objects & Content

| Object | Title | Description |
|---|---|---|
| Bookshelf | Ancient Library | *"Rows of ancient texts — Arithmancy, Astronomy, the works of Merlin himself."* |
| Rowena Ravenclaw statue | Rowena Ravenclaw | *"Founder of this house, seeker of wisdom above all else. Her diadem is said to grant great wisdom to its wearer."* |
| Writing desk | Writing Desk | *"Quills, parchment, and half-finished star charts. Someone was here recently."* |
| Globe stand | Celestial Globe | *"A celestial globe, charmed to reflect the night sky above Hogwarts in real time."* |
| Armchair | Velvet Armchair | *"The velvet is worn soft from centuries of students reading by firelight."* |
| Eagle knocker | The Eagle Knocker | *"The bronze eagle blinks. 'Knock, and answer wisely.'"* |

---

## Project Structure

```
ravenclaw-common-room/
├── public/
│   └── textures/              ← carpet.jpg, star-dome.jpg, window-panorama.jpg
├── src/
│   ├── main.tsx                ← Vite entry, mounts <App />
│   ├── App.tsx                 ← scene router + Canvas wrapper
│   ├── store/
│   │   └── useGameStore.ts     ← Zustand store
│   ├── scenes/
│   │   ├── EntryScene.tsx      ← corridor + eagle knocker
│   │   └── CommonRoomScene.tsx ← assembles all room components
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
│   │   │   ├── InteractableObject.tsx  ← wraps any mesh with raycast + E-key logic
│   │   │   └── Crosshair.tsx
│   │   └── ui/
│   │       ├── TooltipCard.tsx
│   │       └── HUD.tsx
│   ├── hooks/
│   │   ├── useFirstPersonControls.ts  ← WASD + PointerLock movement
│   │   └── useInteraction.ts          ← raycast, nearest interactable detection
│   └── types/
│       └── index.ts            ← SceneId, Tooltip, RoomObjectProps, etc.
├── docs/
│   └── superpowers/
│       └── specs/
│           └── 2026-04-14-ravenclaw-common-room-design.md
├── images/                     ← reference art
├── index.html
├── vite.config.ts
└── package.json
```

---

## Future Phases (Not in Scope Now)

| Phase | Feature |
|---|---|
| 2 | Multiplayer infrastructure — WebSocket server, real-time player sync, presence |
| 3 | Character/avatar creation — customisation screen, avatar rendering in room |
| 4 | Eagle knocker riddle mechanic — riddle prompt, answer validation, door lock |
| 5 | Game mechanics — interactive activities (chess, reading, house points) |
| 6 | GLTF asset upgrades — replace primitive geometry with high-quality models |

---

## Success Criteria for Phase 1

- [ ] Player can load the app in a browser with no install
- [ ] Entry scene shows eagle-knocker door; clicking it transitions to the common room
- [ ] All canonical room elements are visibly present and recognisable
- [ ] Player can walk freely around the room in first-person
- [ ] Player cannot walk through walls or furniture
- [ ] All 6 interactable objects show a tooltip card when approached and activated
- [ ] Crosshair turns bronze when an interactable is in range
- [ ] App runs at ≥30 FPS on a mid-range laptop in Chrome
