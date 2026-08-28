// Minimal static server for the exported site, mounted at the same basePath
// GitHub Pages uses. Keeps the E2E suite honest about basePath-dependent URLs
// without pulling in another dependency.
import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const ROOT = resolve("out");
const BASE_PATH = process.env.BASE_PATH ?? "/deti-plus-26";
const PORT = Number(process.env.PORT ?? 3100);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".map": "application/json; charset=utf-8",
};

async function resolveFile(pathname) {
  // normalize() collapses any ".." before we join, so requests cannot escape ROOT.
  const relative = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  const candidate = join(ROOT, relative);
  if (!candidate.startsWith(ROOT)) return null;

  const info = await stat(candidate).catch(() => null);
  if (info?.isFile()) return candidate;
  if (info?.isDirectory()) {
    const index = join(candidate, "index.html");
    return (await stat(index).catch(() => null))?.isFile() ? index : null;
  }
  const withHtml = `${candidate}.html`;
  return (await stat(withHtml).catch(() => null))?.isFile() ? withHtml : null;
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, "http://localhost");

  if (!pathname.startsWith(BASE_PATH)) {
    res.writeHead(404, { "content-type": "text/plain" }).end("Not found");
    return;
  }

  const file = await resolveFile(pathname.slice(BASE_PATH.length) || "/");
  if (!file) {
    const notFound = join(ROOT, "404.html");
    const exists = (await stat(notFound).catch(() => null))?.isFile();
    res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
    if (exists) createReadStream(notFound).pipe(res);
    else res.end("Not found");
    return;
  }

  res.writeHead(200, {
    "content-type": MIME[extname(file)] ?? "application/octet-stream",
  });
  createReadStream(file).pipe(res);
}).listen(PORT, "127.0.0.1", () => {
  console.log(`Serving ./out at http://127.0.0.1:${PORT}${BASE_PATH}/`);
});
