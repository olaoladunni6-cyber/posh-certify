(function(){
function boot(){
if(typeof db==="undefined"||typeof isFD!=="function"){setTimeout(boot,80);return;}
if(window.__fdGuard)return;window.__fdGuard=true;
if(!db.deskNotes)db.deskNotes=[];
function roomsHere(){return (typeof siteRooms==="function"?siteRooms():db.rooms||[]).filter(function(r){return !r.site||siteMatch(r.site);});}
function certifiedRooms(){return roomsHere().filter(function(r){return r.status==="certified";});}
function dayNow(){return typeof today==="function"?today():"";}
function list(title,arr,empty){
  if(!arr.length)return "<div class=card><h3>"+title+"</h3><p>"+empty+"</p></div>";
  return "<div class=card><h3>"+title+"</h3>"+arr.map(function(r){
    var log=(r.statusLog||[]).filter(function(x){return !x.day||x.day===dayNow();}).map(function(x){return x.at+" · "+x.kind;}).join("<br>");
    return "<p><b>Rm "+r.number+"</b> · "+(r.status||"").toUpperCase()+(r.hkNote?(" · "+r.hkNote):"")+(log?("<br><small>"+log+"</small>"):"")+"</p>";
  }).join("")+"</div>";
}
function noteBox(){
  if(!(isFD()||(typeof isAcct==="function"&&isAcct())||(typeof mgr==="function"&&mgr())||(typeof isGM==="function"&&isGM())||(typeof isSuper==="function"&&isSuper())))return "";
  var all=roomsHere();
  var ooo=all.filter(function(r){return r.status==="ooo";});
  var back=all.filter(function(r){return r.status==="pending"||(r.hkNote&&r.status!=="certified"&&r.status!=="ooo");});
  var wait=all.filter(function(r){return r.status==="submitted";});
  var ok=certifiedRooms();
  var notes=(db.deskNotes||[]).filter(function(n){return siteMatch(n.site)&&(!n.day||n.day===dayNow());}).slice().reverse();
  return "<h1>Room status · all shifts · "+dayNow()+"</h1>"+
    "<div class=ok>Certified, returned-to-service and OOO stay on this board for the whole day so both Front Desk shifts see the same rooms.</div>"+
    list("CERTIFIED — ready to sell",ok,"No certified room yet")+
    list("RETURNED TO SERVICE — waiting recertify",back,"None waiting")+
    list("OUT OF ORDER — do not sell",ooo,"No OOO rooms")+
    list("SUBMITTED — duty manager to certify",wait,"None submitted")+
    (notes.length?("<div class=card><h3>Status changes today</h3>"+notes.map(function(n){return "<p><b>Rm "+n.room+"</b> · "+n.kind+" · "+n.at+(n.by?(" · "+n.by):"")+"</p>";}).join("")+"</div>"):"");
}
function restrictSelect(){
  var sel=document.getElementById("cinRoom");
  if(!sel||!isFD())return;
  var keep=certifiedRooms(),cur=sel.value;
  sel.innerHTML=keep.map(function(r){return "<option>"+r.number+"</option>";}).join("")||"<option value=''>No certified room</option>";
  if(keep.some(function(r){return String(r.number)===String(cur);}))sel.value=cur;
}
var _vd=viewDesk;
viewDesk=function(){return noteBox()+_vd.apply(this,arguments);};
var _b=bind;
bind=function(){
  _b();
  restrictSelect();
  var save=document.getElementById("saveCin");
  if(save){
    var prev=save.onclick;
    save.onclick=function(){
      var room=(document.getElementById("cinRoom")||{}).value;
      var hit=(db.rooms||[]).filter(function(r){return String(r.number)===String(room)&&siteMatch(r.site);})[0];
      if(!hit||hit.status!=="certified"){alert("That room is not certified.");return;}
      if(prev)prev();
    };
  }
};
window.poshDeskNote=function(room,kind){
  if(!db.deskNotes)db.deskNotes=[];
  var r=(db.rooms||[]).filter(function(x){return String(x.number)===String(room)&&(!user||!x.site||x.site===user.site);})[0];
  if(r){
    if(!r.statusLog)r.statusLog=[];
    r.statusLog.push({kind:kind,at:new Date().toLocaleString(),day:dayNow(),by:user&&user.name||""});
  }
  db.deskNotes.push({id:"n"+Date.now(),room:room,kind:kind,site:user&&user.site||"",by:user&&user.name||"",day:dayNow(),at:new Date().toLocaleString()});
};
try{draw();}catch(e){}
}
boot();
})();
