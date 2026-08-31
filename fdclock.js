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
if(typeof viewBoard==="function"){
  var _vb=viewBoard;
  viewBoard=function(){
    if(isFD())return "<div class=ok>Front Desk guest check-in is on the Desk tab.</div><p><button type=button class=btn id=goDesk>Open guest check-in</button></p>"+_vb.apply(this,arguments);
    return _vb.apply(this,arguments);
  };
}
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
function num(id){var el=document.getElementById(id);var n=parseFloat(el&&el.value||"0");return isNaN(n)?0:n;}
function txt(id){var el=document.getElementById(id);return (el&&el.value||"").trim();}
document.addEventListener("click",function(ev){
  var t=ev.target;
  if(!t)return;
  var id=t.id||"";
  if(id==="goDesk"||id==="d6"){
    tab="desk";roomId=null;go();
    if(id==="goDesk"){ev.preventDefault();}
    return;
  }
  if(id==="fdClockIn"){
    ev.preventDefault();
    if(!user||!isFD()){alert("Log in as Front Desk first");return;}
    if(mine()){go();return;}
    db.clocks.push({id:"ck"+Date.now(),day:today(),site:workSite(),by:user.name,byId:user.id,shift:user.shift||"",inAt:new Date().toLocaleTimeString(),outAt:""});
    try{save();}catch(e){}
    alert("Clocked in.");go();return;
  }
  if(id==="fdOpenSend"){
    ev.preventDefault();
    if(!mine()){alert("Clock in first");return;}
    var items=picked(".fdOpenTick",OPEN);
    if(items.length<OPEN.length){alert("Tick every opening item");return;}
    db.fdChecks.push({id:"fc"+Date.now(),day:today(),site:workSite(),kind:"open",by:user.name,byId:user.id,items:items,note:txt("fdOpenNote"),at:new Date().toLocaleString(),seen:false,seenBy:""});
    try{save();}catch(e){}
    alert("Opening checklist submitted.");go();return;
  }
  if(id==="fdCloseSend"){
    ev.preventDefault();
    var ck=mine();
    if(!ck){alert("You are not clocked in");return;}
    if(!opened()){alert("Submit the opening checklist first");return;}
    var items2=picked(".fdCloseTick",CLOSE);
    if(items2.length<CLOSE.length){alert("Tick every closing item");return;}
    ck.outAt=new Date().toLocaleTimeString();
    db.fdChecks.push({id:"fc"+Date.now(),day:today(),site:workSite(),kind:"close",by:user.name,byId:user.id,items:items2,note:txt("fdCloseNote"),at:new Date().toLocaleString(),seen:false,seenBy:""});
    try{save();}catch(e){}
    alert("Shift closed.");go();return;
  }
  if(id==="saveCin"){
    ev.preventDefault();
    if(!isFD())return;
    var name=txt("cinName"),room=txt("cinRoom"),amount=num("cinAmt");
    if(!name||!room){alert("Guest name and room required");return;}
    var extras={early:num("cinEarly"),earlyNote:txt("cinEarlyNote"),late:num("cinLate"),lateNote:txt("cinLateNote"),laundry:num("cinLau"),laundryNote:txt("cinLauNote"),minimart:num("cinMart"),minimartNote:txt("cinMartNote"),other:num("cinOth"),otherNote:txt("cinOthNote")};
    var debt=num("cinDebt"),debtNote=txt("cinDebtNote");
    var billed=amount+extras.early+extras.late+extras.laundry+extras.minimart+extras.other;
    if(debt>billed){alert("Debt cannot be more than the billed total.");return;}
    if(!db.checkins)db.checkins=[];
    db.checkins.push({id:"c"+Date.now(),guest:name,room:room,amount:amount,extras:extras,debt:debt,debtNote:debtNote,collected:Math.max(0,billed-debt),site:workSite(),by:user.name,byId:user.id,shift:user.shift||"A",day:today(),at:new Date().toLocaleString()});
    if(debt>0){
      if(!db.debts)db.debts=[];
      db.debts.push({id:"db"+Date.now(),guest:name,room:room,site:workSite(),amount:debt,remaining:debt,note:debtNote,by:user.name,byId:user.id,day:today(),at:new Date().toLocaleString(),payments:[]});
    }
    try{save();}catch(e){}
    alert("Guest folio saved.");go();return;
  }
  if(id==="submitShift"){
    ev.preventDefault();
    if(!isFD())return;
    if(typeof myCheckins!=="function"||typeof salesPack!=="function"){alert("Shift report tools not loaded");return;}
    var mineC=myCheckins();
    var pack=salesPack(mineC);
    if(typeof paidToday==="function")pack.debtPaid=paidToday(typeof siteDebts==="function"?siteDebts():[]);
    if(!db.shiftReports)db.shiftReports=[];
    var rep={id:"sh"+Date.now(),day:today(),site:workSite(),by:user.name,byId:user.id,shift:user.shift||"A",sales:typeof deskSalesTotal==="function"?deskSalesTotal(mineC):0,pack:pack,arrivals:mineC.length,inhouse:parseInt(txt("cinHouse")||"0",10)||0,expected:parseInt(txt("cinExp")||"0",10)||0,incident:txt("cinInc"),at:new Date().toLocaleString()};
    db.shiftReports.push(rep);
    try{save();}catch(e){}
    if(typeof pingMgrGm==="function"&&typeof shiftReportText==="function")try{pingMgrGm(shiftReportText(rep));}catch(e){}
    alert("Shift sales report submitted.");go();
  }
},true);
try{draw();}catch(e){}
}
boot();
})();
