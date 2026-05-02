const CACHE_NAME = "stopSmoking-v6";
const FILES_DA_CACHARE = [
    "/quit-smoking-app/",
    "/quit-smoking-app/index.html",
    "/quit-smoking-app/style.css",
    "/quit-smoking-app/app.js",
    "/quit-smoking-app/manifest.json",
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_DA_CACHARE))
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
});

// Gestione notifiche
self.addEventListener("push", (event) => {
    const data = event.data ? event.data.json() : {};
    self.registration.showNotification(data.titolo || "SmettiFumo", {
        body: data.corpo || "È ora di controllare il timer!",
        icon: "/quit-smoking-app/icons/icon-192.png",
        badge: "/quit-smoking-app/icons/icon-192.png",
    });
});

// Click sulla notifica — apre l'app
self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow("/quit-smoking-app/")
    );
});