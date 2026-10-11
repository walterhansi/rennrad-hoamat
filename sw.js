// Rennrad Hoamat – Service Worker
// Programmdateien: zuerst aus dem Netz (damit Aktualisierungen sofort ankommen), ohne Netz aus dem Vorrat.
// Leaflet vom CDN: aus dem Vorrat. Wegdaten, Zählungen und Routing laufen immer direkt übers Netz;
// die Wegdaten speichert die Seite selbst (IndexedDB).
const VERSION = 'rh-8';
const APP = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png',
  'anleitung.html', 'anleitung/gpxliste.webp', 'anleitung/kopf.webp', 'anleitung/legende.webp', 'anleitung/planen-nachher.webp', 'anleitung/planen-vorher.webp', 'anleitung/pruefen-popup.webp', 'anleitung/pruefen.webp', 'anleitung/uebersicht.webp', 'anleitung/zeichnen-panel.webp'];
const LIB = [
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all([c.addAll(APP), ...LIB.map(u => c.add(u).catch(() => {}))])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
  } else if (url.hostname === 'cdnjs.cloudflare.com') {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
      const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return res;
    })));
  }
});
