import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import type { IncomingMessage, ServerResponse } from "node:http";

// In production the files in /api run as Vercel Functions.
// In `npm run dev` this plugin serves the same handlers from the Vite server.
function devApi(): Plugin {
  return {
    name: "studentnest-dev-api",
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        const url = new URL(req.url || "/", "http://localhost");
        const m = url.pathname.match(/^\/api\/([a-z-]+)$/);
        if (!m) return next();
        try {
          const mod = await server.ssrLoadModule(`/api/${m[1]}.ts`);
          const handler = mod[req.method || "GET"];
          if (typeof handler !== "function") { res.statusCode = 405; return res.end("Method not allowed"); }
          const chunks: Buffer[] = [];
          for await (const c of req) chunks.push(c as Buffer);
          const body = chunks.length ? Buffer.concat(chunks) : undefined;
          const headers = new Headers();
          for (const [k, v] of Object.entries(req.headers)) if (typeof v === "string") headers.set(k, v);
          const request = new Request(url.toString(), { method: req.method, headers, body: req.method === "GET" ? undefined : body });
          const response: Response = await handler(request);
          res.statusCode = response.status;
          response.headers.forEach((v, k) => res.setHeader(k, v));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (e) {
          server.config.logger.error(String((e as Error)?.stack || e));
          res.statusCode = 500; res.end(JSON.stringify({ error: "Server error" }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Make server-only keys from .env.local visible to the dev API handlers.
  const env = loadEnv(mode, process.cwd(), "");
  for (const k of ["OPENAI_API_KEY", "OPENAI_MODEL", "GOOGLE_MAPS_SERVER_KEY", "SUPABASE_URL", "SUPABASE_ANON_KEY"]) {
    if (env[k] && !process.env[k]) process.env[k] = env[k];
  }
  return { plugins: [react(), devApi()] };
});
