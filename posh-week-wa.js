(function(){
  function digits(n){ return String(n||"").replace(/\D/g,""); }
  function waNums(){
    DB.wa=DB.wa||{ikeja:"",vi:"",hotel:""};
    return DB.wa;
  }
  function numFor(site){
    var w=waNums();
    var n=(site==="Victoria Island"?w.vi:w.ikeja)||w.hotel||"";
    return digits(n);
  }
  function msg(r){
    return "Posh walkthrough Rm "+(r.number||"")+" "+(r.site||"")+" by "+(USER&&USER.name?USER.name:"HK")+". Please watch this video and certify.";
  }
  function sendWA(r,file){
    var text=msg(r);
    var phone=numFor(r.site);
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
    alert("WhatsApp opened. Attach the room video in that chat if it was not shared automatically.");
  }
  function inject(){
    if(!ROOM) return;
    var r=findRoom(ROOM); if(!r) return;
    if(document.getElementById("waVidBtn")) return;
    var app=document.getElementById("app"); if(!app) return;
    if(role()==="housekeeper"){
      var b=document.createElement("div");
      b.className="card";
      b.innerHTML="<h2>Send video on WhatsApp</h2><p>Opens the duty manager chat and attaches the clip when the phone allows it.</p><button type=button class=btn id=waVidBtn>Send video to duty manager</button>";
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
    if(role()==="manager"||role()==="superadmin"||role()==="ceo"){
      if(document.getElementById("waSeen")) return;
      var d=document.createElement("div");
      d.className="card";
      d.innerHTML="<p>If you watched the clip on WhatsApp, tap below.</p><button type=button class=btn id=waSeen>I watched on WhatsApp</button>";
      app.appendChild(d);
      document.getElementById("waSeen").onclick=function(){
        r.videoWatched=true; r.videoWhatsApp=true; save(); alert("Marked watched — you may certify"); draw();
      };
    }
  }
  var _viewLists=window.viewLists;
  window.viewLists=function(){
    var h=typeof _viewLists==="function"?_viewLists():"<h1>Lists</h1>";
    var w=waNums();
    h+="<div class=card><h2>WhatsApp numbers</h2><p>Use country code. Example 2348012345678</p>"+
      "<input id=waIk placeholder='Ikeja duty manager' value='"+(w.ikeja||"")+"'>"+
      "<input id=waVi placeholder='VI duty manager' value='"+(w.vi||"")+"'>"+
      "<input id=waHt placeholder='Hotel DM line (second chat)' value='"+(w.hotel||"")+"'>"+
      "<button type=button class=btn id=saveWa>Save WhatsApp numbers</button></div>";
    return h;
  };
  var _bind=window.bind;
  window.bind=function(){
    if(typeof _bind==="function") _bind();
    var s=document.getElementById("saveWa");
    if(s) s.onclick=function(){
      DB.wa={
        ikeja:document.getElementById("waIk").value.trim(),
        vi:document.getElementById("waVi").value.trim(),
        hotel:document.getElementById("waHt").value.trim()
      };
      save(); alert("WhatsApp numbers saved"); draw();
    };
    inject();
  };
  var _draw=window.draw;
  window.draw=function(){ _draw(); inject(); };
})();
