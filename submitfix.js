(function(){
function boot(){
if(typeof bind!=="function"){setTimeout(boot,80);return;}
if(window.__submitFixV2)return;window.__submitFixV2=true;
mediaCount=function(r){return (r&&r.videoReady)?1:0;};
var _vr=typeof viewRoom==="function"?viewRoom:null;
if(_vr){
  viewRoom=function(){
    var r=(db.rooms||[]).filter(function(x){return x.id===roomId;})[0];
    if(r&&user&&user.role==="housekeeper"&&(r.status==="certified"||r.status==="ooo"||r.locked)){
      return "<p id=back>&larr; Back</p><div class=warn>Room "+r.number+" is locked after certification.</div>";
    }
    var html=_vr();
    if(!r||!user||user.role!=="housekeeper")return html;
    var ready=!!(r.laundryChecked||r.checklistDone)&&!!r.videoReady;
    if(!ready)return html+"<div class=warn>Submit needs the checklist and one walkthrough video. Photos are not used.</div>";
    return html+"<div class=ok>Checklist and video on file. Use Submit room on the gold bar.</div>";
  };
}
try{draw();}catch(e){}
}
boot();
})();
