import { Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { EntryScene } from './scenes/EntryScene'
import { CommonRoomScene } from './scenes/CommonRoomScene'
import { HUD } from './components/ui/HUD'
import { FadeOverlay } from './components/ui/FadeOverlay'
import { useGameStore } from './store/useGameStore'
import styles from './App.module.css'

export default function App() {
  const scene = useGameStore((s) => s.scene)
  const setScene = useGameStore((s) => s.setScene)
  const setTooltip = useGameStore((s) => s.setTooltip)
  const [focused, setFocused] = useState(false)
  const [fading, setFading] = useState(false)
  const [started, setStarted] = useState(false)

  const handleEnter = () => {
    setFading(true)
    setTimeout(() => {
      setScene('common-room')
      setTooltip(null)
      setTimeout(() => setFading(false), 100)
    }, 550)
  }

  // Reset focus state on scene change
  useEffect(() => setFocused(false), [scene])

  return (
    <div className={styles.root}>
      <Canvas camera={{ fov: 75, near: 0.1, far: 200, position: [0, 1.7, -4] }}>
        <Suspense fallback={null}>
          {scene === 'entry' && (
            <EntryScene onFocusChange={setFocused} onEnter={handleEnter} />
          )}
          {scene === 'common-room' && (
            <CommonRoomScene onFocusChange={setFocused} />
          )}
        </Suspense>
      </Canvas>

      <HUD crosshairFocused={focused} />
      <FadeOverlay visible={fading} />

      {!started && (
        <div className={styles.startOverlay} onClick={() => setStarted(true)}>
          <h1>Ravenclaw Tower</h1>
          <p>
            Click to begin. Use <strong>WASD</strong> or arrow keys to walk,
            <strong> mouse</strong> to look, and press <strong>E</strong> or click
            to interact with objects. Press <strong>Escape</strong> to release the cursor.
          </p>
        </div>
      )}
    </div>
  )
}
