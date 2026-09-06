(function(){
  function digits(n){ return String(n||"").replace(/\D/g,""); }
  function waNums(){
    DB.wa=DB.wa||{ikeja:"",vi:"",hotel:""};
    return DB.wa;
  }
  function managerPhone(site){
    var fromStaff=(DB.users||[]).filter(function(u){ return u.role==="manager" && u.site===site && u.whatsapp; })[0];
    if(fromStaff) return digits(fromStaff.whatsapp);
    var w=waNums();
    return digits((site==="Victoria Island"?w.vi:w.ikeja)||w.hotel||"");
  }
  function msg(r){
    return "Posh walkthrough Rm "+(r.number||"")+" "+(r.site||"")+" by "+(USER&&USER.name?USER.name:"HK")+". Please watch this video and certify.";
  }
  function sendWA(r,file){
    var text=msg(r);
    var phone=managerPhone(r.site);
    var hotel=digits(waNums().hotel);
    function openChat(){
      var url=phone?("https://wa.me/"+phone+"?text="+encodeURIComponent(text)):("https://wa.me/?text="+encodeURIComponent(text));
      window.open(url,"_blank");
      if(hotel && hotel!==phone) setTimeout(function(){ window.open("https://wa.me/"+hotel+"?text="+encodeURIComponent(text),"_blank"); },600);
    }
    if(file && navigator.canShare && navigator.canShare({files:[file]})){
      navigator.share({title:"Rm "+r.number+" video",text:text,files:[file]}).then(function(){
        r.videoWhatsApp=true; r.videoWaAt=now(); save();
      }).catch(function(){ openChat(); r.videoWhatsApp=true; save(); });
      return;
    }
    openChat();
    r.videoWhatsApp=true; r.videoWaAt=now(); save();
    alert("WhatsApp opened. Attach the room video in that chat if needed.");
  }
  function inject(){
    if(!ROOM) return;
    var r=findRoom(ROOM); if(!r) return;
    if(document.getElementById("waVidBtn")) return;
    var app=document.getElementById("app"); if(!app) return;
    if(role()==="housekeeper"){
      var b=document.createElement("div");
      b.className="card";
      b.innerHTML="<h2>Send video on WhatsApp</h2><button type=button class=btn id=waVidBtn>Send video to duty manager</button>";
      app.appendChild(b);
      document.getElementById("waVidBtn").onclick=function(){
        if(!r.videoReady){ alert("Record the video first"); return; }
        function go(file){ sendWA(r,file); }
        var inp=document.getElementById("oneVid");
        if(inp&&inp.files&&inp.files[0]){ go(inp.files[0]); return; }
        try{
          var req=indexedDB.open("poshvid",1);
          req.onsuccess=function(){
            var q=req.result.transaction("v").objectStore("v").get(r.id);
            q.onsuccess=function(){ go(q.result||null); };
            q.onerror=function(){ go(null); };
          };
          req.onerror=function(){ go(null); };
        }catch(e){ go(null); }
      };
    }
    if((role()==="manager"||role()==="superadmin"||role()==="ceo") && !document.getElementById("waSeen")){
      var d=document.createElement("div");
      d.className="card";
      d.innerHTML="<button type=button class=btn id=waSeen>I watched on WhatsApp</button>";
      app.appendChild(d);
      document.getElementById("waSeen").onclick=function(){
        r.videoWatched=true; r.videoWhatsApp=true; save(); alert("Marked watched"); draw();
      };
    }
  }
  window.viewStaff=function(){
    if(role()!=="superadmin") return "<div class=warn>Super Admin only</div>";
    var h="<h1>Staff</h1><div class=card><h2>Add staff</h2><input id=sn placeholder='Name'><select id=sr><option>housekeeper</option><option>frontdesk</option><option>manager</option><option>laundry</option><option>kitchen</option><option>maint</option><option>storekeeper</option><option>accountant</option></select><select id=ss><option>Ikeja</option><option>Victoria Island</option><option>All locations</option></select><input id=sp placeholder='PIN'><input id=swa placeholder='WhatsApp 2348... '><button class=btn id=addStaff>Add</button></div>";
    h+=(DB.users||[]).map(function(u,i){
      return "<div class=card><b>"+u.name+"</b><br>"+u.role+" · <b>"+u.site+"</b> · PIN "+u.pin+"<br>WhatsApp: <b>"+(u.whatsapp||"not set")+"</b><br>"+
        "<input class=uwa data-i='"+i+"' placeholder='2348...' value='"+(u.whatsapp||"")+"'>"+
        "<button type=button class='btn savWaU' data-i='"+i+"'>Save WhatsApp</button> "+
        "<button type=button class='btn edU' data-i='"+i+"'>Edit</button></div>";
    }).join("");
    h+="<div class=card><input id=rn placeholder='Room'><select id=rsite><option>Ikeja</option><option>Victoria Island</option></select><button class=btn id=addRoom>Add room</button></div>";
    var w=waNums();
    h+="<div class=card><h2>Fallback hotel lines</h2><input id=waIk placeholder='Ikeja DM' value='"+(w.ikeja||"")+"'><input id=waVi placeholder='VI DM' value='"+(w.vi||"")+"'><input id=waHt placeholder='Hotel DM line' value='"+(w.hotel||"")+"'><button type=button class=btn id=saveWa>Save fallback lines</button></div>";
    return h;
  };
  var _viewLists=window.viewLists;
  window.viewLists=function(){
    var h=typeof _viewLists==="function"?_viewLists():"<h1>Lists</h1>";
    var w=waNums();
    h+="<div class=card><h2>Fallback WhatsApp lines</h2><input id=waIk placeholder='Ikeja DM' value='"+(w.ikeja||"")+"'><input id=waVi placeholder='VI DM' value='"+(w.vi||"")+"'><input id=waHt placeholder='Hotel DM' value='"+(w.hotel||"")+"'><button type=button class=btn id=saveWa>Save lines</button><p>Prefer the number saved on each duty manager staff card.</p></div>";
    return h;
  };
  var _bind=window.bind;
  window.bind=function(){
    if(typeof _bind==="function") _bind();
    var add=document.getElementById("addStaff");
    if(add) add.onclick=function(){
      var name=(document.getElementById("sn").value||"").trim();
      if(!name){ alert("Name required"); return; }
      DB.users.push({
        id:"u"+Date.now(),
        name:name,
        role:document.getElementById("sr").value,
        site:document.getElementById("ss").value,
        pin:document.getElementById("sp").value,
        whatsapp:(document.getElementById("swa")&&document.getElementById("swa").value||"").trim()
      });
      save(); alert("Staff added"); draw();
    };
    document.querySelectorAll(".savWaU").forEach(function(b){
      b.onclick=function(){
        var i=parseInt(b.getAttribute("data-i"),10);
        var inp=document.querySelector(".uwa[data-i='"+i+"']");
        if(!DB.users[i]) return;
        DB.users[i].whatsapp=inp?inp.value.trim():"";
        save(); alert("WhatsApp saved for "+DB.users[i].name); draw();
      };
    });
    document.querySelectorAll(".edU").forEach(function(b){
      b.onclick=function(){
        var u=DB.users[parseInt(b.getAttribute("data-i"),10)]; if(!u) return;
        u.name=prompt("Name",u.name)||u.name;
        u.role=prompt("Role",u.role)||u.role;
        u.site=prompt("Location",u.site)||u.site;
        u.pin=prompt("PIN",u.pin)||u.pin;
        u.whatsapp=prompt("WhatsApp with country code",u.whatsapp||"")||u.whatsapp;
        save(); draw();
      };
    });
    var s=document.getElementById("saveWa");
    if(s) s.onclick=function(){
      DB.wa={
        ikeja:(document.getElementById("waIk")||{}).value||"",
        vi:(document.getElementById("waVi")||{}).value||"",
        hotel:(document.getElementById("waHt")||{}).value||""
      };
      save(); alert("Fallback lines saved"); draw();
    };
    inject();
  };
  var _draw=window.draw;
  window.draw=function(){ _draw(); inject(); };
})();
