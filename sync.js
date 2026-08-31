(function(){
if(typeof db==="undefined")return;
var CLOUD_KEY="posh-cloud-id";
var CLOUD_API="https://jsonblob.com/api/jsonBlob";
function cloudId(){return (db&&db.cloudId)||localStorage.getItem(CLOUD_KEY)||"";}
function setCloudId(id){
  id=String(id||"").replace(/[^a-zA-Z0-9]/g,"");
  if(!id)return;
  db.cloudId=id;
  localStorage.setItem(CLOUD_KEY,id);
}
function slimDb(){
  try{return JSON.parse(JSON.stringify(db));}catch(e){return db;}
}
function applyRemote(x){
  if(!x||!x.users||!x.rooms)return false;
  db=x;
  try{localStorage.setItem(typeof KEY==="string"?KEY:"posh-full-v13",JSON.stringify(db));}catch(e){}
  return true;
}
function pullCloud(done){
  var id=cloudId();
  if(!id){if(done)done(false);return;}
  fetch(CLOUD_API+"/"+id,{cache:"no-store"}).then(function(r){
    if(!r.ok)throw new Error(r.status);
    return r.json();
  }).then(function(x){
    if(applyRemote(x)){try{draw();}catch(e){}}
    if(done)done(true);
  }).catch(function(){if(done)done(false);});
}
function pushCloud(){
  var id=cloudId();
  if(!id)return;
  fetch(CLOUD_API+"/"+id,{method:"PUT",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(slimDb())}).catch(function(){});
}
function startCloud(done){
  fetch(CLOUD_API,{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(slimDb())}).then(function(r){
    var loc=r.headers.get("Location")||r.headers.get("location")||"";
    var id=r.headers.get("X-jsonblob")||r.headers.get("x-jsonblob")||"";
    if(!id&&loc){var p=loc.split("/");id=p[p.length-1];}
    if(!id)throw new Error("no id");
    setCloudId(id);
    try{if(typeof _save==="function")_save();else save();}catch(e){}
    if(done)done(id);
  }).catch(function(err){alert("Could not start shared hotel. "+err);if(done)done("");});
}
var _save=save;
save=function(){
  _save();
  pushCloud();
};
function cloudBox(){
  var id=cloudId();
  if(id)return "<div class=card><h3>Shared hotel is ON</h3><p>Cloud ID <b>"+id+"</b></p><button class=btn id=pullCloud>Refresh from shared list</button></div>";
  return "<div class=card><h3>Shared hotel is OFF</h3><p>Staff and rooms stay on this device only until you start sharing.</p><button class=btn id=startCloud>Start shared hotel</button></div>";
}
function hookCloud(){
  var start=document.getElementById("startCloud");
  if(start)start.onclick=function(){
    startCloud(function(id){if(id){alert("Shared hotel is on. Open the same link on other phones, then tap Refresh from shared list.");draw();}});
  };
  var pull=document.getElementById("pullCloud");
  if(pull)pull.onclick=function(){pullCloud(function(ok){alert(ok?"Updated from shared list.":"Could not reach shared list.");});};
}
var _vsC=viewStaff;
viewStaff=function(){
  var html=_vsC();
  if(user&&user.role==="superadmin")return cloudBox()+html;
  return html;
};
var _bC=bind;
bind=function(){
  _bC();
  hookCloud();
};
var _drawC=draw;
draw=function(){
  _drawC();
  if(!user){
    var login=document.querySelector(".login");
    if(login&&!document.getElementById("startCloud")&&!document.getElementById("pullCloud")){
      var wrap=document.createElement("div");
      wrap.innerHTML=cloudBox();
      login.appendChild(wrap);
      hookCloud();
    }
  }
};
if(cloudId())pullCloud();
setInterval(function(){if(cloudId())pullCloud();},20000);
try{draw();}catch(e){}
})();
