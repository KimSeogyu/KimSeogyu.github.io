
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import postsData from '../src/data/posts.json'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BASE_URL = 'https://seogyukim.com' // Replace with actual domain
const OUTPUT_FILE = path.join(__dirname, '../public/sitemap.xml')

const staticRoutes = [
  '/',
  '/blog',
]

function generateSitemap() {
  const routes = [...staticRoutes]

  // Add blog posts
  postsData.forEach((post) => {
    routes.push(`/blog/${post.slug}`)
  })

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${routes
    .map((route) => {
      return `
  <url>
    <loc>${BASE_URL}${route}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${route === '/' ? 'daily' : 'weekly'}</changefreq>
    <priority>${route === '/' ? '1.0' : '0.8'}</priority>
  </url>`
    })
    .join('')}
</urlset>`

  fs.writeFileSync(OUTPUT_FILE, sitemap)
  console.log(`✅ Sitemap generated at ${OUTPUT_FILE}`)
}

generateSitemap()
