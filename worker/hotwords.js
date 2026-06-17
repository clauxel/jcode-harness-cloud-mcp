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
    if (pathname === '/assets/app.js') {
      return javascript(APP_JS)
    }
    if (pathname === '/checkout' || pathname.startsWith('/checkout/')) {
      return handleCheckoutPage(request)
    }
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

function handleCheckoutPage(request) {
  const url = new URL(request.url)
  const plan = normalizePlan(url.searchParams.get('plan') || DEFAULT_PLAN_ID)
  const billing = String(url.searchParams.get('billing') || DEFAULT_BILLING).toLowerCase() === 'monthly' ? 'monthly' : 'annual'
  const planName = planCatalog[plan]?.name || planCatalog[DEFAULT_PLAN_ID].name
  return html(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,follow">
  <title>${escapeHtml(SITE_NAME)} checkout</title>
  <style>
    :root{color-scheme:dark;--bg:#090b1e;--panel:#10172a;--text:#f8fafc;--muted:#cbd5e1;--line:#263149;--accent:#8b8cff}
    *{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:radial-gradient(circle at 50% 0%,#1d2450 0,#090b1e 52%);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    main{width:min(560px,calc(100vw - 32px));border:1px solid var(--line);background:rgba(16,23,42,.88);border-radius:8px;padding:28px;box-shadow:0 24px 80px rgba(0,0,0,.32)}
    .eyebrow{margin:0 0 10px;color:#a5b4fc;text-transform:uppercase;font-size:12px;font-weight:800;letter-spacing:.08em}h1{margin:0 0 12px;font-size:clamp(28px,5vw,42px);line-height:1.05;letter-spacing:0}p{color:var(--muted);line-height:1.6}button,a{font:inherit}.actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:22px}.btn{border:1px solid var(--line);border-radius:8px;padding:12px 16px;color:var(--text);background:#111827;text-decoration:none;font-weight:800;cursor:pointer}.primary{background:var(--accent);border-color:var(--accent);color:#08091a}.status{margin-top:18px;color:#e2e8f0;min-height:24px}
  </style>
</head>
<body>
  <main>
    <p class="eyebrow">NOWPayments checkout</p>
    <h1>Opening ${escapeHtml(planName)} ${escapeHtml(billing)} checkout</h1>
    <p>JCode Harness Cloud uses hosted NOWPayments checkout. This page will move to the secure payment invoice automatically.</p>
    <div class="actions">
      <button class="btn primary" id="start" type="button">Open NOWPayments</button>
      <a class="btn" href="/">Back to product</a>
    </div>
    <p class="status" id="status">Preparing checkout...</p>
  </main>
  <script>
    const planId = ${JSON.stringify(plan)};
    const billing = ${JSON.stringify(billing)};
    const status = document.getElementById('status');
    const button = document.getElementById('start');
    let started = false;
    async function startCheckout() {
      if (started) return;
      started = true;
      button.disabled = true;
      status.textContent = 'Creating NOWPayments invoice...';
      try {
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId, billing, source: 'checkout-page' })
        });
        const payload = await response.json();
        if (!response.ok || !payload.checkoutUrl) throw new Error(payload.message || payload.error || 'Checkout could not be started.');
        status.textContent = 'Opening NOWPayments...';
        location.assign(payload.checkoutUrl);
      } catch (error) {
        started = false;
        button.disabled = false;
        status.textContent = error && error.message ? error.message : 'Checkout could not be started.';
      }
    }
    button.addEventListener('click', startCheckout);
    setTimeout(startCheckout, 250);
  </script>
</body>
</html>`)
}

function normalizePlan(value) {
  const plan = String(value || '').toLowerCase().replace(/[^a-z0-9_-]/g, '')
  return planCatalog[plan] ? plan : DEFAULT_PLAN_ID
}

function html(body, status = 200) {
  return new Response(body, {
    status,
    headers: { ...assetHeaders, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

function javascript(body, status = 200) {
  return new Response(body, {
    status,
    headers: { ...assetHeaders, 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]))
}

const APP_JS = `window.SITE_CONFIG={"slug":"jcodeharness","name":"JCode Harness Cloud","type":"MCP","sample":"JCode Harness Cloud sample with public-safe workflow context, owner, policy, deadline, risk notes, and reviewer evidence.","outputs":["Structured verdict JSON","Risk reasons and next actions","Receipt and usage log","Audit dashboard export"],"plan":"team","planName":"Team"};
(()=>{const cfg=window.SITE_CONFIG;const $=(s,r=document)=>r.querySelector(s);const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));function esc(v){return String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}function uuid(){return crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random().toString(16).slice(2);}function storageValue(key,session){try{const store=session?sessionStorage:localStorage;let value=store.getItem(key);if(value)return value;value=uuid();store.setItem(key,value);return value}catch{return uuid()}}const visitorId=storageValue(cfg.slug+'_visitor_id');const sessionId=storageValue(cfg.slug+'_session_id',true);function eventPayload(name,metadata){const params=new URLSearchParams(location.search);return{id:uuid(),name,path:location.pathname,visitorId,sessionId,referrerHost:document.referrer?new URL(document.referrer).hostname:'',utmSource:params.get('utm_source')||'',utmMedium:params.get('utm_medium')||'',utmCampaign:params.get('utm_campaign')||'',utmTerm:params.get('utm_term')||'',utmContent:params.get('utm_content')||'',occurredAt:new Date().toISOString(),metadata:metadata||{}}}function track(name,metadata){try{const body=JSON.stringify({events:[eventPayload(name,metadata)]});if(navigator.sendBeacon){navigator.sendBeacon('/api/analytics/events',new Blob([body],{type:'application/json'}));return}fetch('/api/analytics/events',{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true}).catch(()=>{})}catch{}}function ensurePaymentUi(){if(!$('#payment-overlay')){const overlay=document.createElement('div');overlay.className='payment-overlay';overlay.id='payment-overlay';overlay.setAttribute('aria-live','polite');overlay.innerHTML='<div class="payment-card"><span class="eyebrow">Hosted payment</span><h2>Opening NOWPayments checkout</h2><p class="section-lede">This page will move to the secure hosted payment invoice.</p><div class="hero-actions"><button class="btn btn-primary" id="payment-link-fallback" type="button">Open payment window</button><button class="btn" id="payment-close" type="button">Keep browsing</button></div></div>';document.body.appendChild(overlay);$('#payment-close')?.addEventListener('click',()=>setPaymentActive(false));}if(!$('#paid-notice')){const notice=document.createElement('div');notice.className='notice';notice.id='paid-notice';notice.innerHTML='<strong>Payment required to run this workflow.</strong><p class="muted">Interactive reports, exports, and team history unlock after checkout.</p><div class="hero-actions"><button class="btn btn-primary" data-checkout="'+esc(cfg.plan||'team')+'">Checkout '+esc(cfg.planName||'Team')+' annual</button><a class="btn" href="/pricing/">View plans</a></div>';document.body.appendChild(notice);}}function setPaymentActive(active){ensurePaymentUi();document.body.classList.toggle('payment-active',Boolean(active));}function refresh(){const text=($('#workInput')?.value||cfg.sample||'').trim();const risk=$('#riskLevel')?.value||'standard';const region=$('#region')?.value||'US';const score=Math.max(70,Math.min(98,84+(text.length%13)-(risk==='strict'?4:0)));const scoreEl=$('#scoreValue');if(scoreEl)scoreEl.textContent=score;const list=$('#receiptList');if(list)list.innerHTML=cfg.outputs.map((item,i)=>'<li><span>'+esc(item)+' - '+(i===0?esc(region)+' evidence ready':esc(risk)+' review')+'</span></li>').join('');const summary=$('#previewSummary');if(summary)summary.textContent=text?text.slice(0,150)+(text.length>150?'...':''):'Paste a sample to generate a preview.';}function showPaidNotice(message,source){ensurePaymentUi();const notice=$('#paid-notice');if(!notice)return;const p=notice.querySelector('p');if(p)p.textContent=message||'Generate preview is available after checkout. Choose a plan to unlock interactive reports, exports, and team history.';notice.classList.add('show');track('paid_feature_prompt',{feature:'generate_preview',source:source||'preview_button'});}async function checkout(e){const target=e.currentTarget;if(location.protocol==='file:')return;const plan=target.dataset.checkout||cfg.plan;e.preventDefault();track('checkout_requested',{plan,billing:'annual',source:target.dataset.source||'site'});setPaymentActive(true);try{const response=await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({planId:plan,billing:'annual',source:'site'})});const payload=await response.json();if(!response.ok||!payload.checkoutUrl)throw new Error(payload.message||payload.error||'Checkout could not be started.');track('checkout_started',{plan:payload.planId,amountCents:payload.amountCents,currency:payload.currency,orderId:payload.orderId});location.assign(payload.checkoutUrl)}catch(error){track('checkout_error',{message:String(error.message||error),plan});setPaymentActive(false);const notice=$('#paid-notice');if(notice){const p=notice.querySelector('p');if(p)p.textContent=String(error.message||error)||'Checkout is not available on this deployment yet. Please try again after payment is configured.';notice.classList.add('show')}}}document.addEventListener('DOMContentLoaded',()=>{ensurePaymentUi();const input=$('#workInput');if(input&&!input.value)input.value=cfg.sample||'';$$('[data-refresh]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();showPaidNotice('Generate preview is available after checkout. Choose a plan to unlock interactive reports, exports, and team history.','generate_preview');}));$$('[data-checkout]').forEach(a=>a.addEventListener('click',checkout));refresh();if(new URLSearchParams(location.search).get('checkout')==='success'||new URLSearchParams(location.search).get('status')==='success'){track('checkout_success_return',{provider:'nowpayments'})}track('page_view',{title:document.title})});})();`
