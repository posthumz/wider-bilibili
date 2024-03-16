const glob = import.meta.glob(['./styles/**/*.css'], { eager: true, query: '?raw' }) as Record<string, { default: string }>
const nameMatch = /.*\/(.*)\.css$/
const entries = Object.entries(glob)
const mapped = entries.map(([key, value]) => [nameMatch.exec(key)?.[1], value.default])
const styles = Object.fromEntries(mapped)

export default styles
