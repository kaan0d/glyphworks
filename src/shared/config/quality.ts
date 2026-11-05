export type QualityName = 'ultra' | 'high' | 'balanced' | 'low'

export interface Quality {
  glyphs: number
  dpr: number
  bgParticles: number
  orbitDots: number
  sparkles: number
  bloom: boolean
}

export const QUALITY: Record<QualityName, Quality> = {
  ultra: { glyphs: 15000, dpr: 2, bgParticles: 1400, orbitDots: 520, sparkles: 1100, bloom: true },
  high: { glyphs: 11000, dpr: 1.5, bgParticles: 900, orbitDots: 420, sparkles: 800, bloom: true },
  balanced: { glyphs: 7000, dpr: 1.25, bgParticles: 600, orbitDots: 300, sparkles: 500, bloom: true },
  low: { glyphs: 4000, dpr: 1, bgParticles: 300, orbitDots: 160, sparkles: 250, bloom: false },
}
export const MAX_GLYPHS = QUALITY.ultra.glyphs
export const MAX_SPARKLES = QUALITY.ultra.sparkles
