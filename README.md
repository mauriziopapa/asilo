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

### Dati della pagina Match asilo-casa (Volume)

Asili e case inseriti in `/match` vengono salvati sul server in un file JSON (`db.json`), condiviso fra tutti quelli che aprono il sito. Il disco di Railway si azzera a ogni deploy, quindi per non perdere i dati:

1. Nel servizio su Railway: **Settings → Volumes → Add Volume**, mount path `/data`.
2. In **Variables** aggiungi `DATA_DIR=/data`.

Senza Volume l'app funziona lo stesso, ma i dati si perdono al deploy successivo.

## Struttura

- `public/index.html` — home con i pulsanti "Cerca Asili" e "Match asilo-casa"
- `public/cerca.html` — lista + mappa Leaflet degli asili (`/cerca`)
- `public/match.html` — pagina Match asilo-casa: asili, case e riepilogo costi (`/match`)
- `public/db-client.js` — client per l'API dati del server (`/api/asili`, `/api/case`)
- `server.js` — server Node senza dipendenze: file statici + API dati su file JSON
- `railway.json` — configurazione di deploy Railway
