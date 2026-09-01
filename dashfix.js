(function(){
function boot(){
if(typeof db==="undefined"||typeof draw!=="function"){setTimeout(boot,60);return;}
if(window.__dashFix)return;window.__dashFix=true;
if(!db.fdOpenList)db.fdOpenList=["Cash float counted and recorded","Keys / key cards collected","In-house occupancy reviewed","Expected arrivals reviewed","Expected departures reviewed","Handover notes from last shift read","POS, printer and phone tested","Desk and uniform ready","Incident book checked","Duty manager informed I am on duty"];
if(!db.fdCloseList)db.fdCloseList=["Cash float counted and handed over","Keys / key cards returned","Shift sales / folios completed","In-house and expected guests updated","Handover notes written","Incidents recorded","POS closed / printer cleared","Desk left tidy","Duty manager informed shift has ended"];
if(!db.salesQueries)db.salesQueries=[];
function day(){return typeof today==="function"?today():"";}
function site(){return (user&&user.site)||"";}
function role(){return (user&&user.role)||"";}
function isDesk(){return role()==="frontdesk";}
function isLead(){return role()==="manager"||role()==="ceo"||role()==="gm"||role()==="accountant"||role()==="superadmin";}
function labelRole(r){
  if(r==="accountant")return "Accountant";
  if(r==="manager")return "Duty manager";
  if(r==="ceo"||r==="gm")return "CEO";
  if(r==="superadmin")return "Super Admin";
  return "Front Desk";
}
function threadOf(q){
  if(q.thread&&q.thread.length)return q.thread;
  var t=[];
  if(q.note)t.push({role:"accountant",by:q.by,at:q.at,text:q.note});
  (q.replies||[]).forEach(function(r){t.push({role:r.role||"frontdesk",by:r.by,at:r.at,text:r.text});});
  q.thread=t;
  return t;
}
window.poshContinueQuery=function(q,text,who){
  if(!q)return;
  threadOf(q);
  q.thread.push({role:who||role()||"frontdesk",by:user&&user.name||"",at:new Date().toLocaleString(),text:String(text).trim()});
  q.status="open";
  q.lastAt=new Date().toLocaleString();
  q.lastBy=user&&user.name||"";
  q.loop=["accountant","manager","ceo","frontdesk"];
};
function queryHtml(){
  if(!(isDesk()||isLead()))return "";
  var list=(db.salesQueries||[]).filter(function(q){
    if(role()==="ceo"||role()==="superadmin")return true;
    return !q.site||q.site===site();
  }).slice().reverse();
  var body=list.length?list.map(function(q){
    var msgs=threadOf(q).map(function(m){return "<p><b>"+labelRole(m.role)+" · "+m.by+"</b><br>"+m.text+"<br><small>"+m.at+"</small></p>";}).join("");
    return "<div class=card><p><b>"+(q.from||"")+" to "+(q.to||"")+"</b> · "+(q.site||"")+" · "+(q.status||"open").toUpperCase()+"</p>"+
      "<p>In the loop: Accountant, Duty manager, CEO, Front Desk</p>"+msgs+"</div>";
  }).join(""):"<p>No sales query yet. Accountant, duty manager or CEO opens Query sales. Front Desk replies. All four stay on the same thread.</p>";
  return "<div class=card id=dashQuery><h3>Sales query · Front Desk ↔ Accountant ↔ Duty manager ↔ CEO</h3>"+
    "<p>Open Desk to read the thread. Use <b>Query sales</b> to start or add. Use <b>Reply to query</b> to answer. Then Publish so the others Refresh and see it.</p>"+body+"</div>";
}
function roomsHere(){return (db.rooms||[]).filter(function(r){return !site()||!r.site||r.site===site()||role()==="ceo"||role()==="superadmin";});}
function ticks(list,cls){
  return list.map(function(name){return "<label class=row style='display:flex;justify-content:space-between;gap:8px;padding:6px 0'><span>"+name+"</span><input type=checkbox class='"+cls+"' data-name=\""+String(name).replace(/"/g,"")+"\"></label>";}).join("");
}
function collect(cls){
  var out=[];
  document.querySelectorAll("."+cls).forEach(function(box){if(box.checked)out.push(box.getAttribute("data-name")||"");});
  return out.filter(Boolean);
}
window.poshCollectOpen=function(){return collect("fdOpenTick");};
window.poshCollectClose=function(){return collect("fdCloseTick");};
window.poshOpenNote=function(){return ((document.getElementById("fdOpenNote")||{}).value||"").trim();};
window.poshCloseNote=function(){return ((document.getElementById("fdCloseNote")||{}).value||"").trim();};
function stripCheckinMart(){
  ["cinMart","cinMartNote"].forEach(function(id){
    var el=document.getElementById(id);
    if(!el)return;
    var prev=el.previousElementSibling;
    if(prev&&/mini\s*mart/i.test(prev.textContent||""))prev.parentNode.removeChild(prev);
    el.parentNode.removeChild(el);
  });
}
function martSalesHtml(){
  var list=(db.martSales||[]).filter(function(s){
    if(s.day&&s.day!==day())return false;
    if(role()==="ceo"||role()==="superadmin")return true;
    return !s.site||s.site===site();
  }).slice().reverse();
  var total=list.reduce(function(a,s){return a+Number(s.amount||0);},0);
  var rows=list.map(function(s){return "<p>"+s.qty+" x "+s.name+" · NGN "+Number(s.amount||0).toLocaleString()+(s.room?(" · Rm "+s.room):"")+" · "+(s.by||"")+"</p>";}).join("");
  return "<div class=card id=dashMart><h3>Mini mart sales today</h3><p>Total <b>NGN "+total.toLocaleString()+"</b></p>"+(rows||"<p>No mini mart sale yet.</p>")+"</div>";
}
function statusHtml(){
  var all=roomsHere();
  function block(title,arr){
    return "<div class=card><h3>"+title+"</h3>"+(arr.length?arr.map(function(r){return "<p><b>Rm "+r.number+"</b> · "+(r.status||"").toUpperCase()+(r.hkNote?(" · "+r.hkNote):"")+"</p>";}).join(""):"<p>None</p>")+"</div>";
  }
  return "<div id=dashStatus><h1>Room status · all shifts · "+day()+"</h1>"+
    block("CERTIFIED — ready to sell",all.filter(function(r){return r.status==="certified";}))+
    block("RETURNED TO SERVICE",all.filter(function(r){return r.status==="pending"||(r.hkNote&&r.status!=="certified"&&r.status!=="ooo");}))+
    block("OUT OF ORDER — do not sell",all.filter(function(r){return r.status==="ooo";}))+
    block("SUBMITTED — waiting certify",all.filter(function(r){return r.status==="submitted";}))+"</div>";
}
function checksHtml(){
  if(!isDesk())return "";
  return "<div class=card id=dashChecks><h3>Shift clock and checklists</h3>"+
    "<p><b>Opening checklist</b></p>"+ticks(db.fdOpenList,"fdOpenTick")+"<textarea id=fdOpenNote placeholder='Opening notes'></textarea>"+
    "<p><b>Closing checklist</b></p>"+ticks(db.fdCloseList,"fdCloseTick")+"<textarea id=fdCloseNote placeholder='Handover notes'></textarea></div>";
}
function submittedChecks(){
  if(!(isDesk()||isLead()))return "";
  var list=(db.fdChecks||[]).filter(function(c){
    if(c.day&&c.day!==day())return false;
    if(role()==="ceo"||role()==="superadmin")return true;
    return !c.site||c.site===site();
  }).slice().reverse();
  return "<div class=card id=dashSentChecks><h3>Submitted checklists today</h3>"+(list.length?list.map(function(c){
    return "<p><b>"+c.by+" · "+(c.kind==="close"?"Closing":"Opening")+"</b> · "+c.at+((c.items||[]).map(function(n){return "<br>✓ "+n;}).join(""))+"</p>";
  }).join(""):"<p>None yet.</p>")+"</div>";
}
function inject(){
  if(!user)return;
  stripCheckinMart();
  if(document.getElementById("dashQuery"))return;
  var wrap=document.querySelector(".wrap");
  if(!wrap)return;
  var html="";
  if(isDesk()||isLead())html+=queryHtml()+statusHtml()+submittedChecks()+martSalesHtml();
  if(isDesk())html+=checksHtml();
  if(!html)return;
  wrap.insertAdjacentHTML("afterbegin",html);
}
var _draw=draw;
draw=function(){
  _draw.apply(this,arguments);
  try{inject();}catch(e){}
};
try{draw();}catch(e){}
}
boot();
})();
