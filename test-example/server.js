/* eslint-disable @typescript-eslint/no-var-requires */

const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const repoRoot = path.resolve(__dirname, '..');
const sdkBundlePath = path.join(repoRoot, 'packages', 'trace-sdk', 'dist', 'trace-sdk.web.iife.js');
const port = Number(process.env.PORT || 8088);

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

function sendFile(res, filePath) {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': contentTypes[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  const requestPath = req.url === '/' ? '/index.html' : req.url;

  if (requestPath === '/sdk/trace-sdk.web.iife.js') {
    return sendFile(res, sdkBundlePath);
  }

  const safePath = path.normalize(requestPath).replace(/^([.][.][/\\])+/, '');
  const target = path.join(root, safePath);

  if (!target.startsWith(root)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  sendFile(res, target);
});

server.listen(port, () => {
  console.log(`test-example server running at http://localhost:${port}`);
  console.log('Open the page in a browser and point it at your local TraceFlow server.');
});
