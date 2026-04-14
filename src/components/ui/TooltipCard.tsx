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
