(function(){
function boot(){
if(typeof db==="undefined"||typeof draw!=="function"){setTimeout(boot,80);return;}
if(window.__opsBar3)return;window.__opsBar3=true;
function role(){return (user&&user.role)||"";}
function canAssign(){return role()==="frontdesk"||role()==="superadmin"||role()==="manager";}
function canFix(){return ["housekeeper","frontdesk","manager","maint","ceo","superadmin"].indexOf(role())>=0;}
function openR(){
  if(roomId)return (db.rooms||[]).filter(function(x){return x.id===roomId;})[0]||null;
  return null;
}
window.poshClockIn=function(){
  if(!user||role()!=="frontdesk"){alert("Front Desk only");return;}
  if(!db.clocks)db.clocks=[];
  db.clocks.push({id:"ck"+Date.now(),day:(typeof today==="function"?today():""),site:user.site,by:user.name,byId:user.id,inAt:new Date().toLocaleTimeString(),outAt:""});
  try{save();}catch(e){}
  alert("Clocked in "+new Date().toLocaleTimeString());
};
window.poshCertify=function(){
  if(role()!=="manager"&&role()!=="superadmin"){alert("Duty manager only");return;}
  var r=openR();
  if(!r){alert("Open the submitted room first from Rooms.");return;}
  if(r.status!=="submitted"&&r.status!=="pending"){alert("Housekeeper must submit first. Status now: "+(r.status||""));return;}
  r.status="certified";r.locked=true;r.certifiedAt=new Date().toLocaleString();r.certifiedBy=user.name;
  try{save();}catch(e){}
  try{draw();}catch(e){}
  alert("Rm "+r.number+" certified. Front Desk can sell after Refresh.");
};
window.poshReturnSvc=function(){
  if(role()!=="manager"&&role()!=="superadmin")return;
  var r=openR();
  if(!r){alert("Open the room first");return;}
  var note=prompt("What should the housekeeper do?","Spring clean");
  if(note===null)return;
  r.status="pending";r.job="inservice";r.hkNote=String(note).trim();r.videoReady=false;r.locked=false;r.checklistDone=false;
  try{save();}catch(e){}
  try{draw();}catch(e){}
  alert("Returned to service. Housekeeper must video and submit again.");
};
window.poshSetOOO=function(){
  if(role()!=="manager"&&role()!=="superadmin"&&role()!=="maint")return;
  var r=openR();
  if(!r){alert("Open the room first");return;}
  r.status="ooo";r.locked=true;
  try{save();}catch(e){}
  try{draw();}catch(e){}
  alert("Rm "+r.number+" is OOO.");
};
function go(tabName){
  if(!user){alert("Sign in first");return;}
  if(role()==="housekeeper"&&(tabName==="desk"||tabName==="meals"))tabName="rooms";
  tab=tabName;roomId=null;try{draw();}catch(e){}
}
function bar(){
  var el=document.getElementById("opsBar");
  if(!el){
    el=document.createElement("div");
    el.id="opsBar";
    var wrap=document.querySelector(".wrap")||document.body;
    wrap.insertBefore(el,wrap.firstChild);
  }
  el.style.cssText="position:sticky;top:0;z-index:120;background:#101512;color:#f3e6c5;padding:12px 10px 14px;font-weight:800;font-size:15px;border-bottom:4px solid #c4a574";
  if(!user){el.innerHTML="<div>POSH MENU — sign in</div>";return;}
  var r=openR();
  var html="<div style='margin-bottom:8px'>POSH MENU · "+user.name+(r?(" · Rm "+r.number+" "+r.status):"")+"</div>";
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
  var st=document.getElementById("opsBarCss");
  if(!st){st=document.createElement("style");st.id="opsBarCss";document.head.appendChild(st);}
  st.textContent="#opsBar .btn{background:#c4a574;color:#101512;border:0;border-radius:999px;padding:10px 14px;margin:0 6px 8px 0;font-weight:800;min-height:44px}";
}
if(!window.__opsClicks3){
  window.__opsClicks3=true;
  document.addEventListener("click",function(ev){
    var id=ev.target&&ev.target.id;
    if(id==="obRooms")go("rooms");
    else if(id==="obDesk")go("desk");
    else if(id==="obStaff")go("staff");
    else if(id==="obMeals")go("meals");
    else if(id==="obMe")go("me");
    else if(id==="obAssign"&&window.poshAssignRoom)window.poshAssignRoom();
    else if(id==="obFix"&&window.poshOpenFix)window.poshOpenFix();
    else if(id==="obClock")window.poshClockIn();
    else if(id==="obCert")window.poshCertify();
    else if(id==="obSvc")window.poshReturnSvc();
    else if(id==="obOOO")window.poshSetOOO();
    else if(id==="obPull"){
      if(typeof refreshHotel==="function")refreshHotel(function(ok){alert(ok?"Refreshed":"Could not refresh");});
      else try{draw();}catch(e){}
    }
  },true);
}
var _d=draw;
draw=function(){
  var out=_d.apply(this,arguments);
  try{bar();}catch(e){}
  return out;
};
try{draw();}catch(e){}
}
boot();
})();
