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
