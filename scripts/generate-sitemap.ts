
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import postsData from '../src/data/posts.json'
// @ts-ignore
import { siteConfig } from '../src/config/site'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BASE_URL = siteConfig.url
const OUTPUT_FILE = path.join(__dirname, '../public/sitemap.xml')

const staticRoutes = [
  '/ko',
  '/ko/resume',
  '/ko/blog',
  '/ko/blog/tags',
  '/ko/blog/series',
  '/en/resume',
]

function generateSitemap() {
  const routes = [...staticRoutes]

  // Add blog posts
  postsData.forEach((post) => {
    if (!post.private) {
      routes.push(`/ko/blog/${post.slug}`)
    }
  })

  // Filter unique routes just in case
  const uniqueRoutes = [...new Set(routes)]

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${uniqueRoutes
    .map((route) => {
      // Priority Logic
      let priority = '0.8'
      if (route === '/ko') priority = '1.0'
      if (route.includes('/resume')) priority = '0.9'
      
      return `
  <url>
    <loc>${BASE_URL}${route}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${route === '/ko' ? 'daily' : 'weekly'}</changefreq>
    <priority>${priority}</priority>
  </url>`
    })
    .join('')}
</urlset>`

  fs.writeFileSync(OUTPUT_FILE, sitemap)
  console.log(`✅ Sitemap generated at ${OUTPUT_FILE} (${uniqueRoutes.length} urls)`)
}

generateSitemap()
