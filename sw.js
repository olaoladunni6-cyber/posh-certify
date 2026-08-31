self.addEventListener("install",function(){self.skipWaiting();});
self.addEventListener("activate",function(e){e.waitUntil(self.clients.claim());});
self.addEventListener("notificationclick",function(e){
  e.notification.close();
  e.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(function(list){
    if(list&&list[0])return list[0].focus();
    return clients.openWindow("./u.html");
  }));
});
