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
function todayClocks(){return (db.clocks||[]).filter(function(c){return c.day===today()&&siteMatch(c.site);});}
function myOpenClock(){
  return (db.clocks||[]).filter(function(c){return c.day===today()&&c.byId===user.id&&!c.outAt;})[0];
}
function todayCheck(uid){
  return (db.fdChecks||[]).filter(function(c){return c.day===today()&&c.byId===uid;})[0];
}
function clockBox(){
  if(!isFD()){
    var list=todayClocks().slice().reverse().map(function(c){
      return "<p><b>"+c.by+"</b> · "+c.site+" · in "+c.inAt+(c.outAt?(" · out "+c.outAt):" · ON DUTY")+"</p>";
    }).join("");
    var checks=(db.fdChecks||[]).filter(function(c){return c.day===today()&&siteMatch(c.site);}).slice().reverse().map(function(c){
      var items=(c.items||[]).map(function(it){return "<p>✓ "+it+"</p>";}).join("");
      var ack=mgr()&&!c.seen?"<button class='btn ackFD' data-id='"+c.id+"'>Acknowledge</button>":(c.seen?"<p>Seen by "+c.seenBy+"</p>":"");
      return "<div class=card><b>"+c.by+" opening checklist</b><br>"+c.at+items+(c.note?("<p>"+c.note+"</p>"):"")+ack+"</div>";
    }).join("");
    if(!(mgr()||isSuper()||isGM()))return "";
    return "<div class=card><h3>Front desk clock-in today</h3>"+(list||"<p>No one clocked in yet.</p>")+"</div>"+(checks||"");
  }
  var open=myOpenClock();
  var done=todayCheck(user.id);
  var clock=open
    ?("<div class=ok>Clocked in at "+open.inAt+" · "+user.site+" · shift "+(user.shift||"")+"</div><button class='btn dark' id=clockOut>Clock out</button>")
    :"<div class=warn>Clock in before you take guests.</div><button class=btn id=clockIn>Clock in — I am on duty</button>";
  var form="";
  if(open&&!done){
    var rows=OPEN_LIST.map(function(it){return "<label class=row><span>"+it[1]+"</span><input type=checkbox class=fdck data-k='"+it[0]+"'></label>";}).join("");
    form="<div class=card><h3>Opening checklist — send to duty manager</h3>"+rows+"<textarea id=fdNote placeholder='Notes for duty manager (optional)'></textarea><button class=btn id=sendFDCheck>Submit checklist</button></div>";
  }
  if(done)form="<div class=ok>Opening checklist submitted at "+done.at+(done.seen?(" · seen by "+done.seenBy):" · waiting for duty manager")+".</div>";
  return "<div class=card><h3>Shift clock</h3>"+clock+"</div>"+form;
}
var _viewDesk=typeof viewDesk==="function"?viewDesk:null;
if(_viewDesk)viewDesk=function(){return clockBox()+_viewDesk();};
var _viewStaff2=viewStaff;
viewStaff=function(){
  var html=_viewStaff2();
  if(mgr()||isSuper()||isGM())return clockBox()+html;
  return html;
};
var _bClock=bind;
bind=function(){
  _bClock();
  var cin=document.getElementById("clockIn");
  if(cin)cin.onclick=function(){
    if(!isFD())return;
    if(myOpenClock())return;
    db.clocks.push({id:"ck"+Date.now(),day:today(),site:workSite(),by:user.name,byId:user.id,shift:user.shift||"",inAt:new Date().toLocaleTimeString(),outAt:""});
    save();
    if(typeof pingMgrGm==="function")pingMgrGm("POSH CLOCK-IN\n"+user.name+"\n"+workSite()+"\nShift "+(user.shift||"")+"\n"+new Date().toLocaleString());
    draw();
  };
  var cout=document.getElementById("clockOut");
  if(cout)cout.onclick=function(){
    var c=myOpenClock();
    if(!c)return;
    c.outAt=new Date().toLocaleTimeString();
    save();draw();
  };
  var send=document.getElementById("sendFDCheck");
  if(send)send.onclick=function(){
    if(!isFD()||!myOpenClock()){alert("Clock in first");return;}
    if(todayCheck(user.id))return;
    var items=[];
    document.querySelectorAll(".fdck").forEach(function(box){
      if(box.checked){
        var k=box.getAttribute("data-k");
        var row=OPEN_LIST.filter(function(x){return x[0]===k;})[0];
        if(row)items.push(row[1]);
      }
    });
    if(items.length<OPEN_LIST.length){alert("Tick every opening item before you submit");return;}
    var note=(document.getElementById("fdNote")&&document.getElementById("fdNote").value||"").trim();
    db.fdChecks.push({id:"fc"+Date.now(),day:today(),site:workSite(),by:user.name,byId:user.id,items:items,note:note,at:new Date().toLocaleString(),seen:false,seenBy:""});
    save();
    if(typeof pingMgrGm==="function")pingMgrGm("POSH OPENING CHECKLIST\n"+user.name+"\n"+workSite()+"\n"+items.join("\n")+(note?("\nNotes: "+note):""));
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
