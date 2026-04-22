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
