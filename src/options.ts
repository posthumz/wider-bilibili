import {
  GM_addStyle,
  GM_setValue,
  GM_getValue,
  GM_deleteValue,
  GM_addValueChangeListener,
  GM_registerMenuCommand,
} from '$'
import styles from './styles'
import { waitReady } from './utils'
import html from './pages/options.html?raw'

type ValueChangeListener<T> = Parameters<typeof GM_addValueChangeListener<T>>[1]
type ValueChangeCallback<T> = (init?: T) => ValueChangeListener<T>
type Update<T> = (newVal: T) => void

interface Option<T> {
  fallback: T
  callback: ValueChangeCallback<T>
}

type OptionRecord = Record<string, Option<boolean> | Option<number>>

function styleToggle(s: string, flip = false): Update<boolean> {
  const style = GM_addStyle(s)
  return flip
    ? (enable: boolean) => { style.disabled = enable }
    : (enable: boolean) => { style.disabled = !enable }
}

/**
 * @argument update   选项更新处理函数
 * @argument fallback 选项默认值
 * @description 初始化Update类型选项，并创建相应的ValueChangeListener
 */
function initUpdate<T>(update: Update<T>, init: T | undefined, fallback: T): ValueChangeListener<T> {
  update(init ?? fallback)
  return (_k: string, _o?: T, newVal?: T) => update(newVal ?? fallback)
}

const commonOptions: OptionRecord = {
  左右边距: {
    fallback: 30,
    callback(init?: number): ValueChangeListener<number> {
      return initUpdate(val => document.documentElement.style.setProperty('--layout-padding', `${val}px`), init, this.fallback)
    },
  },
}

const videoOptions: OptionRecord = {
  导航栏下置: {
    fallback: true,
    callback(init?: boolean) {
      return initUpdate(styleToggle(styles.upperNavigation, true), init, this.fallback)
    },
  },
  显示标题栏: {
    fallback: false,
    callback(init?: boolean) {
      return initUpdate(styleToggle(styles.reserveTitleBar), init, this.fallback)
    },
  },
  自动高度: { // 也就是说，不会有上下黑边
    fallback: true,
    callback(init?: boolean) {
      const container = document.getElementsByClassName('bpx-player-container')[0]! as HTMLElement
      document.documentElement.style.setProperty('--player-height', `${container.clientHeight}px`)
      const observer = new ResizeObserver(entries => {
        if (container.dataset.screen === 'mini') return
        const { height } = entries[0]!.contentRect
        if (height && Math.round(height) <= window.innerHeight)
          document.documentElement.style.setProperty('--player-height', `${height}px`)
      })
      observer.observe(container)
      return initUpdate(styleToggle(styles.fixHeight, true), init, this.fallback)
    },
  },
  小窗样式: {
    fallback: true,
    callback(init?: boolean) {
      const toggle1 = styleToggle(styles.mini)
      const toggle2 = styleToggle('.bpx-player-container{--mini-width:initial}', true)
      return initUpdate(enable => (toggle1(enable), toggle2(enable)), init, this.fallback)
    },
  },
  粘性导航栏: {
    fallback: true,
    callback(init?: boolean) {
      return initUpdate(styleToggle(styles.stickyHeader), init, this.fallback)
    },
  },
  紧凑控件间距: {
    fallback: true,
    callback(init?: boolean) {
      return initUpdate(styleToggle(styles.compactControls), init, this.fallback)
    },
  },
  暂停显示控件: {
    fallback: false,
    callback(init?: boolean) {
      return initUpdate(styleToggle(styles.pauseShowControls), init, this.fallback)
    },
  },
  显示观看信息: {
    fallback: true,
    callback(init?: boolean) {
      return initUpdate(styleToggle('.bpx-player-video-info{display:flex!important)}'), init, this.fallback)
    },
  },
  隐藏控件: {
    fallback: true,
    callback(init?: boolean) {
      return initUpdate(styleToggle(styles.hideControls), init, this.fallback)
    },
  },
}

const timelineOptions: OptionRecord = {
  粘性侧栏: {
    fallback: false,
    callback(init?: boolean) {
      return initUpdate(styleToggle(styles.stickyAside), init, this.fallback)
    },
  },
}

// 应用页面选项并监听变化
export default function listenOptions(options: OptionRecord): void {
  for (const [name, option] of Object.entries(options)) {
    // @ts-expect-error idk how to fix this, but it works
    GM_addValueChangeListener(name, option.callback(GM_getValue(name)))
  }
}

const optionsFlat: OptionRecord = { ...commonOptions, ...videoOptions, ...timelineOptions }

// 页面加载完成后插入设置选项
waitReady().then(() => {
  document.body.insertAdjacentHTML('beforeend', html)
  const app = document.getElementById('wider-bilibili')!

  // 调出设置选项
  GM_registerMenuCommand('选项', () => { app.style.display = 'flex' })

  const modifiers = ['ctrlKey', 'altKey', 'shiftKey', 'metaKey'] as const
  const comb = [['altKey', 'shiftKey'], 'W'] as [typeof modifiers[number][], string]

  (function addListener() {
    document.addEventListener('keydown', ev => {
      const { key } = ev
      if (key === comb[1] && modifiers.every(mod => comb[0].includes(mod) === ev[mod])) {
        ev.stopImmediatePropagation()
        ev.stopPropagation()
        app.showPopover()
      }
      setTimeout(addListener, 250)
    }, { once: true })
  })()

  for (const [name, option] of Object.entries(optionsFlat)) {
    const init: unknown = GM_getValue(name)
    const input = document.querySelector<HTMLInputElement>(`label[data-option=${name}]>input`)
    switch (input?.type) {
      case 'checkbox':
        input.checked = (init as boolean ?? option.fallback)
        input.onchange = () => GM_setValue(name, input.checked)
        // 右键重置默认
        input.oncontextmenu = e => {
          e.preventDefault()
          input.checked = option.fallback as boolean
          GM_deleteValue(name)
        }
        break
      case 'number':
        input.value = (init as number ?? option.fallback) as unknown as string
        input.oninput = () => {
          if (!input.value) {
            input.value = option.fallback as unknown as string
            return GM_deleteValue(name)
          }
          const val = Number(input.value)
          if (Number.isInteger(val))
            GM_setValue(name, val)
        }
        break
    }
  }
  listenOptions(commonOptions)
}).catch(console.error)

export { videoOptions, timelineOptions }
