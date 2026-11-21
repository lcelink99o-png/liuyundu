import { CatmullRomCurve3, Color, Euler, Matrix4, Quaternion, Vector3 } from 'three'
import { pulseAt } from './rhythm.js'
import {
  LOOP, beat, clamp, inCubic, inOutCubic, inOutQuint, inOutSine, lerp, outBack,
  outCubic, outExpo, progress, smoothstep, track, wobble,
} from './timeline.js'

const PALETTE = {
  paper: '#F4F5EF',
  ink: '#080A0A',
  violet: '#8A2BFF',
  pink: '#FF2E7E',
  electric: '#5BFF3C',
  lime: '#D6FE51',
  teal: '#2EF2E0',
  acidPink: '#FF5CA8',
  acidGreen: '#B8FF4D',
}

// Display colours: only lit materials go through ACES, so wipes and rings mix as seen.
export const BACKDROPS = {
  studio: { color: new Color(PALETTE.paper), text: PALETTE.ink },
  dark: { color: new Color(PALETTE.ink), text: PALETTE.lime },
  acid: { color: new Color(PALETTE.lime), text: PALETTE.ink },
}

// 完整 40 秒音频，循环播放（动画 15 秒循环，两者独立）
export const TRACK = { url: 'audio/bgm.mp3', start: 0 }
const FILL_HITS = [0, 0.5, 1, 1.5, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75].map((offset) => beat(28 + offset))

// Shots fit a 16×9 unit frame at z = 0 seen from 17 units; frame units have height 1.
const CAMERA_DISTANCE = 17
const SET_D = 40
const SAFE_HALF_HEIGHT = 4.5
const SAFE_HALF_WIDTH = 8
export const fitFov = (aspect) =>
  2 * Math.atan(Math.max(SAFE_HALF_HEIGHT, SAFE_HALF_WIDTH / aspect) / CAMERA_DISTANCE) * 180 / Math.PI

const WHIP_IN = [beat(16.25), beat(17)]
const WHIP_OUT = [beat(31), LOOP]
const TITLE_IMPACT = beat(26)

const cameraTargetX = track([[0, 0], [WHIP_IN[0], 0], [WHIP_IN[1], SET_D, inOutQuint], [beat(30.5), SET_D], [WHIP_OUT[0], SET_D + 0.6, inOutSine], [WHIP_OUT[1], 0, inOutQuint]])
const cameraTargetY = track([[0, 0], [beat(1), 0.3, inOutSine], [beat(3), 0.3], [beat(4), 0.2, inOutSine], [beat(12), 0.2], [WHIP_IN[0], 0.35, inOutSine], [WHIP_IN[1], 0, inOutQuint], [beat(23), 0], [TITLE_IMPACT, 0.45, inOutCubic], [WHIP_OUT[0], 0.45], [LOOP, 0, inOutQuint]])
const cameraDistance = track([
  [0, 17], [beat(4), 16.2, inOutSine], [beat(6), 17.2, inOutSine], [beat(7), 18.3, inOutSine], [beat(10), 18.3],
  [beat(12), 17, inOutCubic], [beat(13.5), 17], [beat(16), 15.9, inOutSine], [WHIP_IN[1], 17, inOutQuint],
  [beat(20), 16.4, inOutSine], [beat(23), 15.2, inOutSine], [TITLE_IMPACT, 17, inOutCubic],
  [beat(28), 16.9, inOutSine], [beat(30.5), 15.7, inOutSine], [WHIP_OUT[0], 16.7, inOutSine], [LOOP, 17, inOutQuint],
])
const cameraYaw = track([[0, 0], [beat(4), -0.08, inOutSine], [beat(10), -0.07, inOutSine], [beat(12), 0, inOutCubic], [WHIP_IN[0], 0.09, inOutSine], [WHIP_IN[1], 0, inOutQuint], [beat(20), 0], [beat(23), 0.24, inOutSine], [TITLE_IMPACT, 0, inOutCubic], [LOOP, 0]])
const cameraHeight = track([[0, 0.2], [beat(12), 0.2], [WHIP_IN[0], 0.9, inOutSine], [WHIP_IN[1], 0.2, inOutQuint], [beat(20), 0.2], [beat(23), 1.8, inOutSine], [TITLE_IMPACT, 0.2, inOutCubic], [LOOP, 0.2]])

