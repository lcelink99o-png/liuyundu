import * as THREE from 'three/webgpu'
import { float, hash, length, mix, mrt, normalView, output, pass, positionGeometry, renderOutput, screenCoordinate, screenUV, step, uniform, uv, vec2, vec3, vec4, velocity } from 'three/tsl'
import { createSoundtrack } from './audio.js'
import { createBackdrop } from './backdrop.js'
import { createDirectionalMotionBlur } from './directionalMotionBlur.js'
import { SHAPES, createTitleCharTexture } from './shapes.js'
import { createHud } from './hud.js'
import { pulseAt, setBeatStrengths } from './rhythm.js'
import {
  SMEAR, TRACK, abSplit, actors, backdropAt, blurShutter, cameraPose, contrastInk,
  createBackdropState, fitFov, projectToFrame,
} from './reel.js'
import { LOOP, smoothstep, wrap } from './timeline.js'
import { updateSmear } from './trail.js'
import { createVelocitySmear } from './velocitySmear.js'

const query = new URLSearchParams(location.search)
const forcedSize = query.get('res')?.match(/^(\d+)x(\d+)$/)?.slice(1).map(Number)
const soundtrack = createSoundtrack({ url: TRACK.url, start: TRACK.start, length: 40, muted: query.has('mute') })

const canvas = document.querySelector('#app')
const intro = document.querySelector('.intro')
const renderer = new THREE.WebGPURenderer({ canvas, antialias: false, trackTimestamp: query.has('perf') })
await renderer.init()
canvas.dataset.backend = renderer.backend.isWebGPUBackend ? 'webgpu' : 'webgl-fallback'
renderer.toneMapping = THREE.ACESFilmicToneMapping

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 200)

// 简单环境：用场景自带点光 + 半球光，替代 HDRI（避免加载 .hdr）
const hemi = new THREE.HemisphereLight(0xffffff, 0x8899aa, 2.2)
scene.add(hemi)
const keyLight = new THREE.DirectionalLight(0xffffff, 3.2)
keyLight.position.set(4, 6, 6)
scene.add(keyLight)
const fillLight = new THREE.DirectionalLight(0xffffff, 1.6)
fillLight.position.set(-3, 2, 4)
scene.add(fillLight)
const rimLight = new THREE.DirectionalLight(0xff5ca8, 1.6)
rimLight.position.set(-5, -2, -3)
scene.add(rimLight)

setBeatStrengths(soundtrack.beatStrengths ?? null)

// 几何体缓存
const geometries = new Map()
const geometryFor = ({ shape, char, detail }) => {
  const key = `${shape}:${char ?? ''}:${detail ?? ''}`
  if (!geometries.has(key)) {
    const geometry = SHAPES[shape](detail === 'low', char)
    geometry.computeBoundingSphere()
    geometry.userData.radius = geometry.boundingSphere.radius + geometry.boundingSphere.center.length()
    geometry.boundingSphere.radius *= 1 + SMEAR.maxStretch
    geometries.set(key, geometry)
  }
  return geometries.get(key)
}

const FINISHES = {
  metal: { metalness: 0.55, roughness: 0.12 },
  gloss: { metalness: 0, roughness: 0.18 },
}
// 固定方向光着色，让纯色面仍有 3D 感
const RETURN_LIGHT = vec3(-0.45, 0.75, 0.5).normalize()
const flatFinish = (hex) => {
  const face = uniform(new THREE.Color(hex))
  const side = face.mul(mix(0.18, 0.5, normalView.dot(RETURN_LIGHT).mul(0.5).add(0.5)))
  return vec4(mix(side, face, normalView.z.smoothstep(0.55, 0.9)), 1)
}

const rigs = actors.map((actor) => {
  const geometry = geometryFor(actor)
  actor.radius = geometry.userData.radius
  const smear = createVelocitySmear()
  const isTitle = actor.shape === 'titlechar'
  const flat = actor.material === 'flat' || isTitle
  const material = flat ? new THREE.MeshBasicNodeMaterial() : new THREE.MeshStandardNodeMaterial({ color: actor.base, ...FINISHES[actor.material] })
  material.positionNode = smear.positionNode
  if (!isTitle) material.outputNode = flat ? flatFinish(actor.base) : output.toneMapping(THREE.ACESFilmicToneMapping)

  // 标题字牌：用 CanvasTexture 贴图（亮色大字，直接显示不受光照影响）
  if (isTitle) {
    const tex = createTitleCharTexture(actor.char, actor.color() ?? actor.base)
    material.map = tex
    material.transparent = true
    material.side = THREE.DoubleSide
    material.depthWrite = false
    material.color = new THREE.Color('#ffffff')
  }

  const mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)
  return { actor, mesh, smear, material, color: actor.base }
})

