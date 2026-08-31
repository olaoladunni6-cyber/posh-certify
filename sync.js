(function(){
if(typeof db==="undefined")return;
var TOKEN_KEY="posh-gh-token";
var REPO="olaoladunni6-cyber/posh-certify";
var PATH="live.json";
var API="https://api.github.com/repos/"+REPO+"/contents/"+PATH;
var pushing=false;
function token(){return (localStorage.getItem(TOKEN_KEY)||"").trim();}
function setToken(t){t=String(t||"").trim();if(t)localStorage.setItem(TOKEN_KEY,t);}
function applyRemote(x){
  if(!x||!x.users||!x.users.length)return false;
  db=x;
  try{localStorage.setItem(typeof KEY==="string"?KEY:"posh-full-v13",JSON.stringify(db));}catch(e){}
  return true;
}
function headers(write){
  var h={"Accept":"application/vnd.github+json"};
  if(token())h.Authorization="Bearer "+token();
  if(write)h["Content-Type"]="application/json";
  return h;
}
function pullCloud(done){
  fetch(PATH+"?t="+Date.now(),{cache:"no-store"}).then(function(r){
    if(!r.ok)throw new Error(r.status);
    return r.json();
  }).then(function(x){
    var ok=applyRemote(x);
    if(ok){try{draw();}catch(e){}}
    if(done)done(ok);
  }).catch(function(){if(done)done(false);});
}
function pushCloud(done){
  if(!token()){if(done)done(false,"No GitHub token on this phone");return;}
  if(pushing){if(done)done(false,"Busy");return;}
  pushing=true;
  fetch(API,{headers:headers(false)}).then(function(r){
    if(!r.ok)throw new Error("read "+r.status);
    return r.json();
  }).then(function(meta){
    var body=JSON.stringify({
      message:"Posh Manager live hotel "+new Date().toISOString(),
      content:btoa(unescape(encodeURIComponent(JSON.stringify(db)))),
      sha:meta.sha
    });
    return fetch(API,{method:"PUT",headers:headers(true),body:body});
  }).then(function(r){
    pushing=false;
    if(!r.ok)throw new Error("write "+r.status);
    if(done)done(true);
  }).catch(function(err){
    pushing=false;
    if(done)done(false,String(err));
  });
}
var _save=save;
save=function(){
  _save();
  if(token())pushCloud();
};
function cloudBox(){
  var on=!!token();
  return "<div class=card><h3>Shared hotel</h3>"+
    "<p>"+(on?"This device can publish to all phones.":"Paste the GitHub token once so this device can publish.")+"</p>"+
    "<input id=ghTok type=password placeholder='GitHub token'><button class=btn id=saveTok>Save token</button>"+
    "<p><button class=btn id=pullCloud>Refresh from shared list</button> <button class=btn id=pushCloud>Publish this device now</button></p></div>";
}
function hookCloud(){
  var saveTok=document.getElementById("saveTok");
  if(saveTok)saveTok.onclick=function(){
    var v=(document.getElementById("ghTok").value||"").trim();
    if(!v){alert("Paste the token first");return;}
    setToken(v);
    alert("Token saved on this device. Tap Publish this device now.");
    draw();
  };
  var pull=document.getElementById("pullCloud");
  if(pull)pull.onclick=function(){pullCloud(function(ok){alert(ok?"Updated from the shared list.":"Could not read the shared list.");});};
  var push=document.getElementById("pushCloud");
  if(push)push.onclick=function(){
    if(!token()){alert("Save the GitHub token on this device first");return;}
    pushCloud(function(ok,err){alert(ok?"Published. Other phones can Refresh.":("Publish failed. "+(err||"")));});
  };
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
    if(login&&!document.getElementById("pullCloud")){
      var wrap=document.createElement("div");
      wrap.innerHTML=cloudBox();
      login.appendChild(wrap);
      hookCloud();
    }
  }
};
pullCloud();
setInterval(function(){pullCloud();},30000);
try{draw();}catch(e){}
})();