const bank = (t, [start, end]) => Math.sin(Math.PI * progress(t, start, end)) ** 2
const whipRoll = (t) => 0.07 * (bank(t, WHIP_IN) - bank(t, WHIP_OUT))
// Only the drop hits hard; the title's kick eases in, so the frame never jolts twice.
const IMPACTS = [[0, 1, 0], [TITLE_IMPACT, 0.85, 0.05]]
const impulse = (t, frequency) => IMPACTS.reduce((sum, [time, amount, attack]) => {
  const age = t - time
  if (age < 0 || age > 0.6) return sum
  return sum + amount * (attack ? smoothstep(0, attack, age) : 1) * Math.exp(-8 * age) * Math.sin(2 * Math.PI * frequency * age)
}, 0)

const cameraTarget = new Vector3()
const cameraUp = new Vector3(0, 1, 0)
const cameraMatrix = new Matrix4()
const viewAxis = new Vector3(0, 0, 1)
const cameraRoll = new Quaternion()

export function cameraPose(t, position, quaternion) {
  const yaw = cameraYaw(t)
  const distance = cameraDistance(t)
  cameraTarget.set(cameraTargetX(t), cameraTargetY(t) - 0.16 * impulse(t, 9), 0)
  position.set(cameraTarget.x + Math.sin(yaw) * distance, cameraTarget.y + cameraHeight(t), Math.cos(yaw) * distance)
  cameraMatrix.lookAt(position, cameraTarget, cameraUp)
  quaternion.setFromRotationMatrix(cameraMatrix).multiply(cameraRoll.setFromAxisAngle(viewAxis, whipRoll(t) + 0.012 * impulse(t, 6)))
}

const projectPosition = new Vector3()
const projectRotation = new Quaternion()

export function projectToFrame(point, t, aspect, out) {
  cameraPose(t, projectPosition, projectRotation)
  const view = out.copy(point).sub(projectPosition).applyQuaternion(projectRotation.invert())
  const halfHeight = Math.tan(fitFov(aspect) * Math.PI / 360)
  const depth = Math.max(-view.z, 1e-3)
  return out.set(view.x / depth / halfHeight / 2, view.y / depth / halfHeight / 2, depth)
}

const curve = (...points) => new CatmullRomCurve3(points.map(([x, y, z = 0]) => new Vector3(x, y, z)), false, 'centripetal')
const along = (path, u, out) => path.getPointAt(clamp(u), out)
const overshootTangent = new Vector3()
const alongPast = (path, u, out) => {
  if (u <= 1) return path.getPointAt(Math.max(u, 0), out)
  return path.getPointAt(1, out).addScaledVector(path.getTangentAt(1, overshootTangent), (u - 1) * path.getLength())
}
const actors = []
const actor = (name, props) => {
  const created = {
    name, cuts: [], radius: 1, scale: () => 1, smear: () => 0.9, color: () => null,
    rotation: (t, out) => out.set(0, 0, 0), ...props,
  }
  const baseScale = created.scale
  const amount = created.shape === 'letter' ? 0.075 : created.detail === 'low' ? 0.16 : 0.13
  created.baseScale = baseScale
  created.scale = (t) => baseScale(t) * (1 + amount * pulseAt(t))
  actors.push(created)
  return created
}

const smootherstep = (x) => {
  const u = clamp(x)
  return u * u * u * (u * (6 * u - 15) + 10)
}
const settle = (age, velocity, frequency, decay) => {
  if (age <= 0) return 0
  const omega = 2 * Math.PI * frequency
  return (velocity / omega) * Math.exp(-decay * age) * Math.sin(omega * age)
}
const softWobble = (time, frequency, decay) => wobble(time, frequency, decay) * smoothstep(0, 0.06, time)

const ORBIT_OMEGA = (2.5 * Math.PI) / beat(4)
const EASE_STOP = [beat(15.5), beat(16)]
const STOP_RATE = 0.3
const orbitClock = (t) => {
  const [slow, stop] = EASE_STOP
  const run = Math.max(0, Math.min(t, slow) - beat(12))
  if (t <= slow) return run
  const u = progress(t, slow, stop)
  return run + (stop - slow) * (u - (1 - STOP_RATE) * (u ** 3 - u ** 4 / 2)) + STOP_RATE * Math.max(0, t - stop)
}
const orbitAt = (t, phase, out) => {
  const a = lerp(17, 7.2, inOutSine(progress(t, beat(12), beat(13.25))))
  const theta = phase - ORBIT_OMEGA * orbitClock(t)
  return out.set(a * Math.cos(theta), 0.35 - 3.05 * Math.sin(theta), 0.9 * Math.sin(theta) - 0.5)
}

const whip = (t) => inOutQuint(progress(t, WHIP_IN[0], WHIP_IN[1]))
const blendVector = new Vector3()

