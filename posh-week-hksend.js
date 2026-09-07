(function(){
  if(window.__poshHkSend) return;
  window.__poshHkSend=true;

  function room(){ return ROOM?findRoom(ROOM):null; }
  function fileNow(){
    if(window.POSH_VID_FILE) return window.POSH_VID_FILE;
    var inp=document.getElementById("oneVid");
    return (inp&&inp.files&&inp.files[0])||null;
  }
  function keep(f,r){
    if(!f||!r) return;
    window.POSH_VID_FILE=f;
    r.videoReady=true;
    r.videoName=f.name||"walkthrough.mp4";
    r.videoAt=now();
    r.videoWatched=false;
    try{
      var db=indexedDB.open("poshvid",1);
      db.onupgradeneeded=function(){ try{db.result.createObjectStore("v")}catch(e){} };
      db.onsuccess=function(){
        try{ db.result.transaction("v","readwrite").objectStore("v").put(f,r.id); }catch(e){}
      };
    }catch(e){}
    try{ save(); }catch(e){}
  }
  function phone(){
    var site=USER&&USER.site;
    var u=(DB.users||[]).filter(function(x){return x.role==="manager"&&x.site===site&&x.whatsapp;})[0];
    var n=(u&&u.whatsapp)||(DB.wa&&(site==="Victoria Island"?DB.wa.vi:DB.wa.ikeja))||(DB.wa&&DB.wa.hotel)||"";
    return String(n).replace(/\D/g,"");
  }
  function openWa(text){
    var p=phone();
    var url=p?("https://wa.me/"+p+"?text="+encodeURIComponent(text)):("https://wa.me/?text="+encodeURIComponent(text));
    try{ (window.top||window).open(url,"_blank"); }catch(e){ window.location.href=url; }
  }
  function sendVid(){
    var r=room();
    if(!r){ alert("Open a room first"); return; }
    var f=fileNow();
    if(!f){ alert("Capture the video on this screen first. The file must still be selected."); return; }
    keep(f,r);
    var text="Posh Rm "+r.number+" walkthrough by "+(USER&&USER.name||"HK")+". Please watch and certify.";
    var file=f;
    try{
      if(!(file instanceof File)) file=new File([f], r.videoName||"room.mp4", {type:f.type||"video/mp4"});
    }catch(e){ file=f; }
    if(navigator.share){
      var payload={title:"Rm "+r.number, text:text};
      try{ if(navigator.canShare && navigator.canShare({files:[file]})) payload.files=[file]; }catch(e){}
      navigator.share(payload).then(function(){
        r.videoWhatsApp=true; r.videoReady=true; save();
      }).catch(function(){
        try{ var a=document.createElement("a"); a.href=URL.createObjectURL(file); a.download=r.videoName||"room.mp4"; document.body.appendChild(a); a.click(); a.remove(); }catch(e){}
        openWa(text);
        r.videoWhatsApp=true; save();
      });
      return;
    }
    try{ var a=document.createElement("a"); a.href=URL.createObjectURL(file); a.download=r.videoName||"room.mp4"; document.body.appendChild(a); a.click(); a.remove(); }catch(e){}
    openWa(text);
    r.videoWhatsApp=true; save();
    alert("WhatsApp opened. Attach the video with + if it did not attach itself.");
  }
  function canSubmit(r){
    return !!(fileNow() || (r && r.videoReady && r.videoName && r.videoAt));
  }
  function submitRoom(){
    var r=room();
    if(!r){ alert("Open a room first"); return; }
    if(!canSubmit(r)){
      alert("Video is required. Record it on this page, then Send, then Submit.");
      return;
    }
    var f=fileNow(); if(f) keep(f,r);
    r.videoReady=true;
    r.status="submitted";
    r.check=true;
    if(typeof note==="function") note("HK submitted Rm "+r.number+" WITH video "+(r.videoName||""));
    save();
    alert("Submitted with video.");
    draw();
  }
  function bar(){
    if(typeof role!=="function" || role()!=="housekeeper" || !ROOM) return;
    var r=room(); if(!r) return;
    if(document.getElementById("hkSendBar")) return;
    var app=document.getElementById("app"); if(!app) return;
    var d=document.createElement("div");
    d.id="hkSendBar";
    d.className="card";
    d.style.background="#f3e6c5";
    d.innerHTML="<h2>Video gate</h2><p id=hkVidSt>"+(canSubmit(r)?("File: "+(r.videoName||"ready")):"No video file yet")+"</p>"+
      "<input id=oneVid2 type=file accept='video/*' capture='environment'>"+
      "<button type=button class=btn id=hkSendVid>Send video on WhatsApp</button> "+
      "<button type=button class=btn id=hkSubmit2>Submit room</button>";
    app.appendChild(d);
  }

  document.addEventListener("change",function(e){
    var t=e.target;
    if(!t || (t.id!=="oneVid" && t.id!=="oneVid2")) return;
    var f=t.files&&t.files[0];
    var r=room();
    if(!f||!r) return;
    keep(f,r);
    var st=document.getElementById("hkVidSt");
    if(st) st.textContent="File: "+r.videoName;
    alert("Video captured and stored.");
  },true);

  document.addEventListener("click",function(e){
    var t=e.target;
    if(!t) return;
    var id=t.id||"";
    if(id==="hkSendVid" || id==="waVidBtn"){ e.preventDefault(); e.stopPropagation(); sendVid(); return; }
    if(id==="hkSubmit2" || id==="submitRm"){
      e.preventDefault(); e.stopPropagation();
      submitRoom();
    }
  },true);

  var _bind=window.bind;
  window.bind=function(){
    if(typeof _bind==="function") _bind();
    var s=document.getElementById("submitRm");
    if(s) s.onclick=function(ev){ ev&&ev.preventDefault(); submitRoom(); };
    bar();
  };
  var _draw=window.draw;
  window.draw=function(){ _draw(); bar(); };
})();
