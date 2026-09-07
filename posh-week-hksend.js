(function(){
  function asFile(blob,name){
    if(!blob) return null;
    if(window.File && blob instanceof File) return blob;
    try{ return new File([blob], name||"room.mp4", {type:blob.type||"video/mp4"}); }catch(e){ return blob; }
  }
  function phone(){
    var site=USER&&USER.site;
    var u=(DB.users||[]).filter(function(x){return x.role==="manager"&&x.site===site&&x.whatsapp;})[0];
    var n=u&&u.whatsapp || (DB.wa&&(site==="Victoria Island"?DB.wa.vi:DB.wa.ikeja)) || (DB.wa&&DB.wa.hotel) || "";
    return String(n).replace(/\D/g,"");
  }
  function sendFile(r,file){
    var text="Posh Rm "+(r.number||"")+" walkthrough by "+(USER&&USER.name||"HK")+". Please watch and certify.";
    var f=asFile(file, "Rm"+(r.number||"")+".mp4");
    function openWa(){
      var p=phone();
      window.open(p?("https://wa.me/"+p+"?text="+encodeURIComponent(text)):("https://wa.me/?text="+encodeURIComponent(text)),"_blank");
    }
    if(f && navigator.share){
      var payload={title:"Rm "+r.number,text:text};
      try{
        if(navigator.canShare && navigator.canShare({files:[f]})) payload.files=[f];
      }catch(e){}
      navigator.share(payload).then(function(){
        r.videoWhatsApp=true; r.videoReady=true; save();
      }).catch(function(){
        if(f){
          var a=document.createElement("a"); a.href=URL.createObjectURL(f); a.download="Rm"+(r.number||"room")+".mp4"; a.click();
        }
        openWa();
        r.videoWhatsApp=true; save();
        alert("Attach the downloaded video in the WhatsApp chat.");
      });
      return;
    }
    if(f){
      var a=document.createElement("a"); a.href=URL.createObjectURL(f); a.download="Rm"+(r.number||"room")+".mp4"; a.click();
    }
    openWa();
    r.videoWhatsApp=true; save();
    alert("Video downloaded. In WhatsApp tap + and pick that file.");
  }
  function grab(r,cb){
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
  function bar(){
    if(role()!=="housekeeper" || !ROOM) return;
    var r=findRoom(ROOM); if(!r) return;
    if(document.getElementById("hkSendBar")) return;
    var inp=document.getElementById("oneVid");
    var host=inp&&inp.parentNode || document.getElementById("app");
    if(!host) return;
    var d=document.createElement("div");
    d.id="hkSendBar";
    d.className="card";
    d.innerHTML="<p><b>After you record:</b> 1 Send video  2 Submit room</p>"+
      "<p>"+(r.videoReady?("Video ready: "+(r.videoName||"yes")):"No video stored yet")+"</p>"+
      "<button type=button class=btn id=hkSendVid>Send video to duty manager</button> "+
      "<button type=button class=btn id=hkSubmit2>Submit room for certify</button>";
    host.appendChild(d);
    document.getElementById("hkSendVid").onclick=function(){
      grab(r,function(file){
        if(!file && !r.videoReady){ alert("Record the video first"); return; }
        r.videoReady=true; save();
        sendFile(r,file);
      });
    };
    document.getElementById("hkSubmit2").onclick=function(){
      if(!r.videoReady && !window.POSH_VID_FILE){ alert("Record and send the video first"); return; }
      r.videoReady=true;
      r.status="submitted";
      r.check=true;
      if(typeof note==="function") note("HK submitted Rm "+r.number+" with video");
      save();
      if(typeof window.poshAlert==="function") window.poshAlert("Room submitted","Rm "+r.number);
      alert("Submitted. Duty manager can certify after watching the video.");
      draw();
    };
  }
  var _bind=window.bind;
  window.bind=function(){
    if(typeof _bind==="function") _bind();
    var inp=document.getElementById("oneVid");
    if(inp){
      inp.setAttribute("accept","video/*");
      inp.onchange=function(){
        var r=findRoom(ROOM); if(!r) return;
        var f=this.files&&this.files[0]; if(!f) return;
        window.POSH_VID_FILE=f;
        r.videoReady=true; r.videoName=f.name||"walkthrough.mp4"; r.videoWatched=false;
        try{
          var db=indexedDB.open("poshvid",1);
          db.onupgradeneeded=function(){db.result.createObjectStore("v")};
          db.onsuccess=function(){ db.result.transaction("v","readwrite").objectStore("v").put(f,r.id); };
        }catch(e){}
        save();
        var p=document.querySelector("#hkSendBar p");
        if(p) p.textContent="Video ready: "+r.videoName;
        alert("Video captured. Tap Send video, then Submit room.");
      };
    }
    bar();
  };
  var _draw=window.draw;
  window.draw=function(){ _draw(); bar(); };
})();
