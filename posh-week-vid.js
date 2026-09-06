(function(){
function putVid(id,file){
  try{
    var r=indexedDB.open("poshvid",1);
    r.onupgradeneeded=function(){r.result.createObjectStore("v")};
    r.onsuccess=function(){
      var tx=r.result.transaction("v","readwrite");
      tx.objectStore("v").put(file,id);
    };
  }catch(e){}
}
function getVid(id,cb){
  try{
    var r=indexedDB.open("poshvid",1);
    r.onupgradeneeded=function(){r.result.createObjectStore("v")};
    r.onsuccess=function(){
      var req=r.result.transaction("v").objectStore("v").get(id);
      req.onsuccess=function(){cb(req.result||null)};
      req.onerror=function(){cb(null)};
    };
    r.onerror=function(){cb(null)};
  }catch(e){cb(null)}
}
function showPlayer(){
  if(!ROOM)return;
  if(!(role()==="manager"||role()==="superadmin"||role()==="ceo"))return;
  var r=findRoom(ROOM); if(!r)return;
  var app=document.getElementById("app");
  if(!app||document.getElementById("dmVid"))return;
  var box=document.createElement("div");
  box.className="card";
  box.innerHTML="<h2>Walkthrough video</h2><div id=dmVid>Looking for video…</div><button type=button class=btn id=watched>I watched this video</button>";
  app.insertBefore(box, app.children[1]||null);
  getVid(r.id,function(blob){
    var el=document.getElementById("dmVid"); if(!el)return;
    if(!blob){ el.innerHTML="<div class=warn>No video on this phone. Watch on WhatsApp then tap I watched on WhatsApp.</div>"; return; }
    var url=URL.createObjectURL(blob);
    el.innerHTML="<video id=playV controls playsinline style='width:100%;background:#000' src='"+url+"'></video>";
    var v=document.getElementById("playV");
    if(v) v.addEventListener("ended",function(){r.videoWatched=true;save();});
  });
  var w=document.getElementById("watched");
  if(w) w.onclick=function(){
    if(!document.getElementById("playV")){alert("No local video — use I watched on WhatsApp");return}
    r.videoWatched=true;save();alert("Marked watched");
  };
}
var _draw=window.draw;
window.draw=function(){
  _draw();
  showPlayer();
  var inp=document.getElementById("oneVid");
  if(inp && !inp.getAttribute("data-bound")){
    inp.setAttribute("data-bound","1");
    inp.setAttribute("accept","video/*");
    inp.setAttribute("capture","environment");
    inp.onchange=function(){
      var room=findRoom(ROOM); if(!room)return;
      var f=this.files&&this.files[0];
      if(!f)return;
      if(f.type && f.type.indexOf("video")!==0){alert("Must be a video");this.value="";return}
      window.POSH_VID_FILE=f;
      room.videoReady=true; room.videoName=f.name; room.videoWatched=false;
      putVid(room.id,f); save();
      alert("Video kept. Now tap Share / send video.");
    };
  }
  var c=document.getElementById("certify");
  if(c){
    c.onclick=function(){
      var room=findRoom(ROOM); if(!room)return;
      if(room.status!=="submitted"){alert("Housekeeper must submit first");return}
      if(!room.videoReady){alert("No video on this room");return}
      if(!room.videoWatched){alert("Watch the walkthrough first, then Certify");return}
      room.status="certified"; save(); alert("Certified after video review"); draw();
    };
  }
};
})();
