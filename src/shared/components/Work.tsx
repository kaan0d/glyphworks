import { useMemo, useRef } from 'react'
import { SceneView, type SceneApi } from './SceneView'
import { Controls } from './Controls'
import { DEFAULTS, type Settings } from '../config/scene'
import type { SceneDef } from '../surface'

/** Full-screen page for one work: the canvas plus the hidden control panel. */
export function Work({ def }: { def: SceneDef }) {
  // one mutable settings object: the render loop reads it every frame, React only edits it
  const settings = useMemo<Settings>(() => ({ ...DEFAULTS }), [])
  const apiRef = useRef<SceneApi | null>(null)
  return (
    <>
      <SceneView settings={settings} apiRef={apiRef} def={def} />
      <Controls settings={settings} apiRef={apiRef} />
    </>
  )
}
