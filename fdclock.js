(function(){
function boot(){
if(typeof viewDesk!=="function"||typeof isFD!=="function"){setTimeout(boot,80);return;}
if(window.__fdClock)return;
window.__fdClock=true;
if(!db.clocks)db.clocks=[];
if(!db.fdChecks)db.fdChecks=[];
if(!db.checkins)db.checkins=[];
var OPEN_SEED=["Cash float counted and recorded","Keys / key cards collected","In-house occupancy reviewed","Expected arrivals reviewed","Expected departures / check-outs reviewed","Handover notes from last shift read","POS, printer and phone tested","Desk and uniform ready","Incident book checked","Duty manager informed I am on duty"];
var CLOSE_SEED=["Cash float counted and handed over","Keys / key cards returned","Shift sales / folios completed","In-house and expected guests updated","Handover notes written for next shift","Incidents recorded","POS closed / printer cleared","Desk left tidy","Duty manager informed shift has ended"];
if(!db.fdOpenList||!db.fdOpenList.length)db.fdOpenList=OPEN_SEED.slice();
if(!db.fdCloseList||!db.fdCloseList.length)db.fdCloseList=CLOSE_SEED.slice();
function openList(){return (db.fdOpenList&&db.fdOpenList.length)?db.fdOpenList:OPEN_SEED;}
function closeList(){return (db.fdCloseList&&db.fdCloseList.length)?db.fdCloseList:CLOSE_SEED;}
function mine(){return (db.clocks||[]).filter(function(c){return user&&c.day===today()&&c.byId===user.id&&!c.outAt;})[0];}
function opened(){return (db.fdChecks||[]).filter(function(c){return user&&c.day===today()&&c.byId===user.id&&c.kind==="open";})[0];}
function closed(){return (db.fdChecks||[]).filter(function(c){return user&&c.day===today()&&c.byId===user.id&&c.kind==="close";})[0];}
function ticks(list,cls){return list.map(function(name,i){return "<label class=row style='display:flex;justify-content:space-between;gap:8px'><span>"+name+"</span><input type=checkbox class='"+cls+"' data-i='"+i+"' data-name='"+String(name).replace(/'/g,"")+"'></label>";}).join("");}
function collect(cls){
  var out=[];
  document.querySelectorAll("."+cls).forEach(function(box){
    if(box.checked)out.push(box.getAttribute("data-name")||("item "+box.getAttribute("data-i")));
  });
  return out;
}
window.poshCollectOpen=function(){return collect("fdOpenTick");};
window.poshCollectClose=function(){return collect("fdCloseTick");};
window.poshOpenNote=function(){return ((document.getElementById("fdOpenNote")||{}).value||"").trim();};
window.poshCloseNote=function(){return ((document.getElementById("fdCloseNote")||{}).value||"").trim();};
function fdBox(){
  if(!user||!isFD())return "";
  var o=mine(),op=opened(),cl=closed();
  var html="<div class=card id=fdClockCard><h3>Shift clock and checklists</h3>";
  html+=o?("<div class=ok>On duty from "+o.inAt+" · "+(user.site||"")+"</div>"):"<div class=warn>Clock in first on the gold bar, then tick the opening list below.</div>";
  if(cl)html+="<div class=ok>Shift closed at "+cl.at+"</div>";
  html+="<p><b>Opening checklist</b></p><p>Tick every line that is done, then tap <b>Submit opening</b>.</p>"+ticks(openList(),"fdOpenTick")+"<textarea id=fdOpenNote placeholder='Opening notes (optional)'></textarea>";
  if(op)html+="<div class=ok>Last opening sent at "+op.at+(op.items&&op.items.length?(" · "+op.items.length+" ticked"):"")+"</div>";
  html+="<p><b>Closing checklist</b></p><p>Tick every line that is done, then tap <b>Submit closing</b>.</p>"+ticks(closeList(),"fdCloseTick")+"<textarea id=fdCloseNote placeholder='Handover notes'></textarea>";
  if(cl)html+="<div class=ok>Last closing sent at "+cl.at+(cl.items&&cl.items.length?(" · "+cl.items.length+" ticked"):"")+"</div>";
  return html+"</div>";
}
function folioPanel(){
  if(!(mgr()||isGM()||isSuper()||(typeof isAcct==="function"&&isAcct())))return "";
  var list=(typeof siteCheckins==="function"?siteCheckins():(db.checkins||[]).filter(function(c){return c.day===today()&&siteMatch(c.site);})).slice().reverse();
  var cards=list.map(function(c){
    return "<div class=card><b>"+c.guest+"</b> · Rm "+c.room+"<br>"+(c.by||"")+" · "+(c.at||c.day)+"</div>";
  }).join("");
  var checks=(db.fdChecks||[]).filter(function(c){return c.day===today()&&siteMatch(c.site);}).slice().reverse().map(function(c){
    var items=(c.items||[]).map(function(n){return "<p>✓ "+n+"</p>";}).join("");
    var ack=mgr()&&!c.seen?"<p><button type=button class='btn ackFD' data-id='"+c.id+"'>Acknowledge</button></p>":(c.seen?"<p>Seen by "+c.seenBy+"</p>":"");
    return "<div class=card><b>"+c.by+" · "+(c.kind==="close"?"Closing":"Opening")+"</b><br>"+c.at+(c.note?("<br>"+c.note):"")+items+ack+"</div>";
  }).join("");
  return "<h1>Today at this hotel</h1><div class=card><h3>Guest folios today</h3>"+(cards||"<p>None yet.</p>")+"</div><div class=card><h3>Front desk checklists</h3>"+(checks||"<p>None submitted yet.</p>")+"</div>";
}
function editClockBox(){
  if(!(isSuper()||mgr()||isGM()))return "";
  var rows=(db.clocks||[]).filter(function(c){return c.day===today()&&siteMatch(c.site);}).map(function(c){
    return "<div class=card><b>"+c.by+"</b><br>In <input data-cin='"+c.id+"' value='"+(c.inAt||"")+"'> Out <input data-cout='"+c.id+"' value='"+(c.outAt||"")+"'><br><button type=button class='btn saveClk' data-id='"+c.id+"'>Save times</button></div>";
  }).join("");
  var lists=isSuper()?("<div class=card><h3>Edit front desk checklists</h3><p>One item per line.</p><p>Opening</p><textarea id=editOpen>"+openList().join("\n")+"</textarea><p>Closing</p><textarea id=editClose>"+closeList().join("\n")+"</textarea><button type=button class=btn id=saveLists>Save checklists</button></div>"):"";
  return folioPanel()+"<h1>Clock times today</h1>"+(rows||"<p>No clock records today.</p>")+lists;
}
var _vd=viewDesk;
viewDesk=function(){return fdBox()+_vd.apply(this,arguments);};
var _vs=viewStaff;
viewStaff=function(){return editClockBox()+_vs.apply(this,arguments);};
function go(){window.__poshTyping=0;window.__poshForceDraw=true;try{draw();}catch(e){}}
document.addEventListener("click",function(ev){
  var t=ev.target; if(!t)return; var id=t.id||""; var cls=String(t.className||"");
  if(id==="goDesk"||id==="d6"){tab="desk";roomId=null;go();return;}
  if(cls.indexOf("ackFD")>=0){
    ev.preventDefault();
    if(!mgr())return;
    var aid=t.getAttribute("data-id");
    (db.fdChecks||[]).forEach(function(c){if(c.id===aid&&siteMatch(c.site)){c.seen=true;c.seenBy=user.name;}});
    try{save();}catch(e){}alert("Acknowledged");go();return;
  }
  if(id==="saveLists"){
    if(!isSuper())return;
    db.fdOpenList=(document.getElementById("editOpen").value||"").split("\n").map(function(s){return s.trim();}).filter(Boolean);
    db.fdCloseList=(document.getElementById("editClose").value||"").split("\n").map(function(s){return s.trim();}).filter(Boolean);
    try{save();}catch(e){}alert("Checklists saved.");go();return;
  }
  if(cls.indexOf("saveClk")>=0){
    if(!(isSuper()||mgr()))return;
    var cid=t.getAttribute("data-id");
    var inn=document.querySelector("[data-cin='"+cid+"']");
    var out=document.querySelector("[data-cout='"+cid+"']");
    (db.clocks||[]).forEach(function(c){if(c.id===cid){c.inAt=(inn&&inn.value||"").trim();c.outAt=(out&&out.value||"").trim();}});
    try{save();}catch(e){}alert("Clock times saved.");go();
  }
},true);
try{draw();}catch(e){}
}
boot();
})();