const AB_SPLIT = WHIP_IN[1]
const AB_HITS = [beat(18), beat(19)]
const AB_MERGE = [beat(19.5), beat(19.875)]
const AB_GONE = AB_MERGE[1] + 0.02
const AB_SCALE = 0.8
const BATON = { x: 3.9, y: 0.3, arm: 2.3 }
const TWIRL = { drift: (0.8 * Math.PI) / beat(1), width: beat(0.35) }
const twirlTurns = (t) => TWIRL.drift * t + Math.PI * AB_HITS.reduce((sum, hit) => sum + smootherstep((t - hit) / TWIRL.width / 2 + 0.5), 0)
const merging = (t) => inCubic(progress(t, AB_MERGE[0], AB_MERGE[1]))
const twirlAngle = (t) => Math.PI / 2 + twirlTurns(t) - twirlTurns(AB_SPLIT)
const splitSpring = (age) => {
  if (age <= 0) return 0
  const omega = 15
  const damping = 0.6 * omega
  const ringing = Math.sqrt(omega * omega - damping * damping)
  return 1 - Math.exp(-damping * age) * (Math.cos(ringing * age) + (damping / ringing) * Math.sin(ringing * age))
}
const batonAt = (t, role, out) => {
  const hold = 1 - merging(t)
  const angle = twirlAngle(t)
  const arm = BATON.arm * hold
  return out.set(SET_D + BATON.x * splitSpring(t - AB_SPLIT) * hold + role * arm * Math.cos(angle), BATON.y + role * arm * Math.sin(angle), 0)
}

// Shares the whip's easing with the camera, so the tracked subject glides on screen.
const blurToBaton = (t, phase, role, out) => {
  if (t < WHIP_IN[0]) return orbitAt(t, phase, out)
  if (t >= WHIP_IN[1]) return batonAt(t, role, out)
  orbitAt(t, phase, blendVector)
  return batonAt(t, role, out).lerp(blendVector, 1 - whip(t))
}

const REST_Y = 0.35
const TRIO_X = [-4.2, 0, 4.2]
const DROP_GRAVITY = 400
const DROP_FALL = beat(0.5)
const DROP_HEIGHT = 0.5 * DROP_GRAVITY * DROP_FALL ** 2
const SPIN = (4 * Math.PI) / LOOP
const falling = (t) => (t >= LOOP - DROP_FALL ? (LOOP - t) / DROP_FALL : 0)
const dropStart = (index, drift, out) => out.set(TRIO_X[index] + drift, REST_Y + DROP_HEIGHT, 0)
const dropAt = (index, drift, t, out) => {
  const fall = falling(t)
  return out.set(TRIO_X[index] + drift * fall, REST_Y + DROP_HEIGHT * (1 - (1 - fall) ** 2), 0)
}
const squashAt = (age, amount) => (age < 0 ? 1 : 1 - amount * Math.exp(-age / 0.05) * Math.cos(age * 42))

const CAROUSEL = { radius: 4.2, tilt: 0.45, warp: 0.6 }
const carouselAngle = (t) => {
  const beats = t / beat(1)
  return (Math.PI / 2) * (beats - (CAROUSEL.warp / Math.PI) * Math.sin(Math.PI * beats))
}
const carouselRate = (t) => ((Math.PI / 2) / beat(1)) * (1 - CAROUSEL.warp * Math.cos((Math.PI * t) / beat(1)))
const swingAt = (side, t, out) => {
  const angle = carouselAngle(t)
  const reach = -side * CAROUSEL.radius * Math.sin(angle)
  return out.set(side * CAROUSEL.radius * Math.cos(angle), REST_Y - reach * Math.sin(CAROUSEL.tilt), reach * Math.cos(CAROUSEL.tilt))
}
const LAUNCH = { koi: beat(4), blossom: beat(4.25), camellia: beat(4.5) }
const ESCAPE = 0.6
const swingTurn = (t, launch) => (t < launch ? carouselAngle(t) : carouselAngle(launch) + carouselRate(launch) * (t - launch))
const dropTurn = (t) => (t - LOOP) * (SPIN + 0.6 * carouselRate(0))
const escapeFrom = (launch, push, age, out) => {
  const time = clamp(age, 0, ESCAPE)
  return out.copy(launch.position).addScaledVector(launch.velocity, time).addScaledVector(push, 0.5 * time * time)
}
const launchState = (sample, time) => {
  const position = sample(time, new Vector3())
  const velocity = sample(time + 1e-4, new Vector3()).sub(sample(time - 1e-4, new Vector3())).divideScalar(2e-4)
  return { position, velocity }
}
const koiBob = (t, out) => out.set(0, REST_Y + settle(t, 5, 2.2, 4) + 0.3 * Math.sin((Math.PI / 2) * (t / beat(1))) ** 2, 0)

