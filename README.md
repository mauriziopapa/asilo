# asilo

Lista e mappa interattiva degli asili nido di Milano e provincia (dati da bambinopoli.it e happychild.it), con filtri per orario di chiusura, zona/CAP e tipologia.

## Avvio in locale

```bash
npm start
```

Poi apri http://localhost:3000.

## Deploy su Railway

1. Su [Railway](https://railway.com) crea un nuovo progetto → **Deploy from GitHub repo** → seleziona `mauriziopapa/asilo`.
2. Railway rileva il progetto Node.js e usa `npm start` (vedi `railway.json`).
3. In **Settings → Networking** clicca **Generate Domain** per ottenere l'URL pubblico.

Il server legge la porta dalla variabile `PORT` fornita da Railway ed espone `/health` per l'healthcheck.

## Struttura

- `public/index.html` — la pagina (lista + mappa Leaflet)
- `server.js` — server statico Node senza dipendenze
- `railway.json` — configurazione di deploy Railway