const backdrop = createBackdrop()
const backdropMaterial = new THREE.MeshBasicNodeMaterial({ depthTest: false, depthWrite: false })
backdropMaterial.vertexNode = vec4(positionGeometry.xy, 1, 1)
backdropMaterial.outputNode = vec4(backdrop.node, 1)
backdropMaterial.mrtNode = mrt({ velocity: vec2(0) })
const backdropMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), backdropMaterial)
backdropMesh.frustumCulled = false
backdropMesh.renderOrder = -1
scene.add(backdropMesh)

const scenePass = pass(scene, camera)
scenePass.setMRT(mrt({ output, velocity }))
scenePass.getTexture('velocity').format = THREE.RGFormat
const color = scenePass.getTextureNode('output')
const blurAmount = uniform(0)
const blurResolution = uniform(new THREE.Vector2(1, 1))
const blurLimit = uniform(48)
const blurOnset = uniform(3.5)
const blurFrameScale = uniform(1)
const motionBlur = createDirectionalMotionBlur({
  color,
  velocity: scenePass.getTextureNode('velocity'),
  depth: scenePass.getTextureNode('depth'),
  near: camera.near,
  far: camera.far,
  strength: blurAmount,
  resolution: blurResolution,
  maxBlurPixels: blurLimit,
  onsetPixels: blurOnset,
  frameScale: blurFrameScale,
})
const splitX = uniform(0)
const grainSeed = uniform(new THREE.Vector2())
const grainSize = uniform(1)
const frameAspect = uniform(1)
const graded = renderOutput(mix(motionBlur.node, color.sample(uv()), step(uv().x, splitX)), THREE.NoToneMapping, THREE.SRGBColorSpace)
const grainCell = screenCoordinate.xy.div(grainSize).floor().add(grainSeed)
const grain = hash(grainCell.x.add(grainCell.y.mul(4099))).sub(0.5).mul(0.032)
const vignette = float(1).sub(length(screenUV.sub(0.5).mul(vec2(frameAspect, 1))).smoothstep(0.45, 1.1).mul(0.06))
const renderPipeline = new THREE.RenderPipeline(renderer)
renderPipeline.outputColorTransform = false
renderPipeline.outputNode = vec4(graded.rgb.mul(vignette).add(grain), 1)
let skipBlurFrames = 2

function applyMotionBlur(t, delta) {
  const frameScale = delta <= 0 || delta > 0.1 ? 0 : Math.min(8, (1 / 120) / Math.max(delta, 1 / 1000))
  blurAmount.value = skipBlurFrames > 0 ? 0 : blurShutter(t) * frameScale
  blurFrameScale.value = frameScale
  motionBlur.updateTiles()
  if (skipBlurFrames > 0) skipBlurFrames--
}

const hud = createHud(document.querySelector('.hud'))
const backdropState = createBackdropState()
const smearSettings = { ...SMEAR, strength: 0 }
const euler = new THREE.Euler()
const frame = new THREE.Vector3()
const earlier = new THREE.Vector3()
const readout = { blur: 0, smear: 1 }

function streakPixels(actor, t) {
  const before = wrap(t - 1 / 120)
  projectToFrame(actor.position(before, earlier), before, camera.aspect, earlier)
  const travel = Math.hypot(frame.x - earlier.x, frame.y - earlier.y) * blurResolution.value.y
  return Math.min(blurLimit.value, travel * blurShutter(t))
}

function pose(t) {
  cameraPose(t, camera.position, camera.quaternion)
  const grainFrame = Math.round(t * 120)
  grainSeed.value.set((grainFrame * 131) % 1021, (grainFrame * 197) % 1031)
  const split = abSplit(t)
  splitX.value = split
  readout.blur = 0
  readout.smear = 1
  for (const rig of rigs) {
    const { actor, mesh, material } = rig
    const scale = actor.scale(t)
    mesh.visible = scale > 1e-3 || actor.scale(wrap(t + 2 / 120)) > 1e-3
    if (!mesh.visible) continue
    actor.position(t, mesh.position)
    mesh.quaternion.setFromEuler(actor.rotation(t, euler))
    const size = Math.max(scale, 1e-4)
    const squash = actor.squash?.(t) ?? 1
    mesh.scale.set(size / Math.sqrt(squash), size * squash, size / Math.sqrt(squash))
    const hex = actor.color(t) ?? actor.base
    if (hex !== rig.color) material.color.set((rig.color = hex))
    let strength = actor.smear(t)
    projectToFrame(mesh.position, t, camera.aspect, frame)
    if (split > 0) strength *= smoothstep(split - 0.03, split + 0.03, frame.x / camera.aspect + 0.5)
    smearSettings.strength = strength
    updateSmear(rig.smear, mesh, actor, t, smearSettings, cameraPose)
    if (scale < 1e-3 || Math.abs(frame.x) > camera.aspect / 2 || Math.abs(frame.y) > 0.5) continue
    readout.smear = Math.max(readout.smear, 1 + rig.smear.end.value.length() / (2 * actor.radius))
    if (frame.x / camera.aspect + 0.5 > split) readout.blur = Math.max(readout.blur, streakPixels(actor, t))
  }
  backdrop.update(backdropAt(t, camera.aspect, backdropState), camera.aspect, contrastInk(backdropState.base), pulseAt(t))
}

