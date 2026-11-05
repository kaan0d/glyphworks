import type { QualityName } from './quality'

export interface Settings {
  quality: QualityName
  paused: boolean
  speed: number
  density: number
  glyphScale: number
  sparkle: number
  particles: number
  bloom: number
  orbits: boolean
  rose: boolean // single switch: silver (default) vs rose balloon palette
  technical: boolean
  brightness: number
  tilt: number // degrees, object pitch
  yaw: number // degrees, static offset added to the spin
  mouseFx: boolean // pointer warp on/off
  push: number // mouse repel strength, 0 = off
  pushRadius: number // world units
}

export const DEFAULTS: Settings = {
  quality: 'ultra', paused: false, speed: 1, density: 1, glyphScale: 1, sparkle: 1,
  particles: 1, bloom: 0.3, orbits: true, rose: false, technical: false,
  brightness: 1, tilt: 0, yaw: 0, mouseFx: true, push: 1, pushRadius: 0.35,
}
