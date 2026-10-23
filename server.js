const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
// Su Railway montare un Volume e impostare DATA_DIR al suo mount path (es. /data)
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const COLLECTIONS = new Set(['asili', 'case']);
const MAX_BODY = 100 * 1024;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// ── Database JSON su file ──────────────────────────────────────────────────
fs.mkdirSync(DATA_DIR, { recursive: true });
let db = { asili: {}, case: {} };
try {
  db = { ...db, ...JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) };
} catch (err) {
  if (err.code !== 'ENOENT') console.error('Lettura database fallita:', err.message);
}

function saveDb() {
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
  res.end(data === undefined ? '' : JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new Error('too large'));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('not an object');
        delete data.id;
        resolve(data);
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

async function handleApi(req, res, parts) {
  const [coll, id] = parts;
  if (!COLLECTIONS.has(coll) || parts.length > 2) return sendJson(res, 404, { error: 'not found' });
  const items = db[coll];

  try {
    if (!id && req.method === 'GET') {
      return sendJson(res, 200, Object.entries(items).map(([k, v]) => ({ id: k, ...v })));
    }
    if (!id && req.method === 'POST') {
      const newId = crypto.randomUUID();
      items[newId] = await readBody(req);
      saveDb();
      return sendJson(res, 201, { id: newId });
    }
    if (id && req.method === 'PUT') {
      items[id] = await readBody(req);
      saveDb();
      return sendJson(res, 200, { id });
    }
    if (id && req.method === 'DELETE') {
      delete items[id];
      saveDb();
      res.writeHead(204);
      return res.end();
    }
  } catch (err) {
    return sendJson(res, 400, { error: 'richiesta non valida' });
  }
  sendJson(res, 405, { error: 'method not allowed' });
}

// ── Server ─────────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);

  if (urlPath === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('ok');
  }

  if (urlPath.startsWith('/api/')) {
    return handleApi(req, res, urlPath.slice(5).split('/').filter(Boolean));
  }

  let filePath = path.normalize(path.join(PUBLIC_DIR, urlPath));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  if (urlPath.endsWith('/')) filePath = path.join(filePath, 'index.html');
  // URL senza estensione: /cerca -> cerca.html
  else if (!path.extname(filePath)) filePath += '.html';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // Fallback alla pagina principale
      return fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (err2, index) => {
        if (err2) {
          res.writeHead(500);
          return res.end('Errore interno');
        }
        res.writeHead(200, { 'Content-Type': MIME['.html'] });
        res.end(index);
      });
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server in ascolto sulla porta ${PORT} (dati in ${DATA_DIR})`);
});
