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
function canSeeRoot(m){
  if(!user)return false;
  if(seesAll())return true;
  if(m.channel==="dm")return m.byId===user.id||m.toId===user.id;
  if((m.channel||"site")==="hotel")return true;
  return !m.site||m.site===site();
}
function canSeeReply(root,r){
  if(!user)return false;
  if(seesAll())return true;
  if((r.mode||"all")==="person")return r.byId===user.id||root.byId===user.id||r.toId===user.id;
  return canSeeRoot(root);
}
function roots(){
  return (db.staffMsgs||[]).filter(function(m){return !m.parentId&&canSeeRoot(m);}).sort(function(a,b){return (b.ts||0)-(a.ts||0);});
}
function findRoot(id){return (db.staffMsgs||[]).filter(function(m){return m.id===id;})[0];}
function stamp(){
  return {by:user.name,byId:user.id,role:role(),at:new Date().toLocaleString(),ts:Date.now(),day:typeof today==="function"?today():""};
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
  }else channel=channel==="hotel"?"hotel":"site";
  if(!db.staffMsgs)db.staffMsgs=[];
  var s=stamp();
  db.staffMsgs.push({
    id:"ch"+s.ts+"_"+Math.random().toString(36).slice(2,6),
    channel:channel,site:site(),by:s.by,byId:s.byId,role:s.role,
    toId:to?to.id:"",toName:to?to.name:"",toRole:to?to.role:"",
    text:text,day:s.day,at:s.at,ts:s.ts,replies:[]
  });
  try{save();}catch(e){}
  try{draw();}catch(e){}
  alert(to?("Loop opened with "+to.name+". Publish so they Refresh."):"Loop opened. Publish so others Refresh.");
};
window.poshReplyChat=function(id,text,mode){
  if(!user){alert("Sign in first");return;}
  var root=findRoot(id);
  if(!root){alert("Message not found");return;}
  text=String(text||"").trim();
  if(!text){alert("Type the reply first");return;}
  mode=mode==="person"?"person":"all";
  if(!root.replies)root.replies=[];
  var s=stamp();
  var toId=root.byId===user.id?root.toId:root.byId;
  var toUser=(db.users||[]).filter(function(u){return u.id===toId;})[0];
  root.replies.push({
    id:"rp"+s.ts+"_"+Math.random().toString(36).slice(2,6),
    mode:mode,by:s.by,byId:s.byId,role:s.role,
    toId:mode==="person"?(toUser&&toUser.id)||toId:"",
    toName:mode==="person"?(toUser&&toUser.name)||root.by:"",
    text:text,at:s.at,ts:s.ts
  });
  root.lastAt=s.at;root.lastBy=s.by;
  try{save();}catch(e){}
  try{draw();}catch(e){}
  alert(mode==="person"?("Reply sent to "+(toUser&&toUser.name||root.by)+". Same loop. Publish."):"Reply sent to everyone on this loop. Publish.");
};
window.poshChatPrompt=function(){
  if(!user){alert("Sign in first");return;}
  var open=roots();
  if(open.length){
    var want=prompt("Type NEW to start a loop, or REPLY to continue the latest one","REPLY");
    if(want===null)return;
    if(String(want).trim().toUpperCase()!=="NEW"){
      var mode=prompt("Reply to:\n1 = the person who wrote it\n2 = everyone on this loop","1");
      if(mode===null)return;
      var text=prompt("Reply in this loop");
      if(text===null)return;
      window.poshReplyChat(open[0].id,text,String(mode).trim()==="2"?"all":"person");
      return;
    }
  }
  var opts=people();
  var lines=["1 = this location ("+site()+")","2 = whole hotel"].concat(opts.map(function(u,i){return (i+3)+" = "+u.name+" · "+labelRole(u.role);}));
  var pick=prompt("Start a loop with:\n"+lines.join("\n"),"1");
  if(pick===null)return;
  var n=parseInt(pick,10),channel="site",toId="";
  if(n===2)channel="hotel";
  else if(n>=3&&opts[n-3]){channel="dm";toId=opts[n-3].id;}
  var text=prompt("First message in the loop");
  if(text===null)return;
  window.poshSendChat(text,channel,toId);
};
function box(){
  if(!user)return "";
  var opts=people().map(function(u){return "<option value='"+u.id+"'>"+u.name+" · "+labelRole(u.role)+(u.site?(" · "+u.site):"")+"</option>";}).join("");
  var cards=roots().slice(0,20).map(function(m){
    var where=m.channel==="dm"?("To "+(m.toName||"staff")):m.channel==="hotel"?"Hotel":(m.site||"Location");
    var thread=(m.replies||[]).filter(function(r){return canSeeReply(m,r);}).map(function(r){
      var tag=r.mode==="person"?("private to "+(r.toName||"them")):"to all on loop";
      return "<p style='margin-left:12px'><b>"+r.by+"</b> · "+labelRole(r.role)+" · "+tag+"<br>"+r.text+"<br><small>"+r.at+"</small></p>";
    }).join("");
    return "<div class=card><p><b>"+m.by+"</b> · "+labelRole(m.role)+" · "+where+"<br>"+m.text+"<br><small>"+m.at+"</small></p>"+
      thread+
      "<p><button type=button class=chatPerson data-id='"+m.id+"'>Reply to person</button> <button type=button class=chatAll data-id='"+m.id+"'>Reply to all</button></p></div>";
  }).join("");
  return "<div class=card id=staffChat><h3>Staff dialogue</h3>"+
    "<p>Start a loop, then keep talking. Reply to person stays between you two. Reply to all stays on the same loop.</p>"+
    "<p>Start with</p><select id=chatTo><option value='site'>This location · "+(site()||"")+"</option><option value='hotel'>Whole hotel</option>"+opts+"</select>"+
    "<textarea id=chatText placeholder='First message, or use Reply on a loop below'></textarea>"+
    "<p><button type=button class=btn id=chatSend>Start loop</button></p>"+
    (cards||"<p>No loops yet.</p>")+"</div>";
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
      return;
    }
    var id=t.getAttribute&&t.getAttribute("data-id");
    if(!id)return;
    var cls=String(t.className||"");
    if(cls.indexOf("chatPerson")>=0||cls.indexOf("chatAll")>=0){
      ev.preventDefault();
      var mode=cls.indexOf("chatAll")>=0?"all":"person";
      var text=prompt(mode==="all"?"Reply to everyone on this loop":"Reply to the person on this loop");
      if(text===null)return;
      window.poshReplyChat(id,text,mode);
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
