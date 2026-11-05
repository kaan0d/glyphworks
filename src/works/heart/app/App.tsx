import { useMemo, useRef } from 'react'
import { HeartScene, type SceneApi } from '../components/HeartScene'
import { Controls } from '../components/Controls'
import { DEFAULTS, type Settings } from '../config/scene'

export function App() {
  // one mutable settings object: the render loop reads it every frame, React only edits it
  const settings = useMemo<Settings>(() => ({ ...DEFAULTS }), [])
  const apiRef = useRef<SceneApi | null>(null)
  return (
    <>
      <HeartScene settings={settings} apiRef={apiRef} />
      <Controls settings={settings} apiRef={apiRef} />
    </>
  )
}
