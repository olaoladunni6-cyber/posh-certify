(function(){
function boot(){
if(typeof db==="undefined"||typeof draw!=="function"){setTimeout(boot,80);return;}
if(window.__martEdit)return;window.__martEdit=true;
function canAdd(){return user&&(user.role==="frontdesk"||user.role==="superadmin");}
function canEdit(){return user&&user.role==="superadmin";}
function items(){if(!db.martItems)db.martItems=[];return db.martItems;}
window.poshAddMartItemBtn=function(){
  if(!canAdd()){alert("Front Desk or Super Admin only");return;}
  var name=prompt("New mini mart item name");if(!name)return;
  var price=parseFloat(prompt("Sell price (Naira)","0"));if(isNaN(price))price=0;
  var qty=parseInt(prompt("Opening stock","0"),10);if(!(qty>=0))qty=0;
  items().push({id:"mi"+Date.now(),name:String(name).trim(),price:price,qty:qty,stock:qty});
  try{save();}catch(e){}try{draw();}catch(e){}
  alert(name+" added. Other phones Refresh now.");
};
window.poshEditMartItemBtn=function(){
  if(!canEdit()){alert("Super Admin only");return;}
  var list=items();
  if(!list.length){alert("No items yet. Add one first.");return;}
  var pick=prompt("Item number to edit or delete:\n"+list.map(function(it,i){return (i+1)+". "+it.name+" · stock "+(it.qty||it.stock||0)+" · ₦"+(it.price||0);}).join("\n"));
  if(!pick)return;
  var it=list[parseInt(pick,10)-1];if(!it){alert("Not found");return;}
  var act=prompt("Type edit or delete","edit");
  if(String(act).toLowerCase().indexOf("del")===0){
    db.martItems=list.filter(function(x){return x.id!==it.id;});
    try{save();}catch(e){}try{draw();}catch(e){}alert(it.name+" removed");return;
  }
  it.name=prompt("Name",it.name)||it.name;
  var p=prompt("Price",String(it.price||0));if(p!==null)it.price=parseFloat(p)||0;
  var q=prompt("Stock",String(it.qty||it.stock||0));if(q!==null){it.qty=parseInt(q,10)||0;it.stock=it.qty;}
  try{save();}catch(e){}try{draw();}catch(e){}alert("Saved "+it.name);
};
function addBtns(){
  var el=document.getElementById("opsBar");if(!el||!user)return;
  function put(id,label){if(document.getElementById(id))return;var b=document.createElement("button");b.type="button";b.className="btn";b.id=id;b.textContent=label;el.appendChild(b);}
  if(canAdd())put("obAddMartItem","Add mart item");
  if(canEdit())put("obEditMartItem","Edit mart item");
}
if(!window.__martEditClicks){
  window.__martEditClicks=true;
  document.addEventListener("click",function(ev){
    var id=ev.target&&ev.target.id;
    if(id==="obAddMartItem")window.poshAddMartItemBtn();
    if(id==="obEditMartItem")window.poshEditMartItemBtn();
  },true);
}
var _d=draw;draw=function(){var out=_d.apply(this,arguments);try{addBtns();}catch(e){}return out;};try{draw();}catch(e){}
}
boot();
})();
