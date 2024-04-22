import { GM_addStyle, GM_addValueChangeListener } from '$'
import styles from './styles'
import listenOptions, { videoOptions } from './options'
import { waitFor, observeFor, waitReady } from './utils'

GM_addStyle(styles.common)

const url = new URL(window.location.href)
switch (url.host) {
  case 'www.bilibili.com': {
    // 首页
    if (url.pathname === '/') {
      GM_addStyle(styles.home)
      console.info('使用首页宽屏样式')
      break
    }
    // 阅读页
    if (url.pathname.startsWith('/read')) {
      GM_addStyle(styles.read)
      console.info('使用阅读页宽屏样式')
      break
    }

    // #region 视频页
    // 先插入视频页样式，再等待页面加载完成
    const style = GM_addStyle(styles.video)
    // 等待页面加载完成，因为使用了run-at document-body
    await waitReady()
    const player = document.getElementById('bilibili-player')
    if (!player) { style.remove(); break }
    listenOptions(videoOptions)

    // 播放器内容器 (番剧页面需要额外等待)
    const container = await waitFor(() => player.getElementsByClassName('bpx-player-container')[0], '播放器内容器') as HTMLDivElement
    // 立即使用宽屏样式 (除非当前是小窗模式)
    if (container.getAttribute('data-screen') !== 'mini') { container.setAttribute('data-screen', 'web') }
    // 重载container的setAttribute：data-screen被设置为mini(小窗)以外的值时将其设置为web(宽屏)
    container.setAttribute = new Proxy(container.setAttribute, {
      apply: (target, thisArg, [name, val]) =>
        target.apply(thisArg, [name, name === 'data-screen' && val !== 'mini' ? 'web' : val]),
    })

    // 初始化以及监听小窗宽度选项
    container.style.setProperty('--mini-width', `${GM_getValue('小窗宽度', 320)}px`)
    GM_addValueChangeListener('小窗宽度', (_k, _o, newVal) => container.style.setProperty('--mini-width', `${newVal}px`))

    // 添加拖动调整大小的部件
    const miniResizer = document.createElement('div')
    miniResizer.className = 'bpx-player-mini-resizer'
    miniResizer.onmousedown = ev => {
      ev.stopImmediatePropagation()
      ev.preventDefault()
      const resize = (ev: MouseEvent) => {
        const miniWidth = Math.max(container.offsetWidth + container.getBoundingClientRect().x - ev.x + 5, 0) // 不设为<0的无效值
        GM_setValue('小窗宽度', Math.round(miniWidth))
      }
      if (ev.button !== 0) return
      document.addEventListener('mousemove', resize)
      document.addEventListener('mouseup', () => document.removeEventListener('mousemove', resize), { once: true })
    }

    const videoArea = container.getElementsByClassName('bpx-player-video-area')[0]
    if (!videoArea) { console.error('页面加载错误：视频区域不存在'); break }
    observeFor('bpx-player-mini-warp', videoArea).then(wrap => wrap.appendChild(miniResizer))

    const sendingBar = player.getElementsByClassName('bpx-player-sending-bar')[0] as HTMLElement
    if (!sendingBar) { console.error('页面加载错误：发送框不存在'); break }
    // 等待人数加载完成，再进行弹幕框的操作
    const danmaku = (await observeFor('bpx-player-video-info', sendingBar)).parentElement
    // 播放器底中部框 (用于放置弹幕框内容)
    const bottomCenter = container.getElementsByClassName('bpx-player-control-bottom-center')[0]
    // 原弹幕框 (播放器下方)
    if (!bottomCenter || !danmaku) {
      console.error('页面加载错误：弹幕框不存在'); break
    }

    // 退出全屏时弹幕框移至播放器下方
    document.addEventListener('fullscreenchange', () => document.fullscreenElement || bottomCenter.replaceChildren(danmaku))
    // 立即将弹幕框移至播放器下方一次
    bottomCenter.replaceChildren(danmaku)

    // 默认顶栏
    const header = document.getElementById('biliMainHeader')
    // 将bilibili-evolved自定义顶栏插入默认顶栏后
    observeFor('custom-navbar', document.body).then(async nav => {
      // 等待默认顶栏加载完成
      await waitFor(() => document.getElementById('nav-searchform'))
      header?.append(nav)
    })

    console.info('宽屏模式成功启用')
    // #endregion
    break
  }
  case 't.bilibili.com':
    GM_addStyle(styles.t)
    waitFor(() => document.getElementsByClassName('right')[0], '动态右栏').then(right =>
      right.prepend(...document.getElementsByClassName('left')[0]?.childNodes ?? []),
    )
    console.info('使用动态样式')
    break
  case 'space.bilibili.com':
    GM_addStyle(styles.space)
    console.info('使用空间样式')
    break
  case 'message.bilibili.com':
    GM_addStyle(styles.message)
    console.info('使用通知样式')
    break
  case 'search.bilibili.com':
    GM_addStyle(styles.search)
    console.info('使用搜索页样式')
    break
  default:
    console.info(`未适配页面，仅启用通用样式: ${url.href}`)
    break
}
