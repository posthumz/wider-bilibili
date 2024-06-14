import { defineConfig, Plugin } from 'vite'
import monkey from 'vite-plugin-monkey'
import { globSync as glob } from 'glob'

import fs from 'node:fs'
import path from 'node:path'

// OK but I really don't want the boilerplate in the distribution code 😭
function custom({
  styles = ['src/styles/**/*.css'],
  scripts = ['src/*.ts'],
  transformer = (code: string) => code.replace(/import \{.*?\} from "\$";?\n/s, ''),
} = {}): Plugin {
  styles = glob(styles)
  scripts = glob(scripts)
  return {
    name: 'custom',
    load(id) {
      const relative = path.relative(__dirname, id)
      // load css statically instead of globbing at runtime
      if (relative === 'src\\styles.ts') {
        const entries = styles.map(style => [path.basename(style).slice(0, -4), fs.readFileSync(style, 'utf-8')])
        return `export default {${entries.map(([key, style]) => `${key}:\`${style}\`,`).join('\n')}}`
      }
    },
    /** removes the _GM_* aliases */
    transform(code, id) {
      if (scripts.includes(path.relative(__dirname, id))) {
        return { code: transformer(code) }
      }
    },
  }
}

// Load with multiline string, i.e. backticks. Escape characters are not handled for now
const multiline: Plugin = {
  name: 'multiline',
  transform(code, id) {
    const relative = path.relative(__dirname, id)
    if (relative.endsWith('?multiline'))
      return `export default \`${code}\``
  },
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const production = mode === 'production'
  return {
    server: { port: 2233 },
    build: { outDir: 'dist', target: 'es2020' },
    plugins: [
      monkey({
        entry: 'src/main.ts',
        userscript: {
          name: 'Wider Bilibili',
          namespace: 'https://greasyfork.org/users/1125570',
          author: 'posthumz',
          description: '哔哩哔哩宽屏体验',
          license: 'MIT',
          icon: 'https://www.bilibili.com/favicon.ico',
          match: ['http*://*.bilibili.com/*'],
          exclude: [
            'http*://www.bilibili.com/correspond/*',
            'http*://message.bilibili.com/pages/nav/*_sync',
          ],
          'run-at': 'document-start',
        },
      }),
      multiline,
      production ? custom() : undefined,
    ],
  }
})
