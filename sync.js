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
  if(typeof save==="function"){
    var _s=save;
    localStorage.setItem(typeof KEY==="string"?KEY:"posh-full-v13",JSON.stringify(db));
  }
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
    try{save();}catch(e){}
    if(done)done(id);
  }).catch(function(err){alert("Could not start shared hotel. "+err);if(done)done("");});
}
var _save=save;
save=function(){
  _save();
  pushCloud();
};
viewCloud=function(){
  var id=cloudId();
  return "<div class=card><h3>Shared hotel (all phones)</h3>"+
    (id?("<p>Shared list is ON. Cloud ID: <b>"+id+"</b></p><button class=btn id=pullCloud>Refresh from shared list</button>"):
    "<p>Each phone currently keeps its own staff and rooms. Turn this on once so every phone uses the same list.</p><button class=btn id=startCloud>Start shared hotel</button>")+"</div>";
};
var _vsC=viewStaff;
viewStaff=function(){
  var html=_vsC();
  if(user&&user.role==="superadmin")return viewCloud()+html;
  return html;
};
var _bC=bind;
bind=function(){
  _bC();
  var start=document.getElementById("startCloud");
  if(start)start.onclick=function(){
    if(!user||user.role!=="superadmin")return;
    startCloud(function(id){if(id){alert("Shared hotel is on. Other phones: open the same link, then Super Admin Staff → Refresh from shared list.");draw();}});
  };
  var pull=document.getElementById("pullCloud");
  if(pull)pull.onclick=function(){pullCloud(function(ok){alert(ok?"Updated from shared list.":"Could not reach shared list.");});};
};
if(cloudId())pullCloud();
setInterval(function(){if(cloudId())pullCloud();},20000);
try{draw();}catch(e){}
})();
