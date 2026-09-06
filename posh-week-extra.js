(function(){
  function ensure(){
    if(!DB) return;
    if(!DB.washServices || !DB.washServices.length){
      DB.washServices=[
        {id:"shirt",name:"Shirt / blouse",price:1500},
        {id:"trouser",name:"Trouser / skirt",price:2000},
        {id:"dress",name:"Dress",price:2500},
        {id:"suit",name:"Suit (2 piece)",price:4000},
        {id:"sheet",name:"Guest bedsheet",price:1500},
        {id:"undies",name:"Underwear pack",price:1000}
      ];
    }
    if(!DB.guestWashes) DB.guestWashes=[];
    if(!DB.breakfasts) DB.breakfasts=[];
    if(!DB.checkins) DB.checkins=[];
    if(!DB.msgs) DB.msgs=[];
    if(!DB.lauItems) DB.lauItems=[{id:"bath_towel",name:"Bath towel"},{id:"sheet",name:"Sheet"},{id:"pillow",name:"Pillowcase"}];
    if(!DB.lauStock) DB.lauStock=[];
    if(!DB.lauMoves) DB.lauMoves=[];
  }
  function siteStock(id,site){
    if(typeof stock==="function") return stock(id,site);
    var row=(DB.martStock||[]).filter(function(s){return s.item===id&&s.site===site})[0];
    return row?Number(row.qty||0):0;
  }
  function lQty(id,site){
    site=site||(USER&&USER.site)||"Ikeja";
    if(site==="All locations") site="Ikeja";
    if(typeof lStock==="function") return lStock(id,site);
    var row=(DB.lauStock||[]).filter(function(s){return s.item===id&&s.site===site})[0];
    return row?Number(row.qty||0):0;
  }
  function mealsPublic(){
    return (DB.breakfasts||[]).filter(function(b){return siteOk(b.site)}).slice().reverse().map(function(b){
      return "<p><b>"+b.guest+"</b> Rm "+(b.room||"-")+" · "+(b.meal||"")+" · "+(b.status||"waiting")+" · "+(b.day||"")+"</p>";
    }).join("")||"<p>No meals allocated</p>";
  }
  function washList(){
    return (DB.guestWashes||[]).filter(function(w){return siteOk(w.site)}).slice().reverse();
  }
  function pingDesk(text){
    (DB.users||[]).filter(function(u){return u.role==="frontdesk"&&siteOk(u.site)}).forEach(function(u){
      DB.msgs.push({from:USER.id,fromName:USER.name,to:u.id,toName:u.name,site:USER.site,text:text,at:now(),kind:"laundry-ready"});
    });
  }
  function washEditor(){
    var h="<div class=card><h2>Guest laundry price list</h2><p class=ok>Super Admin edits this. Front desk ticks one or more items.</p>";
    h+=(DB.washServices||[]).map(function(s,i){
      return "<div class=card><input class=wn data-i='"+i+"' value='"+s.name+"'><input class=wp data-i='"+i+"' type=number value='"+s.price+"'><button type=button class='btn savW' data-i='"+i+"'>Save</button> <button type=button class='btn bad delW' data-i='"+i+"'>Remove</button></div>";
    }).join("");
    h+="<input id=wsN placeholder='New service'><input id=wsP type=number placeholder='Price NGN'><button class=btn id=addWashSvc>Add to price list</button></div>";
    return h;
  }

  var _viewDesk=window.viewDesk;
  window.viewDesk=function(){
    ensure();
    var h=typeof _viewDesk==="function"?_viewDesk():"<h1>Front desk</h1>";
    if(role()==="frontdesk"||role()==="superadmin"){
      h+="<div class=card><h2>Guest paid laundry</h2><p>Tick every item going in this bag.</p><input id=wGuest placeholder='Guest name'><input id=wRoom placeholder='Room no'>";
      h+=(DB.washServices||[]).map(function(s){
        return "<label style='display:block;margin:6px 0'><input type=checkbox class=wPick data-id='"+s.id+"'> "+s.name+" · "+naira(s.price)+" · qty <input class=wQty data-id='"+s.id+"' type=number min=1 value=1 style='width:70px;display:inline-block'></label>";
      }).join("");
      h+="<button class=btn id=sendWash>Send selected to laundry</button></div>";
    }
    var ready=washList().filter(function(w){return w.status==="ready"});
    if(ready.length && (role()==="frontdesk"||role()==="manager"||role()==="ceo")){
      h+="<div class=warn><b>Laundry ready for collection</b>"+ready.map(function(w){return "<p>"+w.guest+" Rm "+w.room+" · "+w.service+"</p>"}).join("")+"</div>";
    }
    h+="<div class=card><h2>Guest laundry tickets</h2>"+(washList().map(function(w){
      return "<p>"+w.guest+" Rm "+w.room+" · "+w.service+" · "+naira(w.amount)+" · <b>"+w.status+"</b></p>";
    }).join("")||"<p>None</p>")+"</div>";
    h+="<div class=card><h2>Meals allocated (no codes)</h2>"+mealsPublic()+"</div>";
    return h;
  };

  window.viewLaundry=function(){
    ensure();
    var site=(USER&&USER.site==="All locations")?"Ikeja":(USER?USER.site:"Ikeja");
    var h="<h1>Laundry</h1><div class=card><h2>Clean stock on hand — "+site+"</h2>";
    h+="<p class=ok>IN = replacement from store. RECEIVED = dirty bags from housekeepers. OUT = clean issued to rooms.</p>";
    (DB.lauItems||[]).forEach(function(it){
      var on=lQty(it.id,site);
      var moves=(DB.lauMoves||[]).filter(function(m){return siteOk(m.site)&&(m.item===it.id||m.item===it.name)});
      var inn=0, rec=0, out=0;
      moves.forEach(function(m){
        var q=Number(m.qty||0);
        if(m.kind==="in") inn+=q;
        else if(m.kind==="received_dirty"||m.kind==="received") rec+=q;
        else if(m.kind==="supplied"||m.kind==="out") out+=q;
      });
      h+="<div class=card><b>"+it.name+"</b><br>On hand: <b>"+on+"</b><br>Qty in (restock): "+inn+" · Dirty received: "+rec+" · Clean supplied: "+out+"</div>";
    });
    h+="</div>";
    if(role()==="laundry"){
      h+="<div class=card><h2>Receive restock (qty in)</h2><select id=linItem>"+(DB.lauItems||[]).map(function(it){return "<option value='"+it.id+"'>"+it.name+"</option>"}).join("")+"</select><input id=linQty type=number placeholder='Quantity in'><button class=btn id=lauIn>Add to stock</button></div>";
      h+="<div class=card><h2>Issue clean (qty out)</h2><select id=loutItem>"+(DB.lauItems||[]).map(function(it){return "<option value='"+it.id+"'>"+it.name+"</option>"}).join("")+"</select><input id=loutQty type=number placeholder='Quantity out'><input id=loutTo placeholder='Room or housekeeper'><button class=btn id=lauOut>Supply clean</button></div>";
    }
    h+="<div class=card><h2>Housekeeper dirty bags</h2>"+((DB.slips||[]).filter(function(s){return siteOk(s.site)}).slice().reverse().map(function(s){
      return "<div class=card>Rm "+s.room+" · "+s.status+" · "+JSON.stringify(s.items||{})+(role()==="laundry"&&s.status==="sent"?"<br><button class='btn recSlip' data-id='"+s.id+"'>Confirm dirty received</button>":"")+(role()==="laundry"&&s.status==="received"?"<br><button class='btn issSlip' data-id='"+s.id+"'>Issued clean</button>":"")+"</div>";
    }).join("")||"<p>No HK bags</p>")+"</div>";
    h+="<div class=card><h2>Guest paid washing</h2>"+(washList().map(function(w){
      var b="";
      if(role()==="laundry" && w.status==="sent") b="<br><button class='btn ackW' data-id='"+w.id+"'>Acknowledge receipt</button>";
      if(role()==="laundry" && (w.status==="received"||w.status==="washing")) b="<br><button class='btn readyW' data-id='"+w.id+"'>Ready — notify front desk</button>";
      return "<div class=card>"+w.guest+" Rm "+w.room+" · "+w.service+" · "+naira(w.amount)+" · "+w.status+b+"</div>";
    }).join("")||"<p>No guest tickets</p>")+"</div>";
    if(role()==="superadmin") h+=washEditor();
    return h;
  };

  var _viewLists=window.viewLists;
  window.viewLists=function(){
    ensure();
    var h=typeof _viewLists==="function"?_viewLists():"<h1>Lists</h1>";
    h+=washEditor();
    return h;
  };

  window.viewMart=function(){
    ensure();
    var h="<h1>Mini mart</h1><div class=card>"+(DB.martItems||[]).map(function(it){
      return "<p><b>"+it.name+"</b> · "+naira(it.price)+"<br>Inventory Ikeja "+siteStock(it.id,"Ikeja")+" · VI "+siteStock(it.id,"Victoria Island")+"</p>";
    }).join("")+"</div>";
    if(role()==="frontdesk"){
      h+="<div class=card><h2>Sell</h2><select id=mItem>"+(DB.martItems||[]).map(function(it){return "<option value='"+it.id+"'>"+it.name+"</option>"}).join("")+"</select><input id=mQty type=number value=1><button class=btn id=sellMart>Sell</button></div>";
    }
    if(role()==="superadmin"||role()==="ceo"){
      h+="<div class=card><h2>Add item + opening inventory</h2><input id=ni placeholder='Item name'><input id=np type=number placeholder='Price'><input id=nqI type=number placeholder='Ikeja inventory'><input id=nqV type=number placeholder='VI inventory'><button class=btn id=addMart>Add with stock</button></div><div class=card><h2>Edit item and inventory</h2>";
      (DB.martItems||[]).forEach(function(it){
        h+="<div class=card><b>"+it.name+"</b><input class=en data-id='"+it.id+"' value='"+it.name+"'><input class=ep data-id='"+it.id+"' type=number value='"+it.price+"'><input class=ei data-id='"+it.id+"' type=number value='"+siteStock(it.id,"Ikeja")+"'><input class=ev data-id='"+it.id+"' type=number value='"+siteStock(it.id,"Victoria Island")+"'><button type=button class='btn savM' data-id='"+it.id+"'>Save inventory</button></div>";
      });
      h+="</div>";
    }
    h+="<div class=card><h2>Sales</h2>"+(typeof martList==="function"?martList():"")+"</div>";
    return h;
  };

  window.viewMeals=function(){
    ensure();
    var h="<h1>Breakfast</h1>";
    if(role()==="kitchen"){
      var existing=(DB.menus||[]).filter(function(m){return m.site===USER.site&&m.day===today()}).pop();
      var ch=existing&&existing.choices?existing.choices:[];
      h+="<div class=card><h2>Post 3 breakfast options</h2><input id=mDay type=date value='"+today()+"'><input id=opt1 placeholder='Option 1' value='"+(ch[0]||"")+"'><input id=opt2 placeholder='Option 2' value='"+(ch[1]||"")+"'><input id=opt3 placeholder='Option 3' value='"+(ch[2]||"")+"'><button class=btn id=saveMenu>Save 3 options</button></div>";
      h+="<div class=card><h2>Allocated guests (code hidden)</h2>"+mealsPublic()+"</div>";
      h+="<div class=card><h2>Verify on arrival</h2><input id=vCode placeholder='Ask guest for code'><button class=btn id=verBf>Verify code</button><div id=vHit></div></div>";
    }
    if(role()==="frontdesk"){
      var menu=(DB.menus||[]).filter(function(m){return m.site===USER.site&&m.day===today()}).pop();
      var ch=menu?menu.choices:[];
      h+="<div class=card>"+(ch.length?"Today: "+ch.join(" / "):"<div class=warn>Chef must post 3 options first</div>")+"<input id=bfName placeholder='Guest name'><input id=bfRoom placeholder='Room no'><select id=bfMeal>"+ch.map(function(c){return "<option>"+c+"</option>"}).join("")+"</select><button class=btn id=issueBf>Issue code</button></div><div class=card><h2>Allocated</h2>"+mealsPublic()+"</div>";
    }
    if(role()==="manager"||role()==="ceo"||role()==="superadmin") h+="<div class=card><h2>Meals allocation</h2>"+mealsPublic()+"</div>";
    return h;
  };

  var _viewAct=window.viewAct;
  window.viewAct=function(){
    ensure();
    var h=typeof _viewAct==="function"?_viewAct():"<h1>Activity</h1>";
    h+="<div class=card><h2>Meals allocation (name + room, no code)</h2>"+mealsPublic()+"</div>";
    h+="<div class=card><h2>Guest paid laundry</h2>"+(washList().map(function(w){return "<p>"+w.day+" · "+w.guest+" Rm "+w.room+" · "+w.service+" · "+naira(w.amount)+" · "+w.status+"</p>";}).join("")||"<p>None</p>")+"</div>";
    return h;
  };

  var _bind=window.bind;
  window.bind=function(){
    if(typeof _bind==="function") _bind();
    ensure();
    var add=document.getElementById("addMart");
    if(add) add.onclick=function(){
      var name=(document.getElementById("ni").value||"").trim(); if(!name){alert("Name required");return;}
      var id="m"+Date.now(); DB.martItems=DB.martItems||[]; DB.martStock=DB.martStock||[];
      DB.martItems.push({id:id,name:name,price:parseFloat(document.getElementById("np").value)||0});
      var qi=parseInt((document.getElementById("nqI")||{}).value,10)||0, qv=parseInt((document.getElementById("nqV")||{}).value,10); if(isNaN(qv)) qv=qi;
      DB.martStock.push({item:id,site:"Ikeja",qty:qi}); DB.martStock.push({item:id,site:"Victoria Island",qty:qv});
      save(); alert("Item added with inventory"); draw();
    };
    document.querySelectorAll(".savM").forEach(function(b){ b.onclick=function(){
      var id=b.getAttribute("data-id"); var it=(DB.martItems||[]).filter(function(x){return x.id===id})[0]; if(!it)return;
      var nm=document.querySelector(".en[data-id='"+id+"']"), pr=document.querySelector(".ep[data-id='"+id+"']"), ik=document.querySelector(".ei[data-id='"+id+"']"), vi=document.querySelector(".ev[data-id='"+id+"']");
      if(nm&&nm.value.trim()) it.name=nm.value.trim(); if(pr) it.price=parseFloat(pr.value)||0;
      if(typeof setStock==="function"){ if(ik) setStock(id,"Ikeja",ik.value); if(vi) setStock(id,"Victoria Island",vi.value); }
      save(); alert("Inventory saved"); draw();
    };});
    var sm=document.getElementById("saveMenu");
    if(sm) sm.onclick=function(){
      var day=(document.getElementById("mDay")&&document.getElementById("mDay").value)||today(), choices=[];
      ["opt1","opt2","opt3"].forEach(function(id){ var el=document.getElementById(id); if(el&&el.value.trim()) choices.push(el.value.trim()); });
      if(!choices.length){alert("Enter breakfast options");return;}
      DB.menus=DB.menus||[]; DB.menus=DB.menus.filter(function(m){return !(m.site===USER.site&&m.day===day)});
      DB.menus.push({day:day,site:USER.site,choices:choices.slice(0,3),by:USER.name,at:now()}); save(); alert("Saved: "+choices.join(" / ")); draw();
    };
    var ib=document.getElementById("issueBf");
    if(ib) ib.onclick=function(){
      var g=(document.getElementById("bfName").value||"").trim(), rm=document.getElementById("bfRoom")?document.getElementById("bfRoom").value.trim():"", meal=document.getElementById("bfMeal")?document.getElementById("bfMeal").value:"";
      if(!g||!meal){alert("Guest and meal required");return;}
      var code=String(1000+Math.floor(Math.random()*9000));
      DB.breakfasts.push({guest:g,room:rm,meal:meal,code:code,status:"waiting",site:USER.site,day:today(),by:USER.name});
      save(); alert("Give this code to the guest only: "+code); draw();
    };
    var vb=document.getElementById("verBf");
    if(vb) vb.onclick=function(){
      var code=(document.getElementById("vCode").value||"").trim(), box=document.getElementById("vHit");
      var b=(DB.breakfasts||[]).filter(function(x){return x.code===code})[0];
      if(!b){ if(box) box.innerHTML="<div class=warn>Invalid</div>"; return; }
      if(b.status==="served"){ if(box) box.innerHTML="<div class=warn>Already served</div>"; return; }
      b.status="served"; b.servedAt=now(); save(); if(box) box.innerHTML="<div class=ok>Serve "+b.guest+" Rm "+(b.room||"-")+" · "+b.meal+"</div>"; draw();
    };
    var sw=document.getElementById("sendWash");
    if(sw) sw.onclick=function(){
      var g=(document.getElementById("wGuest").value||"").trim(), rm=(document.getElementById("wRoom").value||"").trim();
      if(!g||!rm){alert("Guest and room required");return;}
      var picks=[];
      document.querySelectorAll(".wPick:checked").forEach(function(cb){
        var id=cb.getAttribute("data-id");
        var svc=(DB.washServices||[]).filter(function(s){return s.id===id})[0];
        var qEl=document.querySelector(".wQty[data-id='"+id+"']");
        var qty=qEl?parseInt(qEl.value,10)||1:1;
        if(svc) picks.push({id:svc.id,name:svc.name,qty:qty,price:Number(svc.price||0),line:qty*Number(svc.price||0)});
      });
      if(!picks.length){alert("Tick at least one laundry item");return;}
      var names=picks.map(function(p){return p.qty+" x "+p.name;}).join(", ");
      var amt=picks.reduce(function(s,p){return s+p.line;},0);
      DB.guestWashes.push({id:"w"+Date.now(),guest:g,room:rm,service:names,items:picks,qty:picks.length,amount:amt,status:"sent",site:USER.site,by:USER.name,day:today(),at:now(),folio:"yes"});
      DB.checkins.push({guest:g,room:rm,amount:amt,extra:"Laundry "+names,checkout:"",site:USER.site,by:USER.name,day:today(),kind:"laundry"});
      if(typeof note==="function") note("Guest laundry "+g+" Rm "+rm+" "+names);
      save(); alert("Sent to laundry. Folio "+naira(amt)); draw();
    };
    document.querySelectorAll(".ackW").forEach(function(b){ b.onclick=function(){ var w=(DB.guestWashes||[]).filter(function(x){return x.id===b.getAttribute("data-id")})[0]; if(!w)return; w.status="received"; w.receivedAt=now(); save(); alert("Receipt acknowledged"); draw(); };});
    document.querySelectorAll(".readyW").forEach(function(b){ b.onclick=function(){ var w=(DB.guestWashes||[]).filter(function(x){return x.id===b.getAttribute("data-id")})[0]; if(!w)return; w.status="ready"; w.readyAt=now(); pingDesk("Laundry READY for "+w.guest+" Rm "+w.room+" — "+w.service); save(); alert("Front desk notified"); draw(); };});
    var aws=document.getElementById("addWashSvc");
    if(aws) aws.onclick=function(){ var n=(document.getElementById("wsN").value||"").trim(); var p=parseFloat(document.getElementById("wsP").value)||0; if(!n)return; DB.washServices.push({id:"ws"+Date.now(),name:n,price:p}); save(); draw(); };
    document.querySelectorAll(".savW").forEach(function(b){ b.onclick=function(){ var i=parseInt(b.getAttribute("data-i"),10); var s=DB.washServices[i]; if(!s)return; var n=document.querySelector(".wn[data-i='"+i+"']"); var p=document.querySelector(".wp[data-i='"+i+"']"); if(n) s.name=n.value.trim()||s.name; if(p) s.price=parseFloat(p.value)||0; save(); alert("Price list saved"); draw(); };});
    document.querySelectorAll(".delW").forEach(function(b){ b.onclick=function(){ DB.washServices.splice(parseInt(b.getAttribute("data-i"),10),1); save(); draw(); };});
  };
})();
