import {
  GM_addStyle,
  GM_setValue,
  GM_getValue,
  GM_addValueChangeListener,
  GM_registerMenuCommand,
} from '$'
import styles from './styles'
import { waitReady } from './utils'
import html from './pages/options.html?multiline'

GM_addStyle(styles.options)

type ValueChangeListener = Parameters<typeof GM_addValueChangeListener>[1]
type Toggle = (enable: boolean) => void

interface Option<T> {
  default_: T
  callback?: (init: T) => ValueChangeListener
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Options = Record<string, Option<any>>

function styleToggle(s: string, init = true, flip = false): Toggle {
  if (flip) { init = !init }
  const style = GM_addStyle(s)
  if (!init) { style.disabled = true }
  return flip
    ? (enable: boolean) => { style.disabled = enable }
    : (enable: boolean) => { style.disabled = !enable }
}

function onStyleValueChange(toggle: Toggle): ValueChangeListener {
  return (_k, _o, newVal) => toggle(newVal as boolean)
}

const commonOptions: Options = {
  左右边距: {
    default_: 30,
    callback: init => {
      document.documentElement.style.setProperty('--layout-padding', `${init}px`)
      return (_k, _o, newVal) => document.documentElement.style.setProperty('--layout-padding', `${newVal}px`)
    },
  },
}

const videoOptions: Options = {
  自动高度: { // 也就是说，不会有上下黑边
    default_: false,
    callback: init => {
      const container = document.getElementsByClassName('bpx-player-container')[0]! as HTMLDivElement
      const observer = new ResizeObserver(entries => {
        const { height } = entries[0]!.contentRect
        if (container.dataset.screen === 'mini') return
        if (height < window.innerHeight)
          document.documentElement.style.setProperty('--player-height', `${height}px`)
        else
          document.documentElement.style.removeProperty('--player-height')
      })
      const toggle = styleToggle(styles.fixHeight, init, true)
      init && observer.observe(container)
      return onStyleValueChange(enable => {
        toggle(enable)
        enable
          ? observer.observe(container)
          : observer.disconnect(), document.documentElement.style.removeProperty('--player-height')
      })
    },
  },
  小窗样式: {
    default_: true,
    callback: init => {
      const toggle1 = styleToggle(styles.mini, init)
      const toggle2 = styleToggle('.bpx-player-container{--mini-width:initial}', init, true)
      return onStyleValueChange(enable => (toggle1(enable), toggle2(enable)))
    },
  },
  导航栏下置: {
    default_: true,
    callback: init => onStyleValueChange(styleToggle(styles.upperNavigation, init, true)),
  },
  粘性导航栏: {
    default_: true,
    callback: init => onStyleValueChange(styleToggle(styles.stickyHeader, init)),
  },
  紧凑控件间距: {
    default_: true,
    callback: init => onStyleValueChange(styleToggle(styles.compactControls, init)),
  },
  暂停显示控件: {
    default_: false,
    callback: init => onStyleValueChange(styleToggle(styles.pauseShow, init)),
  },
  显示观看信息: {
    default_: true,
    callback: init => onStyleValueChange(styleToggle('.bpx-player-video-info{display:flex!important}', init)),
  },
}

// 应用页面选项并监听变化
export default function listenOptions(options: Options) {
  for (const [name, { default_, callback }] of Object.entries(options))
    callback && GM_addValueChangeListener(name, callback(GM_getValue(name, default_)))
}

const optionsFlat: Options = { ...commonOptions, ...videoOptions }

// 页面加载完成后插入设置选项
waitReady().then(() => {
  document.body.insertAdjacentHTML('beforeend', html)
  const app = document.getElementById('wider-bilibili')!

  // 调出设置选项
  GM_registerMenuCommand('选项', () => { app.style.display = 'flex' })
  // 关闭设置选项
  document.getElementById('wb-close')?.addEventListener('click', () => { app.style.display = 'none' })

  const modifiers = ['ctrlKey', 'altKey', 'shiftKey', 'metaKey'] as const
  const comb = [['altKey', 'shiftKey'], 'W'] as [typeof modifiers[number][], string]

  (function addListener() {
    document.addEventListener('keydown', ev => {
      const { key } = ev
      if (key === comb[1] && modifiers.every(mod => comb[0].includes(mod) === ev[mod])) {
        ev.stopImmediatePropagation()
        ev.stopPropagation()
        app.style.display = app.style.display === 'none' ? 'flex' : 'none'
      }
      setTimeout(addListener, 250)
    }, { once: true })
  })()

  for (const input of app.getElementsByTagName('input')) {
    const key = input.parentElement?.textContent
    if (!key) { continue }
    const option = optionsFlat[key]
    if (!option) { continue }
    switch (input.type) {
      case 'checkbox':
        input.checked = GM_getValue(key, option.default_)
        input.onchange = () => GM_setValue(key, input.checked)
        break
      case 'number':
        input.value = GM_getValue(key, option.default_)
        input.oninput = () => {
          const val = Number(input.value)
          Number.isInteger(val) && GM_setValue(key, val)
        }
        break
    }
  }

  listenOptions(commonOptions)
})

export { videoOptions }
