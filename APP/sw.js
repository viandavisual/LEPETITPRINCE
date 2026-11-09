/* Le Petit Prince v18 - registre robust, manté l'abast de /APP/ */
const CACHE='lpp-world-v21-apk';
const CORE=['./','./index.html','./app.js','./styles.css','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];
const OPTIONAL=['./music.js','./icons/favicon.png','./icons/favicon.ico','./assets/banner-principito.webp','./assets/bg-pattern.jpg','./assets/intro-principito.webp','./assets/dog-principito.webp','./assets/fox-dog-principito.webp','./assets/home-title.webp','./assets/cover-missing.webp','../DATA/catalog-data.js'];
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 // Els recursos bàsics determinen la instal·lació; el contingut opcional mai no la bloqueja.
 await cache.addAll(CORE);
 await Promise.allSettled(OPTIONAL.map(path=>cache.add(path)));
 await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const names=await caches.keys();
 await Promise.all(names.filter(x=>x.startsWith('lpp-world-')&&x!==CACHE).map(x=>caches.delete(x)));
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(url.pathname.endsWith('.apk'))return; // descàrrega Android sempre directa des de GitHub Pages
 if(url.origin!==self.location.origin)return;
 const isCritical=/\/(?:index\.html|app\.js|styles\.css|music\.js|catalog-data\.js|manifest\.webmanifest)$/.test(url.pathname);
 if(isCritical){event.respondWith((async()=>{
   const cache=await caches.open(CACHE);
   try{const response=await fetch(req);if(response.ok)cache.put(req,response.clone()).catch(()=>{});return response}
   catch(err){return await cache.match(req)||await cache.match('./index.html')||Response.error()}
 })());return;}
 event.respondWith((async()=>{
   const cached=await caches.match(req);if(cached)return cached;
   try{const response=await fetch(req);if(response.ok&&url.pathname.includes('/APP/')){
     const cache=await caches.open(CACHE);cache.put(req,response.clone()).catch(()=>{});
   }return response}
   catch(err){return Response.error()}
 })());
});
