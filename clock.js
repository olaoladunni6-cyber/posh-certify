(function(){
if(typeof db==="undefined")return;
if(!db.clocks)db.clocks=[];
if(!db.fdChecks)db.fdChecks=[];
var OPEN_LIST=[
  ["float","Cash float counted and recorded"],
  ["keys","Keys / key cards collected"],
  ["inhouse","In-house occupancy reviewed"],
  ["arrivals","Expected arrivals reviewed"],
  ["departures","Expected departures / check-outs reviewed"],
  ["handover","Handover notes from last shift read"],
  ["pos","POS, printer and phone tested"],
  ["desk","Desk and uniform ready"],
  ["incidents","Incident book checked"],
  ["dm","Duty manager informed I am on duty"]
];
var CLOSE_LIST=[
  ["cfloat","Cash float counted and handed over"],
  ["ckeys","Keys / key cards returned"],
  ["csales","Shift sales / folios completed"],
  ["cocc","In-house and expected guests updated"],
  ["chand","Handover notes written for next shift"],
  ["cinc","Incidents recorded"],
  ["cpos","POS closed / printer cleared"],
  ["cdesk","Desk left tidy"],
  ["cdm","Duty manager informed shift has ended"]
];
function todayClocks(){return (db.clocks||[]).filter(function(c){return c.day===today()&&siteMatch(c.site);});}
function myOpenClock(){return (db.clocks||[]).filter(function(c){return c.day===today()&&c.byId===user.id&&!c.outAt;})[0];}
function todayCheck(uid,kind){return (db.fdChecks||[]).filter(function(c){return c.day===today()&&c.byId===uid&&c.kind===kind;})[0];}
function checksToday(){return (db.fdChecks||[]).filter(function(c){return c.day===today()&&siteMatch(c.site);}).slice().reverse();}
function clockBox(){
  if(!user)return "";
  if(!isFD()){
    if(!(mgr()||isSuper()||isGM()))return "";
    var list=todayClocks().slice().reverse().map(function(c){
      return "<p><b>"+c.by+"</b> · "+c.site+" · in "+c.inAt+(c.outAt?(" · out "+c.outAt):" · ON DUTY")+"</p>";
    }).join("");
    var checks=checksToday().map(function(c){
      var items=(c.items||[]).map(function(it){return "<p>✓ "+it+"</p>";}).join("");
      var ack=mgr()&&!c.seen?"<button class='btn ackFD' data-id='"+c.id+"'>Acknowledge</button>":(c.seen?"<p>Seen by "+c.seenBy+"</p>":"");
      return "<div class=card><b>"+c.by+" · "+(c.kind==="close"?"Closing":"Opening")+" checklist</b><br>"+c.at+items+(c.note?("<p>"+c.note+"</p>"):"")+ack+"</div>";
    }).join("");
    return "<div class=card><h3>Front desk clock today</h3>"+(list||"<p>No one clocked in yet.</p>")+"</div>"+(checks||"");
  }
  var open=myOpenClock();
  var opened=todayCheck(user.id,"open");
  var closed=todayCheck(user.id,"close");
  var clock;
  if(!open&&closed)clock="<div class=ok>Shift closed at "+closed.at+"</div>";
  else if(open)clock="<div class=ok>Clocked in at "+open.inAt+" · "+user.site+" · shift "+(user.shift||"")+"</div>";
  else clock="<div class=warn>Clock in before you take guests.</div><button class=btn id=clockIn>Clock in — I am on duty</button>";
  var form="";
  if(open&&!opened){
    form="<div class=card><h3>Opening checklist — send to duty manager</h3>"+OPEN_LIST.map(function(it){return "<label class=row><span>"+it[1]+"</span><input type=checkbox class=fdck data-k='"+it[0]+"'></label>";}).join("")+"<textarea id=fdNote placeholder='Notes for duty manager (optional)'></textarea><button class=btn id=sendFDCheck>Submit opening checklist</button></div>";
  }
  if(opened&&!closed)form+="<div class=ok>Opening checklist submitted at "+opened.at+(opened.seen?(" · seen by "+opened.seenBy):" · waiting for duty manager")+".</div>";
  if(open&&opened&&!closed){
    form+="<div class=card><h3>Closing checklist — clock out</h3>"+CLOSE_LIST.map(function(it){return "<label class=row><span>"+it[1]+"</span><input type=checkbox class=fdclose data-k='"+it[0]+"'></label>";}).join("")+"<textarea id=fdCloseNote placeholder='Handover notes for next shift'></textarea><button class='btn dark' id=sendFDClose>Submit closing checklist and clock out</button></div>";
  }
  if(closed)form+="<div class=ok>Closing checklist submitted at "+closed.at+(closed.seen?(" · seen by "+closed.seenBy):" · waiting for duty manager")+".</div>";
  return "<div class=card><h3>Shift clock</h3>"+clock+"</div>"+form;
}
var _viewDesk=typeof viewDesk==="function"?viewDesk:function(){return "";};
viewDesk=function(){return clockBox()+_viewDesk();};
var _viewBoardC=typeof viewBoard==="function"?viewBoard:function(){return "";};
viewBoard=function(){return (isFD()?clockBox():"")+_viewBoardC();};
var _viewStaff2=viewStaff;
viewStaff=function(){
  var html=_viewStaff2();
  if(mgr()||isSuper()||isGM()||isFD())return clockBox()+html;
  return html;
};
function collect(sel,list){
  var items=[];
  document.querySelectorAll(sel).forEach(function(box){
    if(!box.checked)return;
    var k=box.getAttribute("data-k");
    var row=list.filter(function(x){return x[0]===k;})[0];
    if(row)items.push(row[1]);
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
    var items=collect(".fdck",OPEN_LIST);
    if(items.length<OPEN_LIST.length){alert("Tick every opening item");return;}
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
    var items=collect(".fdclose",CLOSE_LIST);
    if(items.length<CLOSE_LIST.length){alert("Tick every closing item");return;}
    var note=(document.getElementById("fdCloseNote")&&document.getElementById("fdCloseNote").value||"").trim();
    ck.outAt=new Date().toLocaleTimeString();
    db.fdChecks.push({id:"fc"+Date.now(),day:today(),site:workSite(),kind:"close",by:user.name,byId:user.id,items:items,note:note,at:new Date().toLocaleString(),seen:false,seenBy:""});
    save();
    if(typeof pingMgrGm==="function")pingMgrGm("POSH CLOCK-OUT\n"+user.name+"\n"+workSite()+"\n"+ck.outAt+"\n"+items.join("\n")+(note?("\nHandover: "+note):""));
    draw();
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
})();
