# glyphworks

Real-time 3D works drawn entirely as glowing glyphs. WebGL2, Three.js, custom GLSL, React UI, no video or model assets. Runs in the browser, one page per work.

## Works

| Work | What it is |
| --- | --- |
| [`heart`](works/heart) | Hollow, inflated heart balloon built from ~15k glyphs, with moving light, glints, orbits and bloom |

## Features (heart)

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
npm run dev        # http://localhost:5173  (gallery), /works/heart/ for the heart
npm run build      # static site in dist/, works with any static host
```

Capture hook: `/works/heart/?t=9&angle=55&hold=1` jumps the timeline (seconds, degrees) and pauses.

## Layout

```
index.html              gallery, one link per work
works/<name>/index.html entry page of a work
src/shared/             code reused by all works (glyph atlas, seeded random)
src/works/<name>/       one folder per work
  app/ components/      React shell and controls
  config/               tuning: geometry, quality, animation, defaults
  geometry/             surface maths and sampling
  rendering/            renderer class
  shaders/              GLSL
  animation/            timeline
vite.config.ts          list of works (one entry each)
```

## Adding a work

1. Copy `src/works/heart` to `src/works/<name>` and `works/heart/index.html` to `works/<name>/index.html` (fix the script path).
2. Add `<name>` to the `works` array in `vite.config.ts` and a link in `index.html`.
3. Move anything a second work needs into `src/shared/`.

## Limits

- Shape was matched by eye, not fitted to pixels. The heart is a clean classic heart, not a copy of any product photo.
- Looked at in headless Chrome (software renderer) only; frame rates on real GPUs are unmeasured.
- WebGL2 required. Ultra quality needs a decent GPU, lower presets reduce counts and resolution.

## License

MIT, see [LICENSE](LICENSE).
