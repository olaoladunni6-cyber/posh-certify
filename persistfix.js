(function(){
function boot(){
if(typeof db==="undefined"||typeof draw!=="function"){setTimeout(boot,80);return;}
if(window.__persistFix)return;window.__persistFix=true;
if(!db.martItems)db.martItems=[];
if(!db.martStock)db.martStock=[];
if(!db.martSales)db.martSales=[];
function siteOf(){return (user&&user.site&&user.site!=="All locations")?user.site:"Ikeja";}
function sites(){return (db.locations&&db.locations.length)?db.locations:["Ikeja","Victoria Island"];}
function pushSoon(){
  clearTimeout(window.__pushT);
  window.__pushT=setTimeout(function(){
    if(typeof publishHotel==="function")publishHotel(function(){});
  },400);
}
if(!window.__saveHooked){
  window.__saveHooked=true;
  var _save=window.save;
  window.save=function(){
    try{if(_save)return _save.apply(this,arguments);}finally{pushSoon();}
  };
}
function stockRow(id,site){
  site=site||siteOf();
  var row=db.martStock.filter(function(s){return s.item===id&&s.site===site;})[0];
  if(!row){row={id:"ms"+id+"_"+String(site).replace(/\s/g,""),item:id,site:site,qty:0};db.martStock.push(row);}
  return row;
}
function setStock(id,qty,site){
  site=site||siteOf();
  stockRow(id,site).qty=Math.max(0,Number(qty||0));
}
window.poshSyncMartStock=function(it){
  if(!it)return;
  var q=Number(it.qty!=null?it.qty:it.stock||0);
  sites().forEach(function(s){if(q>0)setStock(it.id,q,s);else stockRow(it.id,s);});
};
(db.martItems||[]).forEach(function(it){
  if(it.qty>0||it.stock>0)window.poshSyncMartStock(it);
});
var _add=window.poshAddMartItemBtn;
window.poshAddMartItemBtn=function(){
  if(_add)try{_add();}catch(e){}
  var last=db.martItems[db.martItems.length-1];
  if(last)window.poshSyncMartStock(last);
  try{save();}catch(e){}
};
var _edit=window.poshEditMartItemBtn;
window.poshEditMartItemBtn=function(){
  if(_edit)try{_edit();}catch(e){}
  (db.martItems||[]).forEach(window.poshSyncMartStock);
  try{save();}catch(e){}
};
window.poshDeskSellMart=function(){
  if(!user||user.role!=="frontdesk"){alert("Front Desk only");return;}
  var list=db.martItems||[];
  if(!list.length){alert("No mini mart items. Super Admin must Add mart item.");return;}
  var lines=list.map(function(it,i){
    var st=stockRow(it.id,siteOf()).qty;
    return (i+1)+". "+it.name+" · stock "+st+" · ₦"+(it.price||0);
  }).join("\n");
  var pick=prompt("Sell which item number:\n"+lines);if(!pick)return;
  var it=list[parseInt(pick,10)-1];if(!it){alert("Not found");return;}
  var qty=parseInt(prompt("Quantity","1"),10);if(!(qty>0))return;
  var row=stockRow(it.id,siteOf());
  if(Number(row.qty||0)<qty){alert("Not enough stock at "+siteOf()+". Super Admin Edit mart item and set stock, then Refresh.");return;}
  row.qty=Number(row.qty)-qty;
  it.qty=row.qty;it.stock=row.qty;
  var room=prompt("Room number (optional)","")||"";
  db.martSales.push({id:"mv"+Date.now(),item:it.id,name:it.name,qty:qty,price:it.price,amount:qty*Number(it.price||0),room:room,site:siteOf(),by:user.name,byId:user.id,day:(typeof today==="function"?today():""),at:new Date().toLocaleString()});
  try{save();}catch(e){}try{draw();}catch(e){}
  alert("Sold "+qty+" x "+it.name+". Stock now "+row.qty+". Other phones Refresh now.");
};
function addBtns(){
  var el=document.getElementById("opsBar");if(!el||!user)return;
  if(user.role==="frontdesk"&&!document.getElementById("obSellMart2")){
    var b=document.createElement("button");b.type="button";b.className="btn";b.id="obSellMart2";b.textContent="Sell mart item";el.appendChild(b);
  }
}
if(!window.__persistClicks){
  window.__persistClicks=true;
  document.addEventListener("click",function(ev){
    if(ev.target&&ev.target.id==="obSellMart2")window.poshDeskSellMart();
  },true);
}
var _d=draw;draw=function(){var out=_d.apply(this,arguments);try{addBtns();}catch(e){}return out;};try{draw();}catch(e){}
}
boot();
})();
