(function(){
function boot(){
if(typeof db==="undefined"||typeof draw!=="function"){setTimeout(boot,80);return;}
if(window.__opsBar)return;window.__opsBar=true;
function role(){return (user&&user.role)||"";}
function canAssign(){return role()==="frontdesk"||role()==="superadmin"||role()==="manager";}
function keepers(){
  return (db.users||[]).filter(function(u){
    if(u.role!=="housekeeper")return false;
    if(role()==="superadmin"||role()==="ceo")return true;
    return !user.site||user.site==="All locations"||u.site===user.site;
  });
}
function roomsHere(){
  return (db.rooms||[]).filter(function(r){
    if(role()==="superadmin"||role()==="ceo")return true;
    return !user.site||user.site==="All locations"||r.site===user.site;
  });
}
window.poshAssignRoom=function(){
  if(!user){alert("Sign in first");return;}
  if(!canAssign()){alert("Only Front Desk, duty manager or Super Admin can allocate rooms.");return;}
  var list=roomsHere();
  if(!list.length){alert("No rooms at this location.");return;}
  var nums=list.map(function(r){return r.number;}).join(", ");
  var num=prompt("Room number to allocate\n"+nums);
  if(!num)return;
  var r=list.filter(function(x){return String(x.number)===String(num).trim();})[0];
  if(!r){alert("Room not found at this location.");return;}
  if(r.status==="certified"){alert("Certified rooms stay closed. Return to service first if the housekeeper must clean again.");return;}
  var hks=keepers();
  if(!hks.length){alert("No housekeeper at this location.");return;}
  var names=hks.map(function(u,i){return (i+1)+". "+u.name;}).join("\n");
  var pick=prompt("Housekeeper number:\n"+names,"1");
  if(!pick)return;
  var hk=hks[parseInt(pick,10)-1]||hks.filter(function(u){return u.name===pick;})[0];
  if(!hk){alert("Pick a number from the list.");return;}
  var job=prompt("Job type: checkout / inhouse / postmaint / spring","checkout");
  if(!job)return;
  job=String(job).toLowerCase().replace(/\s+/g,"");
  if(job.indexOf("in")===0)job="inhouse";
  if(job.indexOf("post")===0)job="postmaint";
  if(job.indexOf("spring")===0)job="spring";
  if(job!=="checkout"&&job!=="inhouse"&&job!=="postmaint"&&job!=="spring")job="checkout";
  r.hk=hk.id;r.hkName=hk.name;r.job=job;r.status="pending";r.locked=false;r.videoReady=false;r.checklistDone=false;r.laundryChecked=false;
  try{save();}catch(e){}
  try{draw();}catch(e){}
  alert("Rm "+r.number+" assigned to "+hk.name+" ("+job+"). Publish / live save so the housekeeper can Refresh.");
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
    el.style.cssText="position:sticky;top:0;z-index:90;background:#c4a574;padding:8px;font-weight:700";
    var wrap=document.querySelector(".wrap")||document.body;
    wrap.insertBefore(el,wrap.firstChild);
  }
  if(!user){el.innerHTML="<span>Sign in</span>";return;}
  var html="<button type=button class=btn id=obRooms>Rooms</button> ";
  if(role()!=="housekeeper")html+="<button type=button class=btn id=obDesk>Desk</button> ";
  html+="<button type=button class=btn id=obStaff>Staff</button> ";
  if(role()!=="housekeeper")html+="<button type=button class=btn id=obMeals>Meals</button> ";
  html+="<button type=button class=btn id=obMe>Me</button>";
  if(canAssign())html+=" <button type=button class=btn id=obAssign>Assign room</button>";
  el.innerHTML=html;
}
if(!window.__opsClicks){
  window.__opsClicks=true;
  document.addEventListener("click",function(ev){
    var id=ev.target&&ev.target.id;
    if(id==="obRooms")go("rooms");
    else if(id==="obDesk")go("desk");
    else if(id==="obStaff")go("staff");
    else if(id==="obMeals")go("meals");
    else if(id==="obMe")go("me");
    else if(id==="obAssign")window.poshAssignRoom();
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
