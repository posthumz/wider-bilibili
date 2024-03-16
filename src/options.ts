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

interface Option<T> {
  page: string
  /** default, using d because `default` is a reserved word */
  d: T
  callback: (init: T) => ValueChangeListener
}

function toggleStyle(s: string, init = true, flip = false) {
  if (flip) { init = !init }
  const style = GM_addStyle(s)
  if (!init) { style.disabled = true }
  return flip
    ? (enable: boolean) => { style.disabled = enable }
    : (enable: boolean) => { style.disabled = !enable }
}
function onStyleValueChange(toggle: ReturnType<typeof toggleStyle>): ValueChangeListener {
  return (_k, _o, init) => toggle(init as boolean)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const options: Record<string, Option<any>> = {
  左右边距: {
    page: 'common',
    d: 30,
    callback: init => {
      document.body.style.setProperty('--layout-padding', `${init}px`)
      return (_k, _o, newVal) => document.body.style.setProperty('--layout-padding', `${newVal}px`)
    },
  },
  导航栏下置: {
    page: 'video',
    d: true,
    callback: init => onStyleValueChange(toggleStyle(styles.upperNavigation, init, true)),
  },
  小窗样式: {
    page: 'video',
    d: true,
    callback: init => {
      const toggle1 = toggleStyle(styles.mini, init)
      const toggle2 = toggleStyle('.bpx-player-container { --mini-width: initial !important }', init, true)
      return onStyleValueChange(enable => { toggle1(enable); toggle2(enable) })
    },
  },
  调节控件间距: {
    page: 'video',
    d: true,
    callback: init => onStyleValueChange(toggleStyle(styles.controls, init)),
  },
  暂停显示控件: {
    page: 'video',
    d: false,
    callback: init => onStyleValueChange(toggleStyle(styles.pauseShow, init)),
  },
  显示观看信息: {
    page: 'video',
    d: true,
    callback: init => onStyleValueChange(toggleStyle('.bpx-player-video-info{display:flex!important}', init)),
  },
}

// 应用页面选项并监听变化
export default function activate(targetPage: string) {
  for (const [name, { page, d, callback }] of Object.entries(options)) {
    page === targetPage && GM_addValueChangeListener(name, callback(GM_getValue(name, d)))
  }
}

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
    const option = options[key]
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
      ev.stopPropagation()
      app.style.display = app.style.display === 'none' ? 'flex' : 'none'
    }
  })
  activate('common')
})
