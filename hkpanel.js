(function(){
function boot(){
if(typeof db==="undefined"||typeof draw!=="function"){setTimeout(boot,80);return;}
if(window.__hkPanel)return;window.__hkPanel=true;
function isHk(){return user&&user.role==="housekeeper";}
function mine(){
  return (db.rooms||[]).filter(function(r){
    if(!isHk())return false;
    if(r.status==="certified"||r.status==="ooo")return false;
    if(user.site&&r.site&&user.site!=="All locations"&&r.site!==user.site)return false;
    return r.hk===user.id||r.hk===user.name||r.hkName===user.name;
  });
}
function current(){
  if(roomId){
    var hit=(db.rooms||[]).filter(function(r){return r.id===roomId;})[0];
    if(hit)return hit;
  }
  return mine()[0]||null;
}
window.poshHkSubmit=function(){
  if(!isHk()){alert("Housekeeper login only");return;}
  var r=current();
  if(!r){alert("No assigned room. Ask Front Desk to Assign room.");return;}
  if(r.status==="certified"||r.status==="ooo"){alert("This room is locked.");return;}
  if(!(r.checklistDone||r.laundryChecked)){
    if(!confirm("Checklist not ticked. Submit anyway only if you already saved counts?"))return;
    r.checklistDone=true;
  }
  if(!r.videoReady){alert("Attach one walkthrough video first.");return;}
  r.status="submitted";r.hkName=user.name;r.submittedAt=new Date().toLocaleString();
  try{save();}catch(e){}
  try{draw();}catch(e){}
  alert("Rm "+r.number+" submitted for certification.");
};
function panel(){
  if(!isHk()){
    var old=document.getElementById("hkPanel");
    if(old)old.style.display="none";
    return;
  }
  var el=document.getElementById("hkPanel");
  if(!el){
    el=document.createElement("div");
    el.id="hkPanel";
    el.className="card";
    var wrap=document.querySelector(".wrap")||document.body;
    var ops=document.getElementById("opsBar");
    if(ops&&ops.parentNode)ops.parentNode.insertBefore(el,ops.nextSibling);
    else wrap.insertBefore(el,wrap.firstChild);
  }
  el.style.display="block";
  var list=mine();
  var r=current();
  var rows=list.map(function(x){
    var on=r&&x.id===r.id?" style='border:2px solid #c4a574'":"";
    return "<div class=room"+on+" data-id='"+x.id+"'><b>Rm "+x.number+"</b> · "+(x.job||"job not set")+" · "+(x.status||"pending")+"<br>"+(x.site||"")+" · assigned to you<br><button type=button class='btn openHk' data-id='"+x.id+"'>Open</button></div>";
  }).join("");
  if(!rows)rows="<div class=warn>No room assigned to you yet. Front Desk must tap Assign room.</div>";
  var vid=r?("<p>Open room: <b>"+r.number+"</b> "+(r.job||"")+" "+(r.videoReady?"· video attached":"· video missing")+"</p><input id=hkOneVid type=file accept='video/mp4,video/*' capture='environment'><p><button type=button class=btn id=hkDoSubmit>Submit room</button></p>"):"<p>Open an assigned room, attach one video, then Submit room.</p>";
  el.innerHTML="<h2>My assigned rooms</h2>"+rows+vid;
  el.querySelectorAll(".openHk").forEach(function(b){
    b.onclick=function(){roomId=b.getAttribute("data-id");tab="rooms";try{draw();}catch(e){}};
  });
  var inp=document.getElementById("hkOneVid");
  if(inp)inp.onchange=function(){
    var f=this.files&&this.files[0], room=current();
    if(!room||!f)return;
    if(String(f.type||"").indexOf("video")!==0&&!/\.(mp4|mov|webm|m4v)$/i.test(f.name||"")){alert("One video only.");return;}
    room.videoReady=true;room.videoName=f.name||"walkthrough.mp4";
    try{save();}catch(e){}
    alert("Video attached to Rm "+room.number+". Now Submit room.");
    try{draw();}catch(e){}
  };
  var sub=document.getElementById("hkDoSubmit");
  if(sub)sub.onclick=window.poshHkSubmit;
}
var _d=draw;
draw=function(){
  var out=_d.apply(this,arguments);
  try{panel();}catch(e){}
  return out;
};
try{draw();}catch(e){}
}
boot();
})();
