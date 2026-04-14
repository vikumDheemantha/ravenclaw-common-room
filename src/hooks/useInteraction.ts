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

  // Keep ref in sync with state so the stable event handler can read current value
  useEffect(() => {
    focusedRef.current = focused
  }, [focused])

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
    // Stable listener — reads current focused via ref, not closure
    const trigger = () => {
      const current = focusedRef.current
      if (current) {
        setTooltip({ title: current.title, description: current.description })
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
  }, [enabled, setTooltip])  // no `focused` in deps — listener is stable

  return focused
}
