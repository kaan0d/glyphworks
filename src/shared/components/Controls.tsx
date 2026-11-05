import { useEffect, useState } from 'react'
import type { Settings } from '../config/scene'
import type { QualityName } from '../config/quality'
import type { SceneApi } from './SceneView'

type Props = { settings: Settings; apiRef: { current: SceneApi | null } }

export function Controls({ settings, apiRef }: Props) {
  const [open, setOpen] = useState(false)
  const [, bump] = useState(0)
  const [stats, setStats] = useState<ReturnType<NonNullable<SceneApi['stats']>>>(null)
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => { settings[k] = v; bump((n) => n + 1) }

  useEffect(() => {
    const id = setInterval(() => setStats(apiRef.current?.stats() ?? null), 250)
    const key = (e: KeyboardEvent) => { if (e.key === 'h' || e.key === 'H') setOpen((o) => !o) }
    window.addEventListener('keydown', key)
    return () => { clearInterval(id); window.removeEventListener('keydown', key) }
  }, [apiRef])

  const slider = (label: string, k: 'speed' | 'density' | 'glyphScale' | 'sparkle' | 'particles' | 'bloom' | 'brightness' | 'tilt' | 'yaw' | 'push' | 'pushRadius', min: number, max: number, step = 0.05) => (
    <label>
      {label}: {settings[k].toFixed(2)}
      <input type="range" min={min} max={max} step={step} value={settings[k]} onChange={(e) => set(k, +e.target.value)} />
    </label>
  )
  const check = (label: string, k: 'orbits' | 'rose' | 'technical') => (
    <label className="chk">
      <input type="checkbox" checked={settings[k]} onChange={(e) => set(k, e.target.checked)} />
      {label}
    </label>
  )

  return (
    <>
      <button className="gear" aria-label="Controls (H)" onClick={() => setOpen(!open)}>⚙</button>
      {settings.technical && stats && (
        <pre className="tech">
          {`rotation ${stats.angleDeg.toFixed(2).padStart(6, '0')}°   glints ${stats.sparkles}\n` +
            `letters ${stats.glyphs.toLocaleString()}   reveal ${(stats.reveal * 100).toFixed(0)}%\n` +
            `quality ${stats.quality}   ${stats.fps.toFixed(0)} fps`}
        </pre>
      )}
      {open && (
        <div className="panel">
          <div className="row">
            <button onClick={() => apiRef.current?.replay()}>Replay</button>
            <button onClick={() => set('paused', !settings.paused)}>{settings.paused ? 'Resume' : 'Pause'}</button>
          </div>
          {slider('Rotation speed', 'speed', 0, 3)}
          {slider('Tilt (deg)', 'tilt', -90, 90, 1)}
          {slider('Angle offset (deg)', 'yaw', -180, 180, 1)}
          {slider('Brightness', 'brightness', 0, 3)}
          {slider('Mouse push', 'push', 0, 3)}
          {slider('Push radius', 'pushRadius', 0.1, 1.5)}
          {slider('Character density', 'density', 0.2, 1)}
          {slider('Character scale', 'glyphScale', 0.6, 2)}
          {slider('Sparkles', 'sparkle', 0, 2)}
          {slider('Particles', 'particles', 0, 2)}
          {slider('Bloom', 'bloom', 0, 1.5)}
          {check('Orbital paths', 'orbits')}
          {check('Rose balloon', 'rose')}
          {check('Technical overlay', 'technical')}
          <label>
            Quality
            <select value={settings.quality} onChange={(e) => { set('quality', e.target.value as QualityName); apiRef.current?.setQuality() }}>
              <option value="ultra">Ultra</option><option value="high">High</option>
              <option value="balanced">Balanced</option><option value="low">Low</option>
            </select>
          </label>
        </div>
      )}
    </>
  )
}
