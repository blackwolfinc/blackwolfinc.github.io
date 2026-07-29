/* Service Worker for "Sổ CLB số — CaritaHub" kiosk PWA.
 * Self-contained (no imports). Served under the /clb/ subpath on GitHub Pages,
 * so every precache URL is resolved against self.registration.scope.
 */
'use strict';

const CACHE_NAME = 'clb-v3';

/* App shell + icons/QR + background music */
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/ch-logo.svg',
  './assets/ch-powered.svg',
  './assets/icon.svg',
  './assets/visit-qr.svg',
  './assets/bg-music.mp3',
];

/* app/*.webp — 39 screenshots */
const APP = [
  './app/01-login.webp',
  './app/02-members-list.webp',
  './app/03-member-form-attention.webp',
  './app/04-programme-form.webp',
  './app/05-club-calendar.webp',
  './app/06-vitals-grid.webp',
  './app/07-attention-inbox.webp',
  './app/08-care-plans.webp',
  './app/09-club-profile.webp',
  './app/10-daycare-day-board.webp',
  './app/11-daycare-enrolments.webp',
  './app/12-enrolment-safety.webp',
  './app/13-centre-kpis.webp',
  './app/15-province-aggregates.webp',
  './app/attendance.webp',
  './app/attention.webp',
  './app/book-preview.webp',
  './app/books.webp',
  './app/family-digest.webp',
  './app/feed-quiet.webp',
  './app/feed.webp',
  './app/health.webp',
  './app/home.webp',
  './app/link.webp',
  './app/members.webp',
  './app/messages.webp',
  './app/photo-hearted.webp',
  './app/profile.webp',
  './app/senior-home.webp',
  './app/station-hub.webp',
  './app/station-identify.webp',
  './app/station-idle.webp',
  './app/station-measure.webp',
  './app/station-reading.webp',
  './app/station-saved.webp',
  './app/visit-sheet.webp',
  './app/vitals.webp',
  './app/welcome.webp',
  './app/wellbeing.webp',
];

/* posters/*.webp */
const POSTERS = [
  './posters/1.webp',
  './posters/2.webp',
  './posters/3.webp',
  './posters/4.webp',
  './posters/5.webp',
];

/* assets/print/*.pdf */
const PRINT = [
  './assets/print/bao-cao-thang.pdf',
  './assets/print/so-diem-danh-ngay.pdf',
  './assets/print/so-thanh-vien.pdf',
  './assets/print/so-theo-doi-suc-khoe.pdf',
];

const PRECACHE = [].concat(SHELL, APP, POSTERS, PRINT);

/* Resolve a relative path against the registration scope (handles /clb/ subpath). */
function scoped(path) {
  return new URL(path, self.registration.scope).toString();
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Add each item individually so a single 404 never rejects the whole install.
    await Promise.allSettled(
      PRECACHE.map(async (path) => {
        const url = scoped(path);
        try {
          const res = await fetch(url, { cache: 'no-cache' });
          if (res && (res.ok || res.type === 'opaque')) {
            await cache.put(url, res.clone());
          }
        } catch (err) {
          /* ignore individual asset failures */
        }
      })
    );
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(
      names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') return;

  // Navigation requests: network-first, fall back to cached index.html.
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(request);
        return fresh;
      } catch (err) {
        const cache = await caches.open(CACHE_NAME);
        const cached =
          (await cache.match(scoped('./index.html'))) ||
          (await cache.match(scoped('./')));
        return cached || Response.error();
      }
    })());
    return;
  }

  // Only handle same-origin GETs beyond this point.
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Stale-while-revalidate: serve cache instantly, refresh in the background.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    const fetching = fetch(request).then((fresh) => {
      if (fresh && (fresh.ok || fresh.type === 'opaque')) cache.put(request, fresh.clone());
      return fresh;
    }).catch(() => null);
    return cached || (await fetching) || Response.error();
  })());
});
