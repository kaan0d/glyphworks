import { useEffect, useRef } from 'react'
import { GlyphRenderer, type Stats } from '../GlyphRenderer'
import type { Settings } from '../config/scene'
import type { SceneDef } from '../surface'

export interface SceneApi { replay(): void; stats(): Stats | null; setQuality(): void }

export function SceneView({ settings, apiRef, def }: { settings: Settings; apiRef: { current: SceneApi | null }; def: SceneDef }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const r = new GlyphRenderer(canvas, settings, def)
    apiRef.current = { replay: () => r.replay(), stats: () => r.getStats(), setQuality: () => r.setQuality() }
    const fit = () => { r.resize(canvas.clientWidth, canvas.clientHeight) }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(canvas)
    let raf = 0
    const loop = (t: number) => { r.frame(t); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); ro.disconnect(); apiRef.current = null; r.dispose() }
  }, [settings, apiRef, def])

  return <canvas ref={canvasRef} className="scene" />
}
