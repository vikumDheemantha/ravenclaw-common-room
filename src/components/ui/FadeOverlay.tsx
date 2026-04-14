import styles from './FadeOverlay.module.css'

interface Props {
  visible: boolean
}

export function FadeOverlay({ visible }: Props) {
  return <div className={`${styles.overlay} ${visible ? styles.visible : ''}`} />
}
