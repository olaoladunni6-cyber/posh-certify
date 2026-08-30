(function(){
if(typeof db==="undefined")return;
if(!db.checkins)db.checkins=[];
if(!db.shiftReports)db.shiftReports=[];
function addFD(id,name,site,pin,shift){
  if(!db.users.some(function(u){return u.id===id;}))
    db.users.push({id:id,name:name,role:"frontdesk",site:site,pin:pin,whatsapp:"",shift:shift,hours:"08:00-19:00",demo:true});
}
addFD("deska","Front Desk Ikeja A","Ikeja","1101","A");
addFD("deskb","Front Desk Ikeja B","Ikeja","1102","B");
addFD("deskvia","Front Desk VI A","Victoria Island","1103","A");
addFD("deskvib","Front Desk VI B","Victoria Island","1104","B");
db.users.forEach(function(u){
  if(u.role==="frontdesk"&&!u.hours)u.hours="08:00-19:00";
  if(u.id==="desk"){u.name="Front Desk Ikeja (legacy)";u.shift=u.shift||"A";}
});
try{save();}catch(e){}
try{document.title="Posh Manager";}catch(e){}

var _digits=digits;
digits=function(s){
  var d=_digits(s);
  if(d.indexOf("234")===0)return d;
  if(d.length===11&&d.charAt(0)==="0")return "234"+d.slice(1);
  if(d.length===10)return "234"+d;
  return d;
};
function waOk(n){return digits(n).length>=13;}
function waLink(num,msg){return "https://wa.me/"+digits(num)+"?text="+encodeURIComponent(msg||"");}
function openWa(num,msg){if(!waOk(num)){alert("Save a valid Nigerian WhatsApp first. Example: 0803 123 4567");return false;}window.open(waLink(num,msg),"_blank");return true;}
var _pingMgrGm=pingMgrGm;
pingMgrGm=function(msg){
  var a=waDigits(),g=gmDigits();
  if(!waOk(a)&&!waOk(g)){alert("No duty manager or CEO WhatsApp saved. Super Admin: Staff tab → Hotel WhatsApp, or put a number on the manager/CEO card.");return;}
  if(waOk(a))openWa(a,msg);
  setTimeout(function(){if(waOk(g)&&digits(g)!==digits(a))openWa(g,msg);},700);
};

function viewWa(){
  var mgrs=db.users.filter(function(u){return u.role==="manager";});
  var fds=db.users.filter(function(u){return u.role==="frontdesk";});
  var ceos=db.users.filter(function(u){return u.role==="ceo"||u.role==="gm";});
  function row(u){return "<p>"+u.name+" · "+u.site+" · "+(waOk(u.whatsapp)?digits(u.whatsapp):"<b>missing</b>")+"</p>";}
  var edit=isSuper()?"<div class=card><h3>Hotel WhatsApp</h3><p>Duty manager line (certify alerts, shift reports, breakfast).</p><input id=wa value='"+digits(db.whatsapp)+"' placeholder='0803 000 0000'><p>Default front desk line</p><input id=fd value='"+digits(db.frontDesk)+"' placeholder='0803 000 0000'><button class=btn id=saveWa2>Save WhatsApp numbers</button> <button class='btn dark' id=testMgr>Test duty manager</button> <button class='btn dark' id=testFd>Test front desk</button></div>":"";
  return "<div class=card><h3>WhatsApp routing</h3><p>Room certified → Front desk</p><p>Shift report / breakfast / late job → Duty manager + CEO</p><p>Type 0803… or 234803… Both work.</p></div>"+edit+"<div class=card><h3>Saved numbers</h3><p><b>Hotel DM line</b> "+(waOk(db.whatsapp)?digits(db.whatsapp):"not set")+"</p><p><b>Default FD line</b> "+(waOk(db.frontDesk)?digits(db.frontDesk):"not set")+"</p><p>Managers</p>"+mgrs.map(row).join("")+"<p>Front desk</p>"+fds.map(row).join("")+"<p>CEO</p>"+ceos.map(row).join("")+"</div>";
}

function shiftLabel(u){return (u&&u.shift)?("Shift "+u.shift+" · "+(u.hours||"08:00-19:00")):"08:00-19:00";}
function money(el){var n=parseFloat((el&&el.value)||"0");return isNaN(n)?0:n;}
function siteCheckins(){return (db.checkins||[]).filter(function(c){return c.day===today()&&siteMatch(c.site);});}
function myCheckins(){return siteCheckins().filter(function(c){return !isFD()||c.byId===user.id;});}
function extrasTotal(c){var e=c.extras||{};return Number(e.early||0)+Number(e.late||0)+Number(e.laundry||0)+Number(e.minimart||0)+Number(e.other||0);}
function checkinTotal(c){return Number(c.amount||0)+extrasTotal(c);}
function deskSalesTotal(list){return list.reduce(function(a,c){return a+checkinTotal(c);},0);}
function shiftReportText(rep){return "POSH MANAGER SHIFT REPORT\n"+(rep.site||"")+"\n"+rep.day+"\nBy "+rep.by+"\nShift "+(rep.shift||"")+" 08:00-19:00\nSales "+naira(rep.sales)+"\nCheck-ins "+rep.arrivals+"\nIn-house "+rep.inhouse+"\nExpected "+rep.expected+"\nIncidents: "+(rep.incident||"None");}
function viewDeskReports(){
  var reps=(db.shiftReports||[]).filter(function(r){return siteMatch(r.site);}).slice().reverse();
  var cards=reps.map(function(r){return "<div class=card><b>"+r.day+" · "+r.site+"</b><br>"+r.by+" · Shift "+(r.shift||"A")+"<br>Sales "+naira(r.sales)+" · arrivals "+r.arrivals+" · in-house "+r.inhouse+" · expected "+r.expected+"<br>"+(r.incident?("Incident: "+r.incident):"No incident")+"</div>";}).join("");
  return "<h1>Shift reports</h1><div class=ok>Submitted to duty manager · this location only unless CEO.</div>"+(cards||"<p>No shift reports yet.</p>");
}
function viewDesk(){
  var list=isFD()?myCheckins():siteCheckins();
  var form="";
  if(isFD())form="<div class=card><h3>Guest check-in</h3><p>"+user.site+" · "+shiftLabel(user)+"</p><input id=cinName placeholder='Guest name'><select id=cinRoom>"+siteRooms().map(function(r){return "<option>"+r.number+"</option>";}).join("")+"</select><input id=cinAmt type=number min=0 placeholder='Room amount charged'><p>Extras</p><input id=cinEarly type=number min=0 placeholder='Early check-in'><input id=cinLate type=number min=0 placeholder='Late check-out'><input id=cinLau type=number min=0 placeholder='Laundry'><input id=cinMart type=number min=0 placeholder='Mini mart'><input id=cinOth type=number min=0 placeholder='Other extras'><button class=btn id=saveCin>Save check-in</button></div><div class=card><h3>End of shift · 8am to 7pm</h3><input id=cinHouse type=number min=0 placeholder='In-house guests now'><input id=cinExp type=number min=0 placeholder='Expected guests'><textarea id=cinInc placeholder='Incidents this shift (or leave blank)'></textarea><button class=btn id=submitShift>Submit sales and occupancy to duty manager</button></div>";
  var rows=list.slice().reverse().map(function(c){return "<div class=card><b>"+c.guest+"</b> · Rm "+c.room+"<br>"+naira(c.amount)+" room · extras "+naira(extrasTotal(c))+" · total "+naira(checkinTotal(c))+"<br>"+c.by+" · "+c.at+"</div>";}).join("");
  return "<h1>Front desk</h1><div class=ok>Today "+today()+" · "+list.length+" check-ins · sales "+naira(deskSalesTotal(list))+"</div>"+form+(rows||"<p>No check-ins this shift yet.</p>")+((mgr()||isGM())?viewDeskReports():"");
}

var _mealReportText=mealReportText;
mealReportText=function(){
  return String(_mealReportText()).replace(/POSH CERTIFY/g,"POSH MANAGER").replace(/POSH BREAKFAST REPORT/g,"POSH MANAGER BREAKFAST REPORT");
};

var _viewStaff=viewStaff,_viewBoard=viewBoard,_bind=bind,_draw=draw;

viewStaff=function(){
  if(isStore())return viewStore();
  if(mgr())return scorePanel()+viewDeskReports()+viewWa()+viewStore();
  if(isGM())return scorePanel()+viewDeskReports()+viewWa()+viewStore();
  if(isSuper())return viewWa()+_viewStaff();
  return _viewStaff();
};

viewBoard=function(){
  if(isKitchen())return viewMeals();
  if(isLaundry())return viewSlips();
  if(isStore())return viewStore();
  if(isGM()){
    var tm=todayMeals(),sv=tm.filter(function(b){return b.status==="served";}).length;
    var openI=(db.issues||[]).filter(function(x){return x.status!=="completed";}).length;
    var cin=siteCheckins();
    return "<div class=ok>CEO report only.</div><h1>House report</h1><div class=card><h3>Breakfast today</h3><p><b>"+sv+"</b> served of <b>"+tm.length+"</b></p></div><div class=card><h3>Front desk today</h3><p>"+cin.length+" check-ins · "+naira(deskSalesTotal(cin))+"</p></div><div class=card><h3>Maintenance</h3><p>"+openI+" open issues</p></div>"+scorePanel()+viewDeskReports()+viewStore();
  }
  return _viewBoard();
};

bind=function(){
  _bind();
  var cert=document.getElementById("cert");
  if(cert)cert.onclick=function(){
    if(!mgr())return;
    var r=db.rooms.filter(function(x){return x.id===roomId;})[0];
    if(!r||!siteMatch(r.site))return;
    if(r.status==="ooo"||missCount(r)>0||mediaCount(r)<3||!r.laundryChecked){alert("Not ready.");return;}
    r.status="certified";save();
    openWa(fdDigits(),"POSH MANAGER Room "+r.number+" CERTIFIED. Ready to sell.");
    roomId=null;draw();
  };
  var saveWa2=document.getElementById("saveWa2");
  if(saveWa2)saveWa2.onclick=function(){
    if(!isSuper())return;
    db.whatsapp=digits(document.getElementById("wa").value);
    db.frontDesk=digits(document.getElementById("fd").value);
    save();alert("WhatsApp numbers saved.");draw();
  };
  var testMgr=document.getElementById("testMgr");
  if(testMgr)testMgr.onclick=function(){openWa(waDigits(),"POSH MANAGER test · duty manager line is working.");};
  var testFd=document.getElementById("testFd");
  if(testFd)testFd.onclick=function(){openWa(fdDigits(),"POSH MANAGER test · front desk line is working.");};
  var saveCin=document.getElementById("saveCin");
  if(saveCin)saveCin.onclick=function(){
    if(!isFD())return;
    var name=(document.getElementById("cinName").value||"").trim();
    var room=document.getElementById("cinRoom").value;
    var amount=money(document.getElementById("cinAmt"));
    if(!name||!room){alert("Guest name and room required");return;}
    db.checkins.push({id:"c"+Date.now(),guest:name,room:room,amount:amount,extras:{early:money(document.getElementById("cinEarly")),late:money(document.getElementById("cinLate")),laundry:money(document.getElementById("cinLau")),minimart:money(document.getElementById("cinMart")),other:money(document.getElementById("cinOth"))},site:workSite(),by:user.name,byId:user.id,shift:user.shift||"A",day:today(),at:new Date().toLocaleString()});
    save();draw();
  };
  var submitShift=document.getElementById("submitShift");
  if(submitShift)submitShift.onclick=function(){
    if(!isFD())return;
    var mine=myCheckins();
    var inhouse=parseInt((document.getElementById("cinHouse").value||"0"),10)||0;
    var expected=parseInt((document.getElementById("cinExp").value||"0"),10)||0;
    var incident=(document.getElementById("cinInc").value||"").trim();
    var sales=deskSalesTotal(mine);
    var rep={id:"sh"+Date.now(),day:today(),site:workSite(),by:user.name,byId:user.id,shift:user.shift||"A",sales:sales,arrivals:mine.length,inhouse:inhouse,expected:expected,incident:incident,at:new Date().toLocaleString()};
    db.shiftReports.push(rep);save();pingMgrGm(shiftReportText(rep));draw();
  };
};

draw=function(){
  var el=document.getElementById("app");
  if(!user){
    if(pending){
      el.innerHTML="<div class=login><h1>Enter PIN</h1><p>"+pending.name+"</p><input id=pinbox type=password inputmode=numeric placeholder='PIN'><p><button class=btn id=pinok>Unlock</button> <button class='btn dark' id=pincancel>Back</button></p></div>";
      document.getElementById("pinok").onclick=function(){
        if(document.getElementById("pinbox").value.trim()===String(pending.pin)){
          user=pending;pending=null;
          tab=isKitchen()?"meals":(isLaundry()?"laundry":(isStore()?"staff":(isMaint()?"issues":(isFD()?"desk":"rooms"))));
          roomId=null;draw();
        }
      };
      document.getElementById("pincancel").onclick=function(){pending=null;draw();};
      return;
    }
    el.innerHTML="<div class=login><h1>Posh Manager</h1>"+db.users.map(function(u){return "<button class=acct data-id='"+u.id+"'><b>"+u.name+"</b><br>"+roleName(u.role)+" · "+u.site+"</button>";}).join("")+"</div>";
    el.querySelectorAll(".acct").forEach(function(b){b.onclick=function(){pending=db.users.filter(function(u){return u.id===b.getAttribute("data-id");})[0];draw();};});
    return;
  }
  var inner=tab==="staff"?viewStaff():tab==="me"?viewMe():tab==="meals"?viewMeals():tab==="issues"?viewIssues():tab==="laundry"?viewSlips():tab==="desk"?viewDesk():roomId?viewRoom():viewBoard();
  el.innerHTML="<div class=top><span>Posh Manager</span><span>"+user.name.split(" ")[0]+"</span></div><div class=wrap>"+inner+"</div><div class=dock><button id=d1>Rooms</button><button id=d2>Fix</button><button id=d5>Meals</button><button id=d6>Desk</button><button id=d3>Staff</button><button id=d4>Me</button></div>";
  ["rooms","issues","staff","me","meals","desk"].forEach(function(name,i){
    var ids=["d1","d2","d3","d4","d5","d6"];
    document.getElementById(ids[i]).onclick=function(){tab=isLaundry()&&name==="issues"?"laundry":name;roomId=null;draw();};
  });
  bind();
};

draw();
})();
