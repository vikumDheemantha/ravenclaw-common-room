# Astral Library HUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current single-layer `TooltipCard` with a themed two-layer HUD: a glassmorphism proximity hint (bottom-left, auto-shows on approach) and a richer interaction popup (center-screen, opens on E-press), both styled from the Astral Library / Celestial Aerie design system.

**Architecture:** The `useInteraction` hook is reworked so proximity automatically sets the store tooltip (proximity hint) and E-press toggles `interactionOpen` (popup). Components read from `useGameStore`. `TooltipCard` is deleted and replaced by `ProximityHint` + `InteractionPopup`.

**Tech Stack:** React 18, TypeScript, CSS Modules, Zustand 4, Vitest, Google Fonts (Noto Serif + Manrope)

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Modify | `src/types/index.ts` | Add `category?` to Tooltip + InteractableDescriptor |
| Modify | `src/store/useGameStore.ts` | Add `interactionOpen` + `setInteractionOpen` |
| Modify | `src/store/useGameStore.test.ts` | Test new store fields |
| Modify | `src/hooks/useInteraction.ts` | Proximity → tooltip; E-press → interactionOpen toggle |
| Modify | `src/components/ui/Crosshair.module.css` | Sky-blue glow on focus |
| Create | `src/components/ui/ProximityHint.tsx` | Bottom-left proximity pill |
| Create | `src/components/ui/ProximityHint.module.css` | Glassmorphism styles |
| Create | `src/components/ui/InteractionPopup.tsx` | Center-screen popup |
| Create | `src/components/ui/InteractionPopup.module.css` | Popup styles + fade animation |
| Modify | `src/components/ui/HUD.tsx` | Mount ProximityHint + InteractionPopup, remove TooltipCard |
| Delete | `src/components/ui/TooltipCard.tsx` | Replaced by ProximityHint |
| Delete | `src/components/ui/TooltipCard.module.css` | Replaced |
| Modify | `src/scenes/CommonRoomScene.tsx` | Fix Tower Entrance trigger to use interactionOpen |
| Modify | `index.html` | Load Noto Serif + Manrope from Google Fonts |

---

## Task 1: Extend Types

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Update the file**

Replace the full contents of `src/types/index.ts` with:

```ts
export type SceneId = 'entry' | 'common-room'

export interface Tooltip {
  title: string
  description: string
  category?: string
}

export interface InteractableDescriptor {
  id: string
  title: string
  description: string
  category?: string
}
```

- [ ] **Step 2: Verify typecheck passes**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

## Task 2: Extend Store + Tests

**Files:**
- Modify: `src/store/useGameStore.ts`
- Modify: `src/store/useGameStore.test.ts`

- [ ] **Step 1: Write the failing tests first**

Open `src/store/useGameStore.test.ts`. Add these three tests inside the existing `describe` block, after the existing tests:

```ts
it('starts with interactionOpen false', () => {
  const state = useGameStore.getState()
  expect(state.interactionOpen).toBe(false)
})

it('can open and close the interaction popup', () => {
  useGameStore.getState().setInteractionOpen(true)
  expect(useGameStore.getState().interactionOpen).toBe(true)
  useGameStore.getState().setInteractionOpen(false)
  expect(useGameStore.getState().interactionOpen).toBe(false)
})

it('resets interactionOpen in beforeEach', () => {
  // Verifies beforeEach covers the new field
  expect(useGameStore.getState().interactionOpen).toBe(false)
})
```

Also update the `beforeEach` to reset the new field:

```ts
beforeEach(() => {
  useGameStore.setState({ scene: 'entry', tooltip: null, interactionOpen: false })
})
```

- [ ] **Step 2: Run tests — expect failures**

```bash
npx vitest run src/store/useGameStore.test.ts
```

Expected: 3 new tests fail with `interactionOpen is not a function` / `undefined`.

- [ ] **Step 3: Implement the store changes**

Replace the full contents of `src/store/useGameStore.ts` with:

```ts
import { create } from 'zustand'
import type { SceneId, Tooltip } from '../types'

interface GameStore {
  scene: SceneId
  tooltip: Tooltip | null
  interactionOpen: boolean
  setScene: (s: SceneId) => void
  setTooltip: (t: Tooltip | null) => void
  setInteractionOpen: (open: boolean) => void
}

export const useGameStore = create<GameStore>((set) => ({
  scene: 'entry',
  tooltip: null,
  interactionOpen: false,
  setScene: (scene) => set({ scene }),
  setTooltip: (tooltip) => set({ tooltip }),
  setInteractionOpen: (interactionOpen) => set({ interactionOpen }),
}))
```

