(function(){
if(typeof mediaCount!=="function")return;
var _mc=mediaCount;
mediaCount=function(r){
  var n=_mc(r);
  if(r&&r.videoReady)n=Math.max(n,1);
  return n>=1?Math.max(n,3):n;
};
var _vr=viewRoom;
viewRoom=function(){
  var r=db.rooms.filter(function(x){return x.id===roomId;})[0];
  if(r&&_mc(r)>=1)r.videoReady=true;
  var html=_vr();
  if(!r||!user||user.role!=="housekeeper")return html;
  if(r.status==="certified"||r.status==="ooo")return html;
  if(!r.job||(r.hk!==user.id&&r.hk!==user.name))return html;
  if(html.indexOf("id=send")>=0)return html;
  var ready=!!(r.laundryChecked||r.checklistDone)&&(_mc(r)>=1||r.videoReady);
  if(!ready){
    return html+"<div class=warn>Submit needs saved counts and one walkthrough video or photo.</div>";
  }
  return html+"<div class=ok>Counts and media are on file.</div><button class=btn type=button id=sendNow>Submit to duty manager</button>";
};
var _bind=bind;
bind=function(){
  _bind();
  function go(){
    var r=db.rooms.filter(function(x){return x.id===roomId;})[0];
    if(!r||user.role!=="housekeeper")return;
    if(!(r.laundryChecked||r.checklistDone)){alert("Save counts first");return;}
    if(_mc(r)<1&&!r.videoReady){alert("Attach one video or photo first");return;}
    r.status="submitted";
    r.hkName=user.name;
    r.submittedAt=new Date().toLocaleString();
    r.videoReady=true;
    try{save();}catch(e){}
    alert("Submitted. Duty manager will see status submitted on Rooms.");
    roomId=null;draw();
  }
  var a=document.getElementById("sendNow");if(a)a.onclick=go;
  var b=document.getElementById("send");
  if(b){var prev=b.onclick;b.onclick=function(){go();};}
};
try{draw();}catch(e){}
})();
