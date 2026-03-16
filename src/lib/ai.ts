const PROXY_URL = '/.netlify/functions/ai-proxy'

export async function callClaude(messages: any[], maxTokens = 4000, stream = false) {
  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      messages,
      stream
    })
  })
  if (!res.ok) throw new Error(`AI request failed: ${res.status}`)
  return stream ? res : res.json()
}

export async function callGPT(messages: any[], maxTokens = 4000) {
  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'openai',
      model: 'gpt-4o',
      max_tokens: maxTokens,
      messages
    })
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
