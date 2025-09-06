import {
  GM_addStyle,
  GM_setValue,
  GM_getValue,
  GM_deleteValues,
  GM_addValueChangeListener,
} from '$'
import styles from './styles'
import listenOptions, { videoOptions, timelineOptions } from './options'
import { waitFor, observeFor, waitReady } from './utils'

GM_addStyle(styles.panel)
GM_addStyle(styles.common)

const url = new URL(window.location.href)
switch (url.host) {
  case 'www.bilibili.com': {
    // #region 首页
    if (url.pathname === '/') {
      GM_addStyle(styles.home)
      console.info('使用首页宽屏样式')
      break
    }
    // #region 阅读页
    if (url.pathname.startsWith('/read')) {
      GM_addStyle(styles.read)
      console.info('使用阅读页宽屏样式')
      break
    }
    // #region 新版动态页
    if (url.pathname.startsWith('/opus')) {
      GM_addStyle(styles.opus)
      break
    }

    // #region 视频页
    // 先插入视频页样式，再等待页面加载完成
    const style = GM_addStyle(styles.video)
    // 等待页面加载完成，因为使用了run-at document-start
    await waitReady()
    const player = document.getElementById('bilibili-player')
    if (!player) { style.remove(); break }

    listenOptions(videoOptions)
    // 播放器内容器 (番剧页面需要额外等待)
    const container = <HTMLElement> await waitFor(() => player.getElementsByClassName('bpx-player-container')[0], '播放器内容器')
    // 立即使用宽屏样式 (除非当前是小窗模式)
    if (container.getAttribute('data-screen') !== 'mini') { container.setAttribute('data-screen', 'web') }
    // 重载container的setAttribute：data-screen被设置为mini(小窗)以外的值时将其设置为web(宽屏)
    container.setAttribute = new Proxy(container.setAttribute.bind(container), {
      apply: (target, thisArg, [name, val]) =>
        target.apply(thisArg, [name, name === 'data-screen' && val !== 'mini' ? 'web' : val]),
    })

    // 初始化以及监听小窗宽度选项
    container.style.setProperty('--mini-width', `${GM_getValue('小窗宽度', 320)}px`)
    GM_addValueChangeListener<number>('小窗宽度', (_k, _o, newVal) => container.style.setProperty('--mini-width', `${newVal}px`))

    // 添加拖动调整大小的部件
    const miniResizer = document.createElement('div')
    miniResizer.className = 'bpx-player-mini-resizer'
    miniResizer.onmousedown = ev => {
      if (ev.button !== 0) return
      ev.stopImmediatePropagation()
      ev.preventDefault()
      const resize = (ev: MouseEvent) => {
        // +1防止指针鬼畜
        const miniWidth = Math.round(Math.max(container.offsetWidth + container.getBoundingClientRect().x - ev.x + 1, 0))
        GM_setValue('小窗宽度', miniWidth)
      }
      document.addEventListener('mousemove', resize)
      document.addEventListener('mouseup', () => document.removeEventListener('mousemove', resize), { once: true })
    }

    // !important覆盖原有小窗拖动样式
    const miniPositionFormat = (rt: string, bt: string) => `.bpx-player-container[data-screen="mini"] {
  right: ${rt}px !important;
  bottom: ${bt}px !important;
}`
    const miniStyle = GM_addStyle(miniPositionFormat(GM_getValue('小窗右', '52'), GM_getValue('小窗下', '8')))

    // 小窗选项重置
    document.querySelector<HTMLButtonElement>(`button[data-option=重置小窗位置]`)?.addEventListener('click', () => {
      GM_deleteValues(['小窗右', '小窗下', '小窗宽度'])
      miniStyle.textContent = miniPositionFormat('52', '8')
      container.style.removeProperty('--mini-width')
    })

    const videoArea = container.getElementsByClassName('bpx-player-video-area')[0]
    if (!(videoArea instanceof HTMLElement)) { console.error('页面加载错误：视频区域不存在'); break }
    observeFor('bpx-player-mini-warp', videoArea).then(warp => {
      warp.appendChild(miniResizer)
      warp.addEventListener('mousedown', ev => {
        if (ev.button !== 0) return
        const { right, bottom } = warp.getBoundingClientRect()
        const offsetX = right - ev.x
        const offsetY = bottom - ev.y
        const onmousemove = (ev: MouseEvent) => {
          const newRt = Math.round(Math.max(window.innerWidth - ev.x - offsetX, 0)) // 不设为<0的无效值
          const newBt = Math.round(Math.max(window.innerHeight - ev.y - offsetY, 0)) // 不设为<0的无效值
          GM_setValue('小窗右', newRt)
          GM_setValue('小窗下', newBt)
          miniStyle.textContent = miniPositionFormat(String(newRt), String(newBt))
        }
        document.addEventListener('mousemove', onmousemove)
        document.addEventListener('mouseup', () => {
          document.removeEventListener('mousemove', onmousemove)
        }, { once: true })
      })
    }).catch(console.error)

    const sendingBar = player.getElementsByClassName('bpx-player-sending-bar')[0]
    if (!(sendingBar instanceof HTMLElement)) { console.error('页面加载错误：发送框不存在'); break }
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

    await waitFor(() => document.getElementById('nav-searchform'), '搜索框').then(() => {
      // 将bilibili-evolved自定义顶栏插入默认顶栏后
      observeFor('custom-navbar', document.body).then(nav => header?.append(nav)).catch(console.error)
    })

    console.info('宽屏模式成功启用')
    break
    // #endregion
  }
  // #region 动态页
  case 't.bilibili.com':
    GM_addStyle(styles.t)
    listenOptions(timelineOptions)
    waitFor(() => document.getElementsByClassName('right')[0], '右侧栏').then(right => {
      const left = document.getElementsByClassName('left')[0]!
      left.appendChild(right)
    }).catch(console.error)
    console.info('使用动态样式')
    break
  // #region 空间页
  case 'space.bilibili.com':
    GM_addStyle(styles.space)
    console.info('使用空间样式')
    break
  // #region 消息页
  case 'message.bilibili.com':
    GM_addStyle(styles.message)
    console.info('使用通知样式')
    break
  // #region 搜索页
  case 'search.bilibili.com':
    GM_addStyle(styles.search)
    console.info('使用搜索页样式')
    break
  // #region 未适配页面
  default:
    console.info(`未适配页面，仅启用通用样式: ${url.href}`)
    break
}
