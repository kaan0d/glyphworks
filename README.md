# glyphworks

Real-time 3D works drawn entirely as glowing glyphs. WebGL2, Three.js, custom GLSL, React UI, no video or model assets. Runs in the browser, one page per work.

## Works

| Work | What it is | |
| --- | --- | --- |
| `heart` | Hollow, inflated heart balloon, drawn from the tip upward | [Preview](https://kaandinc.com/glyphworks/heart/) |
| `ring` | Diamond ring: band, prongs, then the faceted stone filling in | [Preview](https://kaandinc.com/glyphworks/ring/) |
| `bottle` | Longneck beer bottle: glass rises from the base, label and collar fill in, the crown cap closes last | [Preview](https://kaandinc.com/glyphworks/bottle/) |
| `wineglass` | Wine glass: foot and stem first, then the hollow tulip bowl fills | [Preview](https://kaandinc.com/glyphworks/wineglass/) |
| `hourglass` | Hourglass: pinched glass bulbs, plates, posts and a mound of sand | [Preview](https://kaandinc.com/glyphworks/hourglass/) |
| `mobius` | Möbius band: a wide ribbon with one half twist | [Preview](https://kaandinc.com/glyphworks/mobius/) |
| `knot` | Trefoil knot as one thick tube | [Preview](https://kaandinc.com/glyphworks/knot/) |
| `dna` | DNA double helix with base pairs | [Preview](https://kaandinc.com/glyphworks/dna/) |
| `nautilus` | Nautilus shell: logarithmic spiral with fine ribs | [Preview](https://kaandinc.com/glyphworks/nautilus/) |
| `planet` | Ringed planet with a moon | [Preview](https://kaandinc.com/glyphworks/planet/) |
| `crown` | Crown with five points and jewels | [Preview](https://kaandinc.com/glyphworks/crown/) |
| `key` | Old key with a round bow and toothed bit | [Preview](https://kaandinc.com/glyphworks/key/) |

All works in one place: [kaandinc.com/glyphworks](https://kaandinc.com/glyphworks/).

## Features (shared by all works)

- **Procedural shell:** outer heart contour and inner hole contour, blended into a pillow-shaped front and back surface with sealed seams and foil pleats; analytic normals.
- **Glyph renderer:** area-uniform surface samples drawn as instanced quads from a glyph atlas; glyph picked by lighting, centre snapped to the pixel grid so glyphs stay sharp while rotating.
- **Correct occlusion:** a hidden depth pass of the real shell hides back glyphs and keeps the hole empty.
- **Lighting:** fixed key light plus a rim light circling over time, wrapped diffuse, tight foil speculars, fresnel edge.
- **Glints:** thin cross-ray sparkles attached to surface points, visible only when the surface faces a light.
- **Atmosphere:** drifting dust, faint intersecting orbit ellipses with travellers, light bloom.
- **Timeline:** per-point reveal from the tip upward (0.3-5.6 s), then a steady spin (12 s per turn).
- **Controls:** press `H` or click the dot (bottom right): replay, pause, speed, density, glyph scale, sparkles, particles, bloom, orbits, rose palette, technical overlay, quality preset.

## Setup

```bash
npm install
npm run dev        # http://localhost:5173  (gallery), /heart/ for the heart
npm run build      # static site in dist/, works with any static host
```

Capture hook: `/heart/?t=9&angle=55&hold=1` jumps the timeline (seconds, degrees) and pauses.

## Layout

```
index.html              gallery, built from src/registry.json
src/registry.json       id, title, description of every work
<id>/index.html         entry page of a work (written by npm run sync), served at /<id>/
public/thumbs/<id>.jpg  gallery thumbnails
src/shared/             renderer, shaders, timeline, controls, mesh helpers (used by every work)
src/works/<id>/         geometry of one work: builds a surface mesh with per-vertex reveal order
```

## Adding a work

1. Create `src/works/<id>/scene.ts` exporting `scene` (a `SceneDef`: `build()` returns a mesh, `fit` frames the camera). `src/shared/shapes.ts` has lathe, tube, sheet and box builders; see `src/works/wineglass/scene.ts` for a short example.
2. Add `{ id, title, description }` to `src/registry.json`, run `npm run sync` to write `<id>/index.html`, and add a thumbnail at `public/thumbs/<id>.jpg`.

## Request a work

Want to see something new built as glyphs? [Open an issue](https://github.com/kaan0d/glyphworks/issues/new?template=new-work.md) with the object and, if you have one, a reference image or photo. Simple, recognisable shapes (a bottle, a ring, a lamp) work best. Pull requests with new works are welcome too, see "Adding a work".

## Limits

- Shape was matched by eye, not fitted to pixels. The heart is a clean classic heart, not a copy of any product photo.
- Looked at in headless Chrome (software renderer) only; frame rates on real GPUs are unmeasured.
- WebGL2 required. Ultra quality needs a decent GPU, lower presets reduce counts and resolution.

## License

MIT, see [LICENSE](LICENSE).
