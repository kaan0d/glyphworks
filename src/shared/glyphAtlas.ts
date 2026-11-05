import { CanvasTexture, LinearMipmapLinearFilter, LinearFilter } from 'three'

/** Dark -> bright ramp. One 48x80 cell per glyph, bold monospace, white on black. */
export const RAMP = '.,:;+=*#%@'

export function makeGlyphAtlas() {
  const cw = 48, ch = 80
  const c = document.createElement('canvas')
  c.width = cw * RAMP.length; c.height = ch
  const g = c.getContext('2d')!
  g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height)
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'
  g.font = 'bold 64px ui-monospace, "Cascadia Mono", Consolas, Menlo, monospace'
  for (let i = 0; i < RAMP.length; i++) g.fillText(RAMP[i], i * cw + cw / 2, ch / 2 + 4)
  const tex = new CanvasTexture(c)
  tex.minFilter = LinearMipmapLinearFilter; tex.magFilter = LinearFilter
  tex.generateMipmaps = true; tex.anisotropy = 4
  return { tex, count: RAMP.length }
}