function resize() {
  const [width, height] = forcedSize ?? [innerWidth, innerHeight]
  renderer.setPixelRatio(forcedSize ? 1 : Math.min(devicePixelRatio, 2))
  renderer.setSize(width, height, false)
  camera.aspect = width / height
  camera.fov = fitFov(camera.aspect)
  camera.updateProjectionMatrix()
  renderer.getDrawingBufferSize(blurResolution.value)
  blurLimit.value = Math.round(blurResolution.value.y * 0.019)
  grainSize.value = Math.max(1, Math.round(blurResolution.value.y / 1200))
  frameAspect.value = camera.aspect
  skipBlurFrames = 2
}
resize()
addEventListener('resize', () => {
  resize()
  if (paused) {
    clock += (pendingSteps - 2) / 120
    pendingSteps = 2
  }
})

let clock = query.has('t') ? Number(query.get('t')) || 0 : 13.1
let started = false
let paused = true
let pendingSteps = 0
let audioDriven = false
const setAudioState = () => { intro.dataset.audio = audioDriven ? soundtrack.state : 'off' }

async function start() {
  if (started) return
  started = true
  intro.classList.add('is-playing')
  await soundtrack.ready
  clock = 0
  skipBlurFrames = 2
  audioDriven = soundtrack.available && await soundtrack.play(0)
  paused = false
  setAudioState()
}
document.querySelector('[data-start]').addEventListener('click', start)

// 进入主页：点击「进入流云渡」触发「帷幕拉开」过渡
document.querySelector('[data-enter]').addEventListener('click', () => {
  if (!started) return
  // 停止音频，避免背景音乐在主页继续循环
  if (audioDriven) soundtrack.pause()
  paused = true
  if (intro) {
    // 合并页：帷幕拉开后揭示下方主页
    intro.classList.add('entering')
    setTimeout(() => {
      intro.classList.add('is-entered')
      document.body.classList.add('entered')
    }, 1150)
  } else {
    // 独立页（index.html）：帷幕拉开后跳转 home.html
    document.body.classList.add('entering')
    setTimeout(() => {
      window.location.href = '/home.html'
    }, 1150)
  }
})

async function setPaused(value) {
  paused = value
  if (!audioDriven) return
  clock = wrap(clock)
  if (paused) await soundtrack.pause()
  else audioDriven = await soundtrack.play(clock)
  setAudioState()
}

addEventListener('keydown', (event) => {
  if (!started) return
  if (event.code === 'Space') setPaused(!paused)
  else if (event.code === 'ArrowRight' || event.code === 'ArrowLeft') {
    if (!paused) setPaused(true)
    pendingSteps += event.code === 'ArrowRight' ? 1 : -1
  } else return
  event.preventDefault()
})
addEventListener('hashchange', () => {
  const target = Number(location.hash.match(/t=([\d.]+)/)?.[1])
  if (Number.isNaN(target)) return
  if (!paused) setPaused(true)
  clock = target - 2 / 120
  pendingSteps = 2
})

for (const { mesh } of rigs) Object.assign(mesh, { visible: true, frustumCulled: false })
renderPipeline.render()
for (const { mesh } of rigs) mesh.frustumCulled = true
// 预热
for (let frame = 2; frame >= 0; frame--) {
  await new Promise(requestAnimationFrame)
  pose(wrap(clock - frame / 120))
  renderPipeline.render()
}
hud.update(wrap(clock), backdropState, camera.aspect, null, readout)
// 容错等待：WebGL fallback 下 device 可能为 null，onSubmittedWorkDone 可能不存在
const gpuDone = renderer.backend?.device?.queue?.onSubmittedWorkDone?.() ?? Promise.resolve()
await Promise.all([soundtrack.ready, document.fonts.ready, gpuDone]).catch(() => {})
document.body.classList.toggle('is-still', query.has('still'))
setAudioState()
intro.classList.remove('is-loading')

const timer = new THREE.Timer()
timer.connect(document)

renderer.setAnimationLoop((time) => {
  timer.update(time)
  const elapsed = timer.getDelta()
  let delta = elapsed > 0.1 ? 0 : elapsed
  if (paused) {
    if (pendingSteps === 0) return
    delta = Math.sign(pendingSteps) / 120
    pendingSteps -= Math.sign(pendingSteps)
    clock += delta
  } else if (audioDriven) {
    const heard = Math.max(clock, soundtrack.time(time + 1000 / 120))
    delta = heard - clock
    clock = heard
  } else {
    clock += delta
  }
  const t = wrap(clock)
  pose(t)
  applyMotionBlur(t, Math.abs(delta))
  renderPipeline.render()
  hud.update(t, backdropState, camera.aspect, audioDriven ? TRACK.start + t : null, readout)
})
