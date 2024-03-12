import { defineConfig } from 'vite'
import fs from 'node:fs'

export default defineConfig({
  server: { port: 2333 },
  root: 'src/options',
  build: {
    outDir: '../../dist',
    emptyOutDir: false,
    rollupOptions: { output: { entryFileNames: '[name].js', assetFileNames: '[name].[ext]' } },
  },
  plugins: [
    {
      name: 'html-transform',
      transformIndexHtml: (html, i) => (i.path === '/index.html'
        ? html.replace(/<body>.*<\/body>/s, `<body>
${fs.readFileSync('src/options/options.html', 'utf-8').replace(/^/mg, '  ')}
</body>`)
        : html),
      handleHotUpdate: ({ file, server }) => {
        if (file.endsWith('/options.html'))
          server.hot.send({ type: 'full-reload' })
      },
    },
  ],
})
