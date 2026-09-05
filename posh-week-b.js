function bind(){
  function on(id,fn){var e=document.getElementById(id); if(e) e.onclick=fn}
  document.querySelectorAll(".openR").forEach(function(b){b.onclick=function(){ROOM=b.getAttribute("data-id"); draw()}});
  on("backRooms",function(){ROOM=null;TAB="rooms";draw()});
  on("doAssign",function(){
    var r=findRoom(document.getElementById("asRoom").value);
    var hk=DB.users.filter(function(u){return u.id===document.getElementById("asHk").value})[0];
    if(!r||!hk)return;
    if(r.status==="certified"){toast("Certified rooms stay closed. Return to service first.");return}
    r.hk=hk.id; r.hkName=hk.name; r.job=document.getElementById("asJob").value; r.status="pending"; r.videoReady=false; r.check=false;
    save(); toast("Assigned Rm "+r.number+" to "+hk.name); draw();
  });
  on("saveFx",function(){
    var r=findRoom(ROOM); if(!r)return; r.fx={}; r.check=true;
    document.querySelectorAll(".fx").forEach(function(inp){r.fx[inp.getAttribute("data-id")]=parseInt(inp.value,10)||0});
    save(); toast("Checklist saved");
  });
  var vid=document.getElementById("oneVid");
  if(vid) vid.onchange=function(){
    var r=findRoom(ROOM); if(!r||!this.files||!this.files[0])return;
    r.videoReady=true; r.videoName=this.files[0].name; save(); toast("Video attached"); draw();
  };
  on("sendLau",function(){
    var r=findRoom(ROOM); if(!r)return;
    var items={}; var t=parseInt((document.getElementById("ltowel")||{}).value,10); if(t>0)items.bath_towel=t;
    var s=parseInt((document.getElementById("lsheet")||{}).value,10); if(s>0)items.sheet=s;
    var p=parseInt((document.getElementById("lpillow")||{}).value,10); if(p>0)items.pillow=p;
    if(!Object.keys(items).length){toast("Enter counts");return}
    DB.slips.push({id:uid("s"),room:r.number,site:r.site,by:USER.name,at:now(),items:items,status:"sent",day:today()});
    r.laundry=true; save(); toast("Sent to laundry"); draw();
  });
  on("submitRm",function(){
    var r=findRoom(ROOM); if(!r)return;
    if(r.status==="certified"){toast("Locked");return}
    if(!r.check){toast("Save checklist first");return}
    if(!r.videoReady){toast("Attach one video first");return}
    r.status="submitted"; r.submittedAt=now(); r.hkName=USER.name; save(); toast("Submitted for certification"); draw();
  });
  on("certify",function(){
    var r=findRoom(ROOM); if(!r)return;
    if(r.status!=="submitted"){toast("Housekeeper must submit first. Now: "+r.status);return}
    r.status="certified"; r.certifiedBy=USER.name; r.certifiedAt=now(); save(); toast("Certified"); draw();
  });
  on("rts",function(){
    var r=findRoom(ROOM); if(!r)return;
    var note=prompt("What should the housekeeper do?","Spring clean"); if(note===null)return;
    r.status="pending"; r.job="inservice"; r.hkNote=note; r.videoReady=false; r.check=false; r.returnedCount=(r.returnedCount||0)+1;
    DB.scores.push({id:uid("sc"),hk:r.hk,day:today(),rating:"return",amount:500,by:USER.name});
    save(); toast("Returned · ₦500 logged"); draw();
  });
  on("ooo",function(){var r=findRoom(ROOM); if(!r)return; r.status="ooo"; save(); toast("OOO"); draw()});
  on("backSvc",function(){var r=findRoom(ROOM); if(!r)return; r.status="pending"; save(); draw()});
  on("saveFolio",function(){
    var name=document.getElementById("gName").value.trim();
    var num=document.getElementById("gRoom").value;
    var out=document.getElementById("gOut").value;
    var r=byNum(num);
    if(!name||!r){toast("Guest and room required");return}
    if(r.status!=="certified"){toast("Only a certified room can be sold");return}
    if(!out){toast("Checkout date required");return}
    DB.checkins.push({id:uid("c"),guest:name,room:num,amount:parseFloat(document.getElementById("gAmt").value)||0,debt:parseFloat(document.getElementById("gDebt").value)||0,paid:parseFloat(document.getElementById("gPaid").value)||0,checkout:out,site:USER.site,by:USER.name,day:today(),at:now()});
    r.status="occupied"; r.guest=name; r.checkOut=out; save(); toast("Folio saved"); draw();
  });
  on("doExt",function(){
    var num=document.getElementById("exRoom").value.trim();
    var d=document.getElementById("exDate").value;
    var r=byNum(num); if(!r||!d){toast("Room and new date");return}
    r.checkOut=d; r.extended=true; save(); toast("Extended"); draw();
  });
  on("sellMart",function(){
    var id=document.getElementById("mItem").value, qty=parseInt(document.getElementById("mQty").value,10)||0;
    var it=DB.martItems.filter(function(x){return x.id===id})[0];
    if(!it||!(qty>0))return;
    if(stock(id,USER.site)<qty){toast("Not enough stock at "+USER.site);return}
    setStock(id,USER.site,stock(id,USER.site)-qty);
    DB.martSales.push({id:uid("ms"),item:id,name:it.name,qty:qty,amount:qty*it.price,room:document.getElementById("mRoom").value,site:USER.site,by:USER.name,day:today(),at:now()});
    save(); toast("Sold"); draw();
  });
  on("recvMart",function(){
    var id=document.getElementById("rItem").value, qty=parseInt(document.getElementById("rQty").value,10)||0;
    setStock(id,USER.site,stock(id,USER.site)+qty); save(); toast("Received"); draw();
  });
  on("addMart",function(){
    var name=document.getElementById("ni").value.trim(); if(!name)return;
    var id="m"+Date.now(), price=parseFloat(document.getElementById("np").value)||0, q=parseInt(document.getElementById("nq").value,10)||0;
    DB.martItems.push({id:id,name:name,price:price});
    SITES.forEach(function(s){DB.martStock.push({item:id,site:s,qty:q})});
    save(); toast("Item added"); draw();
  });
  on("editMart",function(){
    var id=document.getElementById("ei").value, it=DB.martItems.filter(function(x){return x.id===id})[0]; if(!it)return;
    var p=document.getElementById("ep").value, s=document.getElementById("es").value, v=document.getElementById("ev").value;
    if(p!=="") it.price=parseFloat(p)||0;
    if(s!=="") setStock(id,"Ikeja",s);
    if(v!=="") setStock(id,"Victoria Island",v);
    save(); toast("Saved"); draw();
  });
  on("delMart",function(){
    var id=document.getElementById("ei").value;
    DB.martItems=DB.martItems.filter(function(x){return x.id!==id}); save(); draw();
  });
  on("saveMenu",function(){
    var day=document.getElementById("mDay").value, raw=document.getElementById("mChoices").value;
    var choices=raw.split(",").map(function(x){return x.trim()}).filter(Boolean);
    DB.menus=DB.menus.filter(function(m){return !(m.day===day&&m.site===USER.site)});
    DB.menus.push({day:day,site:USER.site,choices:choices,by:USER.name}); save(); toast("Menu saved"); draw();
  });
  on("issueBf",function(){
    var g=document.getElementById("bfName").value.trim(); if(!g)return;
    var code=String(1000+Math.floor(Math.random()*9000));
    DB.breakfasts.push({id:uid("b"),guest:g,room:document.getElementById("bfRoom").value,meal:document.getElementById("bfMeal").value,code:code,status:"waiting",site:USER.site,day:today()});
    save(); toast("Give guest this code: "+code);
  });
  on("verBf",function(){
    var code=document.getElementById("vCode").value.trim();
    var b=(DB.breakfasts||[]).filter(function(x){return x.code===code&&x.site===USER.site})[0];
    var box=document.getElementById("vHit");
    if(!b){box.innerHTML="<div class=warn>Invalid code</div>";return}
    if(b.status==="served"){box.innerHTML="<div class=warn>Already served</div>";return}
    b.status="served"; b.servedAt=now(); save();
    box.innerHTML="<div class=ok>Serve "+b.guest+" · "+b.meal+"</div>"; draw();
  });
  document.querySelectorAll(".recSlip").forEach(function(b){b.onclick=function(){
    var s=DB.slips.filter(function(x){return x.id===b.getAttribute("data-id")})[0]; if(!s)return;
    s.status="received"; s.receivedBy=USER.name; save(); draw();
  }});
  document.querySelectorAll(".issSlip").forEach(function(b){b.onclick=function(){
    var s=DB.slips.filter(function(x){return x.id===b.getAttribute("data-id")})[0]; if(!s)return;
    s.status="issued"; save(); draw();
  }});
  on("logFault",function(){
    DB.issues.push({id:uid("i"),room:document.getElementById("fRoom").value,site:USER.site,fault:document.getElementById("fTxt").value,by:USER.name,openedAt:Date.now(),status:"received"});
    save(); toast("Fault logged"); draw();
  });
  document.querySelectorAll(".stFix").forEach(function(sel){sel.onchange=function(){
    var i=DB.issues.filter(function(x){return x.id===sel.getAttribute("data-id")})[0]; if(!i)return; i.status=sel.value; save();
  }});
  document.querySelectorAll(".okFix").forEach(function(b){b.onclick=function(){
    var i=DB.issues.filter(function(x){return x.id===b.getAttribute("data-id")})[0]; if(!i)return; i.cert="ok"; save(); toast("Job certified");
  }});
  document.querySelectorAll(".sc").forEach(function(b){b.onclick=function(){
    DB.scores.push({id:uid("sc"),hk:b.getAttribute("data-id"),day:today(),rating:b.getAttribute("data-r"),by:USER.name});
    save(); toast("Scored"); draw();
  }});
  on("addStaff",function(){
    DB.users.push({id:uid("u"),name:document.getElementById("sn").value,role:document.getElementById("sr").value,site:document.getElementById("ss").value,pin:document.getElementById("sp").value});
    save(); draw();
  });
  document.querySelectorAll(".edU").forEach(function(b){b.onclick=function(){
    var u=DB.users[parseInt(b.getAttribute("data-i"),10)];
    u.name=prompt("Name",u.name)||u.name;
    u.role=prompt("Role",u.role)||u.role;
    u.site=prompt("Site",u.site)||u.site;
    u.pin=prompt("PIN",u.pin)||u.pin;
    save(); draw();
  }});
  document.querySelectorAll(".delU").forEach(function(b){b.onclick=function(){
    if(!confirm("Delete staff?"))return;
    DB.users.splice(parseInt(b.getAttribute("data-i"),10),1); save(); draw();
  }});
  on("addRoom",function(){
    var n=document.getElementById("rn").value.trim(); if(!n)return;
    DB.rooms.push({id:uid("r"),number:n,site:document.getElementById("rsite").value,type:"Standard",status:"pending",hk:"",job:"",videoReady:false,check:false,fx:{}});
    save(); draw();
  });
  document.querySelectorAll(".delR").forEach(function(b){b.onclick=function(){
    DB.rooms=DB.rooms.filter(function(r){return r.id!==b.getAttribute("data-id")}); save(); draw();
  }});
  on("stIn",function(){
    DB.storeMoves.push({item:document.getElementById("stItem").value,qty:parseInt(document.getElementById("stQty").value,10)||0,site:USER.site,by:USER.name,at:now()});
    save(); draw();
  });
  on("clockIn",function(){DB.clocks.push({id:uid("ck"),day:today(),site:USER.site,by:USER.name,inAt:new Date().toLocaleTimeString(),outAt:""}); save(); toast("Clocked in"); draw()});
  on("clockOut",function(){
    var c=(DB.clocks||[]).filter(function(x){return x.by===USER.name&&x.day===today()&&!x.outAt}).pop();
    if(c) c.outAt=new Date().toLocaleTimeString(); save(); draw();
  });
  on("subShift",function(){
    DB.shifts.push({id:uid("sh"),day:today(),site:USER.site,by:USER.name,inhouse:document.getElementById("inhouse").value,expected:document.getElementById("expected").value,incident:document.getElementById("inc").value,at:now()});
    save(); toast("Shift submitted"); draw();
  });
  on("sendQ",function(){
    DB.queries.push({id:uid("q"),site:group(USER)?"Ikeja":USER.site,by:USER.name,text:document.getElementById("qTxt").value,at:now(),thread:[]});
    save(); draw();
  });
  on("replyQ",function(){
    var q=(DB.queries||[]).filter(function(x){return siteOk(x.site)}).pop();
    if(!q){toast("No query");return}
    q.thread=q.thread||[]; q.thread.push({by:USER.name,text:document.getElementById("qAns").value,at:now()});
    save(); draw();
  });
  on("sendC",function(){
    var to=document.getElementById("cTo").value;
    var tu=DB.users.filter(function(u){return u.id===to})[0];
    DB.msgs.push({id:uid("m"),from:USER.id,fromName:USER.name,to:to,toName:tu?tu.name:"site",site:USER.site,text:document.getElementById("cTxt").value,at:now()});
    save(); draw();
  });
  on("saveCloud",function(){
    var u=document.getElementById("cu").value.trim(), k=document.getElementById("ck").value.trim();
    localStorage.setItem("posh-week-url",u); localStorage.setItem("posh-week-key",k);
    localStorage.setItem("posh-sb-url",u); localStorage.setItem("posh-sb-key",k);
    toast("Keys saved");
  });
  on("pullCloud",function(){cloudPull(function(ok){toast(ok?"Live loaded":"Could not load")})});
  on("pushCloud",function(){save(); toast("Published")});
  on("out",function(){USER=null;ROOM=null;TAB="home";draw()});
}
