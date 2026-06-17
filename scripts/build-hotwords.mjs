import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const config = JSON.parse(await readFile(path.join(root, 'site.hotwords.json'), 'utf8'))
const out = path.join(root, 'public-hotwords')

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function pageUrl(slug = '') {
  return 'https://' + config.domain + (slug ? '/' + slug.replace(/^\/+|\/+$/g, '') + '/' : '/')
}

function layout({ title, description, slug = '', body, robots = 'index,follow' }) {
  const canonical = pageUrl(slug)
  const nav = config.pages.map((page) => '<a href="/' + page.slug + '/">' + escapeHtml(page.short || page.title) + '</a>').join('')
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + escapeHtml(title) + '</title><meta name="description" content="' + escapeHtml(description) + '">' +
    '<meta name="robots" content="' + robots + '"><link rel="canonical" href="' + canonical + '">' +
    '<meta property="og:type" content="website"><meta property="og:title" content="' + escapeHtml(title) + '">' +
    '<meta property="og:description" content="' + escapeHtml(description) + '"><meta property="og:url" content="' + canonical + '">' +
    '<script type="application/ld+json">' + JSON.stringify(schema(title, description, canonical)) + '</script>' +
    '<style>' + css() + '</style></head><body><header class="top"><div class="wrap nav"><a class="brand" href="/">' + escapeHtml(config.brand) + '</a><nav>' + nav + '<a href="/pricing/">Pricing</a></nav></div></header>' +
    body + '<footer><div class="wrap"><strong>' + escapeHtml(config.brand) + '</strong><span>Independent hosted workflow. Global service. Support: support@aigeamy.com.</span><a href="/sitemap.xml">Sitemap</a><a href="/llms.txt">llms.txt</a></div></footer></body></html>'
}

function schema(title, description, url) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: config.brand,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    url,
    description,
    offers: [
      { '@type': 'Offer', name: 'Operator', price: '19', priceCurrency: 'USD', url: pageUrl('pricing') },
      { '@type': 'Offer', name: 'Team', price: '49', priceCurrency: 'USD', url: pageUrl('pricing') },
      { '@type': 'Offer', name: 'Scale', price: '99', priceCurrency: 'USD', url: pageUrl('pricing') },
    ],
    provider: { '@type': 'Organization', name: 'Clauxel', email: 'support@aigeamy.com' },
  }
}

function css() {
  return ':root{color-scheme:light;--ink:#172033;--muted:#5d6b82;--bg:#f6f8fb;--panel:#fff;--line:#d9e1ec;--blue:#1d4ed8;--green:#0f766e;--gold:#b7791f}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;line-height:1.6}a{color:inherit}.wrap{width:min(1120px,calc(100% - 32px));margin:0 auto}.top{border-bottom:1px solid var(--line);background:#fff}.nav{min-height:62px;display:flex;align-items:center;justify-content:space-between;gap:18px}.brand{font-weight:900;text-decoration:none}.nav nav{display:flex;gap:14px;flex-wrap:wrap}.nav a{text-decoration:none;color:var(--muted);font-weight:750;font-size:14px}.hero{padding:44px 0 24px}.hero-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,430px);gap:24px;align-items:start}.eyebrow{margin:0 0 8px;color:var(--green);font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.08em}h1{margin:0 0 14px;font-size:clamp(34px,5vw,56px);line-height:1.05;letter-spacing:0}h2{margin:0 0 10px;font-size:28px;line-height:1.15}h3{margin:0 0 8px}.lead{font-size:18px;color:#344054;margin:0 0 18px}.actions{display:flex;gap:10px;flex-wrap:wrap}.button{display:inline-flex;min-height:42px;align-items:center;justify-content:center;border:1px solid var(--line);border-radius:8px;background:#fff;padding:0 14px;text-decoration:none;font-weight:850}.button.primary{background:var(--blue);border-color:var(--blue);color:#fff}.panel,.card{background:#fff;border:1px solid var(--line);border-radius:8px;box-shadow:0 10px 24px rgba(15,23,42,.06)}.panel{padding:18px}.metric{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}.metric div{border:1px solid var(--line);border-radius:8px;padding:12px}.metric strong{display:block;font-size:22px}.metric span,.card p,footer span{color:var(--muted)}.section{padding:30px 0;border-top:1px solid var(--line)}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.card{padding:18px}.steps{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.step{background:#fff;border:1px solid var(--line);border-radius:8px;padding:15px}.price{font-size:34px;font-weight:900}.price small{font-size:14px;color:var(--muted)}footer{padding:26px 0;border-top:1px solid var(--line);color:var(--muted)}footer .wrap{display:flex;gap:14px;flex-wrap:wrap;align-items:center}@media(max-width:840px){.hero-grid,.grid,.steps{grid-template-columns:1fr}.nav{align-items:flex-start;flex-direction:column;padding:12px 0}.metric{grid-template-columns:1fr}}'
}

