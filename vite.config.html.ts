import { defineConfig, Plugin } from 'vite'
import fs from 'node:fs'

const htmlTransform: Plugin = {
  name: 'html-transform',
  transformIndexHtml: (html, ctx) => {
    if (ctx.path === '/index.html') {
      return html.replace(/<div id="wider-bilibili" popover>.*<\/div>/s, `<div id="wider-bilibili" popover>
${fs.readFileSync('src/pages/options.html', 'utf-8')}
</div>`)
    }
  },
}

export default defineConfig({
  server: { port: 2333 },
  root: 'src/pages',
  build: {
    outDir: '../../dist',
    emptyOutDir: false,
    rollupOptions: {
      output: { entryFileNames: '[name].js', assetFileNames: '[name].[ext]' },
    },
  },
  plugins: [htmlTransform],
})
