const glob = import.meta.glob(['./styles/*.css', './options/styles/*.css'], { eager: true, query: '?raw' }) as Record<string, { default: string }>

const regex = /styles\/(.*)\.css$/
console.log(Object.fromEntries(
  Object.entries(glob).map(([key, value]) => [regex.exec(key)?.[1], value.default]),
))
export default Object.fromEntries(
  Object.entries(glob).map(([key, value]) => [regex.exec(key)?.[1], value.default]),
)
// const styles = new Proxy<Record<string, string>>(import.meta.glob(['./styles/*.css'], { eager: true, query: '?raw' }), {
//   get: (target, key) => {
//     // @ts-expect-error: I know what I'm doing
//     return target[`./styles/${key}.css`].default
//   },
// })
