# Theme-aware Hero video design

## Goal

让首页 Hero 在 light 与 dark 主题下分别使用匹配的视频和预览图，同时保留懒加载与“减少动态效果”保护，避免重复下载或主题切换时闪回错误画面。

## Assets

- 现有 `hero-bg.mp4` 重命名为 `hero-bg-dark.mp4`。
- 现有 `hero-bg-poster.webp` 与 `hero-bg-poster-sm.webp` 分别重命名为 dark 版本。
- 用户新增的视频重命名为 `hero-bg-light.mp4`。
- 从 light 视频的稳定首帧生成：
  - `hero-bg-light-poster.webp`：1280×720。
  - `hero-bg-light-poster-sm.webp`：640×360。

## Runtime behavior

- Hero 继续只渲染一个 `<video>`，避免 light 与 dark 视频同时下载。
- 当前主题决定活动视频、桌面 Poster 和手机 Poster。
- 初次进入时先显示当前主题对应的 Poster，空闲时再加载对应视频。
- 主题切换时立即隐藏旧视频并显示新主题 Poster，然后替换视频源、调用 `load()`，在 `loadeddata` 后播放新视频。
- 系统偏好“减少动态效果”时不加载任何视频，只显示当前主题 Poster。
- 主题在视频加载过程中切换时，以最新主题的资源为准；旧视频的就绪事件不得重新显示旧画面。

## Visual treatment

- 保留现有 Hero 尺寸、内容排版和主题渐变叠层。
- light 模式不使用深色全屏遮罩，仅保留透明到页面底色的底部衔接渐变，并将标题、描述、次按钮和图标切换为深色高对比样式。
- dark 模式继续使用现有深色渐变遮罩和白色文案。
- Hero 使用 Nuxt UI 官方提供的 `--ui-header-height` 向上覆盖导航栏区域，同时把同等高度补回内容顶部安全区，避免文案与 navbar 重叠。
- Poster 与视频共用 `object-cover`，确保切换前后裁切一致。
- 不新增第二套 Hero 文案或结构。

## Testing

- 源码契约测试覆盖两套视频、四张 Poster 和单视频元素结构。
- 契约测试覆盖主题变更时重载视频，以及减少动态效果下不加载视频。
- 实际预览验证 light/dark 桌面与手机均使用正确资源，无横向溢出。
- 运行完整测试、类型检查和生产构建。

## Out of scope

- 不修改 Hero 文案、文章区布局或主题配色。
- 不同时预加载两支视频。
