var CACHE="posh-manager-35a";
self.addEventListener("install",function(e){self.skipWaiting();});
self.addEventListener("activate",function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
    }).then(function(){return self.clients.claim();})
  );
});
self.addEventListener("fetch",function(e){
  if(e.request.method!=="GET")return;
  e.respondWith(fetch(e.request).catch(function(){return caches.match(e.request);}));
});
self.addEventListener("notificationclick",function(e){
  e.notification.close();
  e.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(function(list){
    if(list&&list[0])return list[0].focus();
    return clients.openWindow("./phone.html");
  }));
});
self.addEventListener("push",function(e){
  var data={title:"Posh Manager",body:"New hotel update"};
  try{if(e.data)data=Object.assign(data,e.data.json());}catch(err){
    try{data.body=e.data.text();}catch(e2){}
  }
  e.waitUntil(self.registration.showNotification(data.title,{body:data.body,tag:data.tag||"posh-push",renotify:true}));
});