// 一条大鲤鱼沿 word 水平轴螺旋穿过（对应模板的 helix）
const HELIX_TIME = [beat(5.75), beat(9.75)]
const helixAt = (u, out = new Vector3()) => {
  const x = lerp(-18, 18, clamp(u))
  const angle = (x + 7.1) * 2 * Math.PI / 6.8 - Math.PI / 2
  return out.set(x, 0.35 + 3.05 * Math.sin(angle), 3.05 * Math.cos(angle))
}
const orbitSize = track([[0, 1], [beat(5.5), 1], [beat(6.25), 0.62, inOutSine], [WHIP_IN[0], 0.62], [WHIP_IN[1], AB_SCALE, inOutQuint], [AB_MERGE[0], AB_SCALE], [AB_MERGE[1], 0, inCubic]])
const koiLaunch = launchState(koiBob, LAUNCH.koi)
const KOI_PUSH = new Vector3(0, 60, 0)

// 主角：鲤鱼（对应模板的 sphere）
const koi = actor('koi', {
  shape: 'koi', material: 'metal', base: '#FF2A3C',
  cuts: [beat(5.7), beat(10), AB_GONE],
  position(t, out) {
    if (t >= LOOP - DROP_FALL) return dropAt(1, 0, t, out)
    if (t < LAUNCH.koi) return koiBob(t, out)
    if (t < beat(5.7)) return escapeFrom(koiLaunch, KOI_PUSH, t - LAUNCH.koi, out)
    if (t < beat(10)) return helixAt(progress(t, HELIX_TIME[0], HELIX_TIME[1]), out)
    if (t < AB_GONE) return blurToBaton(t, 0, 1, out)
    return dropStart(1, 0, out)
  },
  scale: (t) => (t >= AB_GONE ? 1 : orbitSize(t)) * (1 + 0.07 * wobble(t, 3, 8)),
  squash: (t) => squashAt(t, 0.26),
  smear: (t) => (t >= HELIX_TIME[0] && t < HELIX_TIME[1] ? 1.6 : 0.9),
})

// 第一幕「神州」——两个大字沿 helix 螺旋穿过（对应模板 SMEAR 字母）
const SHENZHOU_CHARS = ['神', '州']
const SHENZHOU_GAP = 4.2          // 两字在路径方向上的间距（字牌放大后）
const SHENZHOU_GLYPH = 3.4        // 字牌放大系数
const SHENZHOU_TIME = [beat(6.0), beat(9.75)]
const shenzhouU = (t) => clamp(progress(t, SHENZHOU_TIME[0], SHENZHOU_TIME[1]))
SHENZHOU_CHARS.forEach((char, i) => {
  const du = SHENZHOU_GAP / 36     // helix 总长 36（x -18~18），间距换算成 u
  const lead = (i - 0.5) * du       // 州在前（i=1），神在后（i=0）
  actor(`shenzhou-${char}-${i}`, {
    shape: 'titlechar', char, material: 'gloss', base: PALETTE.ink,
    color: () => PALETTE.ink,
    cuts: [SHENZHOU_TIME[1]],
    position(t, out) {
      if (t < SHENZHOU_TIME[0] || t >= SHENZHOU_TIME[1]) return out.copy(VORTEX)
      const u = clamp(shenzhouU(t) + lead)
      return helixAt(u, out)
    },
    rotation(t, out) { return out.set(0, 0, 0) },
    scale(t) {
      if (t < SHENZHOU_TIME[0] || t >= SHENZHOU_TIME[1]) return 0
      const enter = outCubic(clamp(progress(t, SHENZHOU_TIME[0], SHENZHOU_TIME[0] + 0.5)))
      const exit = 1 - inCubic(clamp(progress(t, SHENZHOU_TIME[1] - 0.5, SHENZHOU_TIME[1])))
      return SHENZHOU_GLYPH * enter * exit
    },
    smear: () => 1.2,
  })
})

// 桃花（对应模板的 knot）
const BLOSSOM_DRIFT = -2.5
const BLOSSOM_ENTRY = 18
const blossomLaunch = launchState((time, out) => swingAt(-1, time, out), LAUNCH.blossom)
const BLOSSOM_PUSH = new Vector3(-50, 170, 0)
const blossomScale = (t) => (t < WHIP_IN[0] ? 1 : lerp(1, AB_SCALE, whip(t)) * (1 - merging(t)))

