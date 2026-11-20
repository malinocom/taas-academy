// Production static server + same-origin reverse proxy for the Taas API.
// This avoids cross-site cookies between Railway frontend/backend domains.
import http from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'dist');
const port = Number(process.env.PORT || 3000);
const backend = new URL(process.env.BACKEND_INTERNAL_URL || 'http://localhost:4000');
const apiPrefixes = ['/auth', '/admin', '/notes', '/orders', '/work-reports', '/questions',
  '/exams', '/attempts', '/upload', '/bookings', '/api', '/advisor', '/competitions',
  '/uploads', '/health'];
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.ttf': 'font/ttf', '.pdf': 'application/pdf', '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8'
};
const hopByHop = new Set(['connection', 'keep-alive', 'proxy-authenticate',
  'proxy-authorization', 'te', 'trailer', 'transfer-encoding', 'upgrade']);
function headersSafe(h) {
  return Object.fromEntries(Object.entries(h).filter(([k]) => !hopByHop.has(k.toLowerCase())));
}
function proxy(req, res) {
  const dest = new URL(req.url || '/', backend);
  const headers = headersSafe(req.headers);
  headers.host = backend.host;
  headers['x-forwarded-proto'] = 'https';
  const upstream = http.request(dest, { method: req.method, headers, timeout: 120000 }, (response) => {
    res.writeHead(response.statusCode || 502, headersSafe(response.headers));
    response.pipe(res);
  });
  upstream.on('timeout', () => upstream.destroy(new Error('Upstream timeout')));
  upstream.on('error', (error) => {
    console.error('API proxy error:', error.message);
    if (!res.headersSent) res.writeHead(502, { 'content-type': 'application/json; charset=utf-8' });
    if (!res.writableEnded) res.end(JSON.stringify({ message: 'API_UNAVAILABLE' }));
  });
  req.pipe(upstream);
}
function serveFile(res, file, method) {
  try {
    const stat = statSync(file);
    if (!stat.isFile()) return false;
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, {
      'content-type': mime[ext] || 'application/octet-stream',
      'content-length': stat.size,
      'cache-control': file.includes(`${path.sep}assets${path.sep}`)
        ? 'public, max-age=31536000, immutable' : 'no-cache',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'strict-origin-when-cross-origin'
    });
    if (method === 'HEAD') res.end();
    else createReadStream(file).pipe(res);
    return true;
  } catch { return false; }
}
http.createServer((req, res) => {
  let pathname;
  try { pathname = new URL(req.url || '/', 'http://localhost').pathname; }
  catch { res.writeHead(400); return res.end(); }
  if (apiPrefixes.some(p => pathname === p || pathname.startsWith(p + '/'))) return proxy(req, res);
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { allow: 'GET, HEAD' }); return res.end();
  }
  let decoded;
  try { decoded = decodeURIComponent(pathname); }
  catch { res.writeHead(400); return res.end(); }
  if (decoded.includes('\0')) { res.writeHead(400); return res.end(); }
  const file = path.resolve(root, '.' + decoded);
  if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
  if (serveFile(res, file, req.method)) return;
  if (path.extname(decoded)) { res.writeHead(404); return res.end(); }
  if (!serveFile(res, path.join(root, 'index.html'), req.method)) {
    res.writeHead(503); res.end('Frontend build not found');
  }
}).listen(port, '0.0.0.0', () => console.log(`Taas frontend listening on ${port}`));
