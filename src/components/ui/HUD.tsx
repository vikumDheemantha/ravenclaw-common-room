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
