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
function lastTs(m){
  var t=m.ts||0;
  (m.replies||[]).forEach(function(r){if((r.ts||0)>t)t=r.ts;});
  return t;
}
function myRead(m){return (m.reads||[]).filter(function(r){return r.byId===user.id;})[0];}
function isUnread(m){
  if(!user)return false;
  if(m.byId===user.id&&!(m.replies||[]).length)return false;
  var rec=myRead(m);
  return !rec||rec.ts<lastTs(m);
}
function roots(){
  return (db.staffMsgs||[]).filter(function(m){return !m.parentId&&canSeeRoot(m);}).sort(function(a,b){return (b.ts||0)-(a.ts||0);});
}
function findRoot(id){return (db.staffMsgs||[]).filter(function(m){return m.id===id;})[0];}
function stamp(){return {by:user.name,byId:user.id,role:role(),at:new Date().toLocaleString(),ts:Date.now(),day:typeof today==="function"?today():""};}
function receiptLine(m){
  var list=(m.reads||[]).slice().sort(function(a,b){return (b.ts||0)-(a.ts||0);});
  if(!list.length)return "<small>Sent · no read receipt yet</small>";
  return "<small>Read by "+list.map(function(r){return r.by+" · "+r.at;}).join(" · ")+"</small>";
}
function mediaHtml(m){
  if(!m)return "";
  if(m.mediaKind==="image"&&m.mediaData)return "<p><img src='"+m.mediaData+"' alt='photo' style='max-width:100%;border-radius:8px'></p>";
  if(m.mediaKind==="video"&&m.mediaData)return "<p><video src='"+m.mediaData+"' controls playsinline style='max-width:100%;border-radius:8px'></video></p>";
  if(m.mediaKind==="video"||m.mediaReady)return "<p><small>Video on file: "+(m.mediaName||"clip")+". Open from the sender phone or Share to WhatsApp.</small></p>";
  if(m.mediaKind==="file")return "<p><small>File: "+(m.mediaName||"attachment")+"</small></p>";
  return "";
}
function compressImage(file,done){
  var url=URL.createObjectURL(file);
  var img=new Image();
  img.onload=function(){
    var max=720,w=img.width,h=img.height;
    if(w>max||h>max){if(w>=h){h=Math.round(h*max/w);w=max;}else{w=Math.round(w*max/h);h=max;}}
    var c=document.createElement("canvas");c.width=w;c.height=h;
    c.getContext("2d").drawImage(img,0,0,w,h);
    var data=c.toDataURL("image/jpeg",0.55);
    URL.revokeObjectURL(url);
    done({kind:"image",name:file.name||"photo.jpg",data:data,ready:true});
  };
  img.onerror=function(){URL.revokeObjectURL(url);done(null);};
  img.src=url;
}
function readFile(file,done){
  if(!file){done(null);return;}
  var type=file.type||"";
  if(type.indexOf("image/")===0){compressImage(file,done);return;}
  if(type.indexOf("video/")===0){
    if(file.size>700000){
      done({kind:"video",name:file.name||"clip.mp4",data:"",ready:true,shareFile:file});
      return;
    }
    var r=new FileReader();
    r.onload=function(){done({kind:"video",name:file.name||"clip.mp4",data:r.result,ready:true,shareFile:file});};
    r.onerror=function(){done({kind:"video",name:file.name||"clip.mp4",data:"",ready:true,shareFile:file});};
    r.readAsDataURL(file);
    return;
  }
  if(file.size>200000){done({kind:"file",name:file.name||"file",data:"",ready:true,shareFile:file});return;}
  var fr=new FileReader();
  fr.onload=function(){done({kind:"file",name:file.name||"file",data:fr.result,ready:true});};
  fr.onerror=function(){done(null);};
  fr.readAsDataURL(file);
}
function pickedFile(){var el=document.getElementById("chatFile");return el&&el.files&&el.files[0]?el.files[0]:null;}
function clearFile(){var el=document.getElementById("chatFile");if(el)el.value="";}
function attachTo(obj,media){
  if(!media)return obj;
  obj.mediaKind=media.kind;obj.mediaName=media.name;obj.mediaData=media.data||"";obj.mediaReady=!!media.ready;
  return obj;
}
function offerShare(file,caption){
  if(!file||!navigator.share)return;
  try{navigator.share({title:"Posh Manager",text:caption||"Staff attachment",files:[file]});}catch(e){}
}
window.poshSendChat=function(text,channel,toId,media){
  if(!user){alert("Sign in first");return;}
  text=String(text||"").trim();
  if(!text&&!media){alert("Type a message or attach a photo / video first");return;}
  if(!text)text=media&&media.kind==="video"?"Video attached":(media&&media.kind==="image"?"Photo attached":"Attachment");
  var to=null;
  if(channel==="dm"||(toId&&toId!=="site"&&toId!=="hotel")){
    channel="dm";
    to=(db.users||[]).filter(function(u){return u.id===toId;})[0];
    if(!to){alert("Choose the person first");return;}
  }else channel=channel==="hotel"?"hotel":"site";
  var s=stamp();
  var msg={id:"ch"+s.ts+"_"+Math.random().toString(36).slice(2,6),channel:channel,site:site(),by:s.by,byId:s.byId,role:s.role,toId:to?to.id:"",toName:to?to.name:"",toRole:to?to.role:"",text:text,day:s.day,at:s.at,ts:s.ts,replies:[],reads:[{byId:s.byId,by:s.by,at:s.at,ts:s.ts}]};
  attachTo(msg,media);
  db.staffMsgs.push(msg);
  try{save();}catch(e){}
  try{draw();}catch(e){}
  if(media&&media.shareFile)offerShare(media.shareFile,text);
  alert(to?("Sent to "+to.name+". Publish so they Refresh."):"Sent. Publish so other phones Refresh.");
};
window.poshReplyChat=function(id,text,mode,media){
  var root=findRoot(id);if(!root){alert("Message not found");return;}
  text=String(text||"").trim();
  if(!text&&!media){alert("Type a reply or attach a file");return;}
  if(!text)text=media&&media.kind==="image"?"Photo attached":(media&&media.kind==="video"?"Video attached":"Attachment");
  mode=mode==="person"?"person":"all";
  if(!root.replies)root.replies=[];
  var s=stamp();
  var toId=root.byId===user.id?root.toId:root.byId;
  var toUser=(db.users||[]).filter(function(u){return u.id===toId;})[0];
  var rp={id:"rp"+s.ts,mode:mode,by:s.by,byId:s.byId,role:s.role,toId:mode==="person"?(toUser&&toUser.id)||toId:"",toName:mode==="person"?(toUser&&toUser.name)||root.by:"",text:text,at:s.at,ts:s.ts};
  attachTo(rp,media);
  root.replies.push(rp);
  root.lastAt=s.at;root.lastBy=s.by;
  if(!root.reads)root.reads=[];
  root.reads=root.reads.filter(function(r){return r.byId===user.id;});
  root.reads.push({byId:user.id,by:user.name,at:s.at,ts:s.ts});
  try{save();}catch(e){}
  try{draw();}catch(e){}
  if(media&&media.shareFile)offerShare(media.shareFile,text);
};
function withPick(fn){
  readFile(pickedFile(),function(media){clearFile();fn(media);});
}
window.poshChatPrompt=function(){
  if(!user){alert("Sign in first");return;}
  var open=roots();
  if(open.length){
    var want=prompt("NEW or REPLY","REPLY");if(want===null)return;
    if(String(want).trim().toUpperCase()!=="NEW"){
      var mode=prompt("1 = person  2 = all on loop","1");if(mode===null)return;
      var text=prompt("Reply (or leave blank if attaching)")||"";
      withPick(function(media){window.poshReplyChat(open[0].id,text,String(mode).trim()==="2"?"all":"person",media);});
      return;
    }
  }
  var opts=people();
  var pick=prompt(["1 = location","2 = hotel"].concat(opts.map(function(u,i){return (i+3)+" = "+u.name;})).join("\n"),"1");
  if(pick===null)return;
  var n=parseInt(pick,10),channel="site",toId="";
  if(n===2)channel="hotel";else if(n>=3&&opts[n-3]){channel="dm";toId=opts[n-3].id;}
  var text=prompt("First message (or leave blank if attaching)")||"";
  withPick(function(media){window.poshSendChat(text,channel,toId,media);});
};
function box(){
  if(!user)return "";
  var unread=roots().filter(isUnread).length;
  var opts=people().map(function(u){return "<option value='"+u.id+"'>"+u.name+" · "+labelRole(u.role)+"</option>";}).join("");
  var cards=roots().slice(0,20).map(function(m){
    var where=m.channel==="dm"?("To "+(m.toName||"staff")):m.channel==="hotel"?"Hotel":(m.site||"Location");
    var thread=(m.replies||[]).filter(function(r){return canSeeReply(m,r);}).map(function(r){
      return "<p style='margin-left:12px'><b>"+r.by+"</b> · "+(r.mode==="person"?"private":"all")+"<br>"+r.text+"</p>"+mediaHtml(r)+"<p style='margin-left:12px'><small>"+r.at+"</small></p>";
    }).join("");
    return "<div class=card><p><b>"+m.by+"</b> · "+where+(isUnread(m)?" <b>UNREAD</b>":"")+"<br>"+m.text+"</p>"+mediaHtml(m)+"<p><small>"+m.at+"</small></p>"+thread+"<p>"+receiptLine(m)+"</p><p><button type=button class=chatPerson data-id='"+m.id+"'>Reply to person</button> <button type=button class=chatAll data-id='"+m.id+"'>Reply to all</button></p></div>";
  }).join("");
  return "<div class=card id=staffChat><h3>Staff dialogue</h3><p>"+(unread?("<b>"+unread+" unread</b>"):"No unread loops")+". Any role can attach a photo, video or file.</p>"+
    "<p>Start with</p><select id=chatTo><option value='site'>This location</option><option value='hotel'>Whole hotel</option>"+opts+"</select>"+
    "<textarea id=chatText placeholder='Write a message'></textarea>"+
    "<p><input id=chatFile type=file accept='image/*,video/*,.pdf,.doc,.docx' capture='environment'></p>"+
    "<p><button type=button class=btn id=chatSend>Start loop</button></p>"+(cards||"<p>No loops yet.</p>")+"</div>";
}
if(!window.__chatClicks){
  window.__chatClicks=true;
  document.addEventListener("click",function(ev){
    var t=ev.target;if(!t)return;
    if(t.id==="chatSend"){
      ev.preventDefault();
      var text=((document.getElementById("chatText")||{}).value||"").trim();
      var ch=((document.getElementById("chatTo")||{}).value||"site");
      withPick(function(media){window.poshSendChat(text,ch==="site"||ch==="hotel"?ch:"dm",ch,media);});
      return;
    }
    var id=t.getAttribute&&t.getAttribute("data-id");if(!id)return;
    var cls=String(t.className||"");
    if(cls.indexOf("chatPerson")>=0||cls.indexOf("chatAll")>=0){
      ev.preventDefault();
      var text=prompt(cls.indexOf("chatAll")>=0?"Reply to all (or leave blank if attaching)":"Reply to person (or leave blank if attaching)")||"";
      withPick(function(media){window.poshReplyChat(id,text,cls.indexOf("chatAll")>=0?"all":"person",media);});
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
