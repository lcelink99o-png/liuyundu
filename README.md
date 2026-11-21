# 流云渡 · 云游此地

「流云渡」OC 世界观个人网站。开场动画（WebGPU 实时渲染）+ 主页（museum-of-motion 风格复刻）。

## 技术栈

- **three.js 0.186（WebGPU + TSL）** —— 开场动画：鲤鱼、桃花、山茶的酸色涂抹与运动模糊
- **GSAP 3.12 + ScrollTrigger** —— 主页滚动动效
- **Vite 7** —— 多页面构建
- **Archivo 可变字体**（Google Fonts）

## 本地开发

```bash
npm install
npm run dev        # 启动开发服务器 http://localhost:5173
```

## 页面结构

| 页面 | 说明 |
|------|------|
| `index.html` | 开场动画（默认首页，15 秒循环） |
| `home.html` | 主页（动画点「进入流云渡」后跳转） |
| `merged.html` | 一体化合并页（动画 + 主页，单页体验） |

## 构建

```bash
npm run build      # 产物输出到 dist/
npm run preview    # 本地预览构建产物
```

## 部署到 GitHub Pages

本项目已配置好 GitHub Actions 自动部署（`.github/workflows/deploy.yml`），推送代码到 `main` 分支即自动构建并部署。

### 首次部署步骤

1. **注册 GitHub 账号**（如已注册跳过）
2. **创建仓库**：github.com 右上角「+」→「New repository」
   - Repository name 填 `liuyundu`（或任意名字）
   - 选 Public（免费 Pages 需要公开仓库）
   - 不要勾选「Add a README」
3. **推送代码**（在项目 `site` 目录下执行）：
   ```bash
   git init
   git add .
   git commit -m "init: 流云渡网站"
   git branch -M main
   git remote add origin https://github.com/<你的用户名>/liuyundu.git
   git push -u origin main
   ```
4. **开启 Pages**：仓库页面 → Settings → Pages
   - Source 选「GitHub Actions」
   - 推送后 Actions 会自动构建部署
5. **访问网站**：`https://<你的用户名>.github.io/liuyundu/`

> 部署完成后，若再次更新代码，只需 `git add . && git commit && git push`，Actions 会自动重新构建部署。

## 资源路径说明

- 项目资源路径已全部改为**相对路径**，适配 GitHub Pages 子路径部署
- 图片在 `public/images/`，音频在 `public/audio/`，第三方库在 `public/vendor/`

## 版权

© 流云渡 · 原创世界观 · 请勿商用
