(function(){
if(typeof db==="undefined")return;
if(!db.checkins)db.checkins=[];
if(!db.shiftReports)db.shiftReports=[];
if(!db.debts)db.debts=[];
function addFD(id,name,site,pin,shift){
  if(!db.users.some(function(u){return u.id===id;}))
    db.users.push({id:id,name:name,role:"frontdesk",site:site,pin:pin,whatsapp:"",shift:shift,hours:"08:00-19:00",demo:true});
}
function addAcct(id,name,site,pin){
  if(!db.users.some(function(u){return u.id===id;}))
    db.users.push({id:id,name:name,role:"accountant",site:site,pin:pin,whatsapp:"",demo:true});
}
addFD("deska","Front Desk Ikeja A","Ikeja","1101","A");
addFD("deskb","Front Desk Ikeja B","Ikeja","1102","B");
addFD("deskvia","Front Desk VI A","Victoria Island","1103","A");
addFD("deskvib","Front Desk VI B","Victoria Island","1104","B");
addAcct("acctikeja","Accountant Ikeja","Ikeja","5501");
addAcct("acctvi","Accountant VI","Victoria Island","5502");
db.users.forEach(function(u){
  if(u.role==="frontdesk"&&!u.hours)u.hours="08:00-19:00";
  if(u.id==="desk"){u.name="Front Desk Ikeja (legacy)";u.shift=u.shift||"A";}
});
try{save();}catch(e){}
try{document.title="Posh Manager";}catch(e){}
function isAcct(){return user&&user.role==="accountant";}
var _roleName=roleName;
roleName=function(r){return r==="accountant"?"Accountant":_roleName(r);};
var _roleSel=roleSel;
roleSel=function(id,v){
  var html=_roleSel(id,v);
  if(html.indexOf("value='accountant'")===-1)
    html=html.replace("</select>","<option value='accountant'"+(v==="accountant"?" selected":"")+">Accountant</option></select>");
  return html;
};
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
function acctDigits(){
  var list=db.users.filter(function(x){return x.role==="accountant"&&waOk(x.whatsapp)&&(seesAll()||siteMatch(x.site));});
  var local=list.filter(function(x){return siteMatch(x.site);})[0];
  return digits((local||list[0]||{}).whatsapp||firstWa("accountant"));
}
var _pingMgrGm=pingMgrGm;
pingMgrGm=function(msg){
  var a=waDigits(),g=gmDigits(),c=acctDigits();
  if(!waOk(a)&&!waOk(g)&&!waOk(c)){alert("No duty manager, CEO or accountant WhatsApp saved.");return;}
  if(waOk(a))openWa(a,msg);
  setTimeout(function(){if(waOk(g)&&digits(g)!==digits(a))openWa(g,msg);},700);
  setTimeout(function(){if(waOk(c)&&digits(c)!==digits(a)&&digits(c)!==digits(g))openWa(c,msg);},1400);
};
function viewWa(){
  var mgrs=db.users.filter(function(u){return u.role==="manager";});
  var fds=db.users.filter(function(u){return u.role==="frontdesk";});
  var ceos=db.users.filter(function(u){return u.role==="ceo"||u.role==="gm";});
  var accts=db.users.filter(function(u){return u.role==="accountant";});
  function row(u){return "<p>"+u.name+" · "+u.site+" · "+(waOk(u.whatsapp)?digits(u.whatsapp):"<b>missing</b>")+"</p>";}
  var edit=isSuper()?"<div class=card><h3>Hotel WhatsApp</h3><p>Duty manager line (certify alerts, shift reports, breakfast).</p><input id=wa value='"+digits(db.whatsapp)+"' placeholder='0803 000 0000'><p>Default front desk line</p><input id=fd value='"+digits(db.frontDesk)+"' placeholder='0803 000 0000'><button class=btn id=saveWa2>Save WhatsApp numbers</button> <button class='btn dark' id=testMgr>Test duty manager</button> <button class='btn dark' id=testFd>Test front desk</button> <button class='btn dark' id=testAcct>Test accountant</button></div>":"";
  return "<div class=card><h3>WhatsApp routing</h3><p>Room certified → Front desk</p><p>Shift / sales report → Duty manager + Accountant + CEO</p><p>Breakfast report → Duty manager + CEO</p></div>"+edit+"<div class=card><h3>Saved numbers</h3><p><b>Hotel DM line</b> "+(waOk(db.whatsapp)?digits(db.whatsapp):"not set")+"</p><p><b>Default FD line</b> "+(waOk(db.frontDesk)?digits(db.frontDesk):"not set")+"</p><p>Managers</p>"+mgrs.map(row).join("")+"<p>Front desk</p>"+fds.map(row).join("")+"<p>Accountants</p>"+(accts.map(row).join("")||"<p>None</p>")+"<p>CEO</p>"+ceos.map(row).join("")+"</div>";
}
function shiftLabel(u){return (u&&u.shift)?("Shift "+u.shift+" · "+(u.hours||"08:00-19:00")):"08:00-19:00";}
function money(el){var n=parseFloat((el&&el.value)||"0");return isNaN(n)?0:n;}
function siteCheckins(day){day=day||today();return (db.checkins||[]).filter(function(c){return c.day===day&&siteMatch(c.site);});}
function myCheckins(){return siteCheckins().filter(function(c){return !isFD()||c.byId===user.id;});}
function extrasTotal(c){var e=c.extras||{};return Number(e.early||0)+Number(e.late||0)+Number(e.laundry||0)+Number(e.minimart||0)+Number(e.other||0);}
function extrasNoMart(c){var e=c.extras||{};return Number(e.early||0)+Number(e.late||0)+Number(e.laundry||0)+Number(e.other||0);}
function checkinTotal(c){return Number(c.amount||0)+extrasTotal(c);}
function deskSalesTotal(list){return list.reduce(function(a,c){return a+checkinTotal(c);},0);}
function sumField(list,fn){return list.reduce(function(a,c){return a+Number(fn(c)||0);},0);}
function extrasLines(c){
  var e=c.extras||{},out=[];
  if(e.early)out.push("Early check-in "+naira(e.early)+(e.earlyNote?" · "+e.earlyNote:""));
  if(e.late)out.push("Late check-out "+naira(e.late)+(e.lateNote?" · "+e.lateNote:""));
  if(e.laundry)out.push("Laundry "+naira(e.laundry)+(e.laundryNote?" · "+e.laundryNote:""));
  if(e.minimart)out.push("Mini mart "+naira(e.minimart)+(e.minimartNote?" · "+e.minimartNote:""));
  if(e.other)out.push("Other "+naira(e.other)+(e.otherNote?" · "+e.otherNote:""));
  return out;
}
function siteDebts(){return (db.debts||[]).filter(function(d){return siteMatch(d.site);});}
function openDebts(){return siteDebts().filter(function(d){return Number(d.remaining||0)>0;});}
function paidToday(list){return list.reduce(function(a,d){return a+(d.payments||[]).filter(function(p){return p.day===today();}).reduce(function(x,p){return x+Number(p.amount||0);},0);},0);}
function newDebtToday(list){return list.filter(function(d){return d.day===today();}).reduce(function(a,d){return a+Number(d.amount||0);},0);}
function salesPack(list){
  return {rooms:sumField(list,function(c){return c.amount;}),mart:sumField(list,function(c){return (c.extras||{}).minimart;}),extras:sumField(list,extrasNoMart),billed:deskSalesTotal(list),debt:sumField(list,function(c){return c.debt;}),collected:sumField(list,function(c){return Math.max(0,checkinTotal(c)-Number(c.debt||0));})};
}
function salesCard(list){
  var p=salesPack(list),dt=newDebtToday(siteDebts()),dp=paidToday(siteDebts());
  return "<div class=card><h3>Documented sales · "+today()+"</h3><p>Room sales <b>"+naira(p.rooms)+"</b></p><p>Mini mart <b>"+naira(p.mart)+"</b></p><p>Extras <b>"+naira(p.extras)+"</b></p><p>Total billed <b>"+naira(p.billed)+"</b></p><p>Collected now <b>"+naira(p.collected)+"</b></p><p>New debt <b>"+naira(dt)+"</b></p><p>Debt payments today <b>"+naira(dp)+"</b></p><p>Open debt book <b>"+naira(openDebts().reduce(function(a,d){return a+Number(d.remaining||0);},0))+"</b></p></div>";
}
function extraNote(c){var lines=extrasLines(c);return lines.length?lines.map(function(l){return "<br>"+l;}).join(""):"";}
function checkinCard(c){
  return "<div class=card><b>"+c.guest+"</b> · Rm "+c.room+"<br>Room "+naira(c.amount)+" · Mini mart "+naira((c.extras||{}).minimart||0)+" · Extras "+naira(extrasNoMart(c))+extraNote(c)+"<br>Billed "+naira(checkinTotal(c))+" · Collected "+naira(Math.max(0,checkinTotal(c)-Number(c.debt||0)))+(c.debt?("<br>Debt "+naira(c.debt)+(c.debtNote?" · "+c.debtNote:"")):"")+"<br>"+c.by+" · "+c.at+"</div>";
}
function shiftReportText(rep){
  var p=rep.pack||{};
  return "POSH MANAGER SALES REPORT\n"+(rep.site||"")+"\n"+rep.day+"\nBy "+rep.by+"\nShift "+(rep.shift||"")+" 08:00-19:00\nRoom sales "+naira(p.rooms||0)+"\nMini mart "+naira(p.mart||0)+"\nExtras "+naira(p.extras||0)+"\nTotal billed "+naira(rep.sales)+"\nCollected "+naira(p.collected||0)+"\nNew debt "+naira(p.debt||0)+"\nDebt paid "+naira(p.debtPaid||0)+"\nCheck-ins "+rep.arrivals+"\nIn-house "+rep.inhouse+"\nExpected "+rep.expected+"\nIncidents: "+(rep.incident||"None");
}
function viewDeskReports(){
  var reps=(db.shiftReports||[]).filter(function(r){return siteMatch(r.site);}).slice().reverse();
  var cards=reps.map(function(r){var p=r.pack||{};return "<div class=card><b>"+r.day+" · "+r.site+"</b><br>"+r.by+" · Shift "+(r.shift||"A")+"<br>Room "+naira(p.rooms||0)+" · Mini mart "+naira(p.mart||0)+" · Extras "+naira(p.extras||0)+"<br>Billed "+naira(r.sales)+" · Collected "+naira(p.collected||0)+"<br>New debt "+naira(p.debt||0)+" · Debt paid "+naira(p.debtPaid||0)+"<br>Arrivals "+r.arrivals+" · in-house "+r.inhouse+" · expected "+r.expected+"<br>"+(r.incident?("Incident: "+r.incident):"No incident")+"</div>";}).join("");
  return "<h1>Sales reports received</h1><div class=ok>Front desk submits to duty manager, accountant and CEO.</div>"+(cards||"<p>No shift reports yet.</p>");
}
function viewDebts(){
  var open=openDebts().slice().reverse();
  var hist=siteDebts().slice().reverse();
  var canPay=isFD()||isAcct()||mgr()||isSuper();
  var cards=open.map(function(d){
    var pays=(d.payments||[]).slice().reverse().map(function(p){return "<p>"+p.at+" · "+naira(p.amount)+" · "+(p.note||"Payment")+" · "+p.by+"</p>";}).join("");
    var pay=canPay?"<input class=payAmt type=number min=1 data-id='"+d.id+"' placeholder='Amount paid'><input class=payNote data-id='"+d.id+"' placeholder='Payment note'><button class='btn payDebt' data-id='"+d.id+"'>Record payment</button>":"";
    return "<div class=card><b>"+d.guest+"</b> · Rm "+d.room+"<br>Opened "+naira(d.amount)+" · remaining <b>"+naira(d.remaining)+"</b>"+(d.note?("<br>"+d.note):"")+"<br>"+d.day+" · "+d.by+"<br>"+pay+(pays?("<p><b>History</b></p>"+pays):"<p>No payments yet.</p>")+"</div>";
  }).join("");
  var closed=hist.filter(function(d){return Number(d.remaining||0)<=0;}).slice(0,8).map(function(d){return "<p>"+d.guest+" · Rm "+d.room+" · cleared "+naira(d.amount)+" · "+d.day+"</p>";}).join("");
  return "<h1>Debt book</h1><div class=ok>Open "+open.length+" · remaining "+naira(open.reduce(function(a,d){return a+Number(d.remaining||0);},0))+"</div>"+(cards||"<p>No open debts.</p>")+"<div class=card><h3>Cleared debts</h3>"+(closed||"<p>None yet.</p>")+"</div>";
}
function viewAccounts(){var list=siteCheckins();return "<h1>Accounts</h1><div class=ok>"+(seesAll()?"":workSite()+" · ")+"Sales, extras, debt and payments.</div>"+salesCard(list)+viewDeskReports()+"<h1>Today's folios</h1>"+(list.slice().reverse().map(checkinCard).join("")||"<p>No check-ins today.</p>")+viewDebts();}
function viewDesk(){
  if(isAcct()||(isGM()&&tab==="desk"))return viewAccounts();
  var list=isFD()?myCheckins():siteCheckins();
  var form="";
  if(isFD())form="<div class=card><h3>Guest check-in</h3><p>"+user.site+" · "+shiftLabel(user)+"</p><input id=cinName placeholder='Guest name'><select id=cinRoom>"+siteRooms().map(function(r){return "<option>"+r.number+"</option>";}).join("")+"</select><input id=cinAmt type=number min=0 placeholder='Room sales amount'><p>Mini mart</p><input id=cinMart type=number min=0 placeholder='Mini mart sales'><input id=cinMartNote placeholder='Mini mart items / description'><p>Extras (amount + description)</p><input id=cinEarly type=number min=0 placeholder='Early check-in amount'><input id=cinEarlyNote placeholder='Early check-in note'><input id=cinLate type=number min=0 placeholder='Late check-out amount'><input id=cinLateNote placeholder='Late check-out note'><input id=cinLau type=number min=0 placeholder='Laundry amount'><input id=cinLauNote placeholder='Laundry description'><input id=cinOth type=number min=0 placeholder='Other extras amount'><input id=cinOthNote placeholder='Other extras description'><p>Debt (unpaid balance)</p><input id=cinDebt type=number min=0 placeholder='Amount on debt'><input id=cinDebtNote placeholder='Why debt / due date'><button class=btn id=saveCin>Save folio</button></div><div class=card><h3>End of shift · 8am to 7pm</h3><input id=cinHouse type=number min=0 placeholder='In-house guests now'><input id=cinExp type=number min=0 placeholder='Expected guests'><textarea id=cinInc placeholder='Incidents this shift (or leave blank)'></textarea><button class=btn id=submitShift>Submit sales report to accountant and duty manager</button></div>";
  var rows=list.slice().reverse().map(checkinCard).join("");
  return "<h1>Front desk</h1><div class=ok>Today "+today()+" · "+list.length+" check-ins · billed "+naira(deskSalesTotal(list))+"</div>"+salesCard(list)+form+(rows||"<p>No check-ins this shift yet.</p>")+((mgr()||isGM()||isAcct())?viewDeskReports()+viewDebts():(isFD()?viewDebts():""));
}
var _mealReportText=mealReportText;
mealReportText=function(){return String(_mealReportText()).replace(/POSH CERTIFY/g,"POSH MANAGER").replace(/POSH BREAKFAST REPORT/g,"POSH MANAGER BREAKFAST REPORT");};
var _viewMeals=viewMeals;
viewMeals=function(){
  var day=today(),posted=menuFor(day),choices=posted&&posted.choices&&posted.choices.length?posted.choices:[],noPost=!posted;
  var list=todayMeals().filter(function(b){return siteMatch(roomSiteOf(b.room));});
  var served=list.filter(function(b){return b.status==="served";});
  var head="<h1>Complimentary breakfast</h1><div class=ok>"+day+(seesAll()?"":" · "+workSite())+" · issued "+list.length+" · served "+served.length+"</div>";
  if(noPost)head+="<div class=warn>Chef has not posted a menu for "+day+".</div>";
  var upcoming=(db.menus||[]).filter(function(m){return m.day>=day&&(seesAll()||!m.site||m.site===workSite());}).sort(function(a,b){return a.day<b.day?-1:a.day>b.day?1:0;});
  var board="<div class=card><h3>Posted menus by date</h3>"+(upcoming.map(function(m){return "<p><b>"+m.day+"</b>"+(m.site?" · "+m.site:"")+"<br>"+m.choices.join(", ")+(m.by?"<br>By "+m.by:"")+"</p>";}).join("")||"<p>None posted yet.</p>")+"</div>";
  var form=isKitchen()?"<div class=card><h3>Post breakfast menu</h3><input id=mday type=date value='"+addDays(1)+"'><textarea id=mchoices>"+(choices.length?choices.join("\n"):"Continental\nNigerian\nFruit platter\nTea and toast")+"</textarea><button class=btn id=saveMenu>Save menu for that date</button></div>":"";
  var todayCard="<div class=card><h3>Today · "+day+"</h3>"+(posted?choices.map(function(c){return "<p>"+c+"</p>";}).join(""):"<p>No menu posted for today.</p>")+"</div>";
  var issue=isFD()?(noPost?"<div class=warn>Cannot issue breakfast until the chef posts today's dated menu.</div>":"<div class=card><h3>Issue breakfast</h3><input id=gname placeholder='Guest name'><select id=groom>"+siteRooms().map(function(r){return "<option>"+r.number+"</option>";}).join("")+"</select><select id=gmeal>"+choices.map(function(c){return "<option>"+c+"</option>";}).join("")+"</select><button class=btn id=issueBf>Issue code</button></div>"):"";
  var kit=isKitchen()?"<div class=card><h3>Verify guest on arrival</h3><input id=gcode placeholder='Enter guest code' inputmode=numeric><button class=btn id=findBf>Verify code</button><div id=bfhit></div></div>":"";
  if(mgr()||isGM()||isAcct()||isSuper())kit+="<div class=ok>Breakfast is run by kitchen and front desk only. Duty manager does not issue or verify.</div>";
  var rows=list.slice().reverse().map(function(b){return isKitchen()?"<div class=card><b>"+b.guest+"</b><br>"+b.meal+(b.status==="served"?" · SERVED":" · waiting")+"</div>":"<div class=card><b>"+b.code+"</b> · "+b.guest+" · Rm "+b.room+"<br>"+b.meal+" · "+b.status.toUpperCase()+"</div>";}).join("");
  var sendBtn=(isKitchen()||isFD())?"<button class=btn id=sendBfRep>Send today's report</button>":"";
  return head+todayCard+form+board+issue+kit+sendBtn+(rows||"<p>None issued yet.</p>");
};
var _viewStaff=viewStaff,_viewBoard=viewBoard,_bind=bind,_draw=draw;
viewStaff=function(){
  if(isStore())return viewStore();
  if(isAcct())return viewAccounts()+viewWa();
  if(mgr())return scorePanel()+viewDeskReports()+viewWa()+viewStore();
  if(isGM())return scorePanel()+salesCard(siteCheckins())+viewDeskReports()+viewWa()+viewStore();
  if(isSuper())return viewWa()+_viewStaff();
  return _viewStaff();
};
viewBoard=function(){
  if(isKitchen())return viewMeals();
  if(isLaundry())return viewSlips();
  if(isStore())return viewStore();
  if(isAcct())return viewAccounts();
  if(isGM()){
    var tm=todayMeals(),sv=tm.filter(function(b){return b.status==="served";}).length;
    var openI=(db.issues||[]).filter(function(x){return x.status!=="completed";}).length;
    var cin=siteCheckins();
    return "<div class=ok>CEO report only.</div><h1>House report</h1><div class=card><h3>Breakfast today</h3><p><b>"+sv+"</b> served of <b>"+tm.length+"</b></p></div>"+salesCard(cin)+"<div class=card><h3>Maintenance</h3><p>"+openI+" open issues</p></div>"+scorePanel()+viewDeskReports()+viewStore();
  }
  return _viewBoard();
};
bind=function(){
  _bind();
  var saveMenu=document.getElementById("saveMenu");
  if(saveMenu)saveMenu.onclick=function(){
    if(!isKitchen())return;
    var raw=(document.getElementById("mchoices").value||"").split("\n").map(function(s){return s.trim();}).filter(Boolean);
    if(!raw.length)return;
    var day=(document.getElementById("mday")&&document.getElementById("mday").value)||addDays(1);
    db.menus=db.menus.filter(function(m){return !(m.day===day&&(m.site||"")===(seesAll()?"":workSite()));});
    db.menus.push({day:day,choices:raw,site:seesAll()?"":workSite(),by:user.name,at:new Date().toLocaleString()});
    save();draw();
  };
  var issueBf=document.getElementById("issueBf");
  if(issueBf)issueBf.onclick=function(){
    if(!isFD())return;
    if(!menuFor(today())){alert("Chef has not posted today's menu.");return;}
    var name=(document.getElementById("gname").value||"").trim(),room=document.getElementById("groom").value,meal=document.getElementById("gmeal").value;
    if(!name||!room||!meal)return;
    if(!siteMatch(roomSiteOf(room)))return;
    var code=makeCode();
    db.breakfasts.push({id:"b"+Date.now(),code:code,guest:name,room:room,meal:meal,day:today(),status:"issued",issuedBy:user.name});
    save();alert("Give this code to the guest:\n\n"+code);draw();
  };
  var findBf=document.getElementById("findBf");
  if(findBf)findBf.onclick=function(){
    if(!isKitchen())return;
    var code=String((document.getElementById("gcode").value||"").trim());
    var hit=todayMeals().filter(function(b){return b.code===code;})[0];
    var box=document.getElementById("bfhit");
    if(!hit){box.innerHTML="<div class=warn>Not genuine. Do not serve.</div>";return;}
    if(!seesAll()&&!siteMatch(roomSiteOf(hit.room))){box.innerHTML="<div class=warn>Other location.</div>";return;}
    if(hit.status==="served"){box.innerHTML="<div class=warn>Already served.</div>";return;}
    box.innerHTML="<div class=ok><b>Verified</b><br>"+hit.guest+" · "+hit.meal+"</div><button class=btn id=serveBf>Confirm and serve</button>";
    document.getElementById("serveBf").onclick=function(){hit.status="served";hit.servedBy=user.name;save();pingMgrGm(mealReportText());draw();};
  };
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
  if(saveWa2)saveWa2.onclick=function(){if(!isSuper())return;db.whatsapp=digits(document.getElementById("wa").value);db.frontDesk=digits(document.getElementById("fd").value);save();alert("WhatsApp numbers saved.");draw();};
  var testMgr=document.getElementById("testMgr");if(testMgr)testMgr.onclick=function(){openWa(waDigits(),"POSH MANAGER test · duty manager line is working.");};
  var testFd=document.getElementById("testFd");if(testFd)testFd.onclick=function(){openWa(fdDigits(),"POSH MANAGER test · front desk line is working.");};
  var testAcct=document.getElementById("testAcct");if(testAcct)testAcct.onclick=function(){openWa(acctDigits(),"POSH MANAGER test · accountant line is working.");};
  var saveCin=document.getElementById("saveCin");
  if(saveCin)saveCin.onclick=function(){
    if(!isFD())return;
    var name=(document.getElementById("cinName").value||"").trim(),room=document.getElementById("cinRoom").value,amount=money(document.getElementById("cinAmt"));
    if(!name||!room){alert("Guest name and room required");return;}
    var extras={early:money(document.getElementById("cinEarly")),earlyNote:(document.getElementById("cinEarlyNote").value||"").trim(),late:money(document.getElementById("cinLate")),lateNote:(document.getElementById("cinLateNote").value||"").trim(),laundry:money(document.getElementById("cinLau")),laundryNote:(document.getElementById("cinLauNote").value||"").trim(),minimart:money(document.getElementById("cinMart")),minimartNote:(document.getElementById("cinMartNote").value||"").trim(),other:money(document.getElementById("cinOth")),otherNote:(document.getElementById("cinOthNote").value||"").trim()};
    var debt=money(document.getElementById("cinDebt")),debtNote=(document.getElementById("cinDebtNote").value||"").trim();
    var billed=amount+extras.early+extras.late+extras.laundry+extras.minimart+extras.other;
    if(debt>billed){alert("Debt cannot be more than the billed total.");return;}
    var rec={id:"c"+Date.now(),guest:name,room:room,amount:amount,extras:extras,debt:debt,debtNote:debtNote,collected:Math.max(0,billed-debt),site:workSite(),by:user.name,byId:user.id,shift:user.shift||"A",day:today(),at:new Date().toLocaleString()};
    db.checkins.push(rec);
    if(debt>0)db.debts.push({id:"db"+Date.now(),checkinId:rec.id,guest:name,room:room,site:workSite(),amount:debt,remaining:debt,note:debtNote,by:user.name,byId:user.id,day:today(),at:rec.at,payments:[]});
    save();draw();
  };
  var submitShift=document.getElementById("submitShift");
  if(submitShift)submitShift.onclick=function(){
    if(!isFD())return;
    var mine=myCheckins();
    var pack=salesPack(mine);pack.debtPaid=paidToday(siteDebts());
    var rep={id:"sh"+Date.now(),day:today(),site:workSite(),by:user.name,byId:user.id,shift:user.shift||"A",sales:deskSalesTotal(mine),pack:pack,arrivals:mine.length,inhouse:parseInt((document.getElementById("cinHouse").value||"0"),10)||0,expected:parseInt((document.getElementById("cinExp").value||"0"),10)||0,incident:(document.getElementById("cinInc").value||"").trim(),at:new Date().toLocaleString()};
    db.shiftReports.push(rep);save();pingMgrGm(shiftReportText(rep));draw();
  };
  document.querySelectorAll(".payDebt").forEach(function(b){
    b.onclick=function(){
      if(!(isFD()||isAcct()||mgr()||isSuper()))return;
      var id=b.getAttribute("data-id");
      var amt=money(document.querySelector(".payAmt[data-id='"+id+"']"));
      var noteEl=document.querySelector(".payNote[data-id='"+id+"']");
      if(!(amt>0)){alert("Enter payment amount");return;}
      db.debts.forEach(function(d){
        if(d.id!==id)return;
        if(!siteMatch(d.site)&&!seesAll())return;
        if(amt>Number(d.remaining||0)){alert("Payment is more than remaining debt");return;}
        d.payments=d.payments||[];
        d.payments.push({id:"p"+Date.now(),amount:amt,note:(noteEl&&noteEl.value||"").trim(),by:user.name,day:today(),at:new Date().toLocaleString()});
        d.remaining=Math.max(0,Number(d.remaining||0)-amt);
      });
      save();draw();
    };
  });
};
draw=function(){
  var el=document.getElementById("app");
  if(!user){
    if(pending){
      el.innerHTML="<div class=login><h1>Enter PIN</h1><p>"+pending.name+"</p><input id=pinbox type=password inputmode=numeric placeholder='PIN'><p><button class=btn id=pinok>Unlock</button> <button class='btn dark' id=pincancel>Back</button></p></div>";
      document.getElementById("pinok").onclick=function(){
        if(document.getElementById("pinbox").value.trim()===String(pending.pin)){
          user=pending;pending=null;
          tab=isKitchen()?"meals":(isLaundry()?"laundry":(isStore()?"staff":(isMaint()?"issues":(isFD()||isAcct()?"desk":"rooms"))));
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
