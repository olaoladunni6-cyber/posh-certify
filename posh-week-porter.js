(function(){
  function liveGuest(num){
    return (DB.checkins||[]).filter(function(c){
      return String(c.room)===String(num) && c.kind!=="laundry" && !c.checkedOut;
    }).pop();
  }
  function confirms(){
    return (DB.porterConfirms||[]).filter(function(c){return siteOk(c.site);}).slice().reverse();
  }
  var _tabs=window.tabs;
  window.tabs=function(){
    if(role()==="porter") return [["rooms","Rooms"],["desk","Desk"],["chat","Chat"],["me","Me"]];
    return typeof _tabs==="function"?_tabs():[["me","Me"]];
  };
  var _viewStaff=window.viewStaff;
  window.viewStaff=function(){
    var h=typeof _viewStaff==="function"?_viewStaff():"<h1>Staff</h1>";
    if(h.indexOf(">porter<")===-1) h=h.replace("<option>accountant</option>","<option>accountant</option><option>porter</option>");
    return h;
  };
  function board(){
    var rows=confirms().slice(0,20).map(function(c){
      return "<p><b>Rm "+c.room+"</b> · "+c.kind+" · "+(c.guest||"")+" · confirmed by "+c.by+" · "+(c.at||c.day)+" · "+(c.note||"")+"</p>";
    }).join("")||"<p>No porter confirmations yet</p>";
    return "<div class=ok><h2>Porter room-check confirmations</h2>"+rows+"</div>";
  }
  var _viewDesk=window.viewDesk;
  window.viewDesk=function(){
    var h=typeof _viewDesk==="function"?_viewDesk():"<h1>Desk</h1>";
    if(role()==="frontdesk"||role()==="manager"||role()==="ceo"||role()==="superadmin"||role()==="porter") h+=board();
    if(role()!=="porter" && role()!=="superadmin" && role()!=="manager") return h;
    var vacant=rooms().filter(function(r){ return r.status==="certified" && !liveGuest(r.number); });
    var inspect=rooms().filter(function(r){ return r.status==="inspect" || r.status==="pending"; });
    h+="<div class=card><h2>Porter check-in</h2>"+
      "<input id=pName placeholder='Guest name'><select id=pRoom>"+vacant.map(function(r){return "<option>"+r.number+"</option>"}).join("")+"</select>"+
      "<input id=pOut type=date>"+
      "<label><input type=checkbox id=pConfirm> I checked this room (condition, keys, no damage)</label>"+
      "<button type=button class=btn id=porterIn>Confirm and check guest in</button></div>";
    h+="<div class=card><h2>After check-out inspection</h2>";
    h+=inspect.map(function(r){
      return "<div class=card><b>Rm "+r.number+"</b> "+r.status+
        "<input class=pDmg data-id='"+r.id+"' placeholder='Damage found'>"+
        "<input class=pForgot data-id='"+r.id+"' placeholder='Forgotten items'>"+
        "<label><input type=checkbox class=pOk data-id='"+r.id+"'> I confirm I checked this room</label>"+
        "<button type=button class='btn pInsp' data-id='"+r.id+"'>Confirm inspection</button> "+
        "<button type=button class='btn pFix' data-id='"+r.id+"'>Report fault</button></div>";
    }).join("")||"<p>No rooms waiting inspection</p>";
    h+="</div>";
    return h;
  };
  var _bind=window.bind;
  window.bind=function(){
    if(typeof _bind==="function") _bind();
    var pin=document.getElementById("porterIn");
    if(pin) pin.onclick=function(){
      var name=(document.getElementById("pName").value||"").trim();
      var num=document.getElementById("pRoom").value;
      var out=(document.getElementById("pOut")&&document.getElementById("pOut").value)||"";
      var r=byNum(num);
      if(!name||!r){ alert("Guest and certified room required"); return; }
      if(!(document.getElementById("pConfirm")&&document.getElementById("pConfirm").checked)){
        alert("Tick I checked this room before check-in"); return;
      }
      if(r.status!=="certified" || liveGuest(num)){ alert("Room is not vacant and certified"); return; }
      DB.checkins=DB.checkins||[];
      DB.checkins.push({id:"ci"+Date.now(),guest:name,room:num,amount:0,checkout:out,site:USER.site,by:USER.name,day:today(),kind:"stay",checkedOut:false,porter:USER.name,porterChecked:true});
      DB.porterConfirms=DB.porterConfirms||[];
      DB.porterConfirms.push({kind:"check-in",room:num,guest:name,by:USER.name,site:USER.site,at:now(),day:today(),note:"Room checked and guest walked in"});
      r.status="occupied"; r.guest=name; r.checkOut=out; r.porterCheck=USER.name;
      if(typeof note==="function") note("Porter confirmed Rm "+num+" "+name);
      save(); alert("Confirmed: Rm "+num+" checked and guest in"); draw();
    };
    document.querySelectorAll(".pInsp").forEach(function(b){
      b.onclick=function(){
        var r=findRoom(b.getAttribute("data-id")); if(!r) return;
        var box=document.querySelector(".pOk[data-id='"+r.id+"']");
        if(!(box&&box.checked)){ alert("Tick I confirm I checked this room"); return; }
        var dmg=(document.querySelector(".pDmg[data-id='"+r.id+"']")||{}).value||"none";
        var fg=(document.querySelector(".pForgot[data-id='"+r.id+"']")||{}).value||"none";
        DB.inspects=DB.inspects||[];
        DB.inspects.push({room:r.number,damage:dmg,forgotten:fg,by:USER.name,site:USER.site,at:now(),day:today(),confirmed:true});
        DB.porterConfirms=DB.porterConfirms||[];
        DB.porterConfirms.push({kind:"check-out inspection",room:r.number,guest:r.guest||"",by:USER.name,site:USER.site,at:now(),day:today(),note:"Damage: "+dmg+"; forgotten: "+fg});
        if(dmg && dmg!=="none"){
          DB.issues=DB.issues||[];
          DB.issues.push({id:"i"+Date.now(),room:r.number,fault:"Damage after checkout: "+dmg,status:"received",site:USER.site,by:USER.name,at:now()});
        }
        r.status="pending"; r.guest=""; r.hk=""; r.hkName=""; r.videoReady=false; r.check=false; r.porterInspect=USER.name;
        if(typeof note==="function") note("Porter confirmed inspect Rm "+r.number);
        save(); alert("Inspection confirmed for Rm "+r.number); draw();
      };
    });
    document.querySelectorAll(".pFix").forEach(function(b){
      b.onclick=function(){
        var r=findRoom(b.getAttribute("data-id")); if(!r) return;
        var f=prompt("Fault to send to maintenance","")||"";
        if(!f) return;
        DB.issues=DB.issues||[];
        DB.issues.push({id:"i"+Date.now(),room:r.number,fault:f,status:"received",site:USER.site,by:USER.name,at:now()});
        save(); alert("Sent to maintenance"); draw();
      };
    });
    document.querySelectorAll(".coG").forEach(function(b){
      var prev=b.onclick;
      b.onclick=function(ev){
        if(typeof prev==="function") prev.call(b,ev);
        var room=b.getAttribute("data-room");
        var r=byNum(room);
        if(r && r.status==="pending"){ r.status="inspect"; save(); }
      };
    });
  };
})();
