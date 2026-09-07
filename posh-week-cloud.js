(function(){
  var CFG_KEY="posh-week-cloud-cfg";
  var DEFAULT_URL="https://xxmhoiuysulcvltttrue.supabase.co";
  var DEFAULT_KEY="sb_publishable_UCziRAwvUlBk581_kOQdSQ_Pkzori7o";
  var ROW="posh";
  var timer=null, pending=null, lastMsg="Cloud idle";

  function cfg(){
    var c={url:DEFAULT_URL,key:DEFAULT_KEY};
    try{var s=JSON.parse(localStorage.getItem(CFG_KEY)||"null"); if(s&&s.url) c=s;}catch(e){}
    return c;
  }
  function setCfg(url,key){
    localStorage.setItem(CFG_KEY, JSON.stringify({url:(url||"").replace(/\/$/,""), key:key||""}));
  }
  function heads(){
    var c=cfg();
    return {
      apikey:c.key,
      Authorization:"Bearer "+c.key,
      "Content-Type":"application/json",
      Accept:"application/json",
      Prefer:"return=minimal"
    };
  }
  function rest(){ return cfg().url.replace(/\/$/,"")+"/rest/v1/hotel_live"; }
  function setMsg(m){
    lastMsg=m;
    var el=document.getElementById("cloudMsg");
    if(el) el.textContent=m;
  }
  function formBusy(){
    var a=document.activeElement;
    if(!a) return false;
    var tag=(a.tagName||"").toLowerCase();
    if(tag==="input"||tag==="select"||tag==="textarea") return true;
    return false;
  }
  function mergeHotel(incoming){
    if(!incoming || typeof incoming!=="object") return;
    if(!DB) DB={};
    var keys=["users","rooms","fixtures","fdChecks","fdClose","fdOut","lauItems","lauStock","lauMoves","martItems","martStock","martSales","slips","issues","scores","clocks","checkins","shifts","menus","breakfasts","queries","msgs","storeMoves","log","shiftReports","salesQueries","washServices","guestWashes","receipts","inspects","porterConfirms","wa"];
    keys.forEach(function(k){ if(incoming[k]!=null) DB[k]=incoming[k]; });
    try{ localStorage.setItem(KEY, JSON.stringify(DB)); }catch(e){}
  }

  window.cloudRefresh=function(forceDraw){
    var c=cfg();
    if(!c.url||!c.key){ setMsg("Missing URL or key"); return Promise.resolve(); }
    setMsg("Refreshing…");
    return fetch(rest()+"?id=eq."+ROW+"&select=payload,updated",{headers:heads()}).then(function(r){
      return r.text().then(function(t){ var j; try{j=JSON.parse(t)}catch(e){j=t} return {ok:r.ok,status:r.status,j:j}; });
    }).then(function(x){
      if(!x.ok){ setMsg("Refresh failed "+x.status); return; }
      var row=x.j && x.j[0];
      var data=row && (row.payload||row.hotel);
      if(!data){ setMsg("Cloud empty — Publish from Super Admin first"); return; }
      mergeHotel(data);
      setMsg("Refreshed "+new Date().toLocaleTimeString());
      if(forceDraw===false) return;
      if(formBusy() && forceDraw!==true){ setMsg("Refreshed in background — form kept open"); return; }
      if(typeof draw==="function") draw();
    }).catch(function(){ setMsg("Refresh error"); });
  };

  window.cloudPublish=function(){
    var c=cfg();
    if(!c.url||!c.key){ setMsg("Missing URL or key"); return Promise.resolve(); }
    if(!DB) return Promise.resolve();
    setMsg("Publishing…");
    var body=JSON.stringify({payload:DB, updated:new Date().toISOString()});
    return fetch(rest()+"?id=eq."+ROW, {method:"PATCH", headers:heads(), body:body}).then(function(r){
      return r.text().then(function(t){ return {ok:r.ok,status:r.status,t:t}; });
    }).then(function(x){
      if(x.ok){ setMsg("Published "+new Date().toLocaleTimeString()); return; }
      setMsg("Publish failed "+x.status+(x.t?(": "+String(x.t).slice(0,80)):""));
    }).catch(function(){ setMsg("Publish error"); });
  };

  var _save=window.save;
  window.save=function(){
    if(typeof _save==="function") _save();
    clearTimeout(pending);
    pending=setTimeout(function(){ window.cloudPublish(); }, 1200);
  };

  function boxHtml(){
    var c=cfg();
    var admin=typeof role==="function" && (role()==="superadmin"||role()==="ceo");
    return "<div class=card id=cloudBox style='background:#f3e6c5'>"+
      "<h2>Live hotel cloud</h2>"+
      "<p id=cloudMsg>"+lastMsg+"</p>"+
      (admin?("<input id=cUrl placeholder='Project URL' value='"+c.url+"'><input id=cKey placeholder='Publishable key' value='"+c.key+"'><button type=button class=btn id=cSave>Save keys</button> "):"")+
      "<button type=button class=btn id=cPub>Publish</button> "+
      "<button type=button class=btn id=cRef>Refresh</button>"+
      "<p>Same hotel on every phone. Forms stay open while you type.</p></div>";
  }

  function injectBox(){
    var app=document.getElementById("app");
    if(!app || document.getElementById("cloudBox")) return;
    var show=false;
    try{ show = !USER || TAB==="me" || (typeof role==="function" && (role()==="superadmin"||role()==="ceo")); }catch(e){}
    if(!show) return;
    app.insertAdjacentHTML("afterbegin", boxHtml());
    var a=document.getElementById("cSave");
    if(a) a.onclick=function(){
      setCfg(document.getElementById("cUrl").value.trim(), document.getElementById("cKey").value.trim());
      setMsg("Keys saved on this phone");
    };
    var p=document.getElementById("cPub"); if(p) p.onclick=function(){ window.cloudPublish(); };
    var r=document.getElementById("cRef"); if(r) r.onclick=function(){ window.cloudRefresh(true); };
  }

  var _draw=window.draw;
  window.draw=function(){
    _draw();
    injectBox();
  };

  if(!timer) timer=setInterval(function(){ if(USER) window.cloudRefresh(false); }, 30000);
  setTimeout(function(){ window.cloudRefresh(false); }, 800);
})();
