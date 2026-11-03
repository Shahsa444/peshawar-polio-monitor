/* ERU Peshawar Dashboard - offline cache.
   Every file from this website (page, data, scripts) is asked from the network first and
   bypasses the browser's own saved copy, so figures and deck code are never stale.
   The last saved copy is used only when there is no signal.
   Fonts and map/PDF/PPT libraries from other websites: served from the saved copy (they never change).
   Version "eru-v2": activating it deletes every older cache, so old copies are cleared on the next visit. */
const V="eru-v2", FIXED=/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/;
self.addEventListener("install",e=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
  const r=e.request; if(r.method!=="GET") return;
  const u=new URL(r.url);
  if(FIXED.test(r.url)){
    e.respondWith(caches.open(V).then(c=>c.match(r).then(hit=>hit||fetch(r).then(res=>{ if(res.ok||res.type==="opaque") c.put(r,res.clone()); return res; }))));
    return;
  }
  if(u.origin!==location.origin) return;
  if(/tile|arcgisonline/.test(r.url)) return;
  e.respondWith(fetch(r,{cache:"no-cache"}).then(res=>{ if(res.ok){ const cp=res.clone(); caches.open(V).then(c=>c.put(r,cp)); } return res; })
    .catch(()=>caches.open(V).then(c=>c.match(r,{ignoreSearch:true})).then(h=>h||Response.error())));
});
