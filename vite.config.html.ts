import { defineConfig } from 'vite'
import fs from 'node:fs'

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
  plugins: [
    {
      name: 'html-transform',
      transformIndexHtml: (html, ctx) => {
        return ctx.path === '/index.html'
          ? html.replace(/<body>.*<\/body>/s, `<body>
  ${fs.readFileSync('src/pages/options.html', 'utf-8').replace(/^/mg, '  ')}
  </body>`)
          : html
      },
      handleHotUpdate: ({ file, server }) => {
        if (file === 'src\\pages\\options.html')
          server.hot.send({ type: 'full-reload' })
      },
    },
  ],
})
