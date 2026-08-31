(function(){
function boot(){
if(typeof viewBoard!=="function"){setTimeout(boot,80);return;}
if(window.__hkResub)return;window.__hkResub=true;
var _vb=viewBoard;
viewBoard=function(){
  var html=_vb.apply(this,arguments);
  if(!user||user.role!=="housekeeper")return html;
  var need=(db.rooms||[]).filter(function(r){
    return siteMatch(r.site)&&r.status!=="certified"&&r.status!=="ooo"&&(r.hkNote||r.status==="pending"||r.status==="submitted");
  });
  if(!need.length)return html;
  var cards=need.map(function(r){
    return "<div class=card><h3>Room "+r.number+" needs recertify</h3>"+
      "<p>Status: "+r.status+"</p>"+
      (r.hkNote?("<p><b>Duty manager said:</b> "+r.hkNote+"</p>"):"")+
      (r.hkFix?("<p><b>You reported:</b> "+r.hkFix+"</p>"):"<p>Attach a new video and submit again.</p>")+
      "</div>";
  }).join("");
  return "<h1>Recertify these rooms</h1>"+cards+html;
};
try{draw();}catch(e){}
}
boot();
})();
