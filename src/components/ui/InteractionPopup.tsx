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
