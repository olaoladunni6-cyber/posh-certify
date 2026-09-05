(function(){
function boot(){
if(typeof db==="undefined"||typeof draw!=="function"){setTimeout(boot,80);return;}
if(window.__saEdit)return;window.__saEdit=true;
function isSA(){return user&&user.role==="superadmin";}
function roles(){return ["housekeeper","frontdesk","manager","laundry","kitchen","maint","storekeeper","accountant","ceo","superadmin"];}
window.poshShowStaff=function(){
  if(!isSA()){alert("Super Admin only");return;}
  tab="staff";try{draw();}catch(e){}
  var lines=(db.users||[]).map(function(u,i){return (i+1)+". "+u.name+" · "+u.role+" · "+(u.site||"")+" · PIN "+u.pin;}).join("\n");
  alert(lines||"No staff");
};
window.poshAddStaff=function(){
  if(!isSA()){alert("Super Admin only");return;}
  var name=prompt("Full name");if(!name)return;
  var role=prompt("Role:\n"+roles().join(", "),"housekeeper");if(!role)return;
  role=String(role).toLowerCase().replace(/\s+/g,"");
  var site=prompt("Location: Ikeja / Victoria Island / All locations","Ikeja");
  var pin=prompt("4-digit PIN");if(!pin)return;
  if(!db.users)db.users=[];
  db.users.push({id:"u"+Date.now(),name:name.trim(),role:role,site:site||"Ikeja",pin:String(pin).trim(),whatsapp:"",demo:false});
  try{save();}catch(e){}try{draw();}catch(e){}
  alert(name+" added. Other phones Refresh now.");
};
window.poshEditStaff=function(){
  if(!isSA())return;
  var list=db.users||[];
  var pick=prompt("Staff number to edit or delete:\n"+list.map(function(u,i){return (i+1)+". "+u.name+" · "+u.role;}).join("\n"));
  if(!pick)return;
  var u=list[parseInt(pick,10)-1];if(!u){alert("Not found");return;}
  var act=prompt("Type edit or delete","edit");
  if(String(act).toLowerCase().indexOf("del")===0){
    db.users=list.filter(function(x){return x.id!==u.id;});
    try{save();}catch(e){}alert(u.name+" removed");try{draw();}catch(e){}return;
  }
  u.name=prompt("Name",u.name)||u.name;
  u.role=prompt("Role",u.role)||u.role;
  u.site=prompt("Location",u.site)||u.site;
  u.pin=prompt("PIN",u.pin)||u.pin;
  u.whatsapp=prompt("WhatsApp",u.whatsapp||"")||u.whatsapp;
  try{save();}catch(e){}try{draw();}catch(e){}alert("Saved "+u.name);
};
window.poshShowMart=function(){
  if(!isSA()&&!(user&&user.role==="frontdesk")){alert("Super Admin or Front Desk");return;}
  var items=db.martItems||[];
  var lines=items.map(function(it,i){return (i+1)+". "+(it.name||it.id)+" · stock "+(it.qty||it.stock||0)+" · ₦"+(it.price||0);}).join("\n");
  alert(lines||"No mini mart items yet. Use Add mart item.");
};
window.poshAddMart=function(){
  if(!isSA()&&!(user&&user.role==="frontdesk")){alert("Super Admin or Front Desk");return;}
  if(typeof poshMartAddItem==="function"){try{poshMartAddItem();return;}catch(e){}}
  var name=prompt("Mini mart item name","Water");if(!name)return;
  var price=parseFloat(prompt("Price (Naira)","500"));if(isNaN(price))price=0;
  var qty=parseInt(prompt("Opening stock","0"),10);if(!(qty>=0))qty=0;
  if(!db.martItems)db.martItems=[];
  db.martItems.push({id:"mi"+Date.now(),name:name.trim(),price:price,qty:qty,stock:qty});
  try{save();}catch(e){}try{draw();}catch(e){}alert(name+" added to mini mart.");
};
function addBtns(){
  var el=document.getElementById("opsBar");if(!el||!user)return;
  if(!isSA())return;
  function put(id,label){if(document.getElementById(id))return;var b=document.createElement("button");b.type="button";b.className="btn";b.id=id;b.textContent=label;el.appendChild(b);}
  put("obStaffList","Staff list");
  put("obStaffAdd","Add staff");
  put("obStaffEdit","Edit staff");
  put("obMartList","Mart items");
  put("obMartAdd","Add mart item");
}
if(!window.__saClicks){
  window.__saClicks=true;
  document.addEventListener("click",function(ev){
    var id=ev.target&&ev.target.id;
    if(id==="obStaffList")window.poshShowStaff();
    else if(id==="obStaffAdd")window.poshAddStaff();
    else if(id==="obStaffEdit")window.poshEditStaff();
    else if(id==="obMartList")window.poshShowMart();
    else if(id==="obMartAdd")window.poshAddMart();
  },true);
}
var _d=draw;draw=function(){var out=_d.apply(this,arguments);try{addBtns();}catch(e){}return out;};try{draw();}catch(e){}
}
boot();
})();
