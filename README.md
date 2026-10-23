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

La pagina `/match` è in sola lettura e carica asili e case da `public/data.json`. Per aggiornare i dati modifica quel file e fai push su `main`: Railway ridistribuisce in automatico.

## Struttura

- `public/index.html` — home con i pulsanti "Cerca Asili" e "Match asilo-casa"
- `public/cerca.html` — lista + mappa Leaflet degli asili (`/cerca`)
- `public/match.html` — pagina Match asilo-casa: asili, case e riepilogo costi (`/match`)
- `public/data.json` — dati di asili e case mostrati in `/match`
- `server.js` — server statico Node senza dipendenze
- `railway.json` — configurazione di deploy Railway
