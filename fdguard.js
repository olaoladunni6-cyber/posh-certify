(function(){
function boot(){
if(typeof db==="undefined"||typeof isFD!=="function"){setTimeout(boot,80);return;}
if(window.__fdGuard)return;window.__fdGuard=true;
if(!db.deskNotes)db.deskNotes=[];
function roomsHere(){return (typeof siteRooms==="function"?siteRooms():db.rooms||[]).filter(function(r){return !r.site||siteMatch(r.site);});}
function certifiedRooms(){return roomsHere().filter(function(r){return r.status==="certified";});}
function list(title,arr,empty){
  if(!arr.length)return "<div class=card><h3>"+title+"</h3><p>"+empty+"</p></div>";
  return "<div class=card><h3>"+title+"</h3>"+arr.map(function(r){
    return "<p><b>Rm "+r.number+"</b> · "+(r.status||"")+(r.hkNote?(" · "+r.hkNote):"")+"</p>";
  }).join("")+"</div>";
}
function noteBox(){
  if(!(isFD()||(typeof mgr==="function"&&mgr())||(typeof isGM==="function"&&isGM())))return "";
  var all=roomsHere();
  var ooo=all.filter(function(r){return r.status==="ooo";});
  var back=all.filter(function(r){return r.status==="pending"||r.hkNote;});
  var wait=all.filter(function(r){return r.status==="submitted";});
  var ok=certifiedRooms();
  var notes=(db.deskNotes||[]).filter(function(n){return siteMatch(n.site);}).slice(-6).reverse();
  return "<h1>Front desk room board</h1>"+
    list("OUT OF ORDER — do not sell",ooo,"No OOO rooms")+
    list("Returned to service — waiting recertify",back,"None waiting")+
    list("Submitted — duty manager to certify",wait,"None submitted")+
    list("Certified — ready to sell",ok,"No certified room yet")+
    (notes.length?("<div class=card><h3>Latest alerts</h3>"+notes.map(function(n){return "<p><b>"+n.room+"</b> · "+n.kind+" · "+n.at+"</p>";}).join("")+"</div>"):"");
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
  db.deskNotes.push({id:"n"+Date.now(),room:room,kind:kind,site:user&&user.site||"",at:new Date().toLocaleString()});
};
try{draw();}catch(e){}
}
boot();
})();
