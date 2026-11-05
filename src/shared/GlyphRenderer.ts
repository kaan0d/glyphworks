import {
  AdditiveBlending, BufferAttribute, BufferGeometry, Float32BufferAttribute, InstancedBufferAttribute,
  InstancedBufferGeometry, Material, Matrix3, Matrix4, Mesh, PerspectiveCamera, Points, Scene, ShaderMaterial,
  Vector2, Vector3, WebGLRenderer, WebGLRenderTarget, HalfFloatType, DoubleSide,
} from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'

import common from './shaders/common.glsl?raw'
import asciiVert from './shaders/ascii.vert?raw'
import asciiFrag from './shaders/ascii.frag?raw'
import depthVert from './shaders/depth.vert?raw'
import depthFrag from './shaders/depth.frag?raw'
import sparkVert from './shaders/sparkle.vert?raw'
import sparkFrag from './shaders/sparkle.frag?raw'
import partVert from './shaders/particles.vert?raw'
import partFrag from './shaders/particles.frag?raw'

import { ANIM } from './config/animation'
import { MAX_GLYPHS, MAX_SPARKLES, QUALITY } from './config/quality'
import type { Settings } from './config/scene'
import { Timeline } from './timeline'
import { rng } from './random'
import { makeGlyphAtlas } from './glyphAtlas'
import { sampleMesh, type SceneDef } from './surface'

const FOV = 28
const U = <T>(v: T) => ({ value: v })

export interface Stats { fps: number; angleDeg: number; sparkles: number; glyphs: number; reveal: number; quality: string }

function randUnit(r: () => number) {
  const v = new Vector3(r() - 0.5, r() - 0.5, r() - 0.5)
  return v.lengthSq() < 1e-4 ? new Vector3(0, 1, 0) : v.normalize()
}

export class GlyphRenderer {
  private renderer: WebGLRenderer
  private scene = new Scene()
  private camera = new PerspectiveCamera(FOV, 1, 0.1, 40)
  private composer: EffectComposer | null = null
  private bloom: UnrealBloomPass | null = null
  private timeline = new Timeline()
  private last = 0
  private fpsAcc = 0
  private fpsN = 0
  private fps = 60
  private w = 1
  private h = 1
  private dpr = 1
  private tmp4 = new Matrix4()

