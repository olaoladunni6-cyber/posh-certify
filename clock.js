(function(){
function boot(){
if(typeof db==="undefined"||typeof draw!=="function"){setTimeout(boot,80);return;}
if(window.__poshClockBound){return;}
window.__poshClockBound=true;
if(!db.clocks)db.clocks=[];
if(!db.fdChecks)db.fdChecks=[];
var OPEN_SEED=["Cash float counted and recorded","Keys / key cards collected","In-house occupancy reviewed","Expected arrivals reviewed","Expected departures / check-outs reviewed","Handover notes from last shift read","POS, printer and phone tested","Desk and uniform ready","Incident book checked","Duty manager informed I am on duty"];
var CLOSE_SEED=["Cash float counted and handed over","Keys / key cards returned","Shift sales / folios completed","In-house and expected guests updated","Handover notes written for next shift","Incidents recorded","POS closed / printer cleared","Desk left tidy","Duty manager informed shift has ended"];
if(!db.fdOpenList||!db.fdOpenList.length)db.fdOpenList=OPEN_SEED.slice();
if(!db.fdCloseList||!db.fdCloseList.length)db.fdCloseList=CLOSE_SEED.slice();
function openList(){return (db.fdOpenList&&db.fdOpenList.length)?db.fdOpenList:OPEN_SEED;}
function closeList(){return (db.fdCloseList&&db.fdCloseList.length)?db.fdCloseList:CLOSE_SEED;}
function todayClocks(){return (db.clocks||[]).filter(function(c){return c.day===today()&&siteMatch(c.site);});}
function myOpenClock(){return (db.clocks||[]).filter(function(c){return user&&c.day===today()&&c.byId===user.id&&!c.outAt;})[0];}
function todayCheck(uid,kind){return (db.fdChecks||[]).filter(function(c){return c.day===today()&&c.byId===uid&&c.kind===kind;})[0];}
function checksToday(){return (db.fdChecks||[]).filter(function(c){return c.day===today()&&siteMatch(c.site);}).slice().reverse();}
function ticks(list,cls){return list.map(function(name,i){return "<label class=row><span>"+name+"</span><input type=checkbox class='"+cls+"' data-i='"+i+"'></label>";}).join("");}
function editLists(){
  if(typeof isSuper!=="function"||!isSuper())return "";
  return "<div class=card><h3>Edit front desk checklists</h3><p>One item per line.</p><p>Opening</p><textarea id=editOpen>"+openList().join("\n")+"</textarea><p>Closing</p><textarea id=editClose>"+closeList().join("\n")+"</textarea><button class=btn id=saveLists>Save checklists</button></div>";
}
function canSeeClock(){
  return !!(user&&(isFD()||mgr()||isSuper()||isGM()||(typeof isAcct==="function"&&isAcct())));
}
function siteNow(){return (typeof workSite==="function"?workSite():(user&&user.site))||"";}
function redraw(){
  window.__poshTyping=0;
  window.__poshForceDraw=true;
  try{draw();}catch(e){alert("Clock error: "+e);}
}
function clockHtml(){
  if(!canSeeClock())return "";
  if(!isFD()){
    var list=todayClocks().slice().reverse().map(function(c){
      return "<p><b>"+c.by+"</b> · "+c.site+" · in "+c.inAt+(c.outAt?(" · out "+c.outAt):" · ON DUTY")+"</p>";
    }).join("");
    var checks=checksToday().map(function(c){
      var items=(c.items||[]).map(function(it){return "<p>✓ "+it+"</p>";}).join("");
      var ack=mgr()&&!c.seen?"<button class='btn ackFD' data-id='"+c.id+"'>Acknowledge</button>":(c.seen?"<p>Seen by "+c.seenBy+"</p>":"");
      return "<div class=card><b>"+c.by+" · "+(c.kind==="close"?"Closing":"Opening")+"</b><br>"+c.at+items+(c.note?("<p>"+c.note+"</p>"):"")+ack+"</div>";
    }).join("");
    return "<div id=shiftClock class=card><h3>Front desk on duty</h3>"+(list||"<p>No one clocked in yet.</p>")+"</div>"+(checks||"")+editLists();
  }
  var open=myOpenClock();
  var opened=todayCheck(user.id,"open");
  var closed=todayCheck(user.id,"close");
  var body;
  if(!open&&closed)body="<div class=ok>Shift closed at "+closed.at+"</div>";
  else if(open)body="<div class=ok>On duty from "+open.inAt+" · "+user.site+" · shift "+(user.shift||"")+"</div>";
  else body="<div class=warn>Clock in before you take guests.</div><p><button type=button class=btn id=clockIn>Clock in — I am on duty</button></p>";
  var form="";
  if(open&&!opened)form="<p><b>Opening checklist</b></p>"+ticks(openList(),"fdck")+"<textarea id=fdNote placeholder='Notes for duty manager (optional)'></textarea><button type=button class=btn id=sendFDCheck>Submit opening checklist</button>";
  if(opened&&!closed)form+="<div class=ok>Opening list sent at "+opened.at+(opened.seen?(" · seen by "+opened.seenBy):" · waiting for duty manager")+".</div>";
  if(open&&opened&&!closed)form+="<p><b>Closing checklist</b></p>"+ticks(closeList(),"fdclose")+"<textarea id=fdCloseNote placeholder='Handover notes for next shift'></textarea><button type=button class='btn dark' id=sendFDClose>Submit closing checklist and clock out</button>";
  if(closed)form+="<div class=ok>Closed at "+closed.at+(closed.seen?(" · seen by "+closed.seenBy):"")+".</div>";
  return "<div id=shiftClock class=card><h3>Shift clock</h3>"+body+form+"</div>";
}
function placeClock(){
  if(!user)return;
  if(!(tab==="desk"||tab==="rooms"||tab==="staff"||tab==="me"))return;
  var wrap=document.querySelector(".wrap");
  if(!wrap)return;
  var old=document.getElementById("shiftClock");
  var html=clockHtml();
  if(!html)return;
  var box=document.createElement("div");
  box.innerHTML=html;
  if(old){
    var hold=old.parentNode;
    if(hold){
      while(box.firstChild)hold.insertBefore(box.firstChild,old);
      old.remove();
    }
  }else{
    while(box.lastChild)wrap.insertBefore(box.lastChild,wrap.firstChild);
  }
}
function collect(sel,list){
  var items=[];
  document.querySelectorAll(sel).forEach(function(box){
    if(!box.checked)return;
    var i=parseInt(box.getAttribute("data-i"),10);
    if(list[i])items.push(list[i]);
  });
  return items;
}
if(!window.__poshClockClicks){
  window.__poshClockClicks=true;
  document.addEventListener("click",function(ev){
    var t=ev.target;
    if(!t)return;
    if(t.id==="clockIn"||(t.closest&&t.closest("#clockIn"))){
      ev.preventDefault();
      if(!user||!isFD()){alert("Clock in is for front desk only");return;}
      if(myOpenClock()){redraw();return;}
      db.clocks.push({id:"ck"+Date.now(),day:today(),site:siteNow(),by:user.name,byId:user.id,shift:user.shift||"",inAt:new Date().toLocaleTimeString(),outAt:""});
      try{save();}catch(e){}
      if(typeof pingMgrGm==="function")try{pingMgrGm("POSH CLOCK-IN\n"+user.name+"\n"+siteNow()+"\nShift "+(user.shift||"")+"\n"+new Date().toLocaleString());}catch(e){}
      redraw();
      return;
    }
    if(t.id==="sendFDCheck"){
      ev.preventDefault();
      if(!isFD()||!myOpenClock()){alert("Clock in first");return;}
      if(todayCheck(user.id,"open")){redraw();return;}
      var list=openList();
      var items=collect(".fdck",list);
      if(items.length<list.length){alert("Tick every opening item");return;}
      var note=(document.getElementById("fdNote")&&document.getElementById("fdNote").value||"").trim();
      db.fdChecks.push({id:"fc"+Date.now(),day:today(),site:siteNow(),kind:"open",by:user.name,byId:user.id,items:items,note:note,at:new Date().toLocaleString(),seen:false,seenBy:""});
      try{save();}catch(e){}
      if(typeof pingMgrGm==="function")try{pingMgrGm("POSH OPENING CHECKLIST\n"+user.name+"\n"+siteNow()+"\n"+items.join("\n")+(note?("\nNotes: "+note):""));}catch(e){}
      redraw();
      return;
    }
    if(t.id==="sendFDClose"){
      ev.preventDefault();
      if(!isFD())return;
      var ck=myOpenClock();
      if(!ck){alert("You are not clocked in");return;}
      if(!todayCheck(user.id,"open")){alert("Submit the opening checklist first");return;}
      var list2=closeList();
      var items2=collect(".fdclose",list2);
      if(items2.length<list2.length){alert("Tick every closing item");return;}
      var note2=(document.getElementById("fdCloseNote")&&document.getElementById("fdCloseNote").value||"").trim();
      ck.outAt=new Date().toLocaleTimeString();
      db.fdChecks.push({id:"fc"+Date.now(),day:today(),site:siteNow(),kind:"close",by:user.name,byId:user.id,items:items2,note:note2,at:new Date().toLocaleString(),seen:false,seenBy:""});
      try{save();}catch(e){}
      if(typeof pingMgrGm==="function")try{pingMgrGm("POSH CLOCK-OUT\n"+user.name+"\n"+siteNow()+"\n"+ck.outAt+"\n"+items2.join("\n")+(note2?("\nHandover: "+note2):""));}catch(e){}
      redraw();
    }
  },true);
}
var _draw=draw;
draw=function(){
  _draw();
  window.__poshForceDraw=false;
  placeClock();
};
try{draw();}catch(e){}
}
boot();
})();
