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
  page: string
  /** default, using d because `default` is a reserved word */
  d: T
  callback: (init: T, elem?: HTMLElement) => ValueChangeListener
}

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

type Page = 'common' | 'video'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const options: Record<Page, Record<string, Option<any>>> = {
  common: {
    左右边距: {
      page: 'common',
      d: 30,
      callback: init => {
        document.documentElement.style.setProperty('--layout-padding', `${init}px`)
        return (_k, _o, newVal) => document.documentElement.style.setProperty('--layout-padding', `${newVal}px`)
      },
    },
  },
  video: {
    导航栏下置: {
      page: 'video',
      d: true,
      callback: init => onStyleValueChange(styleToggle(styles.upperNavigation, init, true)),
    },
    显示观看信息: {
      page: 'video',
      d: true,
      callback: init => onStyleValueChange(styleToggle('.bpx-player-video-info{display:flex!important}', init)),
    },
    小窗样式: {
      page: 'video',
      d: true,
      callback: init => {
        const toggle1 = styleToggle(styles.mini, init)
        const toggle2 = styleToggle('.bpx-player-container { --mini-width: initial !important }', init, true)
        return onStyleValueChange(enable => (toggle1(enable), toggle2(enable)))
      },
    },
    // 小窗宽度: {
    //   page: 'video',
    //   d: 320,
    //   callback: init => {
    //     // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    //     const container = document.getElementsByClassName('bpx-player-container')[0]! as HTMLElement
    //     container.style.setProperty('--mini-width', `${init}px`)
    //     return (_k, _o, newVal) => container.style.setProperty('--mini-width', `${newVal}px`)
    //   },
    // },
    自动高度: { // 也就是说，不会有上下黑边
      page: 'video',
      d: false,
      callback: init => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const player = document.getElementById('bilibili-player')!
        const observer = new ResizeObserver(entries => {
          const height = entries[0]?.contentRect.height
          if (height) { document.documentElement.style.setProperty('--player-height', `${height}px`) }
        })
        const toggle = styleToggle(styles.autoHeight, init)
        init && observer.observe(player)
        return onStyleValueChange(enable => {
          toggle(enable)
          enable
            ? observer.observe(player)
            : observer.disconnect(), document.documentElement.style.removeProperty('--player-height')
        })
      },
    },
    调节控件间距: {
      page: 'video',
      d: true,
      callback: init => onStyleValueChange(styleToggle(styles.controls, init)),
    },
    暂停显示控件: {
      page: 'video',
      d: false,
      callback: init => onStyleValueChange(styleToggle(styles.pauseShow, init)),
    },
  },
}

// 应用页面选项并监听变化
export default function activate(page: Page) {
  for (const [name, { d, callback }] of Object.entries(options[page])) {
    GM_addValueChangeListener(name, callback(GM_getValue(name, d)))
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const optionsFlat: Record<string, Option<any>> = { ...options.common, ...options.video }

// 页面加载完成后插入设置选项
waitReady().then(() => {
  document.body.insertAdjacentHTML('beforeend', html)
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const app = document.getElementById('wider-bilibili')!

  // 调出设置选项
  GM_registerMenuCommand('选项', () => { app.style.display = 'flex' })
  // 关闭设置选项
  document.getElementById('wb-close')?.addEventListener('click', () => { app.style.display = 'none' })

  for (const input of app.getElementsByTagName('input')) {
    const key = input.parentElement?.textContent
    if (!key) { continue }
    const option = optionsFlat[key]
    if (!option) { continue }
    switch (input.type) {
      case 'checkbox':
        input.checked = GM_getValue(key, option.d)
        input.onchange = () => GM_setValue(key, input.checked)
        break
      case 'number':
        input.value = GM_getValue(key, option.d)
        input.oninput = () => {
          const val = Number(input.value)
          Number.isInteger(val) && GM_setValue(key, val)
        }
        break
    }
  }

  const modifiers = ['ctrlKey', 'altKey', 'shiftKey', 'metaKey'] as const
  const comb = [['altKey', 'shiftKey'], 'W'] as [typeof modifiers[number][], string]

  document.addEventListener('keyup', ev => {
    const { key } = ev
    if (key === comb[1] && modifiers.every(mod => comb[0].includes(mod) === ev[mod])) {
      ev.stopImmediatePropagation()
      ev.stopPropagation()
      app.style.display = app.style.display === 'none' ? 'flex' : 'none'
    }
  })
  activate('common')
})
