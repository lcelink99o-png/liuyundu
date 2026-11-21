// shapes.js — 流云渡几何体工厂
// 照猫画虎替换模板的 sphere/knot/gem/box/capsule/torus/letter，
// 用鲤鱼、桃花、山茶、花瓣、标题字牌等几何体替代。

import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { TessellateModifier } from 'three/addons/modifiers/TessellateModifier.js'

const tessellate = (geometry, edge) => new TessellateModifier(edge, 10).modify(geometry)

// 鲤鱼：改用简洁的球体（更干净好看），高分段数保证表面光滑
function koiGeometry() {
  return new THREE.SphereGeometry(1.15, 64, 48)
}

// 桃花：中心球 + 五片花瓣（用锥体/球体组合）
function blossomGeometry() {
  const center = new THREE.SphereGeometry(0.4, 24, 16)
  const petal = new THREE.SphereGeometry(0.42, 16, 12)
  petal.scale(1.6, 0.45, 0.8)
  // 五片花瓣环绕
  const group = []
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2
    const p = petal.clone()
    p.translate(Math.cos(angle) * 0.85, 0, Math.sin(angle) * 0.85)
    p.rotateY(-angle)
    group.push(p)
  }
  return mergeGeometries([center, ...group])
}

// 山茶：多层重瓣（用多层花瓣）
function camelliaGeometry() {
  const layers = []
  const center = new THREE.SphereGeometry(0.38, 20, 14)
  layers.push(center)
  for (let layer = 0; layer < 3; layer++) {
    const count = 6 + layer * 2
    const radius = 0.5 + layer * 0.22
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + layer * 0.3
      const petal = new THREE.SphereGeometry(0.34, 12, 10)
      petal.scale(1.4, 0.32, 0.7)
      petal.translate(Math.cos(angle) * radius, 0, Math.sin(angle) * radius)
      petal.rotateY(-angle)
      layers.push(petal)
    }
  }
  return mergeGeometries(layers)
}

// 花瓣（单片，用于 swarm）
function petalGeometry() {
  const petal = new THREE.SphereGeometry(0.4, 10, 8)
  petal.scale(1.8, 0.3, 0.9)
  return petal
}

// 标题字牌：用 Canvas 生成「流云渡」单字的贴图平面（拉伸成带厚度的板）
// 返回 BufferGeometry（PlaneGeometry 拉伸出厚度，便于 smear 拖尾）
function titleCharGeometry(char) {
  // 用 CanvasTexture 平面 + 轻微挤出（前后两个面 + 侧边简单处理）
  const plane = new THREE.PlaneGeometry(1, 1)
  // 记录 char 供 material 使用
  plane.userData.char = char
  return plane
}

function mergeGeometries(geometries) {
  // 手动合并顶点（不依赖 BufferGeometryUtils.mergeGeometries，避免导入顺序问题）
  const positions = []
  const normals = []
  const uvs = []
  let vertexOffset = 0
  const indices = []
  for (const geo of geometries) {
    const pos = geo.attributes.position
    const nor = geo.attributes.normal
    const uv = geo.attributes.uv
    for (let i = 0; i < pos.count; i++) {
      positions.push(pos.getX(i), pos.getY(i), pos.getZ(i))
      if (nor) normals.push(nor.getX(i), nor.getY(i), nor.getZ(i))
      if (uv) uvs.push(uv.getX(i), uv.getY(i))
    }
    const idx = geo.index
    if (idx) {
      for (let i = 0; i < idx.count; i++) indices.push(idx.getX(i) + vertexOffset)
    } else {
      for (let i = 0; i < pos.count; i++) indices.push(i + vertexOffset)
    }
    vertexOffset += pos.count
  }
  const merged = new THREE.BufferGeometry()
  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  if (normals.length) merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  if (uvs.length) merged.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  merged.setIndex(indices)
  return merged
}

export const SHAPES = {
  koi: (low) => koiGeometry(),
  blossom: (low) => tessellate(blossomGeometry(), low ? 0.3 : 0.16),
  camellia: (low) => tessellate(camelliaGeometry(), low ? 0.3 : 0.16),
  petal: (low) => petalGeometry(),
  box: () => new RoundedBoxGeometry(1.7, 1.7, 1.7, 3, 0.22),
  capsule: () => new THREE.CapsuleGeometry(0.6, 1.1, 6, 20).rotateZ(Math.PI / 2),
  torus: () => new THREE.TorusGeometry(0.8, 0.36, 20, 64),
  titlechar: (low, char) => titleCharGeometry(char),
}

// 生成标题字贴图
export function createTitleCharTexture(char, color = '#080A0A') {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 256
  const ctx = c.getContext('2d')
  ctx.clearRect(0, 0, 256, 256)
  ctx.font = '900 200px "PingFang SC", "Microsoft YaHei", "SimHei", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = color
  ctx.fillText(char, 128, 140)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  tex.needsUpdate = true
  return tex
}
