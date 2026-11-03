const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const MAX_BODY_BYTES = 200_000;

// Vercel Serverless Function: beri ruang waktu yang cukup untuk respons AI.
export const maxDuration = 60;

const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Cache-Control', 'no-store');

  // Vercel memakai GEMINI_API_KEY. Untuk development lokal, izinkan
  // VITE_GEMINI_API_KEY dari .env agar endpoint /api/gemini dapat dites
  // tanpa mengekspos key ke kode client.
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY belum dikonfigurasi di environment server.'
    });
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
    const models = [MODEL, 'gemini-3.6-flash'].filter(
      (model, index, list) => list.indexOf(model) === index
    );

    let lastStatus = 503;
    let lastMessage = 'Gemini sedang tidak tersedia.';
    let lastRetryable = true;

    for (let modelIndex = 0; modelIndex < models.length; modelIndex++) {
      const currentModel = models[modelIndex];

      // Jangan menunggu tanpa batas. Jika Gemini tidak merespons dalam batas ini,
      // client akan menerima 504 dan dapat mencoba lagi dengan aman.
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      let response: Response;
      try {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(currentModel)}:generateContent`,
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
            signal: controller.signal,
          }
        );
      } finally {
        clearTimeout(timeoutId);
      }

      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: text };
      }

      if (response.ok) {
        return res.status(200).json(data);
      }

      const message =
        data?.error?.message ||
        data?.error ||
        `Gemini API HTTP ${response.status}`;

      const retryable = RETRYABLE_STATUSES.has(response.status);
      const retryAfter = response.headers.get('retry-after');

      lastStatus = response.status;
      lastMessage = message;
      lastRetryable = retryable;

      if (retryAfter) {
        res.setHeader('Retry-After', retryAfter);
      }

      console.error(
        'Gemini API error:',
        response.status,
        currentModel,
        message
      );

      // Jika model utama sedang overload, coba model Flash sebelumnya sekali.
      // Untuk error client seperti 400/401/403/404, jangan pindah model.
      const shouldFallback =
        modelIndex === 0 &&
        (response.status === 429 ||
          response.status === 500 ||
          response.status === 502 ||
          response.status === 503 ||
          response.status === 504);

      if (shouldFallback) {
        continue;
      }

      break;
    }

    return res.status(lastStatus).json({
      error: lastMessage,
      retryable: lastRetryable,
      status: lastStatus,
    });
  } catch (error: any) {
    console.error('Gemini proxy error:', error);

    if (error?.name === 'AbortError') {
      return res.status(504).json({
        error: 'Gemini membutuhkan waktu terlalu lama untuk merespons. Silakan coba lagi dengan permintaan yang lebih ringan.',
        retryable: true,
        status: 504
      });
    }

    return res.status(502).json({
      error: 'Server Gemini tidak dapat dihubungi.',
      retryable: true,
      status: 502
    });
  }
}
