const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const MAX_BODY_BYTES = 200_000;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY belum dikonfigurasi di Vercel.' });
  }

  const rawBody = typeof req.body === 'string'
    ? req.body
    : JSON.stringify(req.body ?? {});

  if (Buffer.byteLength(rawBody, 'utf8') > MAX_BODY_BYTES) {
    return res.status(413).json({ error: 'Permintaan terlalu besar.' });
  }

  let payload: any;
  try {
    payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Payload JSON tidak valid.' });
  }

  if (!payload || !Array.isArray(payload.contents) || payload.contents.length === 0) {
    return res.status(400).json({ error: 'Payload Gemini tidak valid.' });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: payload.contents,
          systemInstruction: payload.systemInstruction,
          generationConfig: payload.generationConfig,
          safetySettings: payload.safetySettings,
        }),
      }
    );

    const text = await response.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }

    if (!response.ok) {
      const message =
        data?.error?.message ||
        data?.error ||
        `Gemini API HTTP ${response.status}`;
      console.error('Gemini API error:', response.status, message);
      return res.status(response.status).json({ error: message });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Gemini proxy error:', error);
    return res.status(502).json({ error: 'Server Gemini tidak dapat dihubungi.' });
  }
}
