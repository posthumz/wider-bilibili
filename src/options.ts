import {
  GM_addStyle,
  GM_setValue,
  GM_getValue,
  GM_deleteValue,
  GM_addValueChangeListener,
  GM_registerMenuCommand,
} from '$'
import styles from './styles'
import { waitReady, waitFor } from './utils'
import html from './pages/options.html?raw'

type Update<T> = (newVal: T) => void
interface Option<T> {
  fallback: T
  callback: (init?: T) => Parameters<typeof GM_addValueChangeListener<T>>[1]
}

type OptionRecord = Record<string, Option<boolean> | Option<number>>

function styleToggle(s: string, flip = false): Update<boolean> {
  const style = GM_addStyle(s)
  return flip
    ? (b: boolean) => { style.disabled = b }
    : (b: boolean) => { style.disabled = !b }
}

/**
 * @argument update   选项更新处理函数
 * @argument fallback 选项默认值
 * @description 初始化Update类型选项，并创建相应的ValueChangeListener
 */
function initUpdate<T>(update: Update<T>, fallback: T, init?: T) {
  update(init ?? fallback)
  return (_k: string, _o?: T, newVal?: T) => update(newVal ?? fallback)
}

const commonOptions: OptionRecord = {
  左右边距: {
    fallback: 30,
    callback(init) {
      return initUpdate(val => document.documentElement.style.setProperty('--layout-padding-input', `${val}px`), this.fallback, init)
    },
  },
}

const videoOptions: OptionRecord = {
  导航栏下置: {
    fallback: true,
    callback(init) {
      return initUpdate(styleToggle(styles.upperNavigation, true), this.fallback, init)
    },
  },
  预留高度: {
    fallback: 96,
    callback(init) {
      return initUpdate(val => (val
        // 非零值：强制使用--navbar-height
        ? document.documentElement.style.setProperty('--reserve-height-input', `calc(var(--navbar-height) + ${val}px)`)
        // 零值：使用默认策略(仅导航栏上置时才使用--navbar-height)
        : document.documentElement.style.removeProperty('--reserve-height-input')
      ), this.fallback, init)
    },
  },
  自动高度: { // 也就是说，不会有上下黑边
    fallback: true,
    callback(init) {
      waitFor(() => document.getElementsByClassName('bpx-player-container')[0], '播放器内容器').then(container => {
        new ResizeObserver(entries => {
          if ((<HTMLElement>container).dataset.screen === 'mini') return
          const height = Math.round(entries[0]!.contentRect.height)
          // 仅高度<=视口高度时才设置
          if (height && height <= window.innerHeight)
            document.documentElement.style.setProperty('--player-height-record', `${height}px`)
          else // 否则使用默认策略(最大可用高度)
            document.documentElement.style.removeProperty('--player-height-record')
        }).observe(container)
      }).catch(console.error)
      return initUpdate(styleToggle(styles.fixHeight, true), this.fallback, init)
    },
  },
  小窗样式: {
    fallback: true,
    callback(init) {
      const toggle1 = styleToggle(styles.mini)
      const toggle2 = styleToggle('.bpx-player-container{--mini-width:initial}', true)
      return initUpdate(enable => { toggle1(enable); toggle2(enable) }, this.fallback, init)
    },
  },
  粘性导航栏: {
    fallback: true,
    callback(init) {
      return initUpdate(styleToggle(styles.stickyHeader), this.fallback, init)
    },
  },
  紧凑控件间距: {
    fallback: true,
    callback(init) {
      return initUpdate(styleToggle(styles.compactControls), this.fallback, init)
    },
  },
  暂停显示控件: {
    fallback: false,
    callback(init) {
      return initUpdate(styleToggle(styles.pauseShowControls), this.fallback, init)
    },
  },
  显示观看信息: {
    fallback: true,
    callback(init) {
      return initUpdate(styleToggle('.bpx-player-video-info{display:flex!important}'), this.fallback, init)
    },
  },
  隐藏控件: {
    fallback: true,
    callback(init) {
      return initUpdate(styleToggle(styles.hideControls), this.fallback, init)
    },
  },
}

const timelineOptions: OptionRecord = {
  粘性侧栏: {
    fallback: false,
    callback(init) {
      return initUpdate(styleToggle(styles.stickyAside), this.fallback, init)
    },
  },
}

// 应用页面选项并监听变化
export default function listenOptions(options: OptionRecord) {
  for (const [name, option] of Object.entries(options)) {
    // @ts-expect-error idk how to fix this, but it works
    GM_addValueChangeListener(name, option.callback(GM_getValue(name)))
  }
}

const optionsFlat: OptionRecord = { ...commonOptions, ...videoOptions, ...timelineOptions }

// 页面加载完成后插入设置选项
waitReady().then(() => {
  const app = document.createElement('div')
  app.id = 'wider-bilibili'
  app.popover = 'auto'
  app.innerHTML = html
  document.body.insertAdjacentElement('beforeend', app)

  // 调出设置选项
  GM_registerMenuCommand('选项', () => { app.showPopover() })

  const modifiers = <const>['ctrlKey', 'altKey', 'shiftKey', 'metaKey']
  type Modifier = typeof modifiers[number]
  const comb = <[Modifier[], string]>[['altKey', 'shiftKey'], 'W']

  ;(function addListener() {
    document.addEventListener('keydown', ev => {
      const { key } = ev
      if (key === comb[1] && modifiers.every(mod => comb[0].includes(mod) === ev[mod])) {
        ev.stopImmediatePropagation()
        ev.stopPropagation()
        app.togglePopover()
      }
      setTimeout(addListener, 250)
    }, { once: true })
  })()

  for (const [name, option] of Object.entries(optionsFlat)) {
    const init = GM_getValue<unknown>(name)
    const input = document.querySelector<HTMLInputElement>(`label[data-option=${name}]>input`)
    switch (input?.type) {
      case 'checkbox':
        input.checked = <boolean>(init ?? option.fallback)
        input.onchange = () => GM_setValue(name, input.checked)
        input.parentElement!.oncontextmenu = e => { // 右键重置默认
          e.preventDefault()
          input.checked = <boolean>option.fallback
          GM_deleteValue(name)
        }
        break
      case 'number':
        input.value = String(<number>(init ?? option.fallback))
        input.oninput = () => {
          if (!input.value) { // 删除以恢复默认值
            input.value = String(<number>option.fallback)
            return GM_deleteValue(name)
          }
          const val = Number(input.value)
          if (Number.isInteger(val))
            GM_setValue(name, val)
        }
        input.parentElement!.oncontextmenu = e => { // 右键重置默认
          e.preventDefault()
          input.value = String(<number>option.fallback)
          GM_deleteValue(name)
        }
        break
    }
  }
  listenOptions(commonOptions)
}).catch(console.error)

export { videoOptions, timelineOptions }
