(function(){
function boot(){
if(typeof db==="undefined"){setTimeout(boot,80);return;}
if(window.__lockGate)return;window.__lockGate=true;

function isHk(){return user&&user.role==="housekeeper";}
function isFd(){return user&&(user.role==="frontdesk"||typeof isFD==="function"&&isFD());}
function roomByNo(n){return (db.rooms||[]).filter(function(x){return String(x.number)===String(n);})[0];}
function openR(){if(!roomId)return null;return (db.rooms||[]).filter(function(x){return x.id===roomId;})[0]||null;}
function locked(r){return !!(r&&(r.status==="certified"||r.status==="ooo"||r.locked||r.hkLocked));}
function sellable(r){return !!(r&&r.status==="certified"&&!r.ooo);}
window.poshSellable=sellable;
window.poshRoomLocked=locked;

window.poshHkReady=function(r){
  if(!r||locked(r))return false;
  return !!(r.laundryChecked||r.checklistDone)&&!!r.videoReady;
};

function hideExtraMedia(){
  try{
    var doc=document;
    var css=doc.getElementById("lockGateCss");
    if(!css){css=doc.createElement("style");css.id="lockGateCss";doc.head.appendChild(css);}
    css.textContent=
      "input[type=file][accept*='image'],label.file,button#send,button#sendNow,.photoBtn,.addPhoto{display:none!important}"+ 
      (isHk()?" #roomList .room.certified,#roomList .room.ooo{opacity:.45;pointer-events:none}":"");
    [].slice.call(doc.querySelectorAll("input[type=file]")).forEach(function(inp){
      var acc=String(inp.accept||"");
      if(inp.id==="barVid")return;
      if(acc.indexOf("image")>=0||acc===""||acc.indexOf("photo")>=0){
        if(acc.indexOf("video")<0){inp.disabled=true;inp.style.display="none";}
      }
      if(acc.indexOf("video")>=0){inp.accept="video/*,video/mp4";inp.multiple=false;}
    });
  }catch(e){}
}

function blockHkOpen(){
  if(!isHk()||window.__lockSkip)return;
  var r=openR();
  if(r&&locked(r)){
    window.__lockSkip=true;
    roomId=null;
    try{if(typeof tab!=="undefined")tab="rooms";}catch(e){}
    alert("Room "+r.number+" is certified and locked. Housekeeper cannot open it.");
    try{draw();}catch(e){}
    window.__lockSkip=false;
  }
}

if(typeof viewBoard==="function"){
  var _vb=viewBoard;
  viewBoard=function(){
    var html=_vb.apply(this,arguments);
    if(!isHk())return html;
    html=String(html||"");
    (db.rooms||[]).forEach(function(r){
      if(!locked(r))return;
      var re=new RegExp("openRoom\\(['\"]"+r.id+"['\"]\\)","g");
      html=html.replace(re,"void(0)");
    });
    return html;
  };
}

if(typeof viewRoom==="function"){
  var _vr=viewRoom;
  viewRoom=function(){
    var r=openR();
    if(isHk()&&r&&locked(r)){
      return "<p id=back>&larr; Back</p><div class=warn>Room "+r.number+" is certified and locked. Duty manager must return it to service before you can work it again.</div>";
    }
    var html=_vr.apply(this,arguments);
    if(isHk()){
      html=String(html||"").replace(/<input[^>]*type=['\"]file['\"][^>]*>/gi,"");
    }
    return html;
  };
}

function wrapSubmit(name){
  if(typeof window[name]!=="function")return;
  var old=window[name];
  window[name]=function(){
    var r=openR()||arguments[0];
    if(r&&typeof r==="object"){
      if(locked(r)){alert("Certified rooms stay closed.");return;}
      if(!(r.laundryChecked||r.checklistDone)){alert("Mark the checklist first.");return;}
      if(!r.videoReady){alert("Attach one walkthrough video first. Photos are not accepted.");return;}
    }
    return old.apply(this,arguments);
  };
}
["sendRoom","submitRoom","poshSendRoom"].forEach(wrapSubmit);

mediaCount=function(r){return (r&&r.videoReady)?1:0;};

function restrictFdSelect(){
  var sel=document.getElementById("cinRoom");
  if(!sel||!isFd())return;
  var keep=(db.rooms||[]).filter(function(r){
    if(user&&user.site&&r.site&&r.site!==user.site&&user.role!=="ceo"&&user.role!=="superadmin")return false;
    return r.status==="certified";
  });
  var cur=sel.value;
  sel.innerHTML=keep.map(function(r){return "<option value='"+r.number+"'>"+r.number+" certified</option>";}).join("")||"<option value=''>No certified room</option>";
  if(keep.some(function(r){return String(r.number)===String(cur);}))sel.value=cur;
}

window.poshMustBeCertified=function(num){
  var r=roomByNo(num);
  if(!r){alert("Room "+num+" not found.");return false;}
  if(r.status==="ooo"){alert("Room "+num+" is out of order.");return false;}
  if(r.status!=="certified"){alert("Room "+num+" is not certified. Front desk cannot assign or check a guest in.");return false;}
  return true;
};

if(typeof bind==="function"){
  var _b=bind;
  bind=function(){
    try{_b.apply(this,arguments);}catch(e){}
    hideExtraMedia();
    restrictFdSelect();
    blockHkOpen();
  };
}

if(typeof draw==="function"){
  var _d=draw;
  draw=function(){
    var out=_d.apply(this,arguments);
    hideExtraMedia();
    restrictFdSelect();
    blockHkOpen();
    return out;
  };
}

try{draw();}catch(e){}
}
boot();
})();
