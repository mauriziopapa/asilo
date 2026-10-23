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

### Dati della pagina Match asilo-casa

La pagina `/match` mostra asili e case da `public/data.json` (per aggiornarli modifica il file e fai push su `main`).

Gli **appuntamenti** (data, ora, note) si aggiungono e rimuovono dalla pagina e il server li salva in `data.json` dentro `DATA_DIR`. A ogni avvio il server riprende asili e case dal repository e conserva gli appuntamenti già salvati.

Il disco di Railway si azzera a ogni deploy, quindi per non perdere gli appuntamenti serve un Volume:

1. Nel servizio su Railway: **Settings → Volumes → Add Volume**, mount path `/data`.
2. In **Variables** aggiungi `DATA_DIR=/data`.

## Struttura

- `public/index.html` — home con i pulsanti "Cerca Asili" e "Match asilo-casa"
- `public/cerca.html` — lista + mappa Leaflet degli asili (`/cerca`)
- `public/match.html` — pagina Match asilo-casa: asili, case e riepilogo costi (`/match`)
- `public/data.json` — dati di asili e case mostrati in `/match`
- `server.js` — server Node senza dipendenze: file statici, `/data.json` e API `/api/appuntamenti`
- `railway.json` — configurazione di deploy Railway
