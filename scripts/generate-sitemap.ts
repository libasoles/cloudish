import { writeFileSync } from 'node:fs'
import { TUTORIALS } from '../src/docs/tutorial-registry'

const SITE_URL = 'https://cloudish.com.ar'
const LAST_MODIFIED = new Date().toISOString().slice(0, 10)

type SitemapEntry = {
  path: string
  changefreq: 'weekly' | 'monthly'
  priority: string
}

const entries: SitemapEntry[] = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  ...TUTORIALS.map((tutorial) => ({
    path: `/docs/${tutorial.id}`,
    changefreq: 'monthly' as const,
    priority: '0.7',
  })),
]

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) => `  <url>
    <loc>${SITE_URL}${entry.path}</loc>
    <lastmod>${LAST_MODIFIED}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`

const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`

writeFileSync('public/sitemap.xml', sitemap)
writeFileSync('public/robots.txt', robots)

console.log(`Generated sitemap with ${entries.length} URLs`)
