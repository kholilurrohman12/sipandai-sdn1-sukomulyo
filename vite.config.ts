import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function localGeminiApi(): Plugin {
  return {
    name: 'sipandai-local-gemini-api',
    configureServer(server) {
      server.middlewares.use('/api/gemini', async (req: any, res: any, next: any) => {
        if (req.method !== 'POST') return next();
        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(Buffer.from(chunk));
          req.body = Buffer.concat(chunks).toString('utf8');

          const module = await server.ssrLoadModule('/api/gemini.ts');
          res.status = (code: number) => { res.statusCode = code; return res; };
          res.json = (data: any) => {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify(data));
          };
          await module.default(req, res);
        } catch (error) {
          console.error('Local /api/gemini error:', error);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ error: 'Local Gemini API gagal dijalankan.' }));
          }
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (!process.env.GEMINI_API_KEY && env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
  if (!process.env.GEMINI_API_KEY && env.VITE_GEMINI_API_KEY) process.env.GEMINI_API_KEY = env.VITE_GEMINI_API_KEY;

  return {
    plugins: [react(), tailwindcss(), localGeminiApi()],
    server: { port: 5173, host: true }
  };
});
