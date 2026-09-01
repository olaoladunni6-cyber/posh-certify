(function(){
function boot(){
if(typeof db==="undefined"||typeof draw!=="function"){setTimeout(boot,80);return;}
if(window.__staffChat)return;window.__staffChat=true;
if(!db.staffMsgs)db.staffMsgs=[];
function role(){return (user&&user.role)||"";}
function site(){return (user&&user.site)||"";}
function seesAll(){return role()==="ceo"||role()==="gm"||role()==="superadmin";}
function labelRole(r){
  return ({housekeeper:"Housekeeper",frontdesk:"Front Desk",manager:"Duty manager",ceo:"CEO",gm:"CEO",accountant:"Accountant",superadmin:"Super Admin",kitchen:"Kitchen",laundry:"Laundry",storekeeper:"Store",maintenance:"Maintenance"})[r]||r||"Staff";
}
function canSee(m){
  if(!user)return false;
  if(seesAll())return true;
  if((m.channel||"site")==="hotel")return true;
  return !m.site||m.site===site();
}
function list(){
  return (db.staffMsgs||[]).filter(canSee).sort(function(a,b){return (a.ts||0)-(b.ts||0);});
}
window.poshSendChat=function(text,channel){
  if(!user){alert("Sign in first");return;}
  text=String(text||"").trim();
  if(!text){alert("Type a message first");return;}
  channel=channel==="hotel"?"hotel":"site";
  if(!db.staffMsgs)db.staffMsgs=[];
  db.staffMsgs.push({
    id:"ch"+Date.now()+"_"+Math.random().toString(36).slice(2,6),
    channel:channel,
    site:site(),
    by:user.name,
    byId:user.id,
    role:role(),
    text:text,
    day:typeof today==="function"?today():"",
    at:new Date().toLocaleString(),
    ts:Date.now()
  });
  try{save();}catch(e){}
  try{draw();}catch(e){}
  alert("Message recorded. Publish so other phones Refresh and see it.");
};
window.poshChatPrompt=function(){
  if(!user){alert("Sign in first");return;}
  var where=seesAll()?"hotel":(prompt("Send to:\n1 = this location ("+site()+")\n2 = whole hotel","1")==="2"?"hotel":"site");
  var text=prompt("Staff message");
  if(text===null)return;
  window.poshSendChat(text,where);
};
function box(){
  if(!user)return "";
  var rows=list().slice(-40).reverse().map(function(m){
    var where=(m.channel==="hotel"?"Hotel":(m.site||"Location"));
    return "<p><b>"+m.by+"</b> · "+labelRole(m.role)+" · "+where+"<br>"+m.text+"<br><small>"+m.at+"</small></p>";
  }).join("");
  return "<div class=card id=staffChat><h3>Staff dialogue</h3>"+
    "<p>Every signed-in role can write. Messages stay on the hotel record.</p>"+
    "<p>Send to</p><select id=chatTo><option value='site'>This location · "+(site()||"")+"</option><option value='hotel'>Whole hotel</option></select>"+
    "<textarea id=chatText placeholder='Write to the team'></textarea>"+
    "<p><button type=button class=btn id=chatSend>Send message</button></p>"+
    "<div>"+(rows||"<p>No messages yet.</p>")+"</div></div>";
}
if(!window.__chatClicks){
  window.__chatClicks=true;
  document.addEventListener("click",function(ev){
    var t=ev.target;if(!t)return;
    if(t.id==="chatSend"){
      ev.preventDefault();
      var text=((document.getElementById("chatText")||{}).value||"").trim();
      var ch=((document.getElementById("chatTo")||{}).value||"site");
      window.poshSendChat(text,ch);
    }
  },true);
}
function inject(){
  if(!user)return;
  if(document.getElementById("staffChat"))return;
  var wrap=document.querySelector(".wrap")||document.getElementById("app");
  if(!wrap)return;
  wrap.insertAdjacentHTML("afterbegin",box());
}
var _draw=draw;
draw=function(){
  _draw.apply(this,arguments);
  try{inject();}catch(e){}
};
try{draw();}catch(e){}
}
boot();
})();