- [ ] **Step 4: Run tests — all must pass**

```bash
npx vitest run src/store/useGameStore.test.ts
```

Expected: all tests pass including the 3 new ones.

- [ ] **Step 5: Run full test suite to check for regressions**

```bash
npm run test:run
```

Expected: all tests pass.

---

## Task 3: Rework useInteraction Hook

**Files:**
- Modify: `src/hooks/useInteraction.ts`

**Key behaviour change:**  
Previously, `setTooltip` was only called when the player pressed E. Now proximity automatically drives the tooltip (so `ProximityHint` can read it), and E-press toggles `interactionOpen`.

- [ ] **Step 1: Replace the full contents of `src/hooks/useInteraction.ts`**

```ts
import { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { findNearestInteractable } from '../store/interactablesRegistry'
import { useGameStore } from '../store/useGameStore'
import type { InteractableDescriptor } from '../types'

const INTERACT_RANGE = 4

export function useInteraction(enabled = true) {
  const { camera } = useThree()
  const [focused, setFocused] = useState<InteractableDescriptor | null>(null)
  const focusedRef = useRef<InteractableDescriptor | null>(null)
  const setTooltip = useGameStore((s) => s.setTooltip)
  const setInteractionOpen = useGameStore((s) => s.setInteractionOpen)

  // Keep ref in sync with state so the stable event handler can read current value
  useEffect(() => {
    focusedRef.current = focused
  }, [focused])

  // Proximity drives the tooltip automatically (Layer 1 - ProximityHint)
  useEffect(() => {
    if (!enabled) return
    if (focused) {
      setTooltip({
        title: focused.title,
        description: focused.description,
        category: focused.category,
      })
    } else {
      setTooltip(null)
      setInteractionOpen(false)
    }
  }, [focused, enabled, setTooltip, setInteractionOpen])

  useFrame(() => {
    if (!enabled) {
      if (focusedRef.current) setFocused(null)
      return
    }
    const next = findNearestInteractable(camera, INTERACT_RANGE)
    setFocused((prev) => (prev?.id === next?.id ? prev : next))
  })

  useEffect(() => {
    if (!enabled) return
    // Stable listener — reads current focused via ref + store, not closure
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyE') {
        if (focusedRef.current) {
          const { interactionOpen } = useGameStore.getState()
          setInteractionOpen(!interactionOpen)
        } else {
          setInteractionOpen(false)
        }
      }
      if (e.code === 'Escape') {
        setInteractionOpen(false)
      }
    }
    const onClick = () => {
      if (focusedRef.current) {
        const { interactionOpen } = useGameStore.getState()
        setInteractionOpen(!interactionOpen)
      }
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onClick)
    }
  }, [enabled, setInteractionOpen])

  return focused
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

## Task 4: Fix Tower Entrance Trigger

**Files:**
- Modify: `src/scenes/CommonRoomScene.tsx`

The Tower Entrance previously triggered scene transition whenever `tooltip.title === 'Tower Entrance'` — which was fine when tooltip was only set on E-press. Now tooltip is set automatically on proximity, so the check must also require `interactionOpen`.

- [ ] **Step 1: Add `interactionOpen` to the store reads at the top of `CommonRoomScene`**

Find this block near the top of the function body (around line 95–109):

```ts
const focused  = useInteraction()
const setScene = useGameStore((s) => s.setScene)

useEffect(() => {
  onFocusChange(!!focused)
}, [focused, onFocusChange])

// Return to the entry corridor when the player interacts with the entrance door.
const tooltip = useGameStore((s) => s.tooltip)
useEffect(() => {
  if (tooltip?.title === 'Tower Entrance') {
    const timer = setTimeout(() => setScene('entry'), 1200)
    return () => clearTimeout(timer)
  }
}, [tooltip, setScene])
```

Replace it with:

```ts
const focused         = useInteraction()
const setScene        = useGameStore((s) => s.setScene)
const setInteractionOpen = useGameStore((s) => s.setInteractionOpen)

useEffect(() => {
  onFocusChange(!!focused)
}, [focused, onFocusChange])

// Return to the entry corridor only when the player explicitly interacts (presses E)
// near the entrance door — not merely by walking past it.
const tooltip         = useGameStore((s) => s.tooltip)
const interactionOpen = useGameStore((s) => s.interactionOpen)
useEffect(() => {
  if (interactionOpen && tooltip?.title === 'Tower Entrance') {
    const timer = setTimeout(() => {
      setScene('entry')
      setInteractionOpen(false)
    }, 1200)
    return () => clearTimeout(timer)
  }
}, [interactionOpen, tooltip, setScene, setInteractionOpen])
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

