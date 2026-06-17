import {
  getNowPaymentsSettings,
  handleNowPaymentsCheckout,
  isNowPaymentsPaid,
  jsonResponse,
  verifyNowPaymentsIpnSignature,
} from './nowpayments.js'

const assetHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
}

const SITE_KEY = 'jcodeharness'
const SITE_NAME = 'JCode Harness Cloud'
const CANONICAL_ORIGIN = 'https://jcodeharness.clauxel.com'
const CANONICAL_HOSTS = new Set(['jcodeharness.clauxel.com'])
const DEFAULT_PLAN_ID = 'team'
const DEFAULT_BILLING = 'annual'
const ANNUAL_DISCOUNT_MULTIPLIER = 0.5
const CHECKOUT_PATHS = new Set(['/api/checkout', '/api/nowpayments-checkout', '/api/agent-checkout'])

const planCatalog = {
  dev: {
    id: 'dev',
    name: 'Dev',
    monthlyAmountCents: 2900,
    currency: 'USD',
    summary: 'Solo developer access for JCode Harness Cloud',
  },
  team: {
    id: 'team',
    name: 'Team',
    monthlyAmountCents: 9900,
    currency: 'USD',
    summary: 'Team access for JCode Harness Cloud',
  },
  studio: {
    id: 'studio',
    name: 'Studio',
    monthlyAmountCents: 24900,
    currency: 'USD',
    summary: 'Studio access for JCode Harness Cloud',
  },
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const redirect = maybeRedirectToHttps(url, request)
    if (redirect) return redirect

    if (url.pathname === '/api/runtime') {
      return handleRuntime(request, env)
    }

    const pathname = normalizePath(url.pathname)
    if (CHECKOUT_PATHS.has(pathname)) {
      return handleCheckout(request, env)
    }
    if (pathname === '/api/webhooks/nowpayments') {
      return handleNowPaymentsWebhook(request, env)
    }

    return env.ASSETS.fetch(request)
  },
}

async function handleRuntime(request, env) {
  const settings = await getNowPaymentsSettings(env)
  return json({
    ok: true,
    service: SITE_NAME,
    siteKey: SITE_KEY,
    host: new URL(request.url).hostname,
    paymentProvider: 'nowpayments',
    nowPaymentsConfigured: Boolean(settings.apiKey),
    defaultPlan: DEFAULT_PLAN_ID,
    defaultBilling: DEFAULT_BILLING,
    annualDiscount: '50%',
    payCurrency: settings.payCurrency,
    plans: Object.values(planCatalog).map((plan) => ({
      id: plan.id,
      name: plan.name,
      monthlyAmountCents: plan.monthlyAmountCents,
      annualAmountCents: Math.round(plan.monthlyAmountCents * 12 * ANNUAL_DISCOUNT_MULTIPLIER),
      currency: plan.currency,
      summary: plan.summary,
    })),
  }, 200, request)
}

async function handleCheckout(request, env) {
  return handleNowPaymentsCheckout(request, env, {
    siteKey: SITE_KEY,
    siteName: SITE_NAME,
    plans: planCatalog,
    defaultPlanId: DEFAULT_PLAN_ID,
    defaultBilling: DEFAULT_BILLING,
    annualDiscountMultiplier: ANNUAL_DISCOUNT_MULTIPLIER,
    resolveOrigin: resolvePublicAppOrigin,
    successPath: '/',
  })
}

async function handleNowPaymentsWebhook(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: jsonResponse({}, 200, request).headers })
  if (request.method !== 'POST') return json({ ok: false, message: 'Method not allowed.' }, 405, request)

  try {
    const rawBody = await request.text()
    const payload = JSON.parse(rawBody)
    const settings = await getNowPaymentsSettings(env)
    if (settings.ipnSecret) {
      const valid = await verifyNowPaymentsIpnSignature(
        payload,
        request.headers.get('x-nowpayments-sig'),
        settings.ipnSecret,
      )
      if (!valid) return json({ ok: false, message: 'Invalid IPN signature.' }, 401, request)
    }
    return json({ ok: true, received: true, paid: isNowPaymentsPaid(payload) }, 200, request)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'NOWPayments webhook could not be processed.'
    return json({ ok: false, message, error: message }, 400, request)
  }
}

function resolvePublicAppOrigin(request) {
  const url = new URL(request.url)
  const host = request.headers.get('Host') || url.host
  if (host.startsWith('127.0.0.1') || host.startsWith('localhost')) return url.origin
  if (CANONICAL_HOSTS.has(url.hostname)) return 'https://' + url.hostname
  return CANONICAL_ORIGIN
}

function maybeRedirectToHttps(url, request) {
  const host = request.headers.get('Host') || ''
  const isLocal = !request.cf || host.startsWith('127.0.0.1') || host.startsWith('localhost')
  if (!isLocal && url.protocol !== 'https:' && CANONICAL_HOSTS.has(url.hostname)) {
    const redirectUrl = new URL(url)
    redirectUrl.protocol = 'https:'
    return Response.redirect(redirectUrl.toString(), 308)
  }
  return null
}

function normalizePath(pathname) {
  if (pathname === '/') return '/'
  return pathname.replace(/\/+$/g, '')
}

function json(value, status = 200, request = null) {
  const response = jsonResponse(value, status, request)
  const headers = new Headers(response.headers)
  for (const [key, value] of Object.entries(assetHeaders)) headers.set(key, value)
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
