(function(){
function boot(){
if(typeof db==="undefined"||typeof bind!=="function"){setTimeout(boot,60);return;}
if(window.__poshClock)return;
window.__poshClock=true;
if(!db.clocks)db.clocks=[];
if(!db.fdChecks)db.fdChecks=[];
var OPEN_SEED=["Cash float counted and recorded","Keys / key cards collected","In-house occupancy reviewed","Expected arrivals reviewed","Expected departures / check-outs reviewed","Handover notes from last shift read","POS, printer and phone tested","Desk and uniform ready","Incident book checked","Duty manager informed I am on duty"];
var CLOSE_SEED=["Cash float counted and handed over","Keys / key cards returned","Shift sales / folios completed","In-house and expected guests updated","Handover notes written for next shift","Incidents recorded","POS closed / printer cleared","Desk left tidy","Duty manager informed shift has ended"];
if(!db.fdOpenList||!db.fdOpenList.length)db.fdOpenList=OPEN_SEED.slice();
if(!db.fdCloseList||!db.fdCloseList.length)db.fdCloseList=CLOSE_SEED.slice();
function openList(){return (db.fdOpenList&&db.fdOpenList.length)?db.fdOpenList:OPEN_SEED;}
function closeList(){return (db.fdCloseList&&db.fdCloseList.length)?db.fdCloseList:CLOSE_SEED;}
function todayClocks(){return (db.clocks||[]).filter(function(c){return c.day===today()&&siteMatch(c.site);});}
function myOpenClock(){return (db.clocks||[]).filter(function(c){return c.day===today()&&c.byId===user.id&&!c.outAt;})[0];}
function todayCheck(uid,kind){return (db.fdChecks||[]).filter(function(c){return c.day===today()&&c.byId===uid&&c.kind===kind;})[0];}
function checksToday(){return (db.fdChecks||[]).filter(function(c){return c.day===today()&&siteMatch(c.site);}).slice().reverse();}
function ticks(list,cls){return list.map(function(name,i){return "<label class=row><span>"+name+"</span><input type=checkbox class='"+cls+"' data-i='"+i+"'></label>";}).join("");}
function editLists(){
  if(!isSuper())return "";
  return "<div class=card><h3>Edit front desk checklists</h3><p>One item per line.</p><p>Opening</p><textarea id=editOpen>"+openList().join("\n")+"</textarea><p>Closing</p><textarea id=editClose>"+closeList().join("\n")+"</textarea><button class=btn id=saveLists>Save checklists</button></div>";
}
function canSeeClock(){
  return !!(user&&(isFD()||mgr()||isSuper()||isGM()||(typeof isAcct==="function"&&isAcct())));
}
function clockBox(){
  if(!canSeeClock())return "";
  if(!isFD()){
    var list=todayClocks().slice().reverse().map(function(c){
      return "<p><b>"+c.by+"</b> · "+c.site+" · in "+c.inAt+(c.outAt?(" · out "+c.outAt):" · ON DUTY")+"</p>";
    }).join("");
    var checks=checksToday().map(function(c){
      var items=(c.items||[]).map(function(it){return "<p>✓ "+it+"</p>";}).join("");
      var ack=mgr()&&!c.seen?"<button class='btn ackFD' data-id='"+c.id+"'>Acknowledge</button>":(c.seen?"<p>Seen by "+c.seenBy+"</p>":"");
      return "<div class=card><b>"+c.by+" · "+(c.kind==="close"?"Closing":"Opening")+" checklist</b><br>"+c.at+items+(c.note?("<p>"+c.note+"</p>"):"")+ack+"</div>";
    }).join("");
    return "<div class=card><h3>Front desk clock today</h3>"+(list||"<p>No one clocked in yet.</p>")+"</div>"+(checks||"")+editLists();
  }
  var open=myOpenClock();
  var opened=todayCheck(user.id,"open");
  var closed=todayCheck(user.id,"close");
  var clock;
  if(!open&&closed)clock="<div class=ok>Shift closed at "+closed.at+"</div>";
  else if(open)clock="<div class=ok>Clocked in at "+open.inAt+" · "+user.site+" · shift "+(user.shift||"")+"</div>";
  else clock="<div class=warn>Clock in before you take guests.</div><button class=btn id=clockIn>Clock in — I am on duty</button>";
  var form="";
  if(open&&!opened)form="<div class=card><h3>Opening checklist — send to duty manager</h3>"+ticks(openList(),"fdck")+"<textarea id=fdNote placeholder='Notes for duty manager (optional)'></textarea><button class=btn id=sendFDCheck>Submit opening checklist</button></div>";
  if(opened&&!closed)form+="<div class=ok>Opening checklist submitted at "+opened.at+(opened.seen?(" · seen by "+opened.seenBy):" · waiting for duty manager")+".</div>";
  if(open&&opened&&!closed)form+="<div class=card><h3>Closing checklist — clock out</h3>"+ticks(closeList(),"fdclose")+"<textarea id=fdCloseNote placeholder='Handover notes for next shift'></textarea><button class='btn dark' id=sendFDClose>Submit closing checklist and clock out</button></div>";
  if(closed)form+="<div class=ok>Closing checklist submitted at "+closed.at+(closed.seen?(" · seen by "+closed.seenBy):" · waiting for duty manager")+".</div>";
  return "<div class=card><h3>Shift clock</h3>"+clock+"</div>"+form;
}
window.clockBox=clockBox;
function wrap(name){
  var prev=typeof window[name]==="function"?window[name]:(typeof this[name]==="function"?this[name]:null);
  if(typeof eval(name)!=="function"&&!prev)return;
}
function attach(fnName){
  var prev;
  try{prev=eval(fnName);}catch(e){return;}
  if(typeof prev!=="function")return;
  if(prev.__withClock)return;
  var wrapped=function(){return clockBox()+prev.apply(this,arguments);};
  wrapped.__withClock=true;
  try{eval(fnName+"=wrapped");}catch(e){}
}
attach("viewDesk");
attach("viewBoard");
attach("viewStaff");
attach("viewMe");
setTimeout(function(){attach("viewDesk");attach("viewBoard");attach("viewStaff");attach("viewMe");try{draw();}catch(e){};},400);
function collect(sel,list){
  var items=[];
  document.querySelectorAll(sel).forEach(function(box){
    if(!box.checked)return;
    var i=parseInt(box.getAttribute("data-i"),10);
    if(list[i])items.push(list[i]);
  });
  return items;
}
var _bClock=bind;
bind=function(){
  _bClock();
  var cin=document.getElementById("clockIn");
  if(cin)cin.onclick=function(){
    if(!isFD()||myOpenClock())return;
    db.clocks.push({id:"ck"+Date.now(),day:today(),site:workSite(),by:user.name,byId:user.id,shift:user.shift||"",inAt:new Date().toLocaleTimeString(),outAt:""});
    save();
    if(typeof pingMgrGm==="function")pingMgrGm("POSH CLOCK-IN\n"+user.name+"\n"+workSite()+"\nShift "+(user.shift||"")+"\n"+new Date().toLocaleString());
    draw();
  };
  var send=document.getElementById("sendFDCheck");
  if(send)send.onclick=function(){
    if(!isFD()||!myOpenClock()){alert("Clock in first");return;}
    if(todayCheck(user.id,"open"))return;
    var list=openList();
    var items=collect(".fdck",list);
    if(items.length<list.length){alert("Tick every opening item");return;}
    var note=(document.getElementById("fdNote")&&document.getElementById("fdNote").value||"").trim();
    db.fdChecks.push({id:"fc"+Date.now(),day:today(),site:workSite(),kind:"open",by:user.name,byId:user.id,items:items,note:note,at:new Date().toLocaleString(),seen:false,seenBy:""});
    save();
    if(typeof pingMgrGm==="function")pingMgrGm("POSH OPENING CHECKLIST\n"+user.name+"\n"+workSite()+"\n"+items.join("\n")+(note?("\nNotes: "+note):""));
    draw();
  };
  var closeBtn=document.getElementById("sendFDClose");
  if(closeBtn)closeBtn.onclick=function(){
    if(!isFD())return;
    var ck=myOpenClock();
    if(!ck){alert("You are not clocked in");return;}
    if(!todayCheck(user.id,"open")){alert("Submit the opening checklist first");return;}
    var list=closeList();
    var items=collect(".fdclose",list);
    if(items.length<list.length){alert("Tick every closing item");return;}
    var note=(document.getElementById("fdCloseNote")&&document.getElementById("fdCloseNote").value||"").trim();
    ck.outAt=new Date().toLocaleTimeString();
    db.fdChecks.push({id:"fc"+Date.now(),day:today(),site:workSite(),kind:"close",by:user.name,byId:user.id,items:items,note:note,at:new Date().toLocaleString(),seen:false,seenBy:""});
    save();
    if(typeof pingMgrGm==="function")pingMgrGm("POSH CLOCK-OUT\n"+user.name+"\n"+workSite()+"\n"+ck.outAt+"\n"+items.join("\n")+(note?("\nHandover: "+note):""));
    draw();
  };
  var saveLists=document.getElementById("saveLists");
  if(saveLists)saveLists.onclick=function(){
    if(!isSuper())return;
    db.fdOpenList=(document.getElementById("editOpen").value||"").split("\n").map(function(s){return s.trim();}).filter(Boolean);
    db.fdCloseList=(document.getElementById("editClose").value||"").split("\n").map(function(s){return s.trim();}).filter(Boolean);
    if(!db.fdOpenList.length||!db.fdCloseList.length){alert("Keep at least one item on each list");return;}
    save();alert("Checklists saved. Publish if this laptop should update the phones.");draw();
  };
  document.querySelectorAll(".ackFD").forEach(function(b){
    b.onclick=function(){
      if(!mgr())return;
      var id=b.getAttribute("data-id");
      (db.fdChecks||[]).forEach(function(c){if(c.id===id&&siteMatch(c.site)){c.seen=true;c.seenBy=user.name;}});save();draw();
    };
  });
};
try{draw();}catch(e){}
}
boot();
})();
