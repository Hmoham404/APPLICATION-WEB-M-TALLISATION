import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// Precache the exact files produced by each build; no third-party API data is cached.
function pwa() {
  return {
    name: "myc-pwa",
    apply: "build",
    generateBundle(_, bundle) {
      const assets = [
        "/",
        "/index.html",
        "/manifest.webmanifest",
        "/pwa-install.js",
        "/icons/icon-192.png",
        "/icons/icon-512.png",
        "/icons/apple-touch-icon.png",
        ...Object.keys(bundle)
          .filter((p) => /\.(js|css)$/.test(p))
          .map((p) => "/" + p),
      ];
      const version = "myc-v2-" + Date.now();
      this.emitFile({
        type: "asset",
        fileName: "sw.js",
        source: `
const CACHE=${JSON.stringify(version)}, ASSETS=${JSON.stringify(assets)};
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener('message', event => {
  if(event.data?.type === 'SKIP_WAITING') event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  const req=event.request, url=new URL(req.url);
  if(req.method!=='GET' || url.origin!==self.location.origin) return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    // Refresh HTML online; never keep an old interface indefinitely.
    if(req.mode==='navigate') {
      try { const response=await fetch(req); if(response.ok)return response; }
      catch {}
      return (await cache.match('/index.html')) || new Response('',{status:503});
    }
    const cached=await cache.match(url.pathname,{ignoreSearch:true,ignoreVary:true});
    if(cached)return cached;
    // Open tabs may still import chunks from a previous version.
    if(url.pathname.startsWith('/assets/')) {
      const previous=await caches.match(req);
      if(previous)return previous;
    }
    try{return await fetch(req)}
    catch{return req.mode==='navigate' ? cache.match('/index.html') : new Response('',{status:503})}
  })());
});`,
      });
    },
  };
}
export default defineConfig({ plugins: [react(), pwa()] });
