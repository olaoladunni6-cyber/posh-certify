(function(){
  function cfg(){
    DB.dmAlerts=DB.dmAlerts||{
      rooms:true, missing:true, issues:true, laundry:true, meals:false, chat:true,
      ikeja:"", vi:"", hotel:""
    };
    return DB.dmAlerts;
  }
  function on(k){ return cfg()[k]!==false; }
  function digits(n){ return String(n||"").replace(/\D/g,""); }
  function dmPhone(site){
    var c=cfg();
    var fromStaff=(DB.users||[]).filter(function(u){ return u.role==="manager" && u.site===site && u.whatsapp; })[0];
    if(fromStaff) return digits(fromStaff.whatsapp);
    return digits((site==="Victoria Island"?c.vi:c.ikeja)||c.hotel||"");
  }
  function fire(title,body,site){
    if(typeof window.poshAlert==="function") window.poshAlert(title,body);
    var phone=dmPhone(site||(USER&&USER.site));
    if(!phone) return;
    try{
      /* store last WA ping only; opening every event would flood */
      DB.dmPings=DB.dmPings||[];
      DB.dmPings.push({title:title,body:body,phone:phone,at:now(),site:site});
    }catch(e){}
  }
  function panel(){
    var c=cfg();
    return "<div class=card id=dmAlertBox style='background:#f3e6c5'><h2>Duty manager alerts</h2>"+
      "<label><input type=checkbox id=daRooms "+(c.rooms?"checked":"")+"> Room submitted / certified / OOO</label>"+
      "<label><input type=checkbox id=daMiss "+(c.missing?"checked":"")+"> Missing room items</label>"+
      "<label><input type=checkbox id=daIss "+(c.issues?"checked":"")+"> Maintenance issues</label>"+
      "<label><input type=checkbox id=daLau "+(c.laundry?"checked":"")+"> Laundry</label>"+
      "<label><input type=checkbox id=daMeal "+(c.meals?"checked":"")+"> Breakfast</label>"+
      "<label><input type=checkbox id=daChat "+(c.chat?"checked":"")+"> Staff messages</label>"+
      "<p>WhatsApp fallback (country code)</p>"+
      "<input id=daIk placeholder='Ikeja DM 2348...' value='"+(c.ikeja||"")+"'>"+
      "<input id=daVi placeholder='VI DM 2348...' value='"+(c.vi||"")+"'>"+
      "<input id=daHt placeholder='Hotel DM line' value='"+(c.hotel||"")+"'>"+
      "<button type=button class=btn id=saveDA>Save duty manager alerts</button> "+
      "<button type=button class=btn id=testDA>Test DM alert</button> "+
      "<button type=button class=btn id=waDA>Open DM WhatsApp</button>"+
      "<p>Staff card WhatsApp is used first if the duty manager has a number saved.</p></div>";
  }
  var _viewMe=window.viewMe;
  window.viewMe=function(){
    var h=typeof _viewMe==="function"?_viewMe():"<h1>Me</h1>";
    if(role()==="manager"||role()==="superadmin"||role()==="ceo") h+=panel();
    return h;
  };
  var seen={};
  function watch(){
    if(!DB||!USER) return;
    if(on("rooms")) (DB.rooms||[]).forEach(function(r){
      var k="dmr"+r.id+r.status; if(seen[k]) return; seen[k]=1;
      if(r.status==="submitted") fire("Certify needed","Rm "+r.number,r.site);
      if(r.status==="ooo") fire("OOO","Rm "+r.number,r.site);
    });
    if(on("missing")) (DB.missing||[]).forEach(function(m){
      var k="dmm"+(m.id||m.at); if(seen[k]) return; seen[k]=1;
      if(m.status!=="seen") fire("Missing items","Rm "+m.room+": "+(m.items||[]).join(", "),m.site);
    });
    if(on("issues")) (DB.issues||[]).forEach(function(i){
      var k="dmi"+(i.id||"")+i.status; if(seen[k]) return; seen[k]=1;
      if(i.status!=="completed") fire("Maintenance","Rm "+i.room+" "+i.fault,i.site);
    });
  }
  var _bind=window.bind;
  window.bind=function(){
    if(typeof _bind==="function") _bind();
    var s=document.getElementById("saveDA");
    if(s) s.onclick=function(){
      DB.dmAlerts={
        rooms:!!document.getElementById("daRooms").checked,
        missing:!!document.getElementById("daMiss").checked,
        issues:!!document.getElementById("daIss").checked,
        laundry:!!document.getElementById("daLau").checked,
        meals:!!document.getElementById("daMeal").checked,
        chat:!!document.getElementById("daChat").checked,
        ikeja:document.getElementById("daIk").value.trim(),
        vi:document.getElementById("daVi").value.trim(),
        hotel:document.getElementById("daHt").value.trim()
      };
      save(); alert("Duty manager alerts saved"); draw();
    };
    var t=document.getElementById("testDA");
    if(t) t.onclick=function(){ fire("Posh DM test","Alert config works",USER.site); alert("Test sent"); };
    var w=document.getElementById("waDA");
    if(w) w.onclick=function(){
      var p=dmPhone(USER.site);
      var url=p?("https://wa.me/"+p+"?text="+encodeURIComponent("Posh duty manager desk")):"https://wa.me/";
      window.open(url,"_blank");
    };
  };
  var _draw=window.draw;
  window.draw=function(){ _draw(); setTimeout(watch,500); };
  setInterval(watch,20000);
})();