function homeHtml() {
  const links = config.pages.map((page) => '<article class="card"><h3><a href="/' + page.slug + '/">' + escapeHtml(page.title) + '</a></h3><p>' + escapeHtml(page.summary) + '</p></article>').join('')
  return layout({
    title: config.brand + ' | ' + config.tagline,
    description: config.description,
    body: '<main><section class="hero"><div class="wrap hero-grid"><div><p class="eyebrow">Hosted workflow</p><h1>' + escapeHtml(config.tagline) + '</h1><p class="lead">' + escapeHtml(config.description) + '</p><div class="actions"><a class="button primary" href="/pricing/">View pricing</a><a class="button" href="/' + config.pages[0].slug + '/">Open workflow guide</a></div></div><aside class="panel"><h2>What teams get</h2><p>' + escapeHtml(config.audience) + ' can use this as a focused review surface before rollout.</p><div class="metric"><div><strong>Input</strong><span>Endpoint, prompt, repo, server card, or memory context</span></div><div><strong>Review</strong><span>Structured checklist and risk evidence</span></div><div><strong>Output</strong><span>Decision-ready summary</span></div><div><strong>Next</strong><span>Checkout or implementation plan</span></div></div></aside></div></section><section class="section"><div class="wrap"><h2>Intent pages</h2><div class="grid">' + links + '</div></div></section></main>',
  })
}

function intentHtml(page) {
  return layout({
    title: page.title + ' | ' + config.brand,
    description: page.summary,
    slug: page.slug,
    body: '<main><section class="hero"><div class="wrap hero-grid"><div><p class="eyebrow">' + escapeHtml(config.brand) + '</p><h1>' + escapeHtml(page.title) + '</h1><p class="lead">' + escapeHtml(page.summary) + '</p><div class="actions"><a class="button primary" href="/pricing/?intent=' + page.slug + '">View pricing</a><a class="button" href="/llms.txt">Read AI summary</a></div></div><aside class="panel"><h2>Workflow fit</h2><p>' + escapeHtml(config.audience) + ' use this page to map the intent into a practical implementation path.</p><div class="metric"><div><strong>1</strong><span>Scope the system or endpoint</span></div><div><strong>2</strong><span>Check trust and data boundaries</span></div><div><strong>3</strong><span>Create a review artifact</span></div><div><strong>4</strong><span>Route next action to owner</span></div></div></aside></div></section><section class="section"><div class="wrap"><h2>How the review works</h2><div class="steps"><div class="step"><strong>Collect</strong><p>Gather the endpoint, repo notes, server card, prompts, memory files, or run context needed for review.</p></div><div class="step"><strong>Normalize</strong><p>Turn unstructured inputs into a consistent checklist that humans and agents can compare.</p></div><div class="step"><strong>Assess</strong><p>Flag trust, safety, retention, permission, or execution risks before rollout.</p></div><div class="step"><strong>Record</strong><p>Keep a decision summary with evidence, owner, status, and follow-up action.</p></div></div></div></section><section class="section"><div class="wrap"><h2>Useful for</h2><div class="grid"><article class="card"><h3>Launch review</h3><p>Before publishing a server, tool, agent workflow, or memory policy.</p></article><article class="card"><h3>Buyer evidence</h3><p>When a customer needs a concise trust or security review.</p></article><article class="card"><h3>Agent operations</h3><p>When automated runs need machine-readable evidence and human-readable summaries.</p></article></div></div></section></main>',
  })
}

