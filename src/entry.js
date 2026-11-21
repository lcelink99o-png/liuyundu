// 顶层 await 模块：main.js 直接执行初始化
// 超时兜底：若 6 秒内动画未初始化完成（卡住/失败），强制解除白屏
const timeoutGuard = setTimeout(() => {
  document.body.classList.remove('is-loading')
  const intro = document.querySelector('.intro')
  if (intro) {
    intro.classList.add('is-failed')
    document.body.classList.add('entered')
  } else {
    window.location.href = './home.html'
  }
}, 6000)

try {
  await import('./main.js')
  clearTimeout(timeoutGuard)
} catch (error) {
  clearTimeout(timeoutGuard)
  console.error('开场动画初始化失败：', error)
  // WebGPU 不支持或加载失败：解除 loading 锁，避免白屏
  document.body.classList.remove('is-loading')
  const intro = document.querySelector('.intro')
  if (intro) {
    // 合并页：隐藏动画层，直接显示主页
    intro.classList.add('is-failed')
    document.body.classList.add('entered')
  } else {
    // 独立页（index.html）：无法播放动画，直接跳转主页
    window.location.href = './home.html'
  }
  const hint = document.querySelector('.start__hint')
  if (hint) hint.textContent = '需要支持 WebGPU 的浏览器（Chrome/Edge 113+），已直接进入主页'
}
