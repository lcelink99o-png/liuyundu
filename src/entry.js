// 顶层 await 模块：main.js 直接执行初始化
try {
  await import('./main.js')
} catch (error) {
  console.error('开场动画初始化失败：', error)
  // WebGPU 不支持或加载失败：隐藏开场动画层，直接显示主页
  const intro = document.querySelector('.intro')
  if (intro) intro.classList.add('is-failed')
  document.body.classList.add('entered')
  const hint = document.querySelector('.start__hint')
  if (hint) hint.textContent = '需要支持 WebGPU 的浏览器（Chrome/Edge 113+），已直接进入主页'
}
