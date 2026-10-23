// Client minimale per il database del server (/api/<collezione>).
// Espone la stessa interfaccia usata dalla pagina: collection().orderBy().onSnapshot(),
// collection().add(), doc('coll/id').set() / .delete().
(function () {
  const POLL_MS = 5000;
  const listeners = new Set();

  async function request(method, url, body) {
    const res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(method + ' ' + url + ' → ' + res.status);
    return res.status === 204 ? null : res.json();
  }

  async function refresh(l) {
    try {
      const items = await request('GET', '/api/' + l.coll);
      if (l.field) {
        const dir = l.dir === 'desc' ? -1 : 1;
        items.sort((a, b) => ((a[l.field] ?? 0) > (b[l.field] ?? 0) ? 1 : (a[l.field] ?? 0) < (b[l.field] ?? 0) ? -1 : 0) * dir);
      }
      const json = JSON.stringify(items);
      if (json === l.last) return;
      l.last = json;
      l.cb({ docs: items.map(({ id, ...data }) => ({ id, data: () => data })) });
    } catch (err) {
      l.onErr && l.onErr(err);
    }
  }

  function refreshAll() { listeners.forEach(refresh); }

  setInterval(refreshAll, POLL_MS);
  window.addEventListener('focus', refreshAll);

  function collection(coll, field, dir) {
    return {
      orderBy: (f, d) => collection(coll, f, d),
      onSnapshot(cb, onErr) {
        const l = { coll, field, dir, cb, onErr, last: null };
        listeners.add(l);
        refresh(l);
        return () => listeners.delete(l);
      },
      async add(data) {
        const r = await request('POST', '/api/' + coll, data);
        refreshAll();
        return r;
      },
    };
  }

  function doc(p) {
    const url = '/api/' + p.split('/').map(encodeURIComponent).join('/');
    return {
      async set(data) { await request('PUT', url, data); refreshAll(); },
      async delete() { await request('DELETE', url); refreshAll(); },
    };
  }

  window.createRestDb = () => ({ collection, doc });
})();
