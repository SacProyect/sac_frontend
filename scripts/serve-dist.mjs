#!/usr/bin/env node
/**
 * Minimal static SPA server for Render Web Service.
 * Serves ./dist on 0.0.0.0:$PORT with history fallback to index.html.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, "..", "dist");
const PORT = Number(process.env.PORT) || 10000;
const HOST = "0.0.0.0";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain; charset=utf-8",
};

function safeJoin(root, reqPath) {
  const decoded = decodeURIComponent((reqPath || "/").split("?")[0]);
  const joined = path.normalize(path.join(root, decoded));
  if (!joined.startsWith(root)) return null;
  return joined;
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || "application/octet-stream";
  const isAsset = filePath.includes(`${path.sep}assets${path.sep}`);
  res.writeHead(200, {
    "Content-Type": type,
    "Cache-Control": isAsset
      ? "public, max-age=31536000, immutable"
      : "no-cache",
  });
  fs.createReadStream(filePath).pipe(res);
}

function sendIndex(res) {
  const index = path.join(DIST, "index.html");
  if (!fs.existsSync(index)) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("dist/index.html missing — build may have failed");
    return;
  }
  sendFile(res, index);
}

if (!fs.existsSync(DIST)) {
  console.error(`[serve-dist] Missing ${DIST}. Run build first.`);
  process.exit(1);
}

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" });
    res.end();
    return;
  }

  const urlPath = new URL(req.url || "/", `http://${req.headers.host}`).pathname;
  const candidate = safeJoin(DIST, urlPath);

  if (!candidate) {
    res.writeHead(403).end();
    return;
  }

  fs.stat(candidate, (err, st) => {
    if (!err && st.isFile()) {
      if (req.method === "HEAD") {
        res.writeHead(200, {
          "Content-Type": MIME[path.extname(candidate).toLowerCase()] || "application/octet-stream",
        });
        res.end();
        return;
      }
      sendFile(res, candidate);
      return;
    }

    // Directory or missing path → SPA fallback
    sendIndex(res);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`[serve-dist] listening on http://${HOST}:${PORT} (root=${DIST})`);
});
