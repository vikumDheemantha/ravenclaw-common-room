# Astral Library HUD — Design Spec
**Date:** 2026-04-22  
**Source design:** Stitch project "Ravenclaw Common Room Tour" (`projects/15355437460338303699`)  
**Screens referenced:** "Ravenclaw Common Room - The Astral Library", "Character Customization - The Astral Library"

---

## 1. Overview

Replace the current single-layer `TooltipCard` with a two-layer interaction system themed on the "Celestial Aerie" / Astral Library design system: a subtle **proximity hint** that appears when the player is near something interactable, and a richer **interaction popup** that opens when they press E.

The player stays in pointer-lock throughout — no cursor is shown, movement is not paused. The popup is dismissed exclusively with E.

---

## 2. Design Tokens

Sourced directly from the Stitch project's `designMd` and `namedColors`. Only the tokens used by HUD components are listed here.

| Token | Value | Usage |
|---|---|---|
| `surface-container-high` | `#292a2a` | Proximity hint + popup background |
| `surface-container-highest` | `#333535` | Popup internal card lift |
| `primary` | `#bdc2ff` | Periwinkle accent, CTA gradient start |
| `primary-container` | `#1a237e` | CTA gradient end |
| `tertiary` | `#89d0ed` | Sky-blue: focused crosshair, hint action text, ghost border tint, popup divider |
| `on-surface` | `#e3e2e2` | Primary body text |
| `on-surface-variant` | `#c6c5d4` | Muted/italic text |
| `outline-variant` | `#454652` | Ghost border base, key badge border |
| `on-primary` | `#1b247f` | CTA button label |

**Typography:**
- Display / titles: **Noto Serif** (weights 400, 700)
- Body / labels / UI: **Manrope** (weights 400, 500, 600)
- Label meta style: `font-size: 10px`, `text-transform: uppercase`, `letter-spacing: 0.08–0.1em`

**Glassmorphism rule:** floating panels use `background` at 78–88% opacity + `backdrop-filter: blur(14–16px)`. No solid borders for content separation — use tonal background shifts or a `linear-gradient` hairline (`rgba(137,208,237,0.15)`) instead of a 1px solid line.

**Shadow:** `box-shadow: 0 20px 40px rgba(0,7,103,0.25), 0 4px 12px rgba(0,0,0,0.4)` — blue-tinted, not black.

**Border-radius:** `6px` (`ROUND_FOUR` — "cut stone", not pill).

---

## 3. Type Changes

`src/types/index.ts` — add one optional field to both interfaces:

```ts
export interface Tooltip {
  title: string
  description: string
  category?: string  // e.g. "Artifact · The Astral Library" — shown above popup title
}

export interface InteractableDescriptor {
  id: string
  title: string
  description: string
  category?: string  // passed through to Tooltip by useInteraction
}
```

`useInteraction` already calls `setTooltip({ title, description })` from the descriptor — it must also pass `category` when present:
```ts
setTooltip({ title: d.title, description: d.description, category: d.category })
```

Existing `InteractableObject` usages that omit `category` are unaffected — the popup falls back to rendering nothing in the category row when the field is absent.

---

## 4. Store Changes

`src/store/useGameStore.ts` — add two fields:

```ts
interactionOpen: boolean
setInteractionOpen: (open: boolean) => void
```

`interactionOpen` is `false` by default. It is set to `true` when the player presses E near a focused interactable. It is set back to `false` when the player presses E again (and no interactable with a special action is targeted). Clearing `tooltip` (walking away) also resets `interactionOpen` to `false`.

---

## 5. Component Specs

### 5.1 Crosshair (`src/components/interaction/Crosshair.tsx` + `.module.css`)

**Idle state:** 8px white dot, `rgba(255,255,255,0.75)`, subtle drop shadow.  
**Focused state:** 10px dot, color `#89d0ed` (tertiary), `box-shadow: 0 0 8px rgba(137,208,237,0.65)`, `transform: scale(1.4)`. Transition: `150ms ease`.

No structural change to the component — only CSS values update.

---

### 5.2 ProximityHint (`src/components/ui/ProximityHint.tsx` + `.module.css`)

**Replaces:** `TooltipCard`. The `TooltipCard` files are deleted.

**Position:** `position: fixed`, `bottom: 18px`, `left: 18px` (bottom-left corner).

**Visibility:** `opacity: 0` when `tooltip` is null, `opacity: 1` when a tooltip is set. Transition: `180ms ease`.

**Visual:**
```
┌─────────────────────────────────┐
│ [⊕]  Ancient Bookshelf          │
│       PRESS E TO INTERACT       │
└─────────────────────────────────┘
```
- Container: `background: rgba(41,42,42,0.78)`, `backdrop-filter: blur(14px)`, `border-radius: 6px`, `border: 1px solid rgba(137,208,237,0.18)`, blue-tinted shadow.
- Icon cell (`⊕`): 18×18px, `border-radius: 4px`, `border: 1.5px solid rgba(137,208,237,0.5)`, color `#89d0ed`.
- Title: Noto Serif, 13px, `color: on-surface`.
- Action label: Manrope, 10px, uppercase, `letter-spacing: 0.08em`, `color: tertiary (#89d0ed)`. Text: `"Press E to interact"`.
- `pointer-events: none`.

**Props:** `{ tooltip: Tooltip | null }` — same interface as old `TooltipCard`.

---

### 5.3 InteractionPopup (`src/components/ui/InteractionPopup.tsx` + `.module.css`)

**Trigger:** Rendered when `interactionOpen === true` (read from store). Positioned `fixed`, centered (`top: 50%, left: 50%, transform: translate(-50%,-50%)`).

