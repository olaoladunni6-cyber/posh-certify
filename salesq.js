(function(){
function boot(){
if(typeof viewDesk!=="function"){setTimeout(boot,80);return;}
if(window.__salesQ)return;window.__salesQ=true;
if(!db.salesQueries)db.salesQueries=[];
function siteOk(q){
  if(!user)return false;
  if(user.role==="ceo"||user.role==="superadmin")return true;
  return !q.site||q.site===user.site||q.byId===user.id;
}
function mine(){return (db.salesQueries||[]).filter(siteOk).slice().reverse();}
function threadOf(q){
  if(q.thread&&q.thread.length)return q.thread;
  var t=[];
  if(q.note)t.push({role:"accountant",by:q.by,at:q.at,text:q.note});
  (q.replies||[]).forEach(function(r){t.push({role:r.role||"frontdesk",by:r.by,at:r.at,text:r.text});});
  q.thread=t;
  return t;
}
function box(){
  if(!(user&&(user.role==="accountant"||user.role==="frontdesk"||user.role==="ceo"||user.role==="superadmin"||user.role==="manager")))return "";
  var list=mine();
  if(!list.length)return "<div class=card><h3>Sales dialogue</h3><p>Accountant opens Query sales. Front Desk replies on the same thread. Keep talking until the query is closed.</p></div>";
  return "<div class=card><h3>Sales dialogue · accountant ↔ front desk</h3><p>Same conversation stays open for both shifts. Use Reply to query to continue.</p>"+list.map(function(q,i){
    var msgs=threadOf(q).map(function(m){
      return "<p><b>"+(m.role==="accountant"?"Accountant":"Front Desk")+" · "+m.by+"</b><br>"+m.text+"<br><small>"+m.at+"</small></p>";
    }).join("");
    return "<div class=card><p><b>#"+(list.length-i)+" · "+(q.from||"")+" to "+(q.to||"")+"</b> · "+(q.site||"")+" · "+(q.status||"open").toUpperCase()+"</p>"+
      "<p>Room "+(q.rooms||0)+" · Mini mart "+(q.mart||0)+" · Extras "+(q.extras||0)+" · Billed "+(q.billed||0)+" · Folios "+(q.count||0)+"</p>"+
      msgs+"</div>";
  }).join("")+"</div>";
}
var _vd=viewDesk;
viewDesk=function(){return box()+_vd.apply(this,arguments);};
window.poshOpenQueries=function(){return (db.salesQueries||[]).filter(function(q){return siteOk(q)&&(q.status||"open")!=="closed";});};
window.poshAllQueries=function(){return (db.salesQueries||[]).filter(siteOk);};
window.poshContinueQuery=function(q,text,role){
  if(!q)return;
  threadOf(q);
  q.thread.push({role:role||(user.role==="accountant"?"accountant":"frontdesk"),by:user.name,at:new Date().toLocaleString(),text:String(text).trim()});
  q.status="open";
  q.lastAt=new Date().toLocaleString();
  q.lastBy=user.name;
};
try{draw();}catch(e){}
}
boot();
})();