## Task 5: Crosshair CSS — Sky-Blue Focus State

**Files:**
- Modify: `src/components/ui/Crosshair.module.css`

- [ ] **Step 1: Replace the full file**

```css
.crosshair {
  position: fixed;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  margin-left: -4px;
  margin-top: -4px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.75);
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.6);
  pointer-events: none;
  transition: background-color 150ms ease, transform 150ms ease, box-shadow 150ms ease;
}

.focused {
  background: #89d0ed;
  box-shadow: 0 0 8px rgba(137, 208, 237, 0.65);
  transform: scale(1.4);
}
```

---

## Task 6: Font Loading

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add Google Fonts preconnect + stylesheet to `<head>`**

Replace the `<head>` section of `index.html` with:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Ravenclaw Common Room</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,700;1,400&family=Manrope:wght@400;500;600&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## Task 7: ProximityHint Component

**Files:**
- Create: `src/components/ui/ProximityHint.tsx`
- Create: `src/components/ui/ProximityHint.module.css`

- [ ] **Step 1: Create `src/components/ui/ProximityHint.module.css`**

```css
.hint {
  position: fixed;
  bottom: 18px;
  left: 18px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 16px 7px 10px;
  background: rgba(41, 42, 42, 0.78);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-radius: 6px;
  border: 1px solid rgba(137, 208, 237, 0.18);
  box-shadow: 0 8px 24px rgba(0, 7, 103, 0.2), 0 2px 8px rgba(0, 0, 0, 0.35);
  pointer-events: none;
  opacity: 0;
  transition: opacity 180ms ease;
}

.visible {
  opacity: 1;
}

.icon {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1.5px solid rgba(137, 208, 237, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #89d0ed;
  flex-shrink: 0;
  line-height: 1;
}

.text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.title {
  font-family: 'Noto Serif', Georgia, serif;
  font-size: 13px;
  font-weight: 400;
  color: #e3e2e2;
  line-height: 1.2;
  white-space: nowrap;
}

.action {
  font-family: 'Manrope', system-ui, sans-serif;
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #89d0ed;
  line-height: 1;
}
```

- [ ] **Step 2: Create `src/components/ui/ProximityHint.tsx`**

```tsx
import styles from './ProximityHint.module.css'
import type { Tooltip } from '../../types'

interface Props {
  tooltip: Tooltip | null
}

export function ProximityHint({ tooltip }: Props) {
  return (
    <div
      className={`${styles.hint} ${tooltip ? styles.visible : ''}`}
      role="status"
      aria-live="polite"
    >
      <span className={styles.icon} aria-hidden="true">⊕</span>
      <div className={styles.text}>
        <span className={styles.title}>{tooltip?.title ?? ''}</span>
        <span className={styles.action}>Press E to interact</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

## Task 8: InteractionPopup Component

**Files:**
- Create: `src/components/ui/InteractionPopup.tsx`
- Create: `src/components/ui/InteractionPopup.module.css`

- [ ] **Step 1: Create `src/components/ui/InteractionPopup.module.css`**

```css
.overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.popup {
  width: 340px;
  background: rgba(41, 42, 42, 0.88);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 6px;
  border: 1px solid rgba(69, 70, 82, 0.25);
  box-shadow: 0 20px 40px rgba(0, 7, 103, 0.25), 0 4px 12px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  position: relative;
  pointer-events: auto;
  opacity: 0;
  transition: opacity 180ms ease;
}

.popupVisible {
  opacity: 1;
}

.watermark {
  position: absolute;
  bottom: -10px;
  right: -10px;
  font-size: 70px;
  line-height: 1;
  opacity: 0.05;
  user-select: none;
  pointer-events: none;
}

.header {
  padding: 16px 20px 12px;
}

.category {
  font-family: 'Manrope', system-ui, sans-serif;
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #89d0ed;
  margin-bottom: 4px;
  line-height: 1;
}

.title {
  font-family: 'Noto Serif', Georgia, serif;
  font-size: 20px;
  font-weight: 700;
  color: #e3e2e2;
  line-height: 1.2;
}

.divider {
  height: 1px;
  margin: 0 20px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(137, 208, 237, 0.15),
    transparent
  );
}

.body {
  padding: 14px 20px 18px;
  position: relative;
  z-index: 1;
}

