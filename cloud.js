(function(){
function boot(){
if(typeof db==="undefined"||typeof draw!=="function"){setTimeout(boot,80);return;}
if(window.__poshCloud)return;window.__poshCloud=true;
var URL_KEY="posh-sb-url";
var KEY_KEY="posh-sb-key";
var ROW="posh";
var client=null;
var pushing=false;
var lastPush=0;
var applying=false;
function cfgUrl(){return (localStorage.getItem(URL_KEY)||"").trim().replace(/\/$,"");}
function cfgKey(){return (localStorage.getItem(KEY_KEY)||"").trim();}
function configured(){return !!(cfgUrl()&&cfgKey()&&/^https:\/\/.+\.supabase\.co$/.test(cfgUrl()));}
function ready(){return !!(configured()&&client);}
function loadSdk(done){
  if(window.supabase&&window.supabase.createClient){done(true);return;}
  var s=document.createElement("script");
  s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js";
  s.onload=function(){done(!!(window.supabase&&window.supabase.createClient));};
  s.onerror=function(){done(false);};
  document.head.appendChild(s);
}
function connect(){
  if(!configured()){client=null;return;}
  try{client=window.supabase.createClient(cfgUrl(),cfgKey());}catch(e){client=null;}
}
function slim(src){
  var x=JSON.parse(JSON.stringify(src||db));
  (x.rooms||[]).forEach(function(r){
    var has=!!(r.video||(r.photos&&r.photos.Walkthrough)||r.videoReady);
    r.photos={};r.video="";r.videoReady=has;
  });
  (x.staffMsgs||[]).forEach(function(m){
    if(!m)return;
    if(m.mediaKind==="video"||(m.mediaData&&String(m.mediaData).length>80000)){m.mediaData="";m.mediaReady=true;}
    (m.replies||[]).forEach(function(r){
      if(r.mediaKind==="video"||(r.mediaData&&String(r.mediaData).length>80000)){r.mediaData="";r.mediaReady=true;}
    });
  });
  x.updated=new Date().toISOString();
  return x;
}
function applyPayload(x){
  if(!x||!x.users||!x.users.length)return false;
  if(typeof applyRemote==="function")return applyRemote(x);
  db=x;
  try{localStorage.setItem(typeof KEY==="string"?KEY:"posh-full-v13",JSON.stringify(db));}catch(e){}
  return true;
}
window.poshCloudPush=function(done){
  if(!ready()){if(done)done(false,"Cloud not connected. Super Admin must paste the two keys.");return;}
  if(pushing){if(done)done(false,"Busy");return;}
  pushing=true;lastPush=Date.now();
  var payload=slim(db);
  client.from("hotel_live").upsert({id:ROW,payload:payload,updated:payload.updated}).then(function(res){
    pushing=false;
    if(res.error){if(done)done(false,res.error.message);return;}
    if(done)done(true);
  }).catch(function(err){pushing=false;if(done)done(false,String(err));});
};
window.poshCloudPull=function(done){
  if(!ready()){if(done)done(false);return;}
  client.from("hotel_live").select("payload").eq("id",ROW).maybeSingle().then(function(res){
    if(res.error){if(done)done(false);return;}
    var x=res.data&&res.data.payload;
    applying=true;
    var ok=applyPayload(x);
    applying=false;
    if(ok){try{draw();}catch(e){}}
    if(done)done(ok);
  }).catch(function(){if(done)done(false);});
};
function listen(){
  if(!ready()||window.__poshCloudListen)return;
  window.__poshCloudListen=true;
  try{
    client.channel("posh-live").on("postgres_changes",{event:"*",schema:"public",table:"hotel_live"},function(){
      if(applying)return;
      if(Date.now()-lastPush<1500)return;
      window.poshCloudPull();
    }).subscribe();
  }catch(e){}
}
function hookButtons(){
  var oldPub=window.publishHotel;
  var oldPull=window.refreshHotel;
  window.publishHotel=function(done){
    if(ready()){window.poshCloudPush(done);return;}
    if(oldPub)oldPub(done);else if(done)done(false,"No cloud yet");
  };
  window.refreshHotel=function(done){
    if(ready()){window.poshCloudPull(done);return;}
    if(oldPull)oldPull(done);else if(done)done(false);
  };
  var _save=save;
  save=function(){
    try{_save();}catch(e){}
    if(ready())window.poshCloudPush();
  };
}
function box(){
  if(!user)return "";
  var admin=user.role==="superadmin"||user.role==="ceo";
  var on=ready();
  var html="<div class=card id=cloudBox><h3>Live hotel cloud</h3><p>"+(on?"Connected. Saves go to every signed-in phone without GitHub Publish.":"Not connected. Super Admin pastes the two keys once.")+"</p>";
  if(admin){
    html+="<p>Project URL</p><input id=sbUrl placeholder='https://xxxx.supabase.co' value='"+cfgUrl()+"'>"+
      "<p>Anon / publishable key</p><input id=sbKey type=password placeholder='eyJ... or sb_publishable_...' value='"+cfgKey()+"'>"+
      "<p><button type=button class=btn id=sbSave>Save cloud keys</button> <button type=button class=btn id=sbTest>Test connection</button></p>";
  }
  html+="<p><button type=button class=btn id=sbPull>Refresh live</button> <button type=button class=btn id=sbPush>Publish live</button></p></div>";
  return html;
}
function inject(){
  if(!user)return;
  if(document.getElementById("cloudBox"))return;
  if(!(user.role==="superadmin"||user.role==="ceo"||user.role==="manager"||user.role==="frontdesk"||user.role==="accountant"))return;
  var wrap=document.querySelector(".wrap")||document.getElementById("app");
  if(!wrap)return;
  wrap.insertAdjacentHTML("afterbegin",box());
}
if(!window.__cloudClicks){
  window.__cloudClicks=true;
  document.addEventListener("click",function(ev){
    var t=ev.target;if(!t)return;
    if(t.id==="sbSave"){
      ev.preventDefault();
      var u=((document.getElementById("sbUrl")||{}).value||"").trim();
      var k=((document.getElementById("sbKey")||{}).value||"").trim();
      if(!/^https:\/\/.+\.supabase\.co$/.test(u.replace(/\/$/,""))){alert("URL must look like https://xxxx.supabase.co");return;}
      if(k.length<20){alert("Paste the anon / publishable key");return;}
      localStorage.setItem(URL_KEY,u.replace(/\/$/,""));
      localStorage.setItem(KEY_KEY,k);
      connect();
      alert("Keys saved on this phone. Tap Test connection, then Publish live. Other phones need the same two keys once.");
      try{draw();}catch(e){}
      return;
    }
    if(t.id==="sbTest"){
      ev.preventDefault();
      if(!ready()){alert("Save the keys first");return;}
      client.from("hotel_live").select("id").eq("id",ROW).maybeSingle().then(function(res){
        if(res.error)alert("Connected to Supabase but table missing.\nRun SETUP-CLOUD.sql in the SQL editor.\n\n"+res.error.message);
        else alert("Cloud is live.");
      });
      return;
    }
    if(t.id==="sbPull"){ev.preventDefault();window.refreshHotel(function(ok){alert(ok?"Live hotel loaded":"Could not refresh");});}
    if(t.id==="sbPush"){ev.preventDefault();window.publishHotel(function(ok,err){alert(ok?"Live hotel published":String(err||"fail"));});}
  },true);
}
var _draw=draw;
draw=function(){
  var out=_draw.apply(this,arguments);
  try{inject();}catch(e){}
  return out;
};
loadSdk(function(ok){
  if(!ok)return;
  connect();
  hookButtons();
  if(ready()){
    window.poshCloudPull();
    listen();
    setInterval(function(){if(ready())window.poshCloudPull();},20000);
  }
  try{draw();}catch(e){}
});
}
boot();
})();