const blossom = actor('blossom', {
  shape: 'blossom', material: 'metal', base: '#FF4DA6',
  cuts: [WHIP_IN[0], AB_GONE],
  position(t, out) {
    if (t >= LOOP - DROP_FALL) return dropAt(0, BLOSSOM_DRIFT, t, out)
    if (t < LAUNCH.blossom) return swingAt(-1, t, out)
    if (t < WHIP_IN[0]) return escapeFrom(blossomLaunch, BLOSSOM_PUSH, t - LAUNCH.blossom, out)
    if (t < WHIP_IN[1]) return out.set(SET_D * whip(t) + BLOSSOM_ENTRY * (1 - smootherstep(progress(t, WHIP_IN[0], WHIP_IN[1]))), BATON.y, 0)
    if (t < AB_GONE) return batonAt(t, 0, out)
    return dropStart(0, BLOSSOM_DRIFT, out)
  },
  rotation(t, out) {
    if (t >= WHIP_IN[0] && t < AB_GONE) return out.set(0.35, t * SPIN, 0.25 + (2 / 3) * (twirlAngle(t) - Math.PI / 2))
    const turn = t >= LOOP - DROP_FALL ? dropTurn(t) : t * SPIN + 0.6 * swingTurn(t, LAUNCH.blossom)
    return out.set(0.35 + 0.1 * wobble(t, 3, 6) + 1.6 * falling(t) ** 2, turn, 0.25)
  },
  scale: (t) => (t >= AB_GONE ? 1 : blossomScale(t)) * (1 + 0.06 * wobble(t, 3, 8)),
  squash: (t) => squashAt(t, 0.18),
})

// 山茶（对应模板的 gem）
const CAMELLIA_DRIFT = 2.5
const camelliaLaunch = launchState((time, out) => swingAt(1, time, out), LAUNCH.camellia)
const CAMELLIA_PUSH = new Vector3(50, 170, 0)

const camellia = actor('camellia', {
  shape: 'camellia', material: 'metal', base: '#52FF3D',
  cuts: [beat(8), AB_GONE],
  position(t, out) {
    if (t >= LOOP - DROP_FALL) return dropAt(2, CAMELLIA_DRIFT, t, out)
    if (t < LAUNCH.camellia) return swingAt(1, t, out)
    if (t < beat(8)) return escapeFrom(camelliaLaunch, CAMELLIA_PUSH, t - LAUNCH.camellia, out)
    if (t < AB_GONE) return blurToBaton(t, Math.PI, -1, out)
    return dropStart(2, CAMELLIA_DRIFT, out)
  },
  rotation(t, out) {
    const turn = t >= LOOP - DROP_FALL ? -dropTurn(t) : t * SPIN - 0.6 * swingTurn(t, LAUNCH.camellia)
    return out.set(0.3 + 0.5 * wobble(t, 2.6, 7) + 1.8 * falling(t) ** 2, turn, -0.3 * wobble(t, 2.6, 7))
  },
  scale: (t) => (t >= AB_GONE ? 1 : orbitSize(t)),
  squash: (t) => squashAt(t, 0.2),
})

const abActive = (t) => t >= AB_SPLIT && t < AB_MERGE[1]
const TWIN_BIRTH = [AB_SPLIT - 0.04, AB_SPLIT]
const mirroring = (t) => (t < AB_MERGE[1] ? smootherstep(progress(t, TWIN_BIRTH[0], TWIN_BIRTH[1])) : 0)
const twinEuler = new Euler()
for (const original of [koi, blossom, camellia]) {
  actor(`${original.name}-twin`, {
    shape: original.shape, material: original.material, base: original.base, cuts: original.cuts,
    position(t, out) {
      original.position(t, out)
      out.x = SET_D + (out.x - SET_D) * (1 - 2 * mirroring(t))
      return out
    },
    rotation(t, out) {
      original.rotation(t, out)
      if (t < TWIN_BIRTH[0] || t >= AB_MERGE[1]) return out
      original.rotation(AB_SPLIT, twinEuler)
      return out.set(out.x, 2 * twinEuler.y - out.y, 2 * twinEuler.z - out.z)
    },
    scale: (t) => (t >= TWIN_BIRTH[0] && t < AB_MERGE[1] ? original.baseScale(t) * mirroring(t) : 0),
    smear: () => 0,
  })
}

