# Wider Bilibili

## 功能
- 播放器占据页面全宽且**允许滚动**，高度自适应
- 调用自带`网页全屏`样式
- 视频/首页/动态/阅读等页面调整边距
- `Shift+Alt+W`或者在脚本菜单中调出设置面板
- 修复B站前端的一些其他问题样式
- 大部分效果基本只使用`CSS`达成，不会进行`DOM`操作

## 选项
- 视频页导航栏放在播放器上/下
- 小窗播放器**可调节大小**，并移除非16:9视频产生的黑边 ([例如](https://www.bilibili.com/video/BV1uT4y1P7CX/))
- 播放器底栏控件调整宽度间距
- 播放器暂停强制显示控件
- 显示播放人数/弹幕数 (自带`网页全屏`下不会显示)

## 预览
- 无，只需要想象一下可以滚动的`网页全屏`就行了
- [装上](https://update.greasyfork.org/scripts/474507/Wider%20Bilibili.user.js)去[任意视频](https://www.bilibili.com/video/BV1uT4y1P7CX/)试试

## 注意
- 仅适配新版页面
- 移除了原`宽屏`/`网页全屏`按钮 (`全屏`仍保留)

## 兼容
### 浏览器
- 需浏览器适配`ES2020`和[`CSS原生嵌套`](https://caniuse.com/css-nesting) (`Chromium` 120+ / `Firefox` 117+ / `Safari` 17.2+)
- 测试仅使用`Firefox`最新版以及`Edge`最新版
### 插件
- 兼容[`Bilibili Evolved`](https://github.com/the1812/Bilibili-Evolved)包括夜间模式和自定义顶栏在内的的大部分插件
- 兼容[`解除B站区域限制`](https://greasyfork.org/scripts/25718)

## 开发
脚本本体使用`ts`+`vite`+[`vite-plugin-monkey`](https://github.com/lisonge/vite-plugin-monkey)开发，直接`npm vite`即可开发/构建

选项面板使用`npm vite -c vite.config.html.ts`或者`npm html`可以独立开发/浏览，无需在bilibili上测试
