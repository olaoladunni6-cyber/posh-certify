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
  return "";
}
mediaCount=function(r){return (roomVideo(r)||r.videoReady)?3:0;};
viewRoom=function(){
  var r=db.rooms.filter(function(x){return x.id===roomId;})[0];
  if(!r)return "<p id=back>&larr; Back</p>";
  var vid=roomVideo(r);
  var ev="<div class=card><h3>Walkthrough video</h3>"+(vid?mediaBox(vid):(r.videoReady?"<div class=ok>Walkthrough video is on file for this room.</div>":"<p>No video yet. Use the gold bar Choose File.</p>"))+"</div>";
  return "<p id=back>&larr; Back</p><h1>Room "+r.number+"</h1><p>"+r.status+" · "+(typeof jobLabel==="function"?jobLabel(r.job):r.job)+"</p>"+ev+(typeof laundryBox==="function"?laundryBox(r):"")+(typeof sendBox==="function"?sendBox(r):"");
};
try{draw();}catch(e){}
}
boot();
})();