// 第二幕「云城」——两个大字在分屏阶段浮现（对应模板 BLUR 字母）
const YUNCHENG_CHARS = ['云', '城']
const YUNCHENG_GLYPH = 3.4
const YUNCHENG_EM = 4.0
const YUNCHENG_TIME = [beat(17.5), beat(19.5)]
const YUNCHENG_Y = 0.9
YUNCHENG_CHARS.forEach((char, i) => {
  const x = SET_D + (i - 0.5) * YUNCHENG_EM
  actor(`yuncheng-${char}-${i}`, {
    shape: 'titlechar', char, material: 'gloss', base: PALETTE.ink,
    color: () => PALETTE.ink,
    cuts: [YUNCHENG_TIME[1]],
    position(t, out) {
      if (t < YUNCHENG_TIME[0] || t >= YUNCHENG_TIME[1]) return out.copy(VORTEX)
      return out.set(x, YUNCHENG_Y, 0)
    },
    rotation(t, out) { return out.set(0, 0, 0) },
    scale(t) {
      if (t < YUNCHENG_TIME[0] || t >= YUNCHENG_TIME[1]) return 0
      const enter = outCubic(clamp(progress(t, YUNCHENG_TIME[0], YUNCHENG_TIME[0] + 0.4)))
      const exit = 1 - inCubic(clamp(progress(t, YUNCHENG_TIME[1] - 0.35, YUNCHENG_TIME[1])))
      return YUNCHENG_GLYPH * enter * exit
    },
    smear: () => 0.9,
  })
})

// 标题「流云渡」——用三个几何体字牌（对应模板的 TITLE 双行字）
const TITLE_OUT_CUT = 14.8
const TITLE_GLYPH = 3.4          // 字牌放大系数（约 3.4 单位高，接近画面 1/3 高度）
const TITLE_EM = 3.6             // 字间距
const TITLE_PITCH = 1.12 * TITLE_EM
const TITLE_MIDDLE = 0.8
const TITLE_CENTER = new Vector3(SET_D, TITLE_MIDDLE, 0)
const VORTEX = new Vector3(SET_D, 0.3, 0)

const TITLE_DEPTH_STEP = 0.75
const titleCamera = new Vector3()
cameraPose(TITLE_IMPACT, titleCamera, new Quaternion())
// 三个「字」水平排布（对应 SMEAR 那行；去掉第二行 +BLUR）
const TITLE_CHARS = ['流', '云', '渡']
const TITLE_LEFT = SET_D - (TITLE_CHARS.length - 1) * TITLE_EM / 2
const TITLE = TITLE_CHARS.map((char, i) => {
  const flat = new Vector3(TITLE_LEFT + i * TITLE_EM, TITLE_MIDDLE, 0)
  const depth = -TITLE_DEPTH_STEP * (i % 2)
  const scale = (titleCamera.z - depth) / titleCamera.z
  return { char, slot: flat.sub(titleCamera).multiplyScalar(scale).add(titleCamera), scale }
})

const titleRank = TITLE.map(({ slot }) => Math.abs(slot.x - SET_D) + Math.abs(slot.y - TITLE_MIDDLE) * 2)
const rankOrder = [...titleRank].sort((a, b) => a - b)
const titleStart = TITLE.map((_, i) => beat(23.875) + rankOrder.indexOf(titleRank[i]) * 0.03)
const titleFlights = TITLE.map(({ slot }) => {
  const offset = slot.clone().sub(VORTEX)
  const angle = offset.x < 0 ? 1.25 : -1.25
  const middle = offset.clone().applyAxisAngle(new Vector3(0, 0, 1), angle).multiplyScalar(0.62).add(VORTEX)
  return curve(VORTEX.toArray(), [middle.x, middle.y, 3], slot.toArray())
})
const titleFlightEase = (u) => outBack(u, 1.4)
const hitPulse = (age) => (age < 0 ? 0 : age < 0.03 ? smoothstep(0, 0.03, age) : Math.exp(-(age - 0.03) / 0.08))
const titleRipple = TITLE.map(({ slot }) => (slot.x - TITLE_LEFT) * 0.012)
const fillHop = (index, t) => FILL_HITS.reduce((sum, hit, k) => sum + (0.1 + 0.02 * k) * hitPulse(t - hit - titleRipple[index]), 0)
const INHALE = [beat(30.5), WHIP_OUT[0]]

function titlePose(index, t, out) {
  alongPast(titleFlights[index], titleFlightEase(progress(t, titleStart[index], TITLE_IMPACT)), out)
  out.y += fillHop(index, t)
  out.z -= 0.7 * inOutCubic(progress(t, INHALE[0], INHALE[1]))
  return out
}
function titleRotation(index, t, out) {
  const spin = 1 - outCubic(progress(t, titleStart[index], TITLE_IMPACT))
  return out.set(0.2 * softWobble(t - TITLE_IMPACT - index * 0.012, 3.2, 6), spin * Math.PI * (index % 2 ? -1 : 1), 0)
}
const titleScale = (index, t) => TITLE[index].scale * TITLE_GLYPH
  * lerp(0.08, 1, outCubic(clamp(progress(t, titleStart[index], TITLE_IMPACT) * 2.2)))
const inTitle = (t, index) => t >= titleStart[index] && t < TITLE_OUT_CUT

