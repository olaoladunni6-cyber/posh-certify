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
  }
  function siteStock(id,site){
    if(typeof stock==="function") return stock(id,site);
    var row=(DB.martStock||[]).filter(function(s){return s.item===id&&s.site===site})[0];
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

  var _viewDesk=window.viewDesk;
  window.viewDesk=function(){
    ensure();
    var h=typeof _viewDesk==="function"?_viewDesk():"<h1>Front desk</h1>";
    if(role()==="frontdesk"||role()==="superadmin"){
      h+="<div class=card><h2>Guest paid laundry</h2><input id=wGuest placeholder='Guest name'><input id=wRoom placeholder='Room no'><select id=wSvc>";
      h+=(DB.washServices||[]).map(function(s){return "<option value='"+s.id+"'>"+s.name+" · "+naira(s.price)+"</option>"}).join("");
      h+="</select><input id=wQty type=number value=1 min=1><button class=btn id=sendWash>Send to laundry</button></div>";
    }
    var ready=washList().filter(function(w){return w.status==="ready"});
    if(ready.length && (role()==="frontdesk"||role()==="manager"||role()==="ceo")){
      h+="<div class=warn><b>Laundry ready for collection</b>"+ready.map(function(w){return "<p>"+w.guest+" Rm "+w.room+" · "+w.service+" x"+w.qty+"</p>"}).join("")+"</div>";
    }
    h+="<div class=card><h2>Guest laundry tickets</h2>"+(washList().map(function(w){
      return "<p>"+w.guest+" Rm "+w.room+" · "+w.service+" x"+w.qty+" · "+naira(w.amount)+" · <b>"+w.status+"</b></p>";
    }).join("")||"<p>None</p>")+"</div>";
    h+="<div class=card><h2>Meals allocated (no codes)</h2>"+mealsPublic()+"</div>";
    return h;
  };

  var _viewLaundry=window.viewLaundry;
  window.viewLaundry=function(){
    ensure();
    var h=typeof _viewLaundry==="function"?_viewLaundry():"<h1>Laundry</h1>";
    h+="<div class=card><h2>Guest paid washing</h2>";
    h+=washList().map(function(w){
      var b="";
      if(role()==="laundry" && w.status==="sent") b="<br><button class='btn ackW' data-id='"+w.id+"'>Acknowledge receipt</button>";
      if(role()==="laundry" && (w.status==="received"||w.status==="washing")) b="<br><button class='btn readyW' data-id='"+w.id+"'>Ready — notify front desk</button>";
      return "<div class=card>"+w.guest+" Rm "+w.room+" · "+w.service+" x"+w.qty+" · "+naira(w.amount)+" · "+w.status+b+"</div>";
    }).join("")||"<p>No guest wash tickets</p>";
    h+="</div>";
    if(role()==="superadmin"){
      h+="<div class=card><h2>Priced wash list</h2>"+(DB.washServices||[]).map(function(s,i){
        return "<p>"+s.name+" · "+naira(s.price)+"</p>";
      }).join("")+"<input id=wsN placeholder='Service name'><input id=wsP type=number placeholder='Price'><button class=btn id=addWashSvc>Add service</button></div>";
    }
    return h;
  };

  window.viewMart=function(){
    ensure();
    var h="<h1>Mini mart</h1>";
    h+="<div class=card>"+(DB.martItems||[]).map(function(it){
      return "<p><b>"+it.name+"</b> · "+naira(it.price)+"<br>Inventory Ikeja "+siteStock(it.id,"Ikeja")+" · VI "+siteStock(it.id,"Victoria Island")+"</p>";
    }).join("")+"</div>";
    if(role()==="frontdesk"){
      h+="<div class=card><h2>Sell</h2><select id=mItem>"+(DB.martItems||[]).map(function(it){return "<option value='"+it.id+"'>"+it.name+"</option>"}).join("")+"</select><input id=mQty type=number value=1><button class=btn id=sellMart>Sell</button></div>";
    }
    if(role()==="superadmin"||role()==="ceo"){
      h+="<div class=card><h2>Add item + opening inventory</h2><input id=ni placeholder='Item name'><input id=np type=number placeholder='Price'><input id=nqI type=number placeholder='Ikeja inventory'><input id=nqV type=number placeholder='VI inventory'><button class=btn id=addMart>Add with stock</button></div>";
      h+="<div class=card><h2>Edit item and inventory</h2>";
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
      h+="<div class=card><h2>Post 3 breakfast options</h2><input id=mDay type=date value='"+today()+"'>";
      h+="<input id=opt1 placeholder='Option 1' value='"+(ch[0]||"")+"'>";
      h+="<input id=opt2 placeholder='Option 2' value='"+(ch[1]||"")+"'>";
      h+="<input id=opt3 placeholder='Option 3' value='"+(ch[2]||"")+"'>";
      h+="<button class=btn id=saveMenu>Save 3 options</button></div>";
      h+="<div class=card><h2>Allocated guests (code hidden)</h2>"+mealsPublic()+"</div>";
      h+="<div class=card><h2>Verify on arrival</h2><input id=vCode placeholder='Ask guest for code'><button class=btn id=verBf>Verify code</button><div id=vHit></div></div>";
    }
    if(role()==="frontdesk"){
      var menu=(DB.menus||[]).filter(function(m){return m.site===USER.site&&m.day===today()}).pop();
      var ch=menu?menu.choices:[];
      h+="<div class=card>"+(ch.length?"Today: "+ch.join(" / "):"<div class=warn>Chef must post 3 options first</div>");
      h+="<input id=bfName placeholder='Guest name'><input id=bfRoom placeholder='Room no'><select id=bfMeal>"+ch.map(function(c){return "<option>"+c+"</option>"}).join("")+"</select><button class=btn id=issueBf>Issue code</button></div>";
      h+="<div class=card><h2>Allocated (codes only on issue alert)</h2>"+mealsPublic()+"</div>";
    }
    if(role()==="manager"||role()==="ceo"||role()==="superadmin"){
      h+="<div class=card><h2>Meals allocation</h2>"+mealsPublic()+"</div>";
    }
    return h;
  };

  var _viewAct=window.viewAct;
  window.viewAct=function(){
    ensure();
    var h=typeof _viewAct==="function"?_viewAct():"<h1>Activity</h1>";
    h+="<div class=card><h2>Meals allocation (name + room, no code)</h2>"+mealsPublic()+"</div>";
    h+="<div class=card><h2>Guest paid laundry</h2>"+(washList().map(function(w){
      return "<p>"+w.day+" · "+w.guest+" Rm "+w.room+" · "+w.service+" x"+w.qty+" · "+naira(w.amount)+" · "+w.status+" · folio "+(w.folio||"yes")+"</p>";
    }).join("")||"<p>None</p>")+"</div>";
    return h;
  };

  var _bind=window.bind;
  window.bind=function(){
    if(typeof _bind==="function") _bind();
    ensure();
    var add=document.getElementById("addMart");
    if(add) add.onclick=function(){
      var name=(document.getElementById("ni").value||"").trim();
      if(!name){alert("Name required");return;}
      var id="m"+Date.now();
      DB.martItems=DB.martItems||[]; DB.martStock=DB.martStock||[];
      DB.martItems.push({id:id,name:name,price:parseFloat(document.getElementById("np").value)||0});
      var qi=parseInt((document.getElementById("nqI")||{}).value,10); if(isNaN(qi)) qi=0;
      var qv=parseInt((document.getElementById("nqV")||{}).value,10); if(isNaN(qv)) qv=qi;
      DB.martStock.push({item:id,site:"Ikeja",qty:qi});
      DB.martStock.push({item:id,site:"Victoria Island",qty:qv});
      save(); alert("Item added with inventory"); draw();
    };
    document.querySelectorAll(".savM").forEach(function(b){
      b.onclick=function(){
        var id=b.getAttribute("data-id");
        var it=(DB.martItems||[]).filter(function(x){return x.id===id})[0];
        if(!it) return;
        var nm=document.querySelector(".en[data-id='"+id+"']");
        var pr=document.querySelector(".ep[data-id='"+id+"']");
        var ik=document.querySelector(".ei[data-id='"+id+"']");
        var vi=document.querySelector(".ev[data-id='"+id+"']");
        if(nm&&nm.value.trim()) it.name=nm.value.trim();
        if(pr) it.price=parseFloat(pr.value)||0;
        if(typeof setStock==="function"){
          if(ik) setStock(id,"Ikeja",ik.value);
          if(vi) setStock(id,"Victoria Island",vi.value);
        }
        save(); alert("Inventory saved"); draw();
      };
    });
    var sm=document.getElementById("saveMenu");
    if(sm) sm.onclick=function(){
      var day=(document.getElementById("mDay")&&document.getElementById("mDay").value)||today();
      var choices=[];
      ["opt1","opt2","opt3"].forEach(function(id){
        var el=document.getElementById(id);
        if(el&&el.value.trim()) choices.push(el.value.trim());
      });
      if(choices.length<1){alert("Enter breakfast options");return;}
      DB.menus=DB.menus||[];
      DB.menus=DB.menus.filter(function(m){return !(m.site===USER.site&&m.day===day)});
      DB.menus.push({day:day,site:USER.site,choices:choices.slice(0,3),by:USER.name,at:now()});
      save(); alert("Saved: "+choices.join(" / ")); draw();
    };
    var ib=document.getElementById("issueBf");
    if(ib) ib.onclick=function(){
      var g=(document.getElementById("bfName").value||"").trim();
      var rm=document.getElementById("bfRoom")?document.getElementById("bfRoom").value.trim():"";
      var meal=document.getElementById("bfMeal")?document.getElementById("bfMeal").value:"";
      if(!g||!meal){alert("Guest and meal required");return;}
      var code=String(1000+Math.floor(Math.random()*9000));
      DB.breakfasts.push({guest:g,room:rm,meal:meal,code:code,status:"waiting",site:USER.site,day:today(),by:USER.name});
      save();
      alert("Give this code to the guest only: "+code+"\nKitchen list shows name and room, not the code.");
      draw();
    };
    var vb=document.getElementById("verBf");
    if(vb) vb.onclick=function(){
      var code=(document.getElementById("vCode").value||"").trim();
      var box=document.getElementById("vHit");
      var b=(DB.breakfasts||[]).filter(function(x){return x.code===code})[0];
      if(!b){ if(box) box.innerHTML="<div class=warn>Invalid or already used</div>"; return; }
      if(b.status==="served"){ if(box) box.innerHTML="<div class=warn>Already served "+b.guest+"</div>"; return; }
      b.status="served"; b.servedAt=now(); b.servedBy=USER.name; save();
      if(box) box.innerHTML="<div class=ok>Serve "+b.guest+" Rm "+(b.room||"-")+" · "+b.meal+"</div>";
      draw();
    };
    var sw=document.getElementById("sendWash");
    if(sw) sw.onclick=function(){
      var g=(document.getElementById("wGuest").value||"").trim();
      var rm=(document.getElementById("wRoom").value||"").trim();
      var sid=document.getElementById("wSvc").value;
      var qty=parseInt(document.getElementById("wQty").value,10)||1;
      var svc=(DB.washServices||[]).filter(function(s){return s.id===sid})[0];
      if(!g||!rm||!svc){alert("Guest, room and service required");return;}
      var amt=qty*Number(svc.price||0);
      var ticket={id:"w"+Date.now(),guest:g,room:rm,service:svc.name,svcId:svc.id,qty:qty,amount:amt,status:"sent",site:USER.site,by:USER.name,day:today(),at:now(),folio:"yes"};
      DB.guestWashes.push(ticket);
      DB.checkins.push({guest:g,room:rm,amount:amt,extra:"Laundry "+svc.name+" x"+qty,checkout:"",site:USER.site,by:USER.name,day:today(),kind:"laundry"});
      if(typeof note==="function") note("Guest laundry "+g+" Rm "+rm+" "+svc.name+" "+amt);
      save(); alert("Sent to laundry and added to folio: "+naira(amt)); draw();
    };
    document.querySelectorAll(".ackW").forEach(function(b){
      b.onclick=function(){
        var w=(DB.guestWashes||[]).filter(function(x){return x.id===b.getAttribute("data-id")})[0];
        if(!w) return;
        w.status="received"; w.receivedAt=now(); w.receivedBy=USER.name;
        if(typeof note==="function") note("Laundry received guest wash Rm "+w.room);
        save(); alert("Receipt acknowledged"); draw();
      };
    });
    document.querySelectorAll(".readyW").forEach(function(b){
      b.onclick=function(){
        var w=(DB.guestWashes||[]).filter(function(x){return x.id===b.getAttribute("data-id")})[0];
        if(!w) return;
        w.status="ready"; w.readyAt=now();
        pingDesk("Laundry READY for "+w.guest+" Rm "+w.room+" — "+w.service+" x"+w.qty);
        if(typeof note==="function") note("Laundry ready Rm "+w.room);
        save(); alert("Front desk notified"); draw();
      };
    });
    var aws=document.getElementById("addWashSvc");
    if(aws) aws.onclick=function(){
      var n=(document.getElementById("wsN").value||"").trim();
      var p=parseFloat(document.getElementById("wsP").value)||0;
      if(!n) return;
      DB.washServices.push({id:"ws"+Date.now(),name:n,price:p});
      save(); draw();
    };
  };
})();
