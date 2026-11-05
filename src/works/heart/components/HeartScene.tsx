import { useEffect, useRef } from 'react'
import { HeartRenderer, type Stats } from '../rendering/HeartRenderer'
import type { Settings } from '../config/scene'

export interface SceneApi { replay(): void; stats(): Stats | null; setQuality(): void }

export function HeartScene({ settings, apiRef }: { settings: Settings; apiRef: { current: SceneApi | null } }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const r = new HeartRenderer(canvas, settings)
    apiRef.current = { replay: () => r.replay(), stats: () => r.getStats(), setQuality: () => r.setQuality() }
    const fit = () => { r.resize(canvas.clientWidth, canvas.clientHeight) }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(canvas)
    let raf = 0
    const loop = (t: number) => { r.frame(t); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); ro.disconnect(); apiRef.current = null; r.dispose() }
  }, [settings, apiRef])

  return <canvas ref={canvasRef} className="scene" />
}
