(function(){
function boot(){
if(typeof db==="undefined"||typeof viewRoom!=="function"){setTimeout(boot,80);return;}
if(window.__poshEvidence2)return;
window.__poshEvidence2=true;
function roomVideo(r){
  if(!r)return "";
  if(r.video&&String(r.video).indexOf("data:video")===0)return r.video;
  var photos=r.photos||{};
  if(photos.Walkthrough&&String(photos.Walkthrough).indexOf("data:video")===0)return photos.Walkthrough;
  return "";
}
mediaCount=function(r){return (roomVideo(r)||(r&&r.videoReady))?1:0;};
var _vr=viewRoom;
viewRoom=function(){
  var r=(db.rooms||[]).filter(function(x){return x.id===roomId;})[0];
  if(!r)return "<p id=back>&larr; Back</p>";
  if(user&&user.role==="housekeeper"&&(r.status==="certified"||r.status==="ooo"||r.locked)){
    return "<p id=back>&larr; Back</p><div class=warn>Room "+r.number+" is certified and locked.</div>";
  }
  var vid=roomVideo(r);
  var ev="<div class=card><h3>One walkthrough video</h3>"+(vid?mediaBox(vid):(r.videoReady?"<div class=ok>One walkthrough video is on file.</div>":"<p>Use the gold bar to attach one video. Photos are not accepted.</p>"))+"</div>";
  return "<p id=back>&larr; Back</p><h1>Room "+r.number+"</h1><p>"+r.status+" · "+(typeof jobLabel==="function"?jobLabel(r.job):r.job)+"</p>"+ev+(typeof laundryBox==="function"?laundryBox(r):"");
};
try{draw();}catch(e){}
}
boot();
})();
