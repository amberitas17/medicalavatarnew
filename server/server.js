// Lightweight static file server for the built frontend.
// Serves the Vite `dist` output and falls back to index.html for
// client-side (SPA) routing. Uses only Node's built-in modules so
// there is no dependency to install at runtime.

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, '..', 'dist');
const INDEX_FILE = path.join(DIST_DIR, 'index.html');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.csv': 'text/csv; charset=utf-8',
};

function sendFile(res, filePath, statusCode = 200) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Internal Server Error');
      return;
    }

    res.writeHead(statusCode, { 'Content-Type': contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  try {
    const requestUrl = decodeURIComponent(req.url.split('?')[0]);
    const safePath = path.normalize(requestUrl).replace(/^(\.\.[/\\])+/, '');
    let filePath = path.join(DIST_DIR, safePath);

    // Prevent path traversal outside of the dist directory.
    if (!filePath.startsWith(DIST_DIR)) {
      filePath = INDEX_FILE;
    }

    fs.stat(filePath, (err, stats) => {
      if (!err && stats.isFile()) {
        sendFile(res, filePath);
        return;
      }

      // Fall back to index.html so client-side routing (React Router)
      // can handle the request instead of returning a 404.
      sendFile(res, INDEX_FILE);
    });
  } catch (err) {
    sendFile(res, INDEX_FILE);
  }
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
