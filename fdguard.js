(function(){
function boot(){
if(typeof db==="undefined"||typeof isFD!=="function"){setTimeout(boot,80);return;}
if(window.__fdGuard)return;window.__fdGuard=true;
if(!db.deskNotes)db.deskNotes=[];
function certifiedRooms(){
  return (typeof siteRooms==="function"?siteRooms():db.rooms||[]).filter(function(r){return r.status==="certified";});
}
function noteBox(){
  if(!isFD())return "";
  var list=(db.deskNotes||[]).filter(function(n){return siteMatch(n.site);}).slice(-8).reverse();
  if(!list.length)return "<div class=card><h3>Room board</h3><p>Only certified rooms can take a guest.</p></div>";
  return "<div class=card><h3>Room board</h3>"+list.map(function(n){return "<p><b>"+n.room+"</b> · "+n.kind+" · "+n.at+"</p>";}).join("")+"</div>";
}
function restrictSelect(){
  var sel=document.getElementById("cinRoom");
  if(!sel||!isFD())return;
  var keep=certifiedRooms();
  var cur=sel.value;
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
      if(!hit||hit.status!=="certified"){alert("That room is not certified. Choose a certified room.");return;}
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
