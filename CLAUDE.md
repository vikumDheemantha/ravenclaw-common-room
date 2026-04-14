# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Vite dev server (HMR)
npm run build        # tsc -b && vite build (typecheck must pass)
npm run preview      # serve the production build
npm run lint         # eslint .
npm run test         # vitest watch mode
npm run test:run     # vitest single run (use this in CI / agent verification)
npx vitest run path/to/file.test.ts   # run a single test file
npx tsc --noEmit     # standalone typecheck without building
```

Tests use Vitest + jsdom + @testing-library/react. Setup file: `src/test/setup.ts` (imports `@testing-library/jest-dom/vitest`). Config: `vitest.config.ts`.

## Repository Layout

The actual source lives in a git worktree, not on `master`:

- **`/` (master branch)** — docs, reference images, `.gitignore`, and the `.worktrees/` directory. No application code.
- **`.worktrees/phase1/` (branch `feature/phase1-3d-environment`)** — the Vite + React + R3F app. **All code work happens here.**

The plan/spec docs that drive the work are at `docs/superpowers/specs/` and `docs/superpowers/plans/` (in both the master tree and the worktree, since they were committed before branching).

## Architecture

Browser-only first-person 3D experience built on **Vite + React 18 + TypeScript + React Three Fiber 8 + Drei 9 + three 0.183**, with **Zustand 4** for state.

### Two-scene router driven by Zustand

`App.tsx` mounts a single fullscreen `<Canvas>` and switches between `<EntryScene />` and `<CommonRoomScene />` based on `useGameStore().scene` (`'entry' | 'common-room'`). The HUD (`Crosshair` + `TooltipCard`) and `FadeOverlay` render as **React DOM siblings outside the Canvas** — they are not part of the 3D tree. Scene switches are gated by a 550ms fade.

The store (`src/store/useGameStore.ts`) is intentionally tiny: `scene`, `tooltip`, `setScene`, `setTooltip`. Player position, multiplayer, and session state are explicitly deferred to future phases.

### Singleton registries (not Zustand) for per-frame 3D queries

Two module-level `Map`-based registries live in `src/store/`:

- **`interactablesRegistry.ts`** — `register/unregister/findNearestInteractable(camera, maxDistance)`. The finder uses `Object3D.getWorldPosition()` (so nested groups work) and a 45° forward cone via dot product against the camera's forward vector.
- **`collidersRegistry.ts`** — register/unregister/getAll for AABBs.

Components register on mount and unregister on unmount via `useEffect`. **Do not migrate these to Zustand** — they are queried every frame from `useFrame` and must not trigger React renders. Tests must call `mesh.updateMatrixWorld()` after `position.set()` because the registry reads world-space.

### Movement & collision (no physics engine)

`src/utils/collision.ts` exports `resolveMovement({ start, desired, radius, boxes, circularRadius? })`:

- Axis-sequential resolution (X then Z), so the player slides along walls instead of stopping dead.
- Across multiple boxes, constraints accumulate via `Math.min`/`Math.max` — the **most-restrictive constraint wins**. (An earlier bug let the last box overwrite all prior resolutions; do not regress this.)
- `circularRadius` clamps the final point inside the room cylinder, which is why `CircularWalls` does not need an AABB.
- Approach-side detection uses `start <= b.minX/minZ` (where the player was, not where they want to be), so resolution is correct whether the player is left/right/above/below a box.

`useFirstPersonControls` (`src/hooks/`) drives WASD/arrow movement at 5 u/s with player radius 0.4 and eye height 1.7, calling `resolveMovement` against `getAllColliders()` each frame. Camera mouse-look is Drei `<PointerLockControls />` clamped to ±80° polar.

### Interaction

`useInteraction` raycasts forward from the camera every frame via `findNearestInteractable(camera, 4)`. Keyboard/click listeners use a **`focusedRef` pattern** with a separate sync effect — the listener `useEffect` deps are `[enabled, setTooltip]` only, so listeners are not re-registered every frame. **Do not put `focused` directly in the deps** (regression bug).

`<InteractableObject>` wraps children in a `<group>`, registers the group in the interactables registry with a tooltip + interaction radius. `Crosshair` reads focus state and turns bronze (`#CD7F32`); `TooltipCard` reads from the Zustand store.

### GLTF upgrade seam

Every room component in `src/components/room/` is designed to accept an optional `modelUrl?: string` prop. When the codebase moves to authored assets (Phase 6 in the spec), components should branch to `useGLTF(modelUrl)` and fall back to the existing primitive geometry when the prop is absent. Preserve this seam when editing room components.

### TDD scope

Pure-logic modules have full test coverage and **must keep it**: `collision.ts`, `useGameStore.ts`, `interactablesRegistry.ts`, `collidersRegistry.ts`. R3F-coupled hooks/components are verified manually in the browser — adding jsdom tests for them tends to test mocks rather than behavior.

## Working Conventions

- The plan at `docs/superpowers/plans/2026-04-14-ravenclaw-common-room-phase1.md` defines the file structure. If a file you're creating drifts beyond its planned responsibility, stop and report rather than splitting on your own.
- Room-scene constants (`RADIUS=20`, `HEIGHT=12`, eye height `1.7`, walk speed `5`, player radius `0.4`, interaction range `4`) are intentional — the room is scaled larger than canon to accommodate future multiplayer. Don't tune these without checking the spec.
- The spec lives at `docs/superpowers/specs/2026-04-14-ravenclaw-common-room-design.md` and is the source of truth for canonical Ravenclaw aesthetics, lighting choices, and Phase 1 scope boundaries (no riddle, no avatars, no networking).
