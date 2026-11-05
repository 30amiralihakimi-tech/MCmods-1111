/**
 * Local preview server for MCmods.
 *
 * It imports worker.js and gives it a filesystem-backed ASSETS binding, so the
 * preview runs the exact same code that deploys to Cloudflare.
 *
 *   npm run dev          -> http://0.0.0.0:3000
 *
 * Options: PORT (default 3000), HOST (default 0.0.0.0),
 *          CURSEFORGE_API_KEY (enables the CurseForge source).
 */

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import worker from "./worker.js";

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";
const PUBLIC_DIR = fileURLToPath(new URL("./public/", import.meta.url));

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
};

async function readAsset(pathname) {
  const target = resolve(PUBLIC_DIR, `.${pathname}`);
  if (!target.startsWith(PUBLIC_DIR)) return null;
  try {
    return await readFile(target);
  } catch {
    return null;
  }
}

const assets = {
  async fetch(assetRequest) {
    const url = new URL(assetRequest.url);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith("/")) pathname += "index.html";

    let body = await readAsset(pathname);
    if (!body) {
      if (extname(pathname)) {
        return new Response("Not found", {
          status: 404,
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      }
      // Single page app fallback.
      pathname = "/index.html";
      body = await readAsset(pathname);
      if (!body) return new Response("Not found", { status: 404 });
    }

    return new Response(body, {
      status: 200,
      headers: {
        "content-type": MIME[extname(pathname).toLowerCase()] || "application/octet-stream",
        "cache-control": "no-cache",
      },
    });
  },
};

const env = {
  CURSEFORGE_API_KEY: process.env.CURSEFORGE_API_KEY || "",
  ASSETS: assets,
};

const server = createServer(async (req, res) => {
  const host = req.headers.host || `localhost:${PORT}`;
  const started = Date.now();
  try {
    const request = new Request(`http://${host}${req.url}`, {
      method: req.method,
      headers: req.headers,
    });
    const response = await worker.fetch(request, env);
    const body = Buffer.from(await response.arrayBuffer());
    const headers = Object.fromEntries(response.headers);
    delete headers["content-encoding"];
    headers["content-length"] = String(body.byteLength);
    res.writeHead(response.status, headers);
    res.end(body);
    console.log(`${req.method} ${req.url} -> ${response.status} (${Date.now() - started}ms)`);
  } catch (error) {
    console.error(`${req.method} ${req.url} -> 500`, error);
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end(`Server error: ${error?.message || error}`);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`MCmods dev server listening on http://${HOST}:${PORT}`);
  console.log(
    env.CURSEFORGE_API_KEY
      ? "CurseForge source: enabled"
      : "CurseForge source: disabled (set CURSEFORGE_API_KEY to enable)",
  );
});
