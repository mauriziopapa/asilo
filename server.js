const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
// Asili e case arrivano dal data.json del repository
const SEED_FILE = path.join(PUBLIC_DIR, 'data.json');
// Copia scrivibile di data.json con gli appuntamenti.
// Su Railway montare un Volume e impostare DATA_DIR al suo mount path (es. /data).
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'data.json');
const MAX_BODY = 20 * 1024;

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

// ── data.json ──────────────────────────────────────────────────────────────
function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

function saveState() {
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}

// All'avvio: asili e case aggiornati dal repository, appuntamenti conservati
fs.mkdirSync(DATA_DIR, { recursive: true });
const seed = readJson(SEED_FILE) || {};
const stored = readJson(DATA_FILE) || {};
const state = {
  ...seed,
  appuntamenti: stored.appuntamenti || seed.appuntamenti || [],
};
saveState();

// ── API appuntamenti ───────────────────────────────────────────────────────
function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new Error('body troppo grande'));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function validateAppuntamento(b) {
  if (!b || typeof b !== 'object') return null;
  const list = b.tipo === 'asilo' ? state.asili : b.tipo === 'casa' ? state.case : null;
  if (!list || !list.some((i) => i.id === b.ref_id)) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.data || '') || !/^\d{2}:\d{2}$/.test(b.ora || '')) return null;
  return {
    id: crypto.randomUUID(),
    tipo: b.tipo,
    ref_id: b.ref_id,
    data: b.data,
    ora: b.ora,
    note: String(b.note || '').slice(0, 2000),
    ts: Date.now(),
  };
}

async function handleAppuntamenti(req, res, id) {
  try {
    if (!id && req.method === 'POST') {
      const app = validateAppuntamento(await readBody(req));
      if (!app) return sendJson(res, 400, { error: 'dati appuntamento non validi' });
      state.appuntamenti.push(app);
      saveState();
      return sendJson(res, 201, { appuntamenti: state.appuntamenti });
    }
    if (id && req.method === 'DELETE') {
      state.appuntamenti = state.appuntamenti.filter((a) => a.id !== id);
      saveState();
      return sendJson(res, 200, { appuntamenti: state.appuntamenti });
    }
    return sendJson(res, 405, { error: 'metodo non consentito' });
  } catch (err) {
    console.error('Errore appuntamenti:', err.message);
    return sendJson(res, 400, { error: 'richiesta non valida' });
  }
}

// ── Server ─────────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);

  if (urlPath === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('ok');
  }

  if (urlPath === '/data.json') return sendJson(res, 200, state);

  const m = urlPath.match(/^\/api\/appuntamenti(?:\/([^/]+))?\/?$/);
  if (m) return handleAppuntamenti(req, res, m[1]);

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
      // I file dati mancanti devono dare 404, non la home
      if (path.extname(filePath) === '.json') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        return res.end('Not found');
      }
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
    const ext = path.extname(filePath);
    const headers = { 'Content-Type': MIME[ext] || 'application/octet-stream' };
    if (ext === '.json') headers['Cache-Control'] = 'no-cache';
    res.writeHead(200, headers);
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server in ascolto sulla porta ${PORT} (appuntamenti in ${DATA_FILE})`);
});