**Entrance animation:** Fade in — `opacity: 0 → 1` over `180ms ease`. No slide, no scale.

**Exit:** Fade out over `150ms ease`, then unmounted. Implemented via a CSS class toggle and `onTransitionEnd` unmount pattern (or a small `useEffect` with a timeout).

**Visual:** `width: 340px max-width`.
```
┌──────────────────────────────────┐
│  ARTIFACT · THE ASTRAL LIBRARY   │  ← Manrope 10px uppercase tertiary
│  Ancient Bookshelf               │  ← Noto Serif 20px bold on-surface
├ ─ ─ ─ ─ sky-blue hairline ─ ─ ─ ┤  ← linear-gradient hairline, no solid border
│  Rows of tomes bound in          │  ← Manrope 13px italic on-surface-variant
│  midnight-blue leather...        │
│                                  │
│  [E] Close          [Inspect →]  │  ← key badge + gradient CTA
└──────────────────────────────────┘
                        🦅 (5% opacity watermark, bottom-right)
```

- Background: `rgba(41,42,42,0.88)`, `backdrop-filter: blur(16px)`, `border-radius: 6px`, `border: 1px solid rgba(69,70,82,0.25)`.
- Shadow: `0 20px 40px rgba(0,7,103,0.25), 0 4px 12px rgba(0,0,0,0.4)`.
- Eagle watermark: absolute, `bottom: -10px, right: -10px`, `font-size: 70px`, `opacity: 0.05`, `user-select: none`, `pointer-events: none`.
- Category row: Manrope 10px, uppercase, `letter-spacing: 0.1em`, color `#89d0ed`.
- Title: Noto Serif 20px bold, `color: on-surface`.
- Divider: `height: 1px`, `margin: 0 20px`, `background: linear-gradient(90deg, transparent, rgba(137,208,237,0.15), transparent)`.
- Description: Manrope 13px italic, `line-height: 1.6`, `color: on-surface-variant`.
- Dismiss label: `[E]` key badge (18×18px, `border: 1px solid outline-variant`, `border-radius: 3px`) + "Close" in Manrope 10px uppercase `outline-variant`.
- Inspect CTA: `background: linear-gradient(135deg, #bdc2ff, #1a237e)`, `border-radius: 6px`, Manrope 11px bold `color: #1b247f`, uppercase. This button currently has no action beyond closing — it is a visual affordance for future interaction phases.
- `pointer-events: none` on the popup itself when `interactionOpen` transitions to false (to prevent clicks during fade-out).

**The "Inspect" button** fires `setInteractionOpen(false)` for now. Wiring to actual interaction logic is deferred to a future phase.

---

### 5.4 HUD (`src/components/ui/HUD.tsx`)

Mounts all three UI elements as React DOM siblings outside the Canvas:

```tsx
<>
  <Crosshair focused={crosshairFocused} />
  <ProximityHint tooltip={tooltip} />
  <InteractionPopup />   {/* reads interactionOpen + tooltip from store internally */}
</>
```

`TooltipCard` import and usage are removed. `TooltipCard.tsx` and `TooltipCard.module.css` are deleted.

---

## 6. Interaction Hook Changes

`src/hooks/useInteraction.ts` — existing E-key listener extended:

- **On E pressed** (interactable focused): if `interactionOpen` is false → `setInteractionOpen(true)`. If already open → `setInteractionOpen(false)`.  
- **On tooltip cleared** (player walks away): `setInteractionOpen(false)`.  
- The Tower Entrance special-case in `CommonRoomScene` (auto-trigger on tooltip title match) is unaffected — it reads `tooltip` from the store, not `interactionOpen`.

Pointer-lock is **not released** when the popup opens. The player can still look and move while reading.

---

## 7. Font Loading

Noto Serif and Manrope must be loaded in `index.html` (or a global CSS import):

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,700;1,400&family=Manrope:wght@400;500;600&display=swap" rel="stylesheet">
```

---

## 8. Files Created / Modified / Deleted

| Action | File |
|---|---|
| **Create** | `src/components/ui/ProximityHint.tsx` |
| **Create** | `src/components/ui/ProximityHint.module.css` |
| **Create** | `src/components/ui/InteractionPopup.tsx` |
| **Create** | `src/components/ui/InteractionPopup.module.css` |
| **Modify** | `src/components/ui/HUD.tsx` |
| **Modify** | `src/components/ui/Crosshair.module.css` |
| **Modify** | `src/hooks/useInteraction.ts` |
| **Modify** | `src/store/useGameStore.ts` |
| **Modify** | `src/types/index.ts` |
| **Modify** | `index.html` |
| **Delete** | `src/components/ui/TooltipCard.tsx` |
| **Delete** | `src/components/ui/TooltipCard.module.css` |

---

## 9. Testing Notes

- Pure-logic modules (`useGameStore`, registries, collision) maintain existing test coverage. The new `interactionOpen` field in the store needs a test: default false, toggles correctly, resets on tooltip clear.
- `ProximityHint` and `InteractionPopup` are DOM-rendered components — verify manually in the browser across all existing interactable objects (tower entrance, writing desk, globe stand, bookshelves, statue).
- Confirm pointer-lock is not broken when popup opens (player can still look/move).
- Confirm the Tower Entrance auto-navigate (`tooltip.title === 'Tower Entrance'`) still fires correctly while popup is open.

---

## 10. Out of Scope

- The "Inspect" button action (deferred to future interaction phase)
- Multiplayer / avatar display in popup
- Sound effects on popup open/close
- Mobile / touch input
- Riddle system
