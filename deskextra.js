(function(){
function boot(){
if(typeof db==="undefined"||typeof draw!=="function"){setTimeout(boot,80);return;}
if(window.__deskExtra)return;window.__deskExtra=true;
window.poshMartSale=function(){
  if(!user||user.role!=="frontdesk"){alert("Front Desk only");return;}
  if(typeof poshMartSell==="function"){try{poshMartSell();return;}catch(e){}}
  var item=prompt("Mini mart item sold","Water");if(!item)return;
  var qty=parseInt(prompt("Quantity","1"),10);if(!(qty>0))qty=1;
  var amt=parseFloat(prompt("Amount charged (Naira)","0"));if(isNaN(amt))amt=0;
  var room=prompt("Room number (optional)","");
  if(!db.martSales)db.martSales=[];
  db.martSales.push({id:"ms"+Date.now(),item:item,qty:qty,amount:amt,room:room,site:user.site,by:user.name,byId:user.id,day:(typeof today==="function"?today():""),at:new Date().toLocaleString()});
  try{save();}catch(e){}
  alert("Mini mart sale saved: "+item+" x"+qty+" ₦"+amt+". Duty manager / accountant Refresh now.");
};
window.poshSendLaundry=function(){
  if(!user||user.role!=="housekeeper"){alert("Housekeeper only");return;}
  var r=null;
  if(roomId)r=(db.rooms||[]).filter(function(x){return x.id===roomId;})[0];
  if(!r)r=(db.rooms||[]).filter(function(x){return x.hk===user.id||x.hk===user.name||x.hkName===user.name;})[0];
  if(!r){alert("Open or get assigned a room first");return;}
  var raw=prompt("Linen / towel counts for Rm "+r.number+"\nExample: bath_towel 2, sheet 2, pillow 2","bath_towel 1, sheet 1");
  if(!raw)return;
  var items={};
  raw.split(",").forEach(function(part){
    var bits=part.trim().split(/\s+/);
    var name=(bits[0]||"").toLowerCase().replace(/[^a-z_]/g,"_");
    var n=parseInt(bits[1]||"1",10);if(!(n>0))n=1;
    if(name)items[name]=n;
  });
  if(!Object.keys(items).length){alert("No items typed");return;}
  if(!db.slips)db.slips=[];
  db.slips.push({id:"s"+Date.now(),room:r.number,site:r.site||user.site,by:user.name,at:new Date().toLocaleString(),items:items,status:"sent",day:(typeof today==="function"?today():"")});
  r.laundryChecked=true;
  try{save();}catch(e){}
  alert("Sent to laundry from Rm "+r.number+". Laundry staff tap Refresh now.");
};
function addBtns(){
  var el=document.getElementById("opsBar");if(!el||!user)return;
  if(user.role==="frontdesk"&&!document.getElementById("obMart")){
    var b=document.createElement("button");b.type="button";b.className="btn";b.id="obMart";b.textContent="Mini mart sale";el.appendChild(b);
  }
  if(user.role==="housekeeper"&&!document.getElementById("obLau")){
    var c=document.createElement("button");c.type="button";c.className="btn";c.id="obLau";c.textContent="Send to laundry";el.appendChild(c);
  }
}
if(!window.__deskExtraClicks){
  window.__deskExtraClicks=true;
  document.addEventListener("click",function(ev){
    if(ev.target&&ev.target.id==="obMart")window.poshMartSale();
    if(ev.target&&ev.target.id==="obLau")window.poshSendLaundry();
  },true);
}
var _d=draw;draw=function(){var out=_d.apply(this,arguments);try{addBtns();}catch(e){}return out;};try{draw();}catch(e){}
}
boot();
})();
