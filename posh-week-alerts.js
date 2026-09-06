(function(){
  function perm(){ return (typeof Notification!=="undefined") ? Notification.permission : "unsupported"; }
  function ping(title,body){
    try{
      if(typeof Notification==="undefined") return;
      if(Notification.permission!=="granted") return;
      new Notification(title,{body:body||"Posh Manager",tag:title});
    }catch(e){}
  }
  window.poshAlert=ping;
  function box(){
    var p=perm();
    var st=p==="granted"?"ON":(p==="denied"?"BLOCKED in phone settings":(p==="unsupported"?"This browser cannot alert":"OFF — tap Allow"));
    return "<div class=card id=alertBox style='background:#f3e6c5'><h2>Phone alerts</h2><p>Status: <b>"+st+"</b></p><button type=button class=btn id=allowAlerts>Allow phone alerts</button><button type=button class=btn id=testAlert>Test alert</button><p>Duty manager: room submitted. Front desk: laundry ready. Kitchen: new breakfast code issued. Chat: new message.</p></div>";
  }
  function inject(){
    var app=document.getElementById("app");
    if(!app||!USER||document.getElementById("alertBox")) return;
    if(TAB!=="me" && role()!=="superadmin" && role()!=="ceo" && role()!=="manager" && role()!=="frontdesk") return;
    if(TAB!=="me" && role()!=="superadmin" && role()!=="ceo") {
      /* still show on Me always */
    }
    if(TAB!=="me") return;
    app.insertAdjacentHTML("afterbegin", box());
    var a=document.getElementById("allowAlerts");
    if(a) a.onclick=function(){
      if(typeof Notification==="undefined"){ alert("Use Safari or Chrome and Add to Home Screen"); return; }
      Notification.requestPermission().then(function(p){
        alert(p==="granted"?"Alerts on for this phone":"Permission: "+p);
        draw();
      });
    };
    var t=document.getElementById("testAlert");
    if(t) t.onclick=function(){ ping("Posh Manager","Test alert on this phone"); alert("If nothing popped up, tap Allow first or check Silent mode."); };
  }
  var seen={};
  function watch(){
    if(!DB||!USER) return;
    (DB.rooms||[]).forEach(function(r){
      var k="rm"+r.id+r.status;
      if(seen[k]) return; seen[k]=1;
      if(r.status==="submitted" && (role()==="manager"||role()==="ceo"||role()==="superadmin")) ping("Room submitted","Rm "+r.number+" needs certification");
      if(r.status==="certified" && role()==="frontdesk") ping("Room certified","Rm "+r.number+" ready to sell");
      if(r.status==="ooo" && role()==="frontdesk") ping("OOO","Rm "+r.number+" out of order");
    });
    (DB.guestWashes||[]).forEach(function(w){
      var k="w"+w.id+w.status; if(seen[k]) return; seen[k]=1;
      if(w.status==="ready" && role()==="frontdesk") ping("Laundry ready",w.guest+" Rm "+w.room);
      if(w.status==="sent" && role()==="laundry") ping("Guest laundry in",w.guest+" Rm "+w.room);
    });
    (DB.slips||[]).forEach(function(s){
      var k="s"+s.id+s.status; if(seen[k]) return; seen[k]=1;
      if(s.status==="sent" && role()==="laundry") ping("HK linen in","Rm "+s.room+" item slip");
    });
    (DB.msgs||[]).slice(-8).forEach(function(m){
      var k="m"+m.at+m.text; if(seen[k]) return; seen[k]=1;
      if(m.to===USER.id || (!m.to && m.from!==USER.id)) ping("Message", (m.fromName||"Staff")+": "+(m.text||"").slice(0,80));
    });
  }
  var _draw=window.draw;
  window.draw=function(){ _draw(); inject(); setTimeout(watch,300); };
  setInterval(watch,12000);
})();
