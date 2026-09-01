(function(){
function boot(){
if(typeof viewDesk!=="function"){setTimeout(boot,80);return;}
if(window.__salesQ)return;window.__salesQ=true;
if(!db.salesQueries)db.salesQueries=[];
function mine(){
  return (db.salesQueries||[]).filter(function(q){
    if(user.role==="accountant")return !q.site||q.site===user.site||q.byId===user.id;
    if(user.role==="frontdesk")return !q.site||q.site===user.site;
    return true;
  }).slice().reverse();
}
function box(){
  if(!(user&&(user.role==="accountant"||user.role==="frontdesk"||user.role==="ceo"||user.role==="superadmin")))return "";
  var list=mine();
  if(!list.length)return "<div class=card><h3>Sales queries</h3><p>Accountant uses Query sales on the gold bar, then leaves a comment. Front Desk replies from the gold bar.</p></div>";
  return "<div class=card><h3>Sales queries</h3>"+list.map(function(q){
    var replies=(q.replies||[]).map(function(r){return "<p><b>"+r.by+"</b> · "+r.at+"<br>"+r.text+"</p>";}).join("");
    return "<div class=card><p><b>"+(q.from||"")+" to "+(q.to||"")+"</b> · "+(q.site||"")+"</p>"+
      "<p>Billed "+(q.billed||0)+" · Folios "+(q.count||0)+"</p>"+
      (q.note?("<p><b>Accountant:</b> "+q.note+"</p>"):"")+
      replies+"<p>"+q.at+" · "+q.by+"</p></div>";
  }).join("")+"</div>";
}
var _vd=viewDesk;
viewDesk=function(){return box()+_vd.apply(this,arguments);};
try{draw();}catch(e){}
}
boot();
})();
