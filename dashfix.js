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
function guestOf(room){
  return (db.checkins||[]).filter(function(c){
    return String(c.room)===String(room)&&!c.checkedOut&&(!c.site||!site()||c.site===site()||role()==="ceo");
  }).slice(-1)[0];
}
function noonFlip(){
  var now=new Date();
  if(now.getHours()<12)return;
  var d=day();
  (db.checkins||[]).forEach(function(c){
    if(c.checkedOut||c.extended)return;
    if(!c.checkout||c.checkout!==d)return;
    c.checkedOut=true;c.autoOut="12:00";
    (db.rooms||[]).forEach(function(r){
      if(String(r.number)!==String(c.room))return;
      if(r.status==="ooo")return;
      r.status="pending";r.job="checkout";r.hkNote="Vacated 12:00 — in service";
    });
  });
}
function siteQueries(){
  return (db.salesQueries||[]).filter(function(q){
    if(role()==="ceo"||role()==="superadmin")return true;
    return !q.site||q.site===site();
  });
}
function threadOf(q){
  if(q.thread&&q.thread.length)return q.thread;
  var t=[];
  if(q.note)t.push({role:"accountant",by:q.by,at:q.at,text:q.note});
  (q.replies||[]).forEach(function(r){t.push({role:r.role||"frontdesk",by:r.by,at:r.at,text:r.text});});
  q.thread=t;return t;
}
window.poshContinueQuery=function(q,text,who){
  if(!q)return;
  threadOf(q);
  q.thread.push({role:who||role()||"frontdesk",by:user&&user.name||"",at:new Date().toLocaleString(),text:String(text).trim()});
  q.status="open";q.loop=["accountant","manager","ceo","frontdesk"];
};
window.poshStartQuery=function(){
  var open=siteQueries().filter(function(q){return (q.status||"open")!=="closed";});
  if(open.length){
    var more=prompt("Add to the open query (or type NEW)","");
    if(more===null)return;
    if(String(more).trim().toUpperCase()!=="NEW"){
      window.poshContinueQuery(open[open.length-1],more,role());
      try{save();}catch(e){}
      alert("Added. Publish so the loop sees it.");return;
    }
  }
  var from=prompt("From date YYYY-MM-DD",day());if(!from)return;
  var to=prompt("To date YYYY-MM-DD",from);if(!to)return;
  var note=prompt("Question for Accountant, Duty manager, CEO and Front Desk","Please confirm room, extras and mini mart");
  if(note===null)return;
  db.salesQueries.push({id:"sq"+Date.now(),from:from,to:to,site:site(),by:user.name,byId:user.id,at:new Date().toLocaleString(),note:String(note).trim(),status:"open",loop:["accountant","manager","ceo","frontdesk"],thread:[{role:role(),by:user.name,at:new Date().toLocaleString(),text:String(note).trim()}],replies:[]});
  try{save();}catch(e){}
  alert("Query opened. Publish this phone.");
};
window.poshReplyQuery=function(){
  var list=siteQueries();
  if(!list.length){alert("No sales query yet");return;}
  var q=list[list.length-1];
  var text=prompt("Reply as "+labelRole(role())+". Type CLOSE to close.","");
  if(text===null||!String(text).trim())return;
  if(String(text).trim().toUpperCase()==="CLOSE"){q.status="closed";try{save();}catch(e){}alert("Closed");return;}
  window.poshContinueQuery(q,text,role());
  try{save();}catch(e){}
  alert("Reply added. Publish.");
};
window.poshExtendStay=function(room){
  var g=guestOf(room);if(!g){alert("No in-house guest in that room");return;}
  var next=prompt("New checkout date YYYY-MM-DD",g.checkout||day());
  if(!next)return;
  g.checkout=String(next).trim();g.extended=true;g.checkedOut=false;
  try{save();}catch(e){}
  alert("Stay extended to "+g.checkout+". Room will not auto in-service at 12:00.");
};
function queryHtml(){
  if(!(isDesk()||isLead()))return "";
  var list=siteQueries().slice().reverse();
  var body=list.length?list.map(function(q){
    var msgs=threadOf(q).map(function(m){return "<p><b>"+labelRole(m.role)+" · "+m.by+"</b><br>"+m.text+"<br><small>"+m.at+"</small></p>";}).join("");
    return "<div class=card><p><b>"+(q.from||"")+" to "+(q.to||"")+"</b> · "+(q.status||"open").toUpperCase()+"</p>"+msgs+"</div>";
  }).join(""):"<p>No sales query yet.</p>";
  return "<div class=card id=dashQuery><h3>Sales query</h3><p>Loop: Accountant · Duty manager · CEO · Front Desk</p>"+
    "<p><button type=button id=dashDoQuery>Start / add to query</button> <button type=button id=dashDoReply>Reply</button></p>"+body+"</div>";
}
function roomsHere(){return (db.rooms||[]).filter(function(r){return !site()||!r.site||r.site===site()||role()==="ceo"||role()==="superadmin";});}
function statusHtml(){
  var all=roomsHere(),d=day();
  var occ=[],due=[],svc=[],ooo=[],ready=[];
  all.forEach(function(r){
    var g=guestOf(r.number);
    if(r.status==="ooo"){ooo.push(r);return;}
    if(g&&g.checkout===d){due.push({r:r,g:g});return;}
    if(g){occ.push({r:r,g:g});return;}
    if(r.status==="pending"||r.status==="submitted"||r.job==="checkout"){svc.push(r);return;}
    ready.push(r);
  });
  function lines(arr,fn){return arr.length?arr.map(fn).join(""):"<p>None</p>";}
  return "<div id=dashStatus><h1>Room status · "+d+"</h1>"+
    "<div class=card><h3>OCCUPIED</h3>"+lines(occ,function(x){return "<p><b>Rm "+x.r.number+"</b> · "+x.g.guest+" · out "+x.g.checkout+(isDesk()?(" <button type=button data-ext='"+x.r.number+"'>Extend</button>"):"")+"</p>";})+"</div>"+
    "<div class=card><h3>READY TO CHECK OUT today</h3><p>At 12:00 these become In service unless Front Desk extends.</p>"+lines(due,function(x){return "<p><b>Rm "+x.r.number+"</b> · "+x.g.guest+(isDesk()?(" <button type=button data-ext='"+x.r.number+"'>Extend</button>"):"")+"</p>";})+"</div>"+
    "<div class=card><h3>IN SERVICE</h3>"+lines(svc,function(r){return "<p><b>Rm "+r.number+"</b> · "+(r.status||"")+(r.hkNote?(" · "+r.hkNote):"")+"</p>";})+"</div>"+
    "<div class=card><h3>OUT OF ORDER</h3>"+lines(ooo,function(r){return "<p><b>Rm "+r.number+"</b></p>";})+"</div>"+
    "<div class=card><h3>VACANT / READY TO SELL</h3>"+lines(ready,function(r){return "<p><b>Rm "+r.number+"</b> · "+(r.status||"vacant")+"</p>";})+"</div></div>";
}
function addCheckoutField(){
  if(!isDesk())return;
  if(document.getElementById("cinOut"))return;
  var room=document.getElementById("cinRoom");
  if(!room)return;
  var p=document.createElement("p");p.textContent="Checkout date";
  var inp=document.createElement("input");inp.id="cinOut";inp.type="date";inp.value=day();
  room.parentNode.insertBefore(p,room.nextSibling);
  room.parentNode.insertBefore(inp,p.nextSibling);
}
function ticks(list,cls){
  return list.map(function(name){return "<label class=row style='display:flex;justify-content:space-between;gap:8px;padding:6px 0'><span>"+name+"</span><input type=checkbox class='"+cls+"' data-name=\""+String(name).replace(/"/g,"")+"\"></label>";}).join("");
}
function collect(cls){
  var out=[];document.querySelectorAll("."+cls).forEach(function(box){if(box.checked)out.push(box.getAttribute("data-name")||"");});return out.filter(Boolean);
}
window.poshCollectOpen=function(){return collect("fdOpenTick");};
window.poshCollectClose=function(){return collect("fdCloseTick");};
window.poshOpenNote=function(){return ((document.getElementById("fdOpenNote")||{}).value||"").trim();};
window.poshCloseNote=function(){return ((document.getElementById("fdCloseNote")||{}).value||"").trim();};
function stripCheckinMart(){
  ["cinMart","cinMartNote"].forEach(function(id){
    var el=document.getElementById(id);if(!el)return;
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
  var rows=list.map(function(s){return "<p>"+s.qty+" x "+s.name+" · NGN "+Number(s.amount||0).toLocaleString()+" · "+(s.by||"")+"</p>";}).join("");
  return "<div class=card id=dashMart><h3>Mini mart sales today</h3><p>Total <b>NGN "+total.toLocaleString()+"</b></p>"+(rows||"<p>No mini mart sale yet.</p>")+"</div>";
}
function checksHtml(){
  if(!isDesk())return "";
  return "<div class=card id=dashChecks><h3>Opening / closing checklists</h3>"+
    "<p><b>Opening</b></p>"+ticks(db.fdOpenList,"fdOpenTick")+"<textarea id=fdOpenNote placeholder='Opening notes'></textarea>"+
    "<p><b>Closing</b></p>"+ticks(db.fdCloseList,"fdCloseTick")+"<textarea id=fdCloseNote placeholder='Handover notes'></textarea></div>";
}
function submittedChecks(){
  if(!(isDesk()||isLead()))return "";
  var list=(db.fdChecks||[]).filter(function(c){if(c.day&&c.day!==day())return false;if(role()==="ceo"||role()==="superadmin")return true;return !c.site||c.site===site();}).slice().reverse();
  return "<div class=card id=dashSentChecks><h3>Submitted checklists today</h3>"+(list.length?list.map(function(c){return "<p><b>"+c.by+" · "+(c.kind==="close"?"Closing":"Opening")+"</b> · "+c.at+"</p>";}).join(""):"<p>None yet.</p>")+"</div>";
}
if(!window.__dashClicks){
  window.__dashClicks=true;
  document.addEventListener("click",function(ev){
    var t=ev.target;if(!t)return;
    if(t.id==="dashDoQuery"){ev.preventDefault();ev.stopPropagation();window.poshStartQuery();return;}
    if(t.id==="dashDoReply"){ev.preventDefault();ev.stopPropagation();window.poshReplyQuery();return;}
    var ext=t.getAttribute&&t.getAttribute("data-ext");
    if(ext){ev.preventDefault();window.poshExtendStay(ext);}
  },true);
}
function inject(){
  if(!user)return;
  noonFlip();
  stripCheckinMart();
  addCheckoutField();
  if(document.getElementById("dashQuery"))return;
  var wrap=document.querySelector(".wrap");if(!wrap)return;
  var html="";
  if(isDesk()||isLead())html+=queryHtml()+statusHtml()+submittedChecks()+martSalesHtml();
  if(isDesk())html+=checksHtml();
  if(html)wrap.insertAdjacentHTML("afterbegin",html);
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
