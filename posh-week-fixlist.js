(function(){
  function catalog(){
    return (DB.fixtures||[]).map(function(f){ return {id:f.id,name:f.name,par:Number(f.par||1)}; });
  }
  function roomKey(r){
    return String((r&&r.number)||r||"");
  }
  window.roomItems=function(r){
    if(!DB.roomFx) DB.roomFx={};
    var k=roomKey(r);
    if(DB.roomFx[k] && DB.roomFx[k].length) return DB.roomFx[k];
    return catalog();
  };
  function setRoomItems(k,list){
    DB.roomFx=DB.roomFx||{};
    DB.roomFx[k]=list;
  }
  function itemRow(f,rid,actual){
    var exp=Number(f.par||1);
    var act=actual!=null?actual:exp;
    return "<label>"+f.name+" · expected <b>"+exp+"</b> · actual <input class=fx data-id='"+f.id+"' data-room='"+rid+"' type=number min=0 value='"+act+"'></label>";
  }
  var _viewRooms=window.viewRooms;
  window.viewRooms=function(){
    if(!ROOM) return typeof _viewRooms==="function"?_viewRooms():"<h1>Rooms</h1>";
    var r=findRoom(ROOM);
    if(!r) return typeof _viewRooms==="function"?_viewRooms():"<div class=warn>Missing</div>";
    if(role()!=="housekeeper" && role()!=="porter") return _viewRooms();
    var items=window.roomItems(r);
    var h="<button class=btn id=backRooms>Back</button><h1>Rm "+r.number+"</h1><div class=ok>"+r.site+" · "+r.status+" · items for THIS room</div>";
    h+="<div class=card><h2>Room items (expected vs actual)</h2>";
    items.forEach(function(f){
      var act=r.fx&&r.fx[f.id]!=null?r.fx[f.id]:f.par;
      h+=itemRow(f,r.id,act);
    });
    h+="<button class=btn id=saveFx>Save counts</button></div>";
    if(role()==="housekeeper" && r.status!=="certified" && r.status!=="ooo"){
      h+="<div class=card><h2>Record one video</h2><input id=oneVid type=file accept='video/*' capture='environment'><p>"+(r.videoReady?("VIDEO: "+(r.videoName||"yes")):"NO VIDEO")+"</p></div>";
      h+="<div class=card><h2>Linen to laundry</h2>";
      (DB.lauItems||[]).forEach(function(it){ h+="<label>"+it.name+" <input class=lq data-id='"+it.id+"' type=number min=0 placeholder='0'></label>"; });
      h+="<button class=btn id=sendLau>Send to laundry</button></div>";
      h+="<button class=btn id=submitRm>Submit room</button>";
    }
    if(role()==="porter"){
      h+="<div class=card><h2>After check-out count</h2><p>Enter what is actually in the room. Shortfall is missing.</p><button class=btn id=porterFx>Confirm item count</button></div>";
    }
    return h;
  };
  var _viewDesk=window.viewDesk;
  window.viewDesk=function(){
    var h=typeof _viewDesk==="function"?_viewDesk():"<h1>Desk</h1>";
    if(role()!=="porter" && role()!=="superadmin" && role()!=="manager") return h;
    var inspect=rooms().filter(function(r){ return r.status==="inspect" || r.status==="pending"; });
    if(!inspect.length) return h;
    h+="<div class=card><h2>Porter item check after checkout</h2><p>Same list Super Admin set for each room.</p>";
    inspect.forEach(function(r){
      var items=window.roomItems(r);
      h+="<div class=card><b>Rm "+r.number+"</b>";
      items.forEach(function(f){
        var act=r.fx&&r.fx[f.id]!=null?r.fx[f.id]:"";
        h+="<label>"+f.name+" expected "+f.par+" · found <input class=pfx data-room='"+r.id+"' data-id='"+f.id+"' type=number min=0 value='"+act+"'></label>";
      });
      h+="<input class=pDmg data-id='"+r.id+"' placeholder='Damage'><input class=pForgot data-id='"+r.id+"' placeholder='Forgotten items'>";
      h+="<button type=button class='btn pCount' data-id='"+r.id+"'>Save missing / confirm room</button></div>";
    });
    h+="</div>";
    return h;
  };
  var _viewLists=window.viewLists;
  window.viewLists=function(){
    var h=typeof _viewLists==="function"?_viewLists():"<h1>Lists</h1>";
    if(role()!=="superadmin") return h;
    var pick=(window._fxRoom)||(rooms()[0]&&rooms()[0].number)||"";
    var cur=rooms().filter(function(r){return String(r.number)===String(pick);})[0];
    var items=cur?window.roomItems(cur):catalog();
    h+="<div class=card><h2>Items per room</h2><p>Each room can have different items and expected quantities.</p>";
    h+="<select id=fxPick>"+rooms().map(function(r){
      return "<option value='"+r.number+"'"+(String(r.number)===String(pick)?" selected":"")+">Rm "+r.number+" · "+r.site+"</option>";
    }).join("")+"</select>";
    items.forEach(function(f,i){
      h+="<div class=card><input class=fxN data-i='"+i+"' value='"+f.name+"'><input class=fxP data-i='"+i+"' type=number value='"+f.par+"'><button type=button class='btn savFI' data-i='"+i+"'>Save item</button> <button type=button class='btn bad delFI' data-i='"+i+"'>Remove</button></div>";
    });
    h+="<input id=fxNewN placeholder='New item name'><input id=fxNewP type=number placeholder='Expected qty' value=1><button type=button class=btn id=addFI>Add to this room</button>";
    h+="<p><button type=button class=btn id=copyFI>Copy this list to all rooms at this site</button></p></div>";
    return h;
  };
  var _bind=window.bind;
  window.bind=function(){
    if(typeof _bind==="function") _bind();
    var pick=document.getElementById("fxPick");
    if(pick) pick.onchange=function(){ window._fxRoom=pick.value; draw(); };
    var add=document.getElementById("addFI");
    if(add) add.onclick=function(){
      var k=(document.getElementById("fxPick")||{}).value||window._fxRoom;
      if(!k) return;
      var n=(document.getElementById("fxNewN").value||"").trim();
      var p=parseInt(document.getElementById("fxNewP").value,10)||1;
      if(!n){ alert("Name required"); return; }
      var list=window.roomItems({number:k}).slice();
      list.push({id:"fx"+Date.now(),name:n,par:p});
      setRoomItems(k,list); save(); alert("Added to Rm "+k); draw();
    };
    document.querySelectorAll(".savFI").forEach(function(b){
      b.onclick=function(){
        var k=(document.getElementById("fxPick")||{}).value;
        var i=parseInt(b.getAttribute("data-i"),10);
        var list=window.roomItems({number:k}).slice();
        var nm=document.querySelector(".fxN[data-i='"+i+"']");
        var pr=document.querySelector(".fxP[data-i='"+i+"']");
        if(!list[i]) return;
        if(nm) list[i].name=nm.value.trim()||list[i].name;
        if(pr) list[i].par=parseInt(pr.value,10)||1;
        setRoomItems(k,list); save(); alert("Saved"); draw();
      };
    });
    document.querySelectorAll(".delFI").forEach(function(b){
      b.onclick=function(){
        var k=(document.getElementById("fxPick")||{}).value;
        var i=parseInt(b.getAttribute("data-i"),10);
        var list=window.roomItems({number:k}).slice();
        list.splice(i,1); setRoomItems(k,list); save(); draw();
      };
    });
    var copy=document.getElementById("copyFI");
    if(copy) copy.onclick=function(){
      var k=(document.getElementById("fxPick")||{}).value;
      var src=rooms().filter(function(r){return String(r.number)===String(k);})[0];
      if(!src) return;
      var list=JSON.parse(JSON.stringify(window.roomItems(src)));
      rooms().filter(function(r){return r.site===src.site;}).forEach(function(r){ setRoomItems(r.number,JSON.parse(JSON.stringify(list))); });
      save(); alert("Copied to all "+src.site+" rooms"); draw();
    };
    document.querySelectorAll(".pCount").forEach(function(b){
      b.onclick=function(){
        var r=findRoom(b.getAttribute("data-id")); if(!r) return;
        r.fx=r.fx||{};
        var missing=[];
        document.querySelectorAll(".pfx[data-room='"+r.id+"']").forEach(function(inp){
          var id=inp.getAttribute("data-id");
          var found=parseInt(inp.value,10); if(isNaN(found)) found=0;
          r.fx[id]=found;
          var it=window.roomItems(r).filter(function(x){return x.id===id;})[0];
          var exp=it?Number(it.par||0):0;
          if(found<exp) missing.push((it?it.name:id)+" short "+(exp-found));
        });
        var dmg=(document.querySelector(".pDmg[data-id='"+r.id+"']")||{}).value||"none";
        var fg=(document.querySelector(".pForgot[data-id='"+r.id+"']")||{}).value||"none";
        DB.inspects=DB.inspects||[];
        DB.inspects.push({room:r.number,fx:r.fx,missing:missing,damage:dmg,forgotten:fg,by:USER.name,site:USER.site,at:now(),day:today(),confirmed:true});
        DB.porterConfirms=DB.porterConfirms||[];
        DB.porterConfirms.push({kind:"item check",room:r.number,by:USER.name,site:USER.site,at:now(),day:today(),note:(missing.length?("Missing: "+missing.join(", ")):"All items present")+"; damage "+dmg+"; forgotten "+fg});
        if(missing.length || (dmg&&dmg!=="none")){
          DB.issues=DB.issues||[];
          DB.issues.push({id:"i"+Date.now(),room:r.number,fault:(missing.length?("Missing fixtures: "+missing.join(", ")):"")+(dmg&&dmg!=="none"?(" Damage: "+dmg):""),status:"received",site:USER.site,by:USER.name,at:now()});
        }
        r.status="pending"; r.porterInspect=USER.name;
        save(); alert(missing.length?("Recorded missing: "+missing.join(", ")):"All items present. Room released to HK."); draw();
      };
    });
    var pfx=document.getElementById("porterFx");
    if(pfx) pfx.onclick=function(){
      var r=findRoom(ROOM); if(!r) return;
      r.fx=r.fx||{};
      document.querySelectorAll(".fx").forEach(function(inp){ r.fx[inp.getAttribute("data-id")]=parseInt(inp.value,10)||0; });
      save(); alert("Counts saved for Rm "+r.number); draw();
    };
  };
})();
