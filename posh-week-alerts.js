(function(){
  var TOPIC=localStorage.getItem("posh-ntfy")||"posh-hospitalita-live";
  var sent={};
  function perm(){ return (typeof Notification!=="undefined") ? Notification.permission : "unsupported"; }
  function ping(title,body){
    try{
      if(typeof Notification!=="undefined" && Notification.permission==="granted"){
        new Notification(title,{body:body||"Posh Manager",tag:title});
      }
    }catch(e){}
  }
  function pushOut(title,body,key){
    if(key){ if(sent[key]) return; sent[key]=1; }
    ping(title,body);
    try{
      fetch("https://ntfy.sh/"+encodeURIComponent(TOPIC),{
        method:"POST",
        headers:{"Title":title,"Tags":"bell,hotel","Priority":"high"},
        body:body||title
      });
    }catch(e){}
  }
  window.poshAlert=function(t,b){ pushOut(t,b); };
  function box(){
    var p=perm();
    var st=p==="granted"?"browser ON":(p==="denied"?"browser BLOCKED":"browser off");
    return "<div class=card id=alertBox style='background:#f3e6c5'><h2>Phone alerts</h2>"+
      "<p>On-page banner: <b>"+st+"</b></p>"+
      "<p>Always-on push topic: <b>"+TOPIC+"</b></p>"+
      "<button type=button class=btn id=allowAlerts>Allow on-page alerts</button> "+
      "<button type=button class=btn id=testAlert>Test both</button>"+
      "<p class=ok>Kitchen must subscribe to this same topic in ntfy. Meal push shows name, room and meal — never the code.</p>"+
      "<input id=ntfyTopic value='"+TOPIC+"'><button type=button class=btn id=saveTopic>Save topic</button></div>";
  }
  function inject(){
    var app=document.getElementById("app");
    if(!app||!USER||TAB!=="me"||document.getElementById("alertBox")) return;
    app.insertAdjacentHTML("afterbegin", box());
    var a=document.getElementById("allowAlerts");
    if(a) a.onclick=function(){
      if(typeof Notification==="undefined"){ alert("Use Chrome or Safari"); return; }
      Notification.requestPermission().then(function(){ draw(); });
      if(navigator.serviceWorker) navigator.serviceWorker.register("sw.js");
    };
    var t=document.getElementById("testAlert");
    if(t) t.onclick=function(){ pushOut("Posh Manager","Test push including kitchen"); };
    var s=document.getElementById("saveTopic");
    if(s) s.onclick=function(){
      TOPIC=(document.getElementById("ntfyTopic").value||"").trim()||TOPIC;
      localStorage.setItem("posh-ntfy",TOPIC);
      draw();
    };
  }
  var seen={};
  function watch(){
    if(!DB||!USER) return;
    (DB.rooms||[]).forEach(function(r){
      var k="rm"+r.id+r.status; if(seen[k]) return; seen[k]=1;
      if(r.status==="submitted") pushOut("Room submitted","Rm "+r.number+" needs certification",k);
      if(r.status==="certified") pushOut("Room certified","Rm "+r.number+" ready to sell",k);
      if(r.status==="ooo") pushOut("OOO","Rm "+r.number+" out of order",k);
    });
    (DB.guestWashes||[]).forEach(function(w){
      var k="w"+w.id+w.status; if(seen[k]) return; seen[k]=1;
      if(w.status==="ready") pushOut("Laundry ready",w.guest+" Rm "+w.room,k);
      if(w.status==="sent") pushOut("Guest laundry in",w.guest+" Rm "+w.room,k);
    });
    (DB.slips||[]).forEach(function(s){
      var k="s"+s.id+s.status; if(seen[k]) return; seen[k]=1;
      if(s.status==="sent") pushOut("HK linen in","Rm "+s.room+" item counts",k);
    });
    (DB.breakfasts||[]).forEach(function(b){
      var k="bf"+(b.guest||"")+(b.room||"")+(b.day||"")+(b.status||"")+(b.meal||"");
      if(seen[k]) return; seen[k]=1;
      var line=(b.guest||"Guest")+" Rm "+(b.room||"-")+" · "+(b.meal||"")+" · "+(b.status||"waiting");
      if(b.status==="served") pushOut("Breakfast served",line,k);
      else pushOut("Breakfast allocated",line+" — kitchen verify with guest code",k);
    });
    (DB.msgs||[]).slice(-5).forEach(function(m){
      var k="m"+(m.at||"")+(m.text||""); if(seen[k]) return; seen[k]=1;
      if(m.from!== (USER&&USER.id)) pushOut("Message",(m.fromName||"Staff")+": "+String(m.text||"").slice(0,80),k);
    });
  }
  var _draw=window.draw;
  window.draw=function(){ _draw(); inject(); setTimeout(watch,400); };
  setInterval(watch,15000);
  try{ if(navigator.serviceWorker) navigator.serviceWorker.register("sw.js"); }catch(e){}
})();
