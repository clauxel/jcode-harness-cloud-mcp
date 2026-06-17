const assetHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname === '/api/runtime') {
      return json({ ok: true, service: 'hotword-pages', host: url.hostname })
    }
    return env.ASSETS.fetch(request)
  },
}

function json(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { ...assetHeaders, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}
