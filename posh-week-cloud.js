(function(){
  var CFG_KEY="posh-week-cloud-cfg";
  var DEFAULT_URL="https://xxmhoiuysulcvltttrue.supabase.co";
  var DEFAULT_KEY="sb_publishable_UCziRAwvUlBk581_kOQdSQ_Pkzori7o";
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
      Prefer:"return=representation"
    };
  }
  function rest(){ return cfg().url.replace(/\/$/,"")+"/rest/v1/hotel_live"; }

  function setMsg(m){
    lastMsg=m;
    var el=document.getElementById("cloudMsg");
    if(el) el.textContent=m;
  }

  window.cloudRefresh=function(){
    var c=cfg();
    if(!c.url||!c.key){ setMsg("Missing URL or key"); return Promise.resolve(); }
    setMsg("Refreshing…");
    return fetch(rest()+"?id=eq.posh&select=hotel",{headers:heads()}).then(function(r){
      return r.json().then(function(j){ return {ok:r.ok, j:j, status:r.status}; });
    }).then(function(x){
      if(!x.ok){ setMsg("Refresh failed "+x.status); return; }
      var row=x.j && x.j[0];
      if(!row || !row.hotel){ setMsg("Cloud empty — Publish from one phone first"); return; }
      DB=row.hotel;
      try{ localStorage.setItem(KEY, JSON.stringify(DB)); }catch(e){}
      setMsg("Refreshed "+new Date().toLocaleTimeString());
      if(typeof draw==="function") draw();
    }).catch(function(e){ setMsg("Refresh error"); });
  };

  window.cloudPublish=function(){
    var c=cfg();
    if(!c.url||!c.key){ setMsg("Missing URL or key"); return Promise.resolve(); }
    if(!DB) return Promise.resolve();
    setMsg("Publishing…");
    var body=JSON.stringify({id:"posh", hotel:DB});
    return fetch(rest()+"?id=eq.posh",{method:"PATCH",headers:heads(),body:JSON.stringify({hotel:DB})}).then(function(r){
      if(r.status===404 || r.status===406){
        return fetch(rest(),{method:"POST",headers:Object.assign({},heads(),{Prefer:"resolution=merge-duplicates,return=representation"}),body:body});
      }
      if(!r.ok){
        return fetch(rest(),{method:"POST",headers:Object.assign({},heads(),{Prefer:"resolution=merge-duplicates,return=representation"}),body:body});
      }
      return r;
    }).then(function(r){
      if(!r.ok) setMsg("Publish failed "+r.status);
      else setMsg("Published "+new Date().toLocaleTimeString());
    }).catch(function(){ setMsg("Publish error"); });
  };

  var _save=window.save;
  window.save=function(){
    if(typeof _save==="function") _save();
    clearTimeout(pending);
    pending=setTimeout(function(){ window.cloudPublish(); }, 900);
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
      "<p>Every phone uses this same hotel. Tap Refresh if you do not see a change.</p></div>";
  }

  function injectBox(){
    var app=document.getElementById("app");
    if(!app) return;
    if(document.getElementById("cloudBox")) return;
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
    var r=document.getElementById("cRef"); if(r) r.onclick=function(){ window.cloudRefresh(); };
  }

  var _draw=window.draw;
  window.draw=function(){
    _draw();
    injectBox();
  };

  if(!timer) timer=setInterval(function(){ if(USER) window.cloudRefresh(); }, 25000);
  setTimeout(function(){ if(typeof load==="function") load(); window.cloudRefresh(); }, 400);
})();
