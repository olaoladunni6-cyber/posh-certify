(function(){
function boot(){
if(typeof viewBoard!=="function"){setTimeout(boot,80);return;}
if(window.__hkNote)return;window.__hkNote=true;
var _vb=viewBoard;
viewBoard=function(){
  var html=_vb.apply(this,arguments);
  if(!user||user.role!=="housekeeper")return html;
  var mine=(db.rooms||[]).filter(function(r){return r.hk===user.id&&r.hkNote;});
  var also=(db.rooms||[]).filter(function(r){return siteMatch(r.site)&&(r.status==="pending"||r.status==="dirty")&&r.hkNote;});
  var list=mine.length?mine:also;
  if(!list.length)return "<div class=card><h3>Duty manager notes</h3><p>No return-to-service instruction yet.</p></div>"+html;
  var cards=list.map(function(r){
    return "<div class=card><h3>Room "+r.number+" returned to service</h3><p>"+r.hkNote+"</p><p>"+(r.hkNoteBy||"Duty manager")+" · "+(r.hkNoteAt||"")+"</p></div>";
  }).join("");
  return "<h1>Instructions for you</h1>"+cards+html;
};
try{draw();}catch(e){}
}
boot();
})();
