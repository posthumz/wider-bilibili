import { defineConfig, Plugin } from 'vite'
import monkey from 'vite-plugin-monkey'
import { globSync as glob } from 'glob'
import fs from 'node:fs'
import path from 'node:path'

// OK but I really don't want the boilerplate in the distribution code 😭
const cleanBuild: Plugin = {
  name: 'clean-build',
  apply: 'build',
  load(id) {
    const relative = path.relative(__dirname, id)
    // load css statically instead of globbing at runtime
    if (relative === 'src\\styles.ts') {
      const styles = glob('src/styles/**/*.css')
      const entries = styles.map(style => [path.basename(style).slice(0, -4), fs.readFileSync(style, 'utf-8')])
      return `export default {${entries.map(([key, style]) => `${key}:\`${style}\`,`).join('\n')}}`
    }
  },
  /** removes the _GM_* aliases */
  transform(code, id) {
    const relative = path.relative(__dirname, id)
    if (relative.endsWith('options.html?raw')) {
      const content = fs.readFileSync(id.replace('?raw', ''), 'utf-8')
      return `export default \`${content}\``
    }
    if (path.matchesGlob(relative, 'src/*.ts'))
      return code.replace(/import \{.*?\} from "\$";?\n/s, '')
  },
}

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    server: { port: 2233 },
    build: {
      outDir: 'dist',
      target: 'es2020',
      cssMinify: false,
    },
    css: {
      preprocessorOptions: {
      },
    },
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
          supportURL: 'https://github.com/posthumz/wider-bilibili/issues',
          $extra: [
            ['compatible', 'firefox 117+'],
            ['compatible', 'chrome 120+'],
            ['compatible', 'edge 120+'],
            // ['downloadURL', 'https://update.greasyfork.org/scripts/474507/Wider%20Bilibili.user.js'],
            // ['updateURL', 'https://update.greasyfork.org/scripts/474507/Wider%20Bilibili.meta.js'],
          ],
          'run-at': 'document-start',
          noframes: true,
        },
      }),
      cleanBuild,
    ],
  }
})
