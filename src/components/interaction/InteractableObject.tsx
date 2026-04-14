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