  private uni = {
    uTime: U(0), uT0: U(ANIM.drawStart), uT1: U(ANIM.drawEnd), uRot: U(new Matrix3()),
    uRes: U(new Vector2(1, 1)), uKey: U(new Vector3(0, 0.8, 0.6).normalize()), uRim: U(new Vector3(1, 0.5, 0).normalize()),
    uRose: U(0), uBright: U(1), uMouse: U(new Vector2(0, 0)), uMouseStr: U(0), uPush: U(1), uPushR: U(0.9),
  }
  // pointer in NDC; null when outside the canvas. Shader sees a smoothed world position + fade strength.
  private ptr: Vector2 | null = null
  private ptrSmooth = new Vector2()
  private tmpR = new Matrix4()
  private onMove = (e: PointerEvent) => {
    const r = this.canvas.getBoundingClientRect()
    this.ptr = new Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1))
  }
  private onLeave = () => { this.ptr = null }
  private disposables: { dispose(): void }[] = []
  private glyphGeo!: InstancedBufferGeometry
  private sparkGeo!: InstancedBufferGeometry
  private glyphMats: ShaderMaterial[] = []
  private sparkMat!: ShaderMaterial
  private bgPts!: Points
  private orbitPts!: Points
  private bgMat!: ShaderMaterial
  private orbitMat!: ShaderMaterial
  private sparkData!: Float32Array
  private sparkCount = 0
  private glyphCount = 0
  private statAcc = 0
  private activeSparkles = 0
  private onLost = (e: Event) => e.preventDefault()

  constructor(private canvas: HTMLCanvasElement, private s: Settings, private def: SceneDef) {
    this.renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' })
    this.renderer.setClearColor(0x000000, 1)
    canvas.addEventListener('webglcontextlost', this.onLost)
    canvas.addEventListener('pointermove', this.onMove)
    canvas.addEventListener('pointerleave', this.onLeave)
    this.camera.position.set(0, 0, 7.2)
    this.build()
    this.applyQuality()
    // inspection hook: ?t=<seconds>&angle=<degrees> jumps the timeline (deterministic captures)
    const q = new URLSearchParams(location.search)
    if (q.has('t')) this.timeline.t = +q.get('t')!
    if (q.has('angle')) this.timeline.angle = (+q.get('angle')! * Math.PI) / 180
    if (q.has('hold')) s.paused = true
    // ?capture exposes a seek for frame-by-frame video capture (paused, driven from outside)
    if (q.has('capture')) { s.paused = true; (window as any).__seek = (t: number, deg: number) => { this.timeline.t = t; this.timeline.angle = (deg * Math.PI) / 180 } }
  }

  private shader(vs: string, fs: string, extra: Record<string, { value: any }>) {
    const m = new ShaderMaterial({
      vertexShader: common + vs, fragmentShader: common + fs,
      uniforms: { ...this.uni, ...extra },
    })
    this.disposables.push(m)
    return m
  }

  private build() {
    const mesh = this.def.build()
    const samples = sampleMesh(mesh, MAX_GLYPHS)
    const atlas = makeGlyphAtlas()
    this.disposables.push(atlas.tex)

    // depth prepass: the real shell occludes back/hidden glyphs, hole stays empty
    const mg = new BufferGeometry()
    mg.setAttribute('position', new BufferAttribute(mesh.pos, 3))
    mg.setAttribute('aThr', new BufferAttribute(mesh.thr, 1))
    mg.setAttribute('aGhost', new BufferAttribute(mesh.ghost ?? new Float32Array(mesh.thr.length), 1))
    mg.setIndex(new BufferAttribute(mesh.idx, 1))
    this.disposables.push(mg)
    {
      const mat = this.shader(depthVert, depthFrag, {})
      mat.colorWrite = false; mat.side = DoubleSide
      mat.polygonOffset = true; mat.polygonOffsetFactor = 1; mat.polygonOffsetUnits = 1
      const m = new Mesh(mg, mat)
      m.frustumCulled = false; m.renderOrder = 0
      this.scene.add(m)
    }

    // glyph instances
    const quad = new InstancedBufferGeometry()
    quad.setAttribute('position', new Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3))
    quad.setIndex([0, 1, 2, 0, 2, 3])
    quad.setAttribute('aPos', new InstancedBufferAttribute(samples.pos, 3))
    quad.setAttribute('aNormal', new InstancedBufferAttribute(samples.nrm, 3))
    quad.setAttribute('aSeed', new InstancedBufferAttribute(samples.seed, 4))
    quad.setAttribute('aMisc', new InstancedBufferAttribute(samples.misc, 2))
    this.glyphGeo = quad
    this.disposables.push(quad)
    const gExtra = { uAtlas: U(atlas.tex), uGlyphCount: U(atlas.count), uGlyphH: U(8) }
    {
      const mat = this.shader(asciiVert, asciiFrag, gExtra)
      mat.transparent = true; mat.depthWrite = false; mat.blending = AdditiveBlending
      this.glyphMats.push(mat)
      const m = new Mesh(quad, mat)
      m.frustumCulled = false; m.renderOrder = 1
      this.scene.add(m)
    }

    // sparkles: attached to surface samples, weighted to upper lobes and seams
    const r = rng(77)
    const sp = new Float32Array(MAX_SPARKLES * 3), sn = new Float32Array(MAX_SPARKLES * 3), sd = new Float32Array(MAX_SPARKLES * 4)
    let k = 0
    while (k < MAX_SPARKLES) {
      const i = Math.floor(r() * samples.count)
      const w = 0.25 + 0.75 * samples.misc[i * 2 + 1] + 0.5 * samples.misc[i * 2]
      if (r() > w) continue
      sp.set(samples.pos.subarray(i * 3, i * 3 + 3), k * 3)
      sn.set(samples.nrm.subarray(i * 3, i * 3 + 3), k * 3)
      const size = Math.pow(r(), 2.2)
      sd.set([2 + r() * 7, r(), size, samples.seed[i * 4]], k * 4)
      k++
    }
    this.sparkData = sd
    const sg = new InstancedBufferGeometry()
    sg.setAttribute('position', new Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3))
    sg.setIndex([0, 1, 2, 0, 2, 3])
    sg.setAttribute('aPos', new InstancedBufferAttribute(sp, 3))
    sg.setAttribute('aNormal', new InstancedBufferAttribute(sn, 3))
    sg.setAttribute('aSp', new InstancedBufferAttribute(sd, 4))
    this.sparkGeo = sg
    this.disposables.push(sg)
    this.sparkMat = this.shader(sparkVert, sparkFrag, { uSparkPx: U(60), uSparkle: U(1) })
    this.sparkMat.transparent = true; this.sparkMat.depthWrite = false; this.sparkMat.blending = AdditiveBlending
    const sm = new Mesh(sg, this.sparkMat)
    sm.frustumCulled = false; sm.renderOrder = 2
    this.scene.add(sm)

    this.buildParticles()
  }

  /** Background drift particles + faint orbital ellipses (dotted paths and travellers). */
  private buildParticles() {
    const r = rng(2024)
    const mk = (n: number, fill: (i: number, c: number[], u: number[], v: number[], p: number[]) => void) => {
      const c = new Float32Array(n * 3), u = new Float32Array(n * 3), v = new Float32Array(n * 3), p = new Float32Array(n * 4)
      const tc: number[] = [0, 0, 0], tu: number[] = [0, 0, 0], tv: number[] = [0, 0, 0], tp: number[] = [0, 0, 0, 0]
      for (let i = 0; i < n; i++) {
        fill(i, tc, tu, tv, tp)
        c.set(tc, i * 3); u.set(tu, i * 3); v.set(tv, i * 3); p.set(tp, i * 4)
      }
      const g = new BufferGeometry()
      g.setAttribute('position', new BufferAttribute(new Float32Array(n * 3), 3))
      g.setAttribute('aCenter', new BufferAttribute(c, 3)); g.setAttribute('aU', new BufferAttribute(u, 3))
      g.setAttribute('aV', new BufferAttribute(v, 3)); g.setAttribute('aP', new BufferAttribute(p, 4))
      this.disposables.push(g)
      return g
    }
    const maxQ = QUALITY.ultra
    const bg = mk(maxQ.bgParticles, (_i, c, u, v, p) => {
      c[0] = (r() - 0.5) * 8; c[1] = (r() - 0.5) * 5.5; c[2] = -3 + r() * 5
      const a = randUnit(r).multiplyScalar(0.04 + r() * 0.16), b = randUnit(r).multiplyScalar(0.04 + r() * 0.16)
      u[0] = a.x; u[1] = a.y; u[2] = a.z; v[0] = b.x; v[1] = b.y; v[2] = b.z
      p[0] = r() * 6.28; p[1] = (r() - 0.5) * 0.5; p[2] = Math.pow(r(), 2.5) * 0.7 + 0.08; p[3] = 0.7 + r() * 0.9
    })
    this.bgMat = this.shader(partVert, partFrag, { uSize: U(1), uIntensity: U(1), uSpin: U(0), uFade: U(-10) })
    this.bgPts = new Points(bg, this.bgMat)

    // orbit planes: random but fixed, intersecting around the heart
    const NO = 6, travellers = 4
    const planes = Array.from({ length: NO }, () => {
      const e1 = randUnit(r), e2 = randUnit(r).cross(e1).normalize()
      return { e1, e2, a: 1.5 + r() * 0.9, b: 0.5 + r() * 0.7, cy: (r() - 0.5) * 0.3, dir: r() < 0.5 ? -1 : 1 }
    })
    const perPath = Math.floor(maxQ.orbitDots / NO)
    const per = perPath + travellers
    const orb = mk(NO * per, (i, c, u, v, p) => {
      const pl = planes[Math.floor(i / per)], j = i % per
      c[0] = 0; c[1] = pl.cy; c[2] = 0
      u[0] = pl.e1.x * pl.a; u[1] = pl.e1.y * pl.a; u[2] = pl.e1.z * pl.a
      v[0] = pl.e2.x * pl.b; v[1] = pl.e2.y * pl.b; v[2] = pl.e2.z * pl.b
      if (j < perPath) { p[0] = (j / perPath) * 6.2832 + r() * 0.05; p[1] = 0; p[2] = 0.45 + r() * 0.2; p[3] = 1.3 }
      else { p[0] = r() * 6.2832; p[1] = pl.dir * (0.25 + r() * 0.25); p[2] = 0.85; p[3] = 2.2 }
    })
    this.orbitMat = this.shader(partVert, partFrag, { uSize: U(1), uIntensity: U(1), uSpin: U(0.045), uFade: U(2) })
    this.orbitPts = new Points(orb, this.orbitMat)
    for (const m of [this.bgMat, this.orbitMat]) { m.transparent = true; m.depthWrite = false; m.blending = AdditiveBlending }
    for (const p of [this.bgPts, this.orbitPts]) { p.frustumCulled = false; p.renderOrder = 3; this.scene.add(p) }
    ;(this.bgPts.userData.max = maxQ.bgParticles); (this.orbitPts.userData.max = NO * per)
    this.orbitPts.userData.perPath = perPath; this.orbitPts.userData.per = per; this.orbitPts.userData.NO = NO
  }

  private applyQuality() {
    const q = QUALITY[this.s.quality]
    this.dpr = Math.min(window.devicePixelRatio || 1, q.dpr)
    this.renderer.setPixelRatio(this.dpr)
    this.renderer.setSize(this.w, this.h, false)
    this.sparkCount = q.sparkles
    this.sparkGeo.instanceCount = q.sparkles
    this.bgPts.geometry.setDrawRange(0, q.bgParticles)
    // orbit draw: keep per-orbit path dots proportional; travellers always on
    const o = this.orbitPts.userData, keep = Math.floor((q.orbitDots / QUALITY.ultra.orbitDots) * o.perPath)
    const idx: number[] = []
    for (let i = 0; i < o.NO * o.per; i++) { const j = i % o.per; if (j >= o.perPath || j < keep) idx.push(i) }
    this.orbitPts.geometry.setIndex(idx)
    if (q.bloom) this.ensureComposer(); else this.disposeComposer()
    this.resize(this.w, this.h, true)
  }

  private ensureComposer() {
    if (this.composer) return
    const rt = new WebGLRenderTarget(this.w, this.h, { type: HalfFloatType })
    this.composer = new EffectComposer(this.renderer, rt)
    this.composer.addPass(new RenderPass(this.scene, this.camera))
    this.bloom = new UnrealBloomPass(new Vector2(this.w, this.h), 0.3, 0.4, 0.7)
    this.composer.addPass(this.bloom)
    this.composer.addPass(new OutputPass())
  }
  private disposeComposer() { this.composer?.dispose(); this.composer = null; this.bloom = null }

  setQuality() { this.applyQuality() }

  resize(w: number, h: number, force = false) {
    if (!force && w === this.w && h === this.h) return
    this.w = Math.max(w, 1); this.h = Math.max(h, 1)
    this.renderer.setPixelRatio(this.dpr)
    this.renderer.setSize(this.w, this.h, false)
    this.composer?.setPixelRatio(this.dpr)
    this.composer?.setSize(this.w, this.h)
    this.camera.aspect = this.w / this.h
    // fit heart (height ~3.6, width ~3.0 incl. orbit margin) at any aspect without distortion
    const t = Math.tan((FOV * Math.PI) / 360)
    const dist = Math.max(this.def.fit.h / t, this.def.fit.w / (t * this.camera.aspect))
    this.camera.position.set(0, 0, dist)
    this.camera.lookAt(0, 0, 0)
    this.camera.updateProjectionMatrix()
    this.uni.uRes.value.set(this.w * this.dpr, this.h * this.dpr)
  }

  replay() { this.timeline.reset() }

  getStats(): Stats {
    const t = this.timeline.t
    return {
      fps: this.fps, angleDeg: ((this.timeline.angle * 180) / Math.PI) % 360,
      sparkles: this.activeSparkles, glyphs: this.glyphCount,
      reveal: Math.min(Math.max((t - ANIM.drawStart) / (ANIM.drawEnd - ANIM.drawStart), 0), 1),
      quality: this.s.quality,
    }
  }

  frame(now: number) {
    const dt = this.last ? Math.min((now - this.last) / 1000, 0.1) : 0
    this.last = now
    if (dt > 0) { this.fpsAcc += dt; this.fpsN++; if (this.fpsAcc > 0.5) { this.fps = this.fpsN / this.fpsAcc; this.fpsAcc = 0; this.fpsN = 0 } }
    const s = this.s, tl = this.timeline
    if (!s.paused) tl.step(dt, s.speed)
    const t = tl.t
    const q = QUALITY[s.quality]
    const u = this.uni

    u.uTime.value = t
    const rad = Math.PI / 180
    this.tmp4.makeRotationY(tl.angle + s.yaw * rad)
    u.uRot.value.setFromMatrix4(this.tmp4.premultiply(this.tmpR.makeRotationX(s.tilt * rad)))
    u.uRose.value = s.rose ? 1 : 0
    u.uBright.value = s.brightness
    u.uPush.value = s.push; u.uPushR.value = s.pushRadius
    {
      // camera looks down -z at the origin: NDC maps linearly to the z=0 plane
      const halfH = Math.tan((FOV * Math.PI) / 360) * this.camera.position.z
      if (this.ptr) this.ptrSmooth.lerp(this.ptr, Math.min(dt * 18, 1))
      u.uMouse.value.set(this.ptrSmooth.x * halfH * this.camera.aspect, this.ptrSmooth.y * halfH)
      const target = this.ptr ? 1 : 0
      u.uMouseStr.value += (target - u.uMouseStr.value) * Math.min(dt * (target ? 10 : 4), 1)
    }
    // key light fixed, rim light circles: L(t) = normalize(cos .9t, .5, sin .9t)
    u.uRim.value.set(Math.cos(t * 0.9), 0.5, Math.sin(t * 0.9)).normalize()

    const H = this.h * this.dpr
    this.glyphCount = Math.floor(MAX_GLYPHS * Math.min(QUALITY[s.quality].glyphs / MAX_GLYPHS, 1) * s.density)
    this.glyphGeo.instanceCount = this.glyphCount
    const gh = 9.5 * (H / (900 * this.dpr)) * this.dpr * s.glyphScale
    for (const m of this.glyphMats) m.uniforms.uGlyphH.value = Math.max(gh, 3)
    this.sparkMat.uniforms.uSparkPx.value = 70 * (H / 900)
    this.sparkMat.uniforms.uSparkle.value = s.sparkle
    const psz = Math.max(this.dpr, 1) * (H / (900 * this.dpr)) * 0.9
    this.bgMat.uniforms.uSize.value = psz; this.bgMat.uniforms.uIntensity.value = s.particles
    this.orbitMat.uniforms.uSize.value = psz; this.orbitMat.uniforms.uIntensity.value = s.particles * 0.8
    this.orbitPts.visible = s.orbits

    this.statAcc += dt
    if (this.statAcc > 0.25) { this.statAcc = 0; this.countSparkles() }
    void q

    if (this.composer && this.bloom && s.bloom > 0.01) {
      this.bloom.strength = s.bloom
      this.composer.render()
    } else {
      this.renderer.setRenderTarget(null)
      this.renderer.render(this.scene, this.camera)
    }
  }

  /** CPU mirror of the shader's glint schedule (alive and revealed); visibility vs. lighting is decided on the GPU. */
  private countSparkles() {
    const d = this.sparkData, t = this.timeline.t
    let n = 0
    for (let i = 0; i < this.sparkCount; i++) {
      const period = d[i * 4], phase = d[i * 4 + 1], size = d[i * 4 + 2], thr = d[i * 4 + 3]
      if (t < ANIM.drawStart + thr * (ANIM.drawEnd - ANIM.drawStart) * 0.9 + 0.5) continue
      const local = (t + phase * period) % period
      if (local < 0.5 + size * 0.9) n++
    }
    this.activeSparkles = n
  }

  dispose() {
    this.canvas.removeEventListener('webglcontextlost', this.onLost)
    this.canvas.removeEventListener('pointermove', this.onMove)
    this.canvas.removeEventListener('pointerleave', this.onLeave)
    this.disposeComposer()
    this.disposables.forEach((d) => d.dispose())
    this.scene.clear()
    this.renderer.dispose()
  }
}

export type { Material }
