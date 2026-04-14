import styles from './Crosshair.module.css'

interface Props {
  focused: boolean
}

export function Crosshair({ focused }: Props) {
  return <div className={`${styles.crosshair} ${focused ? styles.focused : ''}`} />
}
