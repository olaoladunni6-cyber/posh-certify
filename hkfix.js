(function(){
function boot(){
if(typeof canReport!=="function"||typeof viewIssues!=="function"){setTimeout(boot,80);return;}
if(window.__hkFix)return;window.__hkFix=true;
var _cr=canReport;
canReport=function(){return (user&&user.role==="housekeeper")||_cr();};
var _vi=viewIssues;
viewIssues=function(){
  if(user&&user.role==="housekeeper"){
    var form="<div class=card><h3>Report a fault</h3><p>Housekeepers can send a room fault to maintenance here or from the gold bar.</p><select id=irm>"+(typeof siteRooms==="function"?siteRooms():db.rooms||[]).filter(function(r){return !r.site||siteMatch(r.site);}).map(function(r){return "<option value='"+r.number+"'>"+r.number+"</option>";}).join("")+"</select><textarea id=ifault placeholder='What is wrong?'></textarea><p>Deadline (hours)</p><input id=ihours type=number min=1 max=24 value=6></div>";
    return "<h1>Fix</h1>"+form+_vi.apply(this,arguments);
  }
  return _vi.apply(this,arguments);
};
var _b=bind;
bind=function(){
  _b();
  var d2=document.getElementById("d2");
  if(d2)d2.onclick=function(){tab="issues";roomId=null;window.__poshForceDraw=true;draw();};
};
try{draw();}catch(e){}
}
boot();
})();
