// Gera public/sitemap.xml a partir de src/app/blog/blog.data.json (fonte única).
// Roda antes do `ng build` (ver package.json) para manter o sitemap sempre em dia.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE_URL = 'https://ejbwebsites.online';
const HREFLANG = { pt: 'pt-BR', en: 'en', es: 'es' };

const posts = JSON.parse(readFileSync(join(root, 'src/app/blog/blog.data.json'), 'utf-8'));
const today = new Date().toISOString().slice(0, 10);

// Agrupa as versões de idioma de cada artigo (para os links hreflang).
const groups = {};
for (const p of posts) (groups[p.group] ??= []).push(p);

function alternates(siblings) {
  const links = siblings.map(
    s => `    <xhtml:link rel="alternate" hreflang="${HREFLANG[s.lang] ?? s.lang}" href="${SITE_URL}/blog/${s.slug}"/>`
  );
  const def = siblings.find(s => s.lang === 'pt') ?? siblings[0];
  links.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}/blog/${def.slug}"/>`);
  return links.join('\n');
}

const urls = [];

urls.push(`  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="pt-BR" href="${SITE_URL}/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}/"/>
  </url>`);

urls.push(`  <url>
    <loc>${SITE_URL}/blog</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`);

for (const p of posts) {
  urls.push(`  <url>
    <loc>${SITE_URL}/blog/${p.slug}</loc>
    <lastmod>${p.updated ?? p.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
${alternates(groups[p.group])}
  </url>`);
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;

writeFileSync(join(root, 'public/sitemap.xml'), xml, 'utf-8');
console.log(`sitemap.xml gerado: ${urls.length} URLs (home + /blog + ${posts.length} artigos).`);