.description {
  font-family: 'Manrope', system-ui, sans-serif;
  font-size: 13px;
  font-weight: 400;
  font-style: italic;
  line-height: 1.6;
  color: #c6c5d4;
  margin: 0 0 16px;
}

.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dismiss {
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: 'Manrope', system-ui, sans-serif;
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #454652;
}

.keyBadge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 3px;
  border: 1px solid #454652;
  font-size: 9px;
  font-weight: 600;
  font-family: 'Manrope', system-ui, sans-serif;
  color: #c6c5d4;
  flex-shrink: 0;
}

.inspectBtn {
  background: linear-gradient(135deg, #bdc2ff 0%, #1a237e 100%);
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  font-family: 'Manrope', system-ui, sans-serif;
  font-size: 11px;
  font-weight: 600;
  color: #1b247f;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  cursor: pointer;
}
```

- [ ] **Step 2: Create `src/components/ui/InteractionPopup.tsx`**

```tsx
import { useGameStore } from '../../store/useGameStore'
import styles from './InteractionPopup.module.css'

export function InteractionPopup() {
  const tooltip = useGameStore((s) => s.tooltip)
  const interactionOpen = useGameStore((s) => s.interactionOpen)
  const setInteractionOpen = useGameStore((s) => s.setInteractionOpen)

  if (!tooltip) return null

  return (
    <div className={styles.overlay}>
      <div className={`${styles.popup} ${interactionOpen ? styles.popupVisible : ''}`}>
        <div className={styles.watermark} aria-hidden="true">🦅</div>

        <div className={styles.header}>
          {tooltip.category && (
            <div className={styles.category}>{tooltip.category}</div>
          )}
          <div className={styles.title}>{tooltip.title}</div>
        </div>

        <div className={styles.divider} />

        <div className={styles.body}>
          <p className={styles.description}>{tooltip.description}</p>
          <div className={styles.footer}>
            <span className={styles.dismiss}>
              <span className={styles.keyBadge}>E</span>
              Close
            </span>
            <button
              className={styles.inspectBtn}
              onClick={() => setInteractionOpen(false)}
            >
              Inspect
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

## Task 9: Wire HUD + Delete TooltipCard

**Files:**
- Modify: `src/components/ui/HUD.tsx`
- Delete: `src/components/ui/TooltipCard.tsx`
- Delete: `src/components/ui/TooltipCard.module.css`

- [ ] **Step 1: Rewrite `src/components/ui/HUD.tsx`**

```tsx
import { Crosshair } from '../interaction/Crosshair'
import { ProximityHint } from './ProximityHint'
import { InteractionPopup } from './InteractionPopup'
import { useGameStore } from '../../store/useGameStore'

interface Props {
  crosshairFocused: boolean
}

export function HUD({ crosshairFocused }: Props) {
  const tooltip = useGameStore((s) => s.tooltip)
  return (
    <>
      <Crosshair focused={crosshairFocused} />
      <ProximityHint tooltip={tooltip} />
      <InteractionPopup />
    </>
  )
}
```

- [ ] **Step 2: Delete `TooltipCard.tsx` and `TooltipCard.module.css`**

```bash
rm src/components/ui/TooltipCard.tsx src/components/ui/TooltipCard.module.css
```

- [ ] **Step 3: Typecheck + full test suite**

```bash
npx tsc --noEmit && npm run test:run
```

Expected: no type errors, all tests pass.

---

## Task 10: Manual Verification in Browser

```bash
npm run dev
```

Work through each check:

- [ ] **Crosshair** — walk near the tower entrance door. Dot turns sky-blue and grows. Walk away — returns to white.

- [ ] **Proximity hint** — bottom-left glassmorphism pill appears with the item name and "Press E to interact" as soon as the crosshair locks on. Fades out when you turn away.

- [ ] **Interaction popup** — press E while near the door. Center popup fades in with title, description, sky-blue divider, eagle watermark, E-dismiss label and Inspect button. Press E again — popup fades out. Walk away — popup closes.

- [ ] **Tower Entrance navigation** — press E near the door. Popup opens. Verify the room does NOT transition for 1200 ms (the transition still fires — that is correct). Wait and confirm the fade + scene switch back to entry happens.

- [ ] **Other interactables** — repeat proximity hint + popup check on: Writing Desk, Globe Stand, Statue, Bookshelves (if they have InteractableObject wrappers).

- [ ] **No regressions** — confirm WASD movement, mouse look, and staircase elevation all still work while the popup is open.

- [ ] **Fonts** — Noto Serif renders for popup title + proximity hint title. Manrope renders for body/labels. (Check DevTools → Network → Fonts to confirm both load.)
