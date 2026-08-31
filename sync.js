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
function unionById(a,b){
  var m={};
  (a||[]).concat(b||[]).forEach(function(x){if(x&&x.id)m[x.id]=x;});
  return Object.keys(m).map(function(k){return m[k];});
}
function slim(src){
  var x=JSON.parse(JSON.stringify(src||db));
  (x.rooms||[]).forEach(function(r){
    var has=!!(r.video||(r.photos&&r.photos.Walkthrough)||r.videoReady);
    r.photos={};
    r.video="";
    r.videoReady=has;
  });
  return x;
}
function stampOf(x){
  return String((x&&x.updated)||"")+"|c"+(x&&x.checkins?x.checkins.length:0)+"|u"+(x&&x.users?x.users.length:0)+"|r"+(x&&x.rooms?x.rooms.length:0)+"|v"+(x&&x.rooms?x.rooms.filter(function(r){return r.videoReady||r.status==="submitted";}).length:0);
}
function applyRemote(x){
  if(!x||!x.users||!x.users.length)return false;
  var keepRooms=db.rooms||[];
  var keep={checkins:db.checkins,clocks:db.clocks,fdChecks:db.fdChecks,debts:db.debts,shiftReports:db.shiftReports,slips:db.slips};
  db=x;
  db.checkins=unionById(x.checkins,keep.checkins);
  db.clocks=unionById(x.clocks,keep.clocks);
  db.fdChecks=unionById(x.fdChecks,keep.fdChecks);
  db.debts=unionById(x.debts,keep.debts);
  db.shiftReports=unionById(x.shiftReports,keep.shiftReports);
  db.slips=unionById(x.slips,keep.slips);
  var map={};
  keepRooms.forEach(function(r){map[r.id]=r;});
  (db.rooms||[]).forEach(function(r){
    var loc=map[r.id];
    if(!loc)return;
    if(loc.video)r.video=loc.video;
    if(loc.photos&&loc.photos.Walkthrough){if(!r.photos)r.photos={};r.photos.Walkthrough=loc.photos.Walkthrough;}
    if(loc.videoReady||loc.video)r.videoReady=true;
    if(loc.status==="submitted"||loc.status==="certified")r.status=loc.status;
  });
  try{localStorage.setItem(typeof KEY==="string"?KEY:"posh-full-v13",JSON.stringify(db));}catch(e){}
  lastStamp=stampOf(db);
  return true;
}
function typing(){
  if(window.__poshForceDraw)return false;
  if(window.__poshTyping && Date.now()-window.__poshTyping<20000)return true;
  var a=document.activeElement;
  return !!(a&&(a.tagName==="INPUT"||a.tagName==="TEXTAREA"||a.tagName==="SELECT"));
}
function homeTab(){
  if(typeof isKitchen==="function"&&isKitchen())return "meals";
  if(typeof isLaundry==="function"&&isLaundry())return "laundry";
  if(typeof isStore==="function"&&isStore())return "staff";
  if(typeof isMaint==="function"&&isMaint())return "issues";
  if(typeof isFD==="function"&&isFD())return "desk";
  if(typeof isAcct==="function"&&isAcct())return "desk";
  return "rooms";
}
function headers(write){
  var h={"Accept":"application/vnd.github+json"};
  if(token())h.Authorization="Bearer "+token();
  if(write)h["Content-Type"]="application/json";
  return h;
}
function pullCloud(done){
  if(typing()){if(done)done(false);return;}
  fetch(PATH+"?t="+Date.now(),{cache:"no-store"}).then(function(r){
    if(!r.ok)throw new Error(r.status);
    return r.json();
  }).then(function(x){
    if(typing()){if(done)done(false);return;}
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
  var payload=slim(db);
  fetch(API,{headers:headers(false)}).then(function(r){
    if(!r.ok)throw new Error("read "+r.status);
    return r.json();
  }).then(function(meta){
    var body=JSON.stringify({
      message:"Posh Manager live hotel "+payload.updated,
      content:btoa(unescape(encodeURIComponent(JSON.stringify(payload)))),
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
save=function(){_save();if(token())pushCloud();};
function cloudBox(){
  var on=!!token();
  return "<div class=card><h3>Shared hotel</h3><p>"+(on?"This device can publish.":"Paste the GitHub token.")+"</p><input id=ghTok type=password placeholder='GitHub token'><button class=btn id=saveTok>Save token</button><p><button class=btn id=pullCloud>Refresh from shared list</button> <button class=btn id=pushCloud>Publish this device now</button></p></div>";
}
function hookCloud(){
  var saveTok=document.getElementById("saveTok");
  if(saveTok)saveTok.onclick=function(){var v=(document.getElementById("ghTok").value||"").trim();if(!v)return;setToken(v);alert("Token saved");};
  var pull=document.getElementById("pullCloud");if(pull)pull.onclick=function(){pullCloud(function(ok){alert(ok?"Updated":"Could not refresh");});};
  var push=document.getElementById("pushCloud");if(push)push.onclick=function(){if(!token()){alert("Save token first");return;}pushCloud(function(ok,err){alert(ok?"Published":String(err||"fail"));});};
  var pinok=document.getElementById("pinok");
  if(pinok)pinok.onclick=function(){
    var typed=onlyPin(document.getElementById("pinbox").value);
    var want=onlyPin(pending&&pending.pin);
    if(typed&&want&&typed===want){user=pending;pending=null;tab=homeTab();roomId=null;window.__poshForceDraw=true;draw();}
    else alert("Wrong PIN.");
  };
}
var _vsC=viewStaff;
viewStaff=function(){
  var html=_vsC();
  if(user&&(user.role==="superadmin"||user.role==="frontdesk"||user.role==="manager"||user.role==="ceo"))return cloudBox()+html;
  return html;
};
var _bC=bind;bind=function(){_bC();hookCloud();};
var _drawC=draw;draw=function(){if(typing()&&user)return;_drawC();hookCloud();};
window.cloudBox=cloudBox;
window.publishHotel=pushCloud;
window.refreshHotel=pullCloud;
pullCloud();
setInterval(function(){pullCloud();},30000);
try{draw();}catch(e){}
})();
