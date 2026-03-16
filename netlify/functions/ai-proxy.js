// Netlify serverless function: AI API proxy
// Deploy with env vars: ANTHROPIC_API_KEY, OPENAI_API_KEY
exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const body = JSON.parse(event.body);
    const provider = body.provider || "anthropic"; // "anthropic" or "openai"

    if (provider === "anthropic") {
      const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
      if (!ANTHROPIC_KEY) return { statusCode: 500, headers, body: JSON.stringify({ error: "Anthropic API key not configured" }) };

      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: body.model || "claude-sonnet-4-20250514",
          max_tokens: body.max_tokens || 4000,
          messages: body.messages,
          ...(body.stream ? { stream: true } : {})
        })
      });

      if (body.stream) {
        // For streaming, return the response body directly
        const text = await resp.text();
        return { statusCode: resp.status, headers, body: text };
      }

      const data = await resp.json();
      return { statusCode: resp.status, headers, body: JSON.stringify(data) };
    }

    if (provider === "openai") {
      const OPENAI_KEY = process.env.OPENAI_API_KEY;
      if (!OPENAI_KEY) return { statusCode: 500, headers, body: JSON.stringify({ error: "OpenAI API key not configured" }) };

      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_KEY}`
        },
        body: JSON.stringify({
          model: body.model || "gpt-4o",
          max_tokens: body.max_tokens || 4000,
          messages: body.messages
        })
      });

      const data = await resp.json();
      return { statusCode: resp.status, headers, body: JSON.stringify(data) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid provider" }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
