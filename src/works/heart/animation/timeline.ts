import { ANIM } from '../config/animation'

export const TAU = Math.PI * 2
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1)
  return t * t * (3 - 2 * t)
}

/** Deterministic clock: time advances only when unpaused; rotation is integrated so speed changes never jump. */
export class Timeline {
  t = 0
  angle = 0
  step(dt: number, speed: number) {
    this.t += dt
    if (this.t > ANIM.spinStart) {
      this.angle += ((dt * speed * TAU) / ANIM.turnSeconds) * smooth(0, ANIM.spinRamp, this.t - ANIM.spinStart)
    }
  }
  reset() { this.t = 0; this.angle = 0 }
}
