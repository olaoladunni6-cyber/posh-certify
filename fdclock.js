(function(){
function boot(){
if(typeof viewDesk!=="function"||typeof isFD!=="function"){setTimeout(boot,80);return;}
if(window.__fdClock)return;
window.__fdClock=true;
if(!db.clocks)db.clocks=[];
if(!db.fdChecks)db.fdChecks=[];
function mine(){return (db.clocks||[]).filter(function(c){return user&&c.day===today()&&c.byId===user.id&&!c.outAt;})[0];}
function opened(){return (db.fdChecks||[]).filter(function(c){return user&&c.day===today()&&c.byId===user.id&&c.kind==="open";})[0];}
function closed(){return (db.fdChecks||[]).filter(function(c){return user&&c.day===today()&&c.byId===user.id&&c.kind==="close";})[0];}
var OPEN=["Cash float counted and recorded","Keys / key cards collected","In-house occupancy reviewed","Expected arrivals reviewed","Expected departures / check-outs reviewed","Handover notes from last shift read","POS, printer and phone tested","Desk and uniform ready","Incident book checked","Duty manager informed I am on duty"];
var CLOSE=["Cash float counted and handed over","Keys / key cards returned","Shift sales / folios completed","In-house and expected guests updated","Handover notes written for next shift","Incidents recorded","POS closed / printer cleared","Desk left tidy","Duty manager informed shift has ended"];
function ticks(list,cls){return list.map(function(name,i){return "<label class=row><span>"+name+"</span><input type=checkbox class='"+cls+"' data-i='"+i+"'></label>";}).join("");}
function fdBox(){
  if(!user||!isFD())return "";
  var o=mine(),op=opened(),cl=closed();
  if(!o&&cl)return "<div class=card id=fdClockCard><h3>Shift clock</h3><div class=ok>Shift closed at "+cl.at+"</div></div>";
  if(!o)return "<div class=card id=fdClockCard><h3>Shift clock</h3><div class=warn>Clock in before you take guests.</div><p><button type=button class=btn id=fdClockIn>Clock in — I am on duty</button></p></div>";
  var html="<div class=card id=fdClockCard><h3>Shift clock</h3><div class=ok>On duty from "+o.inAt+" · "+(user.site||"")+" · shift "+(user.shift||"")+"</div>";
  if(!op)html+="<p><b>Opening checklist</b></p>"+ticks(OPEN,"fdOpenTick")+"<textarea id=fdOpenNote placeholder='Notes (optional)'></textarea><p><button type=button class=btn id=fdOpenSend>Submit opening checklist</button></p>";
  else html+="<div class=ok>Opening list sent at "+op.at+"</div>";
  if(op&&!cl)html+="<p><b>Closing checklist</b></p>"+ticks(CLOSE,"fdCloseTick")+"<textarea id=fdCloseNote placeholder='Handover notes'></textarea><p><button type=button class='btn dark' id=fdCloseSend>Submit closing checklist and clock out</button></p>";
  html+="</div>";
  return html;
}
var _vd=viewDesk;
viewDesk=function(){return fdBox()+_vd.apply(this,arguments);};
function picked(sel,list){
  var out=[];
  document.querySelectorAll(sel).forEach(function(box){
    if(!box.checked)return;
    var i=parseInt(box.getAttribute("data-i"),10);
    if(list[i])out.push(list[i]);
  });
  return out;
}
function go(){window.__poshTyping=0;window.__poshForceDraw=true;try{draw();}catch(e){alert(e);}}
document.addEventListener("click",function(ev){
  var t=ev.target;
  if(!t||!t.id)return;
  if(t.id==="fdClockIn"){
    ev.preventDefault();
    ev.stopPropagation();
    if(!user||!isFD()){alert("Log in as Front Desk first");return;}
    if(mine()){go();return;}
    db.clocks.push({id:"ck"+Date.now(),day:today(),site:workSite(),by:user.name,byId:user.id,shift:user.shift||"",inAt:new Date().toLocaleTimeString(),outAt:""});
    try{save();}catch(e){}
    alert("Clocked in.");
    go();
    return;
  }
  if(t.id==="fdOpenSend"){
    ev.preventDefault();
    if(!mine()){alert("Clock in first");return;}
    var items=picked(".fdOpenTick",OPEN);
    if(items.length<OPEN.length){alert("Tick every opening item");return;}
    db.fdChecks.push({id:"fc"+Date.now(),day:today(),site:workSite(),kind:"open",by:user.name,byId:user.id,items:items,note:(document.getElementById("fdOpenNote")&&document.getElementById("fdOpenNote").value||"").trim(),at:new Date().toLocaleString(),seen:false,seenBy:""});
    try{save();}catch(e){}
    go();
    return;
  }
  if(t.id==="fdCloseSend"){
    ev.preventDefault();
    var ck=mine();
    if(!ck){alert("You are not clocked in");return;}
    if(!opened()){alert("Submit the opening checklist first");return;}
    var items=picked(".fdCloseTick",CLOSE);
    if(items.length<CLOSE.length){alert("Tick every closing item");return;}
    ck.outAt=new Date().toLocaleTimeString();
    db.fdChecks.push({id:"fc"+Date.now(),day:today(),site:workSite(),kind:"close",by:user.name,byId:user.id,items:items,note:(document.getElementById("fdCloseNote")&&document.getElementById("fdCloseNote").value||"").trim(),at:new Date().toLocaleString(),seen:false,seenBy:""});
    try{save();}catch(e){}
    go();
  }
},true);
try{draw();}catch(e){}
}
boot();
})();