TITLE.forEach(({ char }, i) => {
  actor(`title-${char}-${i}`, {
    shape: 'titlechar', char, material: 'gloss', base: PALETTE.ink,
    color: () => PALETTE.ink,
    cuts: [TITLE_OUT_CUT],
    position(t, out) { return inTitle(t, i) ? titlePose(i, t, out) : out.copy(VORTEX) },
    rotation(t, out) { return titleRotation(i, t, out) },
    scale(t) { return inTitle(t, i) ? titleScale(i, t) : 0 },
    smear: () => 0.8,
  })
})

// 桃花瓣 swarm（对应模板的 rings/swarm）
const RINGS = [
  { radius: 2.4, count: 8, omega: 3.4, tilt: new Euler(1.26, 0, 0.31), size: 0.26 },
  { radius: 3.8, count: 10, omega: -2.5, tilt: new Euler(0.24, 0, -0.17), size: 0.3 },
  { radius: 5.3, count: 12, omega: 1.8, tilt: new Euler(-0.56, 0, 0.66), size: 0.34 },
]
const SWARM_SHAPES = ['petal', 'blossom', 'camellia', 'koi', 'petal', 'blossom']
const SWARM_COLORS = [PALETTE.violet, PALETTE.pink, PALETTE.electric, PALETTE.acidPink, PALETTE.teal, PALETTE.lime]
const COLLAPSE = [beat(23), beat(24)]
const ringPoint = new Vector3()
let swarmIndex = 0

RINGS.forEach((ring, ringIndex) => {
  const rotation = new Quaternion().setFromEuler(ring.tilt)
  const burst = beat(20 + ringIndex / 4)
  for (let k = 0; k < ring.count; k++) {
    const index = swarmIndex++
    const phase = (k / ring.count) * 2 * Math.PI + ringIndex * 0.4
    const radiusAt = (t) => {
      const grow = outBack(progress(t, burst, burst + 0.6), 1.3)
      return ring.radius * grow * (1 - inCubic(progress(t, COLLAPSE[0], COLLAPSE[1])))
    }
    actor(`swarm-${index}`, {
      shape: SWARM_SHAPES[(k + ringIndex * 2) % SWARM_SHAPES.length],
      detail: 'low',
      material: index % 3 === 0 ? 'gloss' : 'metal',
      base: SWARM_COLORS[(k + ringIndex) % SWARM_COLORS.length],
      position(t, out) {
        const collapse = progress(t, COLLAPSE[0], COLLAPSE[1])
        const angle = phase + ring.omega * (t - burst) + Math.sign(ring.omega) * 3 * collapse ** 3
        ringPoint.set(Math.cos(angle), 0, Math.sin(angle)).multiplyScalar(radiusAt(t)).applyQuaternion(rotation)
        return out.copy(VORTEX).add(ringPoint)
      },
      rotation: (t, out) => out.set(t * 1.7 + index, t * 2.3 + index * 0.5, 0),
      scale(t) {
        const grow = outBack(progress(t, burst, burst + 0.45), 1.6)
        return ring.size * grow * (1 - smoothstep(0.55, 1, progress(t, COLLAPSE[0], COLLAPSE[1])))
      },
    })
  }
})

export { actors }

export const blurShutter = track([[0, 3.2], [beat(11), 3.2], [beat(12), 4.4, inOutSine], [AB_MERGE[1], 4.4], [beat(20.75), 3.2, inOutSine], [beat(21), 3.8, inOutSine], [WHIP_OUT[0], 3.8], [LOOP, 3.2, inOutSine]])
export const abSplit = (t) => (abActive(t) ? 0.5 : 0)
export const abReveal = (t) => outExpo(progress(t, AB_SPLIT, AB_SPLIT + 0.3)) * (1 - inCubic(progress(t, AB_MERGE[0], AB_MERGE[1])))
export const SMEAR = { exposure: 0.08, maxStretch: 1.5, taper: 0.76, taperCurve: 1.3 }

const CURTAIN = [beat(11.05), beat(11.75)]
const IRIS = [beat(19.875), beat(20.75)]
const SCENES = [
  { until: CURTAIN[0], backdrop: 'studio' },
  { until: WHIP_IN[0], backdrop: 'dark' },
  { until: IRIS[0], backdrop: 'studio' },
  { until: WHIP_OUT[0], backdrop: 'acid' },
  { until: LOOP, backdrop: 'studio' },
]
const edgePoint = new Vector3()
const worldEdge = (t, aspect) => projectToFrame(edgePoint.set(SET_D / 2, 0, 0), t, aspect, edgePoint).x

