(function(){
function boot(){
if(typeof db==="undefined"||typeof viewRoom!=="function"){setTimeout(boot,80);return;}
if(window.__poshEvidence)return;
window.__poshEvidence=true;
function roomVideo(r){
  if(!r)return "";
  if(r.video&&String(r.video).indexOf("data:video")===0)return r.video;
  var photos=r.photos||{};
  if(photos.Walkthrough&&String(photos.Walkthrough).indexOf("data:video")===0)return photos.Walkthrough;
  var keys=Object.keys(photos);
  for(var i=0;i<keys.length;i++){
    if(String(photos[keys[i]]||"").indexOf("data:video")===0)return photos[keys[i]];
  }
  return "";
}
mediaCount=function(r){return roomVideo(r)?3:0;};
viewRoom=function(){
  var r=db.rooms.filter(function(x){return x.id===roomId;})[0];
  if(!seesAll()&&user.role!=="housekeeper"&&r&&!siteMatch(r.site))return "<p id=back>&larr; Back</p><div class=warn>This room is not at your location.</div>";
  var miss=missCount(r),shots=mediaCount(r),vid=roomVideo(r);
  var act=mgr()?(miss||shots<3?"<div class=warn>Cannot certify yet. Need the walkthrough video and zero missing items.</div><button class='btn bad' id=ooo>Set OUT OF ORDER</button> <button class=btn id=rel>Return to service</button>":"<button class=btn id=cert>Certify and notify front desk</button> <button class='btn bad' id=ooo>Set OUT OF ORDER</button> <button class=btn id=rel>Return to service</button>"):isMaint()?"<button class='btn bad' id=ooo>Set OUT OF ORDER</button> <button class=btn id=rel>Return to service</button>":isSuper()?"<div class=ok>Super Admin can edit or delete this room.</div>":isFD()?"<div class=ok>Allocate on Rooms.</div>":isGM()||isLaundry()||isKitchen()||isStore()?"<div class=ok>View only.</div>":(!r.job||r.hk!==user.id?"<div class=warn>Not allocated to you.</div>":shots<3?"<div class=warn>Record one walkthrough video first.</div>":r.laundryChecked?"<button class=btn id=send>Submit to duty manager</button>":"<div class=warn>Save laundry count first.</div>");
  var cap=user&&user.role==="housekeeper"&&r.hk===user.id&&r.job;
  var ev="<div class=card><h3>Walkthrough video</h3><p>One video of the room only. No still photos.</p>"+(vid?mediaBox(vid):"<p>No video yet.</p>")+(cap?"<label class=btn>Record video<input id=walkVid type=file accept='video/*' capture='environment'></label>":"")+"</div>";
  return "<p id=back>&larr; Back</p><h1>Room "+r.number+"</h1><p>"+r.status+" · "+jobLabel(r.job)+" · "+hkName(r.hk)+"</p>"+(isSuper()?("<div class=card><h3>Edit room</h3><input id=enum value='"+r.number+"'><input id=etype value='"+r.type+"'>"+locSel("esite",r.site)+"<button class=btn id=saveRm>Save room</button> <button class='btn bad' id=delRm>Delete room</button></div>"):"")+(isFD()||mgr()?("<div class=card><h3>Re-allocate</h3>"+hkSel("rhk",r.hk)+jobSel("rjob",r.job||"checkout")+"<button class=btn id=reAlloc>Save allocation</button></div>"):"")+ev+laundryBox(r)+sendBox(r)+act;
};
var _bEv=bind;
bind=function(){
  _bEv();
  var inp=document.getElementById("walkVid");
  if(inp)inp.onchange=function(){
    var f=inp.files&&inp.files[0];
    if(!f)return;
    if(f.type&&f.type.indexOf("video")!==0){alert("Record a video, not a photo");return;}
    var r=db.rooms.filter(function(x){return x.id===roomId;})[0];
    var rd=new FileReader();
    rd.onload=function(){
      r.video=rd.result;
      if(!r.photos)r.photos={};
      r.photos.Walkthrough=rd.result;
      save();draw();
    };
    rd.readAsDataURL(f);
  };
  var send=document.getElementById("send");
  if(send)send.onclick=function(){
    if(user.role!=="housekeeper")return;
    var r=db.rooms.filter(function(x){return x.id===roomId;})[0];
    if(!r.job||r.hk!==user.id)return;
    if(mediaCount(r)<3||!r.laundryChecked){alert("Walkthrough video and laundry count required.");return;}
    r.status="submitted";save();roomId=null;draw();
  };
};
try{draw();}catch(e){}
}
boot();
})();
