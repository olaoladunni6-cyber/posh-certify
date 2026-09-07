(function(){
  function pushMissing(room, items, by){
    if(!items || !items.length) return;
    DB.missing=DB.missing||[];
    DB.missing.push({id:"ms"+Date.now(),room:room,items:items,by:by||USER.name,site:USER.site,at:now(),day:today(),status:"open",to:"duty manager"});
    if(typeof note==="function") note("MISSING to DM Rm "+room+": "+items.join(", "));
    DB.msgs=DB.msgs||[];
    DB.msgs.push({id:"m"+Date.now(),from:USER.name,to:"manager",site:USER.site,text:"Missing items Rm "+room+": "+items.join(", "),at:now(),day:today(),kind:"missing"});
  }
  function pushMaint(room, text){
    if(!text) return;
    DB.issues=DB.issues||[];
    DB.issues.push({id:"i"+Date.now(),room:room,fault:text,status:"received",site:USER.site,by:USER.name,at:now(),day:today(),to:"maintenance"});
    if(typeof note==="function") note("Issue to maintenance Rm "+room+": "+text);
  }
  function board(){
    var rows=(DB.missing||[]).filter(function(m){return siteOk(m.site)&&m.status!=="closed";}).slice().reverse();
    if(!rows.length) return "<div class=card><h2>Missing items — duty manager</h2><p>None open</p></div>";
    return "<div class=warn><h2>Missing items — duty manager</h2>"+rows.map(function(m){
      return "<p><b>Rm "+m.room+"</b> · "+m.items.join(", ")+" · "+m.by+" · "+m.at+
        (role()==="manager"||role()==="superadmin"?" <button type=button class='btn ackMiss' data-id='"+m.id+"'>Seen</button>":"")+"</p>";
    }).join("")+"</div>";
  }
  var _viewRooms=window.viewRooms;
  window.viewRooms=function(){
    var h=typeof _viewRooms==="function"?_viewRooms():"<h1>Rooms</h1>";
    if(role()==="manager"||role()==="ceo"||role()==="superadmin") h=board()+h;
    return h;
  };
  var _viewFix=window.viewFix;
  window.viewFix=function(){
    var h=typeof _viewFix==="function"?_viewFix():"<h1>Maintenance</h1>";
    var mine=(DB.issues||[]).filter(function(i){return siteOk(i.site);}).slice().reverse();
    h+="<div class=card><h2>Issues logged to maintenance</h2>"+(mine.map(function(i){
      return "<p><b>Rm "+i.room+"</b> · "+i.status+" · "+i.fault+" · "+i.by+"</p>";
    }).join("")||"<p>None</p>")+"</div>";
    return h;
  };
  function collectFx(sel){
    var missing=[];
    document.querySelectorAll(sel).forEach(function(inp){
      var id=inp.getAttribute("data-id");
      var found=parseInt(inp.value,10); if(isNaN(found)) found=0;
      var rid=inp.getAttribute("data-room");
      var r=rid?findRoom(rid):findRoom(ROOM);
      if(!r) return;
      r.fx=r.fx||{}; r.fx[id]=found;
      var it=(window.roomItems?window.roomItems(r):[]).filter(function(x){return x.id===id;})[0];
      var exp=it?Number(it.par||0):0;
      if(found<exp) missing.push((it?it.name:id)+" short "+(exp-found));
    });
    return missing;
  }
  var _bind=window.bind;
  window.bind=function(){
    if(typeof _bind==="function") _bind();
    var save=document.getElementById("saveFx");
    if(save){
      var prev=save.onclick;
      save.onclick=function(){
        var r=findRoom(ROOM);
        var missing=collectFx(".fx");
        if(typeof prev==="function") prev.call(save);
        if(r && missing.length) pushMissing(r.number, missing, USER.name);
        save(); draw();
      };
    }
    document.querySelectorAll(".pCount").forEach(function(b){
      var prev=b.onclick;
      b.onclick=function(ev){
        var r=findRoom(b.getAttribute("data-id"));
        var missing=collectFx(".pfx[data-room='"+b.getAttribute("data-id")+"']");
        var dmg=(document.querySelector(".pDmg[data-id='"+b.getAttribute("data-id")+"']")||{}).value||"";
        if(typeof prev==="function") prev.call(b,ev);
        if(r && missing.length) pushMissing(r.number, missing, USER.name);
        if(r && dmg && dmg!=="none") pushMaint(r.number, "Damage / fault: "+dmg);
        save();
      };
    });
    document.querySelectorAll(".ackMiss").forEach(function(b){
      b.onclick=function(){
        (DB.missing||[]).forEach(function(m){ if(m.id===b.getAttribute("data-id")) m.status="seen"; });
        save(); draw();
      };
    });
  };
})();
