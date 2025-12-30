import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  plugins: [
    devtools(),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart({
      // Static site generation for GitHub Pages
      prerender: {
        enabled: true,
        // GitHub Pages uses /page/index.html structure
        autoSubfolderIndex: true,
        // Discover and prerender all static routes
        autoStaticPathsDiscovery: true,
        // Crawl links to discover all blog posts
        crawlLinks: true,
        // Don't fail on errors (for development)
        failOnError: false,
        onSuccess: ({ page }) => {
          console.log(`✅ Rendered: ${page.path}`)
        },
      },
    }),
    viteReact(),
  ],
  build: {
    // Output to docs folder for GitHub Pages
    outDir: 'docs',
  },
})

export default config
