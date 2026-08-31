(function(){
if(typeof db==="undefined")return;
var TOKEN_KEY="posh-gh-token";
var REPO="olaoladunni6-cyber/posh-certify";
var PATH="live.json";
var API="https://api.github.com/repos/"+REPO+"/contents/"+PATH;
var pushing=false;
var lastStamp="";
function token(){return (localStorage.getItem(TOKEN_KEY)||"").trim();}
function setToken(t){t=String(t||"").trim();if(t)localStorage.setItem(TOKEN_KEY,t);}
function onlyPin(s){return String(s||"").replace(/\D/g,"");}
function stampOf(x){return String((x&&x.updated)||"")+"|"+(x&&x.users?x.users.length:0)+"|"+(x&&x.rooms?x.rooms.length:0)+"|"+(x&&x.issues?x.issues.length:0)+"|"+(x&&x.shiftReports?x.shiftReports.length:0);}
function notify(title,body){
  if(!("Notification" in window))return;
  if(Notification.permission!=="granted")return;
  try{new Notification(title,{body:body,tag:"posh-hotel"});}catch(e){}
}
function applyRemote(x){
  if(!x||!x.users||!x.users.length)return false;
  var st=stampOf(x);
  var changed=lastStamp&&st!==lastStamp;
  db=x;
  try{localStorage.setItem(typeof KEY==="string"?KEY:"posh-full-v13",JSON.stringify(db));}catch(e){}
  if(changed)notify("Posh Manager","Hotel list updated");
  lastStamp=st;
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
  db.updated=new Date().toISOString();
  fetch(API,{headers:headers(false)}).then(function(r){
    if(!r.ok)throw new Error("read "+r.status);
    return r.json();
  }).then(function(meta){
    var body=JSON.stringify({
      message:"Posh Manager live hotel "+db.updated,
      content:btoa(unescape(encodeURIComponent(JSON.stringify(db)))),
      sha:meta.sha
    });
    return fetch(API,{method:"PUT",headers:headers(true),body:body});
  }).then(function(r){
    pushing=false;
    if(!r.ok)throw new Error("write "+r.status);
    lastStamp=stampOf(db);
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
  var perm=("Notification" in window)?Notification.permission:"denied";
  return "<div class=card><h3>Shared hotel</h3>"+
    "<p>"+(on?"This device can publish to all phones.":"Paste the GitHub token once so this device can publish.")+"</p>"+
    "<input id=ghTok type=password placeholder='GitHub token'><button class=btn id=saveTok>Save token</button>"+
    "<p><button class=btn id=pullCloud>Refresh from shared list</button> <button class=btn id=pushCloud>Publish this device now</button></p>"+
    (perm==="granted"?"<p>Phone alerts are on.</p>":"<p><button class=btn id=allowAlert>Allow phone alerts</button></p>")+"</div>";
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
  var al=document.getElementById("allowAlert");
  if(al)al.onclick=function(){
    if(!("Notification" in window)){alert("This phone cannot show banners");return;}
    Notification.requestPermission().then(function(p){
      if(p==="granted")notify("Posh Manager","Alerts are on");
      draw();
    });
  };
  var pinok=document.getElementById("pinok");
  if(pinok)pinok.onclick=function(){
    var typed=onlyPin(document.getElementById("pinbox").value);
    var want=onlyPin(pending&&pending.pin);
    if(typed&&want&&typed===want){
      user=pending;pending=null;
      tab=(typeof isKitchen==="function"&&isKitchen())?"meals":((typeof isLaundry==="function"&&isLaundry())?"laundry":((typeof isStore==="function"&&isStore())?"staff":((typeof isMaint==="function"&&isMaint())?"issues":"rooms")));
      roomId=null;draw();
    }else alert("Wrong PIN. Front Desk VI A is 1103.");
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
  hookCloud();
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
if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js").catch(function(){});
pullCloud();
setInterval(function(){pullCloud();},30000);
try{draw();}catch(e){}
})();
