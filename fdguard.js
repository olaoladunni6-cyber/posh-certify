(function(){
function boot(){
if(typeof db==="undefined"||typeof isFD!=="function"){setTimeout(boot,80);return;}
if(window.__fdGuard)return;window.__fdGuard=true;
if(!db.deskNotes)db.deskNotes=[];
function roomsHere(){return (db.rooms||[]).filter(function(r){return !r.site||!user||!user.site||r.site===user.site||user.role==="ceo"||user.role==="superadmin";});}
function certifiedRooms(){return roomsHere().filter(function(r){return r.status==="certified";});}
function dayNow(){return typeof today==="function"?today():"";}
function restrictSelect(){
  var sel=document.getElementById("cinRoom");
  if(!sel||!isFD())return;
  var keep=certifiedRooms(),cur=sel.value;
  sel.innerHTML=keep.map(function(r){return "<option>"+r.number+"</option>";}).join("")||"<option value=''>No certified room</option>";
  if(keep.some(function(r){return String(r.number)===String(cur);}))sel.value=cur;
}
if(typeof bind==="function"){
  var _b=bind;
  window.bind=function(){
    try{_b();}catch(e){}
    try{restrictSelect();}catch(e){}
  };
}
window.poshDeskNote=function(room,kind){
  if(!db.deskNotes)db.deskNotes=[];
  var r=(db.rooms||[]).filter(function(x){return String(x.number)===String(room);})[0];
  if(r){
    if(!r.statusLog)r.statusLog=[];
    r.statusLog.push({kind:kind,at:new Date().toLocaleString(),day:dayNow(),by:user&&user.name||""});
  }
  db.deskNotes.push({id:"n"+Date.now(),room:room,kind:kind,site:user&&user.site||"",by:user&&user.name||"",day:dayNow(),at:new Date().toLocaleString()});
};
try{if(typeof draw==="function")draw();}catch(e){}
}
boot();
})();
