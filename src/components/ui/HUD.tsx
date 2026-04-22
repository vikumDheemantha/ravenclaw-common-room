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
