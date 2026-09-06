(function(){
  function digits(n){ return String(n||"").replace(/\D/g,""); }
  function waNums(){ DB.wa=DB.wa||{ikeja:"",vi:"",hotel:""}; return DB.wa; }
  function managerPhone(site){
    var fromStaff=(DB.users||[]).filter(function(u){ return u.role==="manager" && u.site===site && u.whatsapp; })[0];
    if(fromStaff) return digits(fromStaff.whatsapp);
    var w=waNums();
    return digits((site==="Victoria Island"?w.vi:w.ikeja)||w.hotel||"");
  }
  function asFile(blob,name){
    if(!blob) return null;
    if(blob instanceof File) return blob;
    try{ return new File([blob], name||"room.mp4", {type:blob.type||"video/mp4"}); }catch(e){ return blob; }
  }
  function downloadFile(file,name){
    try{
      var url=URL.createObjectURL(file);
      var a=document.createElement("a");
      a.href=url; a.download=name||"posh-room.mp4";
      document.body.appendChild(a); a.click();
      setTimeout(function(){ URL.revokeObjectURL(url); a.remove(); },800);
    }catch(e){}
  }
  function openChats(text,phone){
    var hotel=digits(waNums().hotel);
    var url=phone?("https://wa.me/"+phone+"?text="+encodeURIComponent(text)):("https://wa.me/?text="+encodeURIComponent(text));
    window.open(url,"_blank");
    if(hotel && hotel!==phone) setTimeout(function(){ window.open("https://wa.me/"+hotel+"?text="+encodeURIComponent(text),"_blank"); },700);
  }
  function sendWA(r,blob){
    var text="Posh walkthrough Rm "+(r.number||"")+" "+(r.site||"")+" by "+(USER&&USER.name?USER.name:"HK")+". Please watch and certify.";
    var phone=managerPhone(r.site);
    var file=asFile(blob||window.POSH_VID_FILE, "Rm"+(r.number||"")+".mp4");
    function fallback(){
      if(file) downloadFile(file,"Rm"+(r.number||"room")+".mp4");
      openChats(text,phone);
      r.videoWhatsApp=true; save();
      alert("WhatsApp cannot be given a file by a website link. The video was downloaded. In the WhatsApp chat tap the paperclip / + and choose that video.");
    }
    if(!file){ fallback(); return; }
    var nav=(window.top&&window.top.navigator)||navigator;
    var payload={title:"Rm "+r.number+" video", text:text, files:[file]};
    if(nav.share && nav.canShare && nav.canShare({files:[file]})){
      nav.share(payload).then(function(){
        r.videoWhatsApp=true; r.videoWaAt=now(); save();
      }).catch(function(){ fallback(); });
      return;
    }
    if(nav.share){
      nav.share({title:payload.title,text:text,files:[file]}).then(function(){
        r.videoWhatsApp=true; save();
      }).catch(function(){ fallback(); });
      return;
    }
    fallback();
  }
  function grabFile(r,cb){
    if(window.POSH_VID_FILE){ cb(window.POSH_VID_FILE); return; }
    var inp=document.getElementById("oneVid");
    if(inp&&inp.files&&inp.files[0]){ window.POSH_VID_FILE=inp.files[0]; cb(inp.files[0]); return; }
    try{
      var req=indexedDB.open("poshvid",1);
      req.onsuccess=function(){
        var q=req.result.transaction("v").objectStore("v").get(r.id);
        q.onsuccess=function(){ cb(q.result||null); };
        q.onerror=function(){ cb(null); };
      };
      req.onerror=function(){ cb(null); };
    }catch(e){ cb(null); }
  }
  function inject(){
    if(!ROOM) return;
    var r=findRoom(ROOM); if(!r) return;
    var app=document.getElementById("app"); if(!app) return;
    if(role()==="housekeeper" && !document.getElementById("waVidBtn")){
      var b=document.createElement("div");
      b.className="card";
      b.innerHTML="<h2>WhatsApp the video</h2><p class=warn>A website cannot drop a file into WhatsApp by itself. This button either opens the phone Share sheet (pick WhatsApp) or downloads the clip so you attach it in the chat.</p><button type=button class=btn id=waVidBtn>Share / send video</button>";
      app.appendChild(b);
      document.getElementById("waVidBtn").onclick=function(){
        if(!r.videoReady){ alert("Record the video first"); return; }
        grabFile(r,function(file){ sendWA(r,file); });
      };
    }
    if((role()==="manager"||role()==="superadmin"||role()==="ceo") && !document.getElementById("waSeen")){
      var d=document.createElement("div");
      d.className="card";
      d.innerHTML="<button type=button class=btn id=waSeen>I watched on WhatsApp</button>";
      app.appendChild(d);
      document.getElementById("waSeen").onclick=function(){
        r.videoWatched=true; r.videoWhatsApp=true; save(); draw();
      };
    }
  }
  window.viewStaff=function(){
    if(role()!=="superadmin") return "<div class=warn>Super Admin only</div>";
    var h="<h1>Staff</h1><div class=card><h2>Add staff</h2><input id=sn placeholder='Name'><select id=sr><option>housekeeper</option><option>frontdesk</option><option>manager</option><option>laundry</option><option>kitchen</option><option>maint</option><option>storekeeper</option><option>accountant</option></select><select id=ss><option>Ikeja</option><option>Victoria Island</option><option>All locations</option></select><input id=sp placeholder='PIN'><input id=swa placeholder='WhatsApp 2348...'><button class=btn id=addStaff>Add</button></div>";
    h+=(DB.users||[]).map(function(u,i){
      return "<div class=card><b>"+u.name+"</b><br>"+u.role+" · "+u.site+" · PIN "+u.pin+"<br>WhatsApp: <b>"+(u.whatsapp||"not set")+"</b><br><input class=uwa data-i='"+i+"' value='"+(u.whatsapp||"")+"'><button type=button class='btn savWaU' data-i='"+i+"'>Save WhatsApp</button> <button type=button class='btn edU' data-i='"+i+"'>Edit</button></div>";
    }).join("");
    var w=waNums();
    h+="<div class=card><h2>Fallback lines</h2><input id=waIk placeholder='Ikeja DM' value='"+(w.ikeja||"")+"'><input id=waVi placeholder='VI DM' value='"+(w.vi||"")+"'><input id=waHt placeholder='Hotel DM' value='"+(w.hotel||"")+"'><button type=button class=btn id=saveWa>Save fallback</button></div>";
    return h;
  };
  var _bind=window.bind;
  window.bind=function(){
    if(typeof _bind==="function") _bind();
    var add=document.getElementById("addStaff");
    if(add) add.onclick=function(){
      var name=(document.getElementById("sn").value||"").trim(); if(!name) return;
      DB.users.push({id:"u"+Date.now(),name:name,role:document.getElementById("sr").value,site:document.getElementById("ss").value,pin:document.getElementById("sp").value,whatsapp:(document.getElementById("swa")&&document.getElementById("swa").value||"").trim()});
      save(); draw();
    };
    document.querySelectorAll(".savWaU").forEach(function(b){ b.onclick=function(){ var i=parseInt(b.getAttribute("data-i"),10); var inp=document.querySelector(".uwa[data-i='"+i+"']"); if(!DB.users[i])return; DB.users[i].whatsapp=inp?inp.value.trim():""; save(); draw(); };});
    document.querySelectorAll(".edU").forEach(function(b){ b.onclick=function(){ var u=DB.users[parseInt(b.getAttribute("data-i"),10)]; if(!u)return; u.name=prompt("Name",u.name)||u.name; u.role=prompt("Role",u.role)||u.role; u.site=prompt("Location",u.site)||u.site; u.pin=prompt("PIN",u.pin)||u.pin; u.whatsapp=prompt("WhatsApp",u.whatsapp||"")||u.whatsapp; save(); draw(); };});
    var s=document.getElementById("saveWa");
    if(s) s.onclick=function(){ DB.wa={ikeja:(document.getElementById("waIk")||{}).value||"",vi:(document.getElementById("waVi")||{}).value||"",hotel:(document.getElementById("waHt")||{}).value||""}; save(); draw(); };
    var inp=document.getElementById("oneVid");
    if(inp){
      inp.addEventListener("change",function(){
        if(this.files&&this.files[0]) window.POSH_VID_FILE=this.files[0];
      });
    }
    inject();
  };
  var _draw=window.draw;
  window.draw=function(){ _draw(); inject(); };
})();
