import { defineConfig, Plugin } from 'vite'
import fs from 'node:fs'

const htmlTransform: Plugin = {
  name: 'html-transform',
  transformIndexHtml: (html, ctx) => {
    if (ctx.path === '/index.html') {
      return html.replace(/<body>.*<\/body>/s, `<body>
${fs.readFileSync('src/pages/options.html', 'utf-8').replace(/^/mg, '  ')}
</body>`)
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
