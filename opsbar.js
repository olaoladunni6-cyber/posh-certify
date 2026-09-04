(function(){
function boot(){
if(typeof db==="undefined"||typeof draw!=="function"){setTimeout(boot,80);return;}
if(window.__opsBar4)return;window.__opsBar4=true;
function role(){return (user&&user.role)||"";}
function canAssign(){return role()==="frontdesk"||role()==="superadmin"||role()==="manager";}
function canFix(){return ["housekeeper","frontdesk","manager","maint","ceo","superadmin"].indexOf(role())>=0;}
function openR(){if(roomId)return (db.rooms||[]).filter(function(x){return x.id===roomId;})[0]||null;return null;}
function keepers(){return (db.users||[]).filter(function(u){if(u.role!=="housekeeper")return false;if(role()==="superadmin"||role()==="ceo")return true;return !user.site||user.site==="All locations"||u.site===user.site;});}
function roomsHere(){return (db.rooms||[]).filter(function(r){if(role()==="superadmin"||role()==="ceo")return true;return !user.site||user.site==="All locations"||r.site===user.site;});}
window.poshAssignRoom=function(){
  if(!user){alert("Sign in first");return;}
  if(!canAssign()){alert("Front Desk, duty manager or Super Admin only.");return;}
  var list=roomsHere();if(!list.length){alert("No rooms");return;}
  var num=prompt("Room number to allocate\n"+list.map(function(r){return r.number;}).join(", "));if(!num)return;
  var r=list.filter(function(x){return String(x.number)===String(num).trim();})[0];if(!r){alert("Room not found");return;}
  if(r.status==="certified"){alert("Certified rooms stay closed.");return;}
  var hks=keepers();if(!hks.length){alert("No housekeeper");return;}
  var pick=prompt("Housekeeper number:\n"+hks.map(function(u,i){return (i+1)+". "+u.name;}).join("\n"),"1");if(!pick)return;
  var hk=hks[parseInt(pick,10)-1];if(!hk){alert("Pick a number");return;}
  var job=prompt("Job: checkout / inhouse / postmaint / spring","checkout");if(!job)return;
  job=String(job).toLowerCase().replace(/\s+/g,"");
  if(job.indexOf("in")===0)job="inhouse";if(job.indexOf("post")===0)job="postmaint";if(job.indexOf("spring")===0)job="spring";
  r.hk=hk.id;r.hkName=hk.name;r.job=job;r.status="pending";r.locked=false;r.videoReady=false;
  try{save();}catch(e){}try{draw();}catch(e){}
  alert("Rm "+r.number+" -> "+hk.name+". Other phones tap Refresh now.");
};
window.poshOpenFix=function(){
  if(!user)return;
  tab="issues";try{draw();}catch(e){}
  var room=prompt("Room number","");var fault=prompt("What is the fault?");if(!fault)return;
  if(!db.issues)db.issues=[];
  db.issues.push({id:"i"+Date.now(),room:String(room||"").trim(),site:user.site||"",fault:String(fault).trim(),by:user.name,openedAt:Date.now(),status:"received",deadlineAt:Date.now()+6*60*60*1000,penalty:0});
  try{save();}catch(e){}try{draw();}catch(e){}alert("Fault logged");
};
window.poshClockIn=function(){
  if(role()!=="frontdesk"){alert("Front Desk only");return;}
  if(!db.clocks)db.clocks=[];
  db.clocks.push({id:"ck"+Date.now(),day:(typeof today==="function"?today():""),site:user.site,by:user.name,byId:user.id,inAt:new Date().toLocaleTimeString(),outAt:""});
  try{save();}catch(e){}alert("Clocked in "+new Date().toLocaleTimeString());
};
window.poshCertify=function(){
  if(role()!=="manager"&&role()!=="superadmin"){alert("Duty manager only");return;}
  var r=openR();if(!r){alert("Open the submitted room from Rooms first");return;}
  if(r.status!=="submitted"&&r.status!=="pending"){alert("Status now: "+(r.status||""));return;}
  r.status="certified";r.locked=true;r.certifiedBy=user.name;r.certifiedAt=new Date().toLocaleString();
  try{save();}catch(e){}try{draw();}catch(e){}alert("Rm "+r.number+" certified. Other phones tap Refresh now.");
};
window.poshReturnSvc=function(){
  if(role()!=="manager"&&role()!=="superadmin")return;
  var r=openR();if(!r){alert("Open the room first");return;}
  var note=prompt("What should the housekeeper do?","Spring clean");if(note===null)return;
  r.status="pending";r.job="inservice";r.hkNote=String(note).trim();r.videoReady=false;r.locked=false;
  try{save();}catch(e){}try{draw();}catch(e){}alert("Returned to service");
};
window.poshSetOOO=function(){
  if(role()!=="manager"&&role()!=="superadmin"&&role()!=="maint")return;
  var r=openR();if(!r){alert("Open the room first");return;}r.status="ooo";r.locked=true;
  try{save();}catch(e){}try{draw();}catch(e){}alert("OOO");
};
function go(t){if(!user){alert("Sign in first");return;}if(role()==="housekeeper"&&(t==="desk"||t==="meals"))t="rooms";tab=t;roomId=null;try{draw();}catch(e){}}
function bar(){
  var el=document.getElementById("opsBar");
  if(!el){el=document.createElement("div");el.id="opsBar";(document.querySelector(".wrap")||document.body).insertBefore(el,(document.querySelector(".wrap")||document.body).firstChild);}
  el.style.cssText="position:sticky;top:0;z-index:120;background:#101512;color:#f3e6c5;padding:12px 10px 14px;font-weight:800;font-size:15px;border-bottom:4px solid #c4a574";
  if(!user){el.innerHTML="<div>POSH MENU — sign in</div>";return;}
  var r=openR();
  var html="<div style='margin-bottom:8px'>POSH MENU · "+user.name+(r?(" · Rm "+r.number+" · "+r.status):"")+"</div>";
  html+="<button type=button class=btn id=obRooms>Rooms</button> ";
  if(role()!=="housekeeper")html+="<button type=button class=btn id=obDesk>Desk</button> ";
  html+="<button type=button class=btn id=obStaff>Staff</button> ";
  if(role()!=="housekeeper")html+="<button type=button class=btn id=obMeals>Meals</button> ";
  html+="<button type=button class=btn id=obMe>Me</button>";
  if(canFix())html+=" <button type=button class=btn id=obFix>Fix</button>";
  if(canAssign())html+=" <button type=button class=btn id=obAssign>Assign room</button>";
  if(role()==="frontdesk")html+=" <button type=button class=btn id=obClock>Clock in</button>";
  if(role()==="manager"||role()==="superadmin")html+=" <button type=button class=btn id=obCert>Certify</button> <button type=button class=btn id=obSvc>Return to service</button> <button type=button class=btn id=obOOO>Set OOO</button>";
  if(role()==="maint")html+=" <button type=button class=btn id=obOOO>Set OOO</button>";
  html+=" <button type=button class=btn id=obPull>Refresh now</button>";
  el.innerHTML=html;
  var st=document.getElementById("opsBarCss");if(!st){st=document.createElement("style");st.id="opsBarCss";document.head.appendChild(st);}
  st.textContent="#opsBar .btn{background:#c4a574;color:#101512;border:0;border-radius:999px;padding:10px 14px;margin:0 6px 8px 0;font-weight:800;min-height:44px}";
}
if(!window.__opsClicks4){
  window.__opsClicks4=true;
  document.addEventListener("click",function(ev){
    var id=ev.target&&ev.target.id;
    if(id==="obRooms")go("rooms");
    else if(id==="obDesk")go("desk");
    else if(id==="obStaff")go("staff");
    else if(id==="obMeals")go("meals");
    else if(id==="obMe")go("me");
    else if(id==="obAssign")window.poshAssignRoom();
    else if(id==="obFix")window.poshOpenFix();
    else if(id==="obClock")window.poshClockIn();
    else if(id==="obCert")window.poshCertify();
    else if(id==="obSvc")window.poshReturnSvc();
    else if(id==="obOOO")window.poshSetOOO();
    else if(id==="obPull"){if(typeof refreshHotel==="function")refreshHotel(function(ok){alert(ok?"Refreshed":"Could not refresh");});else try{draw();}catch(e){}}
  },true);
}
var _d=draw;draw=function(){var out=_d.apply(this,arguments);try{bar();}catch(e){}return out;};try{draw();}catch(e){}
}
boot();
})();
