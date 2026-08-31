(function(){
if(typeof db==="undefined")return;
var LIVE="live.json";
function applyRemote(x){
  if(!x||!x.users||!x.users.length)return false;
  db=x;
  try{localStorage.setItem(typeof KEY==="string"?KEY:"posh-full-v13",JSON.stringify(db));}catch(e){}
  return true;
}
function downloadLocal(){
  var blob=new Blob([JSON.stringify(db,null,2)],{type:"application/json"});
  var a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="posh-backup-"+(typeof today==="function"?today():"data")+".json";
  a.click();
}
function pullCloud(done){
  fetch(LIVE+"?t="+Date.now(),{cache:"no-store"}).then(function(r){
    if(!r.ok)throw new Error(r.status);
    return r.json();
  }).then(function(x){
    var ok=applyRemote(x);
    if(ok){try{draw();}catch(e){}}
    if(done)done(ok);
  }).catch(function(){if(done)done(false);});
}
function startCloud(){
  downloadLocal();
  alert("The internet locker is blocked on this network. A backup file was downloaded. Send that file in this Grok chat and it will be published to the shared link. Then each phone taps Refresh from shared list.");
}
function cloudBox(){
  return "<div class=card><h3>Shared hotel</h3><p>Phones read the published hotel list from this same app link.</p><button class=btn id=startCloud>Start shared hotel</button> <button class=btn id=pullCloud>Refresh from shared list</button></div>";
}
function hookCloud(){
  var start=document.getElementById("startCloud");
  if(start)start.onclick=function(){startCloud();};
  var pull=document.getElementById("pullCloud");
  if(pull)pull.onclick=function(){pullCloud(function(ok){alert(ok?"Updated from the shared list.":"No published hotel list yet. Send the backup file in the Grok chat first.");});};
}
var _vsC=viewStaff;
viewStaff=function(){
  var html=_vsC();
  if(user&&user.role==="superadmin")return cloudBox()+html;
  return html;
};
var _bC=bind;
bind=function(){_bC();hookCloud();};
var _drawC=draw;
draw=function(){
  _drawC();
  if(!user){
    var login=document.querySelector(".login");
    if(login&&!document.getElementById("startCloud")){
      var wrap=document.createElement("div");
      wrap.innerHTML=cloudBox();
      login.appendChild(wrap);
      hookCloud();
    }
  }
};
pullCloud();
try{draw();}catch(e){}
})();
