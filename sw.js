self.addEventListener("install",function(){self.skipWaiting();});
self.addEventListener("activate",function(e){e.waitUntil(self.clients.claim());});
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