function wipeAt(t, aspect, wipe) {
  wipe.mode = 0
  wipe.normal[0] = 1
  wipe.normal[1] = 0
  wipe.point[1] = 0
  wipe.radius = 0
  if (t >= CURTAIN[0] && t < CURTAIN[1]) {
    const reach = aspect / 2 + 0.3
    wipe.from = 'studio'
    wipe.to = 'dark'
    wipe.point[0] = lerp(reach, -reach - 0.6, progress(t, CURTAIN[0], CURTAIN[1]) ** 2)
    wipe.normal[0] = Math.cos(0.2)
    wipe.normal[1] = Math.sin(0.2)
    return true
  }
  if (t >= WHIP_IN[0] - 0.05 && t < WHIP_IN[1] + 0.05) {
    wipe.from = 'dark'
    wipe.to = 'studio'
    wipe.point[0] = worldEdge(t, aspect)
    return true
  }
  if (t >= IRIS[0] && t < IRIS[1]) {
    wipe.from = 'studio'
    wipe.to = 'acid'
    wipe.mode = 1
    projectToFrame(VORTEX, t, aspect, edgePoint)
    wipe.point[0] = edgePoint.x
    wipe.point[1] = edgePoint.y
    wipe.radius = 1.3 * outCubic(progress(t, IRIS[0], IRIS[1]))
    return true
  }
  if (t >= WHIP_OUT[0] - 0.05) {
    wipe.from = 'acid'
    wipe.to = 'studio'
    wipe.point[0] = worldEdge(t, aspect)
    wipe.normal[0] = -1
    return true
  }
  return false
}

const RINGS_AT = [
  { time: 0, actor: 'blossom', size: 0.22, alpha: 0.7 },
  { time: 0, actor: 'koi', size: 0.3, alpha: 0.7 },
  { time: 0, actor: 'camellia', size: 0.22, alpha: 0.7 },
  { time: beat(24), point: VORTEX, size: 0.9, alpha: 0.8 },
  { time: TITLE_IMPACT, point: TITLE_CENTER, size: 0.75, alpha: 0.9 },
  { time: TITLE_IMPACT + 0.09, point: TITLE_CENTER, size: 1.05, alpha: 0.7 },
]
const ringWorld = new Vector3()
const ringFrame = new Vector3()
const previousWipe = { mode: 0, point: [0, 0], normal: [1, 0], radius: 0, from: '', to: '' }

export function backdropAt(t, aspect, state) {
  const scene = SCENES.find((entry) => t < entry.until)
  state.active = wipeAt(t, aspect, state.wipe)
  state.base = scene.backdrop
  if (state.active) {
    const moving = wipeAt(t - 1 / 120, aspect, previousWipe)
    const moved = !moving ? 0 : state.wipe.mode === 1
      ? Math.abs(state.wipe.radius - previousWipe.radius)
      : Math.abs(state.wipe.point[0] - previousWipe.point[0])
    state.wipe.softness = Math.min(state.wipe.mode === 1 ? 0.015 : 0.35, moved * blurShutter(t) * 0.5)
  }
  state.rings.forEach((ring) => { ring.alpha = 0 })
  let slot = 0
  for (const entry of RINGS_AT) {
    const age = t - entry.time
    if (age < 0 || age > 0.6 || slot >= state.rings.length) continue
    if (entry.actor) actors.find((candidate) => candidate.name === entry.actor).position(entry.time, ringWorld)
    else ringWorld.copy(entry.point)
    projectToFrame(ringWorld, entry.time, aspect, ringFrame)
    const u = age / 0.6
    const ring = state.rings[slot++]
    ring.x = ringFrame.x
    ring.y = ringFrame.y
    ring.radius = entry.size * outCubic(u)
    ring.alpha = entry.alpha * (1 - u) ** 1.5
  }
  return state
}

export function createBackdropState() {
  return {
    base: 'studio', active: false,
    wipe: { mode: 0, point: [0, 0], normal: [1, 0], radius: 0, softness: 0, from: 'studio', to: 'studio' },
    rings: Array.from({ length: 3 }, () => ({ x: 0, y: 0, radius: 0, alpha: 0 })),
  }
}

export const contrastInk = (backdrop) => BACKDROPS[backdrop].text

export const CAPTIONS = [
  { from: beat(6.25), to: beat(10.75), index: '01', title: '映鲤云暄', body: '' },
  { from: beat(12.5), to: beat(16), index: '02', title: '飏焱观衡', body: '' },
  { from: beat(17.5), to: beat(19.5), index: '03', title: '载花同游', body: '' },
  { from: beat(20.5), to: beat(23.75), index: '04', title: '欢迎来到', body: '' },
]
