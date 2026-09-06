(function(){
  function siteStock(id,site){
    if(typeof stock==="function") return stock(id,site);
    var row=(DB.martStock||[]).filter(function(s){return s.item===id&&s.site===site})[0];
    return row?Number(row.qty||0):0;
  }
  window.viewMart=function(){
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
        h+="<div class=card><b>"+it.name+"</b><input class=en data-id='"+it.id+"' value='"+it.name+"'><input class=ep data-id='"+it.id+"' type=number value='"+it.price+"' placeholder='Price'><input class=ei data-id='"+it.id+"' type=number value='"+siteStock(it.id,"Ikeja")+"' placeholder='Ikeja qty'><input class=ev data-id='"+it.id+"' type=number value='"+siteStock(it.id,"Victoria Island")+"' placeholder='VI qty'><button type=button class='btn savM' data-id='"+it.id+"'>Save inventory</button></div>";
      });
      h+="</div>";
    }
    h+="<div class=card><h2>Sales</h2>"+(typeof martList==="function"?martList():"")+"</div>";
    return h;
  };
  window.viewMeals=function(){
    var h="<h1>Breakfast</h1>";
    if(role()==="kitchen"){
      var existing=(DB.menus||[]).filter(function(m){return m.site===USER.site&&m.day===today()}).pop();
      var ch=existing&&existing.choices?existing.choices:[];
      h+="<div class=card><h2>Post 3 breakfast options</h2><input id=mDay type=date value='"+today()+"'>";
      h+="<input id=opt1 placeholder='Option 1' value='"+(ch[0]||"")+"'>";
      h+="<input id=opt2 placeholder='Option 2' value='"+(ch[1]||"")+"'>";
      h+="<input id=opt3 placeholder='Option 3' value='"+(ch[2]||"")+"'>";
      h+="<button class=btn id=saveMenu>Save 3 options</button></div>";
      h+="<div class=card><input id=vCode placeholder='Guest code'><button class=btn id=verBf>Verify</button><div id=vHit></div></div>";
    }
    if(role()==="frontdesk"){
      var menu=(DB.menus||[]).filter(function(m){return m.site===USER.site&&m.day===today()}).pop();
      var ch=menu?menu.choices:[];
      h+="<div class=card>"+(ch.length?"Today: "+ch.join(" / "):"<div class=warn>Chef must post 3 options first</div>");
      h+="<input id=bfName placeholder='Guest'><select id=bfMeal>"+ch.map(function(c){return "<option>"+c+"</option>"}).join("")+"</select><button class=btn id=issueBf>Issue code</button></div>";
    }
    return h;
  };
  var _bind=window.bind;
  window.bind=function(){
    if(typeof _bind==="function") _bind();
    var add=document.getElementById("addMart");
    if(add) add.onclick=function(){
      var name=(document.getElementById("ni").value||"").trim();
      if(!name){alert("Name required");return;}
      var id="m"+Date.now();
      DB.martItems=DB.martItems||[];
      DB.martStock=DB.martStock||[];
      DB.martItems.push({id:id,name:name,price:parseFloat(document.getElementById("np").value)||0});
      var qi=parseInt((document.getElementById("nqI")||{}).value,10); if(isNaN(qi)) qi=parseInt((document.getElementById("nq")||{}).value,10)||0;
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
      if(!choices.length && document.getElementById("mChoices")){
        choices=(document.getElementById("mChoices").value||"").split(",").map(function(x){return x.trim()}).filter(Boolean);
      }
      if(choices.length<1){alert("Enter breakfast options");return;}
      DB.menus=DB.menus||[];
      DB.menus=DB.menus.filter(function(m){return !(m.site===USER.site&&m.day===day)});
      DB.menus.push({day:day,site:USER.site,choices:choices.slice(0,3),by:USER.name,at:now()});
      save(); alert("Saved: "+choices.join(" / ")); draw();
    };
  };
})();
