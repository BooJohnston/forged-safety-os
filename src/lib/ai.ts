// ═══ AI Library — Direct API calls (no Netlify function middleman) ═══
const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || ''
const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY || ''
const PROXY_URL = '/.netlify/functions/ai-proxy'

// Use direct API if key available, otherwise fall back to proxy
const USE_DIRECT = !!ANTHROPIC_KEY

export async function callClaude(messages: any[], maxTokens = 2000) {
  if (USE_DIRECT) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        messages
      })
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Claude API error: ${res.status} — ${err}`)
    }
    return res.json()
  }

  // Fallback to proxy
  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: 'anthropic', model: 'claude-sonnet-4-20250514', max_tokens: maxTokens, messages })
  })
  if (!res.ok) throw new Error(`AI request failed: ${res.status}`)
  return res.json()
}

export async function callGPT(messages: any[], maxTokens = 2000) {
  // GPT always goes through proxy (OpenAI doesn't support browser CORS)
  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: 'openai', model: 'gpt-4o', max_tokens: maxTokens, messages })
  })
  if (!res.ok) return null
  return res.json()
}

export async function dualAnalyze(prompt: string, images?: string[]) {
  const claudeContent: any[] = []
  if (images?.length) {
    images.forEach(img => {
      claudeContent.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: img.split(',')[1] } })
    })
  }
  claudeContent.push({ type: 'text', text: prompt })

  const gptContent: any[] = [{ type: 'text', text: prompt }]
  if (images?.length) {
    images.forEach(img => {
      gptContent.push({ type: 'image_url', image_url: { url: img } })
    })
  }

  const [claudeRes, gptRes] = await Promise.allSettled([
    callClaude([{ role: 'user', content: claudeContent }]),
    callGPT([{ role: 'user', content: gptContent }])
  ])

  const claudeText = claudeRes.status === 'fulfilled' && claudeRes.value?.content
    ? claudeRes.value.content.map((c: any) => c.text || '').join('')
    : ''
  const gptText = gptRes.status === 'fulfilled' && gptRes.value?.choices
    ? gptRes.value.choices[0]?.message?.content || ''
    : ''

  return { claudeText, gptText }
}
