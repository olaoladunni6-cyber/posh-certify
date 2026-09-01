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
function people(){
  return (db.users||[]).filter(function(u){
    if(!u||!u.id||!user)return false;
    if(u.id===user.id)return false;
    if(seesAll())return true;
    if(u.role==="ceo"||u.role==="gm"||u.role==="superadmin")return true;
    return !u.site||!site()||u.site===site();
  });
}
function canSee(m){
  if(!user)return false;
  if(seesAll())return true;
  if(m.channel==="dm")return m.byId===user.id||m.toId===user.id;
  if((m.channel||"site")==="hotel")return true;
  return !m.site||m.site===site();
}
function list(){
  return (db.staffMsgs||[]).filter(canSee).sort(function(a,b){return (a.ts||0)-(b.ts||0);});
}
window.poshSendChat=function(text,channel,toId){
  if(!user){alert("Sign in first");return;}
  text=String(text||"").trim();
  if(!text){alert("Type a message first");return;}
  var to=null;
  if(channel==="dm"||(toId&&toId!=="site"&&toId!=="hotel")){
    channel="dm";
    to=(db.users||[]).filter(function(u){return u.id===toId;})[0];
    if(!to){alert("Choose the person first");return;}
  }else{
    channel=channel==="hotel"?"hotel":"site";
  }
  if(!db.staffMsgs)db.staffMsgs=[];
  db.staffMsgs.push({
    id:"ch"+Date.now()+"_"+Math.random().toString(36).slice(2,6),
    channel:channel,
    site:site(),
    by:user.name,
    byId:user.id,
    role:role(),
    toId:to?to.id:"",
    toName:to?to.name:"",
    toRole:to?to.role:"",
    text:text,
    day:typeof today==="function"?today():"",
    at:new Date().toLocaleString(),
    ts:Date.now()
  });
  try{save();}catch(e){}
  try{draw();}catch(e){}
  alert(to?("Sent to "+to.name+". Publish so their phone can Refresh."):"Message recorded. Publish so other phones Refresh.");
};
window.poshChatPrompt=function(){
  if(!user){alert("Sign in first");return;}
  var opts=people();
  var lines=["1 = this location ("+site()+")","2 = whole hotel"].concat(opts.map(function(u,i){return (i+3)+" = "+u.name+" · "+labelRole(u.role)+(u.site?(" · "+u.site):"");}));
  var pick=prompt("Send to:\n"+lines.join("\n"),"1");
  if(pick===null)return;
  var n=parseInt(pick,10);
  var channel="site",toId="";
  if(n===2)channel="hotel";
  else if(n>=3&&opts[n-3]){channel="dm";toId=opts[n-3].id;}
  var text=prompt(channel==="dm"?("Message to "+opts[n-3].name):"Staff message");
  if(text===null)return;
  window.poshSendChat(text,channel,toId);
};
function box(){
  if(!user)return "";
  var opts=people().map(function(u){return "<option value='"+u.id+"'>"+u.name+" · "+labelRole(u.role)+(u.site?(" · "+u.site):"")+"</option>";}).join("");
  var rows=list().slice(-50).reverse().map(function(m){
    var where=m.channel==="dm"?("To "+(m.toName||"staff")+(m.byId===user.id?"":" · private")):m.channel==="hotel"?"Hotel":(m.site||"Location");
    return "<p><b>"+m.by+"</b> · "+labelRole(m.role)+" · "+where+"<br>"+m.text+"<br><small>"+m.at+"</small></p>";
  }).join("");
  return "<div class=card id=staffChat><h3>Staff dialogue</h3>"+
    "<p>Send to this location, the whole hotel, or one person. Direct messages stay between you two (CEO / Super Admin can audit).</p>"+
    "<p>Send to</p><select id=chatTo><option value='site'>This location · "+(site()||"")+"</option><option value='hotel'>Whole hotel</option>"+opts+"</select>"+
    "<textarea id=chatText placeholder='Write the message'></textarea>"+
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
      window.poshSendChat(text,ch==="site"||ch==="hotel"?ch:"dm",ch);
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