function pricingHtml() {
  const plans = [
    ['Operator', '19', 'One workflow owner reviewing a small number of endpoints or agent runs.'],
    ['Team', '49', 'Teams that need repeatable review, evidence, and decision records.'],
    ['Scale', '99', 'Larger portfolios that need stronger coverage and operating rhythm.'],
  ]
  const cards = plans.map(([name, price, text]) => '<article class="card"><h3>' + name + '</h3><div class="price">$' + price + ' <small>/mo</small></div><p>' + text + '</p><a class="button' + (name === 'Team' ? ' primary' : '') + '" href="/checkout/?plan=' + name.toLowerCase() + '&billing=monthly">Checkout ' + name + '</a></article>').join('')
  return layout({
    title: 'Pricing | ' + config.brand,
    description: 'Pricing for ' + config.brand + ' hosted workflow review.',
    slug: 'pricing',
    body: '<main><section class="hero"><div class="wrap"><p class="eyebrow">Pricing</p><h1>Choose a plan for repeatable workflow review.</h1><p class="lead">Monthly USD pricing. Annual billing can be arranged from checkout or support.</p><div class="grid">' + cards + '</div></div></section></main>',
  })
}

function simplePage(slug, title, text, robots = 'index,follow') {
  return layout({
    title: title + ' | ' + config.brand,
    description: text,
    slug,
    robots,
    body: '<main><section class="hero"><div class="wrap"><p class="eyebrow">' + escapeHtml(config.brand) + '</p><h1>' + escapeHtml(title) + '</h1><p class="lead">' + escapeHtml(text) + '</p><div class="actions"><a class="button primary" href="/pricing/">View pricing</a><a class="button" href="/">Return home</a></div></div></section></main>',
  })
}

async function write(rel, content) {
  const file = path.join(out, rel)
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, content, 'utf8')
}

async function copyIfExists(source, target) {
  const file = path.join(root, source)
  if (!existsSync(file)) return false
  await write(target, await readFile(file, 'utf8'))
  return true
}

await rm(out, { recursive: true, force: true })
await mkdir(out, { recursive: true })
config.pages = config.pages.map((page) => ({ slug: page[0], title: page[1], summary: page[2], short: page[1].replace(/^MCP |^AI |^OpenAI /, '') }))

await write('index.html', homeHtml())
for (const page of config.pages) await write(page.slug + '/index.html', intentHtml(page))
await write('pricing/index.html', pricingHtml())
await write('checkout/index.html', simplePage('checkout', 'Checkout', 'Start checkout for the selected plan. Hosted payment opens from the production payment flow when configured.', 'noindex,follow'))
await write('success/index.html', simplePage('success', 'Payment return', 'Payment return page for order confirmation and support follow-up.', 'noindex,follow'))
await write('privacy/index.html', simplePage('privacy', 'Privacy Policy', 'We process submitted workflow context only to provide review, support, security, and service operations. Do not submit secrets or unnecessary personal data.'))
await write('terms/index.html', simplePage('terms', 'Terms of Service', 'Use this service for workflow review and operational evidence. Outputs support human decisions and do not guarantee rankings, uptime, security, or business outcomes.'))

await copyIfExists('server.json', '.well-known/mcp/server-card.json')
await copyIfExists('server-card.json', '.well-known/mcp/server-card.json')

const urls = ['', 'pricing', 'privacy', 'terms', ...config.pages.map((page) => page.slug)]
await write('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + urls.map((slug) => '<url><loc>' + pageUrl(slug) + '</loc><changefreq>weekly</changefreq><priority>' + (slug ? '0.8' : '1.0') + '</priority></url>').join('') + '</urlset>\n')
await write('robots.txt', 'User-agent: *\nAllow: /\nSitemap: https://' + config.domain + '/sitemap.xml\n')
await write('llms.txt', '# ' + config.brand + '\n\n' + config.description + '\n\nCanonical: https://' + config.domain + '/\nAudience: ' + config.audience + '\n\nKey pages:\n' + urls.map((slug) => '- ' + pageUrl(slug)).join('\n') + '\n')

console.log('Built hotword assets for ' + config.domain + ' -> ' + out)
