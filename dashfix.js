(function(){
function boot(){
if(typeof db==="undefined"||typeof draw!=="function"){setTimeout(boot,60);return;}
if(window.__dashFix)return;window.__dashFix=true;
if(!db.fdOpenList)db.fdOpenList=["Cash float counted and recorded","Keys / key cards collected","In-house occupancy reviewed","Expected arrivals reviewed","Expected departures reviewed","Handover notes from last shift read","POS, printer and phone tested","Desk and uniform ready","Incident book checked","Duty manager informed I am on duty"];
if(!db.fdCloseList)db.fdCloseList=["Cash float counted and handed over","Keys / key cards returned","Shift sales / folios completed","In-house and expected guests updated","Handover notes written","Incidents recorded","POS closed / printer cleared","Desk left tidy","Duty manager informed shift has ended"];
function day(){return typeof today==="function"?today():"";}
function site(){return (user&&user.site)||"";}
function role(){return (user&&user.role)||"";}
function isDesk(){return role()==="frontdesk";}
function isLead(){return role()==="manager"||role()==="ceo"||role()==="gm"||role()==="accountant"||role()==="superadmin";}
function roomsHere(){return (db.rooms||[]).filter(function(r){return !site()||!r.site||r.site===site()||role()==="ceo"||role()==="superadmin";});}
function ticks(list,cls){
  return list.map(function(name,i){return "<label class=row style='display:flex;justify-content:space-between;gap:8px;padding:6px 0'><span>"+name+"</span><input type=checkbox class='"+cls+"' data-name=\""+String(name).replace(/"/g,"")+"\"></label>";}).join("");
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
  var rows=list.map(function(s){return "<p>"+s.qty+" x "+s.name+" · NGN "+Number(s.amount||0).toLocaleString()+(s.room?(" · Rm "+s.room):"")+(s.guest?(" · "+s.guest):"")+" · "+(s.by||"")+"</p>";}).join("");
  return "<div class=card id=dashMart><h3>Mini mart sales today · "+(site()||"all")+"</h3><p>Total <b>NGN "+total.toLocaleString()+"</b> · "+list.length+" sales</p>"+(rows||"<p>No mini mart sale yet. Front Desk receives stock, then sells from Desk.</p>")+"</div>";
}
function statusHtml(){
  var all=roomsHere();
  function block(title,arr){
    return "<div class=card><h3>"+title+"</h3>"+(arr.length?arr.map(function(r){return "<p><b>Rm "+r.number+"</b> · "+(r.status||"").toUpperCase()+(r.hkNote?(" · "+r.hkNote):"")+(r.site?(" · "+r.site):"")+"</p>";}).join(""):"<p>None</p>")+"</div>";
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
    "<p><b>Opening checklist</b></p><p>Tick every line done, then tap Submit opening on the gold bar.</p>"+
    ticks(db.fdOpenList,"fdOpenTick")+
    "<textarea id=fdOpenNote placeholder='Opening notes'></textarea>"+
    "<p><b>Closing checklist</b></p><p>Tick every line done, then tap Submit closing on the gold bar.</p>"+
    ticks(db.fdCloseList,"fdCloseTick")+
    "<textarea id=fdCloseNote placeholder='Handover notes'></textarea></div>";
}
function submittedChecks(){
  if(!(isDesk()||isLead()))return "";
  var list=(db.fdChecks||[]).filter(function(c){
    if(c.day&&c.day!==day())return false;
    if(role()==="ceo"||role()==="superadmin")return true;
    return !c.site||c.site===site();
  }).slice().reverse();
  if(!list.length)return "<div class=card id=dashSentChecks><h3>Submitted checklists today</h3><p>None yet.</p></div>";
  return "<div class=card id=dashSentChecks><h3>Submitted checklists today</h3>"+list.map(function(c){
    var items=(c.items||[]).map(function(n){return "<p>✓ "+n+"</p>";}).join("");
    return "<p><b>"+c.by+" · "+(c.kind==="close"?"Closing":"Opening")+"</b> · "+c.at+(c.note?("<br>"+c.note):"")+items+"</p>";
  }).join("")+"</div>";
}
function inject(){
  if(!user)return;
  stripCheckinMart();
  if(document.getElementById("dashStatus"))return;
  var wrap=document.querySelector(".wrap");
  if(!wrap)return;
  var html="";
  if(isDesk()||isLead())html+=statusHtml()+submittedChecks()+martSalesHtml();
  if(isDesk())html+=checksHtml();
  if(!html)return;
  wrap.insertAdjacentHTML("afterbegin",html);
}
var _draw=draw;
draw=function(){
  _draw.apply(this,arguments);
  try{inject();}catch(e){console&&console.log&&console.log("dashfix",e);}
};
try{draw();}catch(e){}
}
boot();
})();
