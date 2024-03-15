/** 等待条件满足并返回结果。检测成功后返回元素；超时停止检测。 */
export function waitFor<T>(loaded: () => T, desc = '页面加载', retry = 100, interval = 100):
Promise<NonNullable<T>> {
  return new Promise((resolve, reject) => {
    const intervalID = setInterval((res = loaded()) => {
      if (res) {
        clearInterval(intervalID)
        console.info(`${desc}已加载`)
        return resolve(res)
      }
      if (--retry === 0) {
        clearInterval(intervalID)
        return reject(new Error('页面加载超时'))
      }
      if (retry % 10 === 0) { console.debug(`${desc}等待加载`) }
    }, interval)
  })
}

/** 直接获取元素或等待元素被添加。检测成功后停止观察并返回元素。 */
export function observeFor(className: string, parent: Element): Promise<Element> {
  return new Promise(resolve => {
    const elem = parent.getElementsByClassName(className)[0]
    if (elem) { return resolve(elem) }
    new MutationObserver((mutations, observer) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element && node.classList.contains(className)) {
            observer.disconnect()
            return resolve(node)
          }
        }
      }
    }).observe(parent, { childList: true })
  })
}

/** 等待DOMContentLoaded */
export function waitReady() {
  return new Promise<void>(resolve => {
    document.readyState === 'loading'
      ? window.addEventListener('DOMContentLoaded', () => resolve(), { once: true })
      : resolve()
  })
}
