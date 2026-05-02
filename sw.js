const CACHE_NAME = "smettifumo-v1";
const FILES_DA_CACHARE = [
    "/quit-smoking-app/",
    "/quit-smoking-app/index.html",
    "/quit-smoking-app/style.css",
    "/quit-smoking-app/app.js",
    "/quit-smoking-app/manifest.json",
];

// Installazione: salva i file in cache
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(FILES_DA_CACHARE);
        })
    );
});

// Attivazione: elimina cache vecchie
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
            );
        })
    );
});

// Intercetta le richieste e serve dalla cache
self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((cached) => {
            return cached || fetch(event.request);
        })
    );
});