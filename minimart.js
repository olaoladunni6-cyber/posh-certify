(function(){
function boot(){
if(typeof db==="undefined"||typeof viewDesk!=="function"){setTimeout(boot,80);return;}
if(window.__miniMart)return;window.__miniMart=true;
if(!db.martItems)db.martItems=[];
if(!db.martStock)db.martStock=[];
if(!db.martSales)db.martSales=[];
if(!db.martMoves)db.martMoves=[];
var SEED=[
  {id:"mm_water",name:"Bottled water",price:500},
  {id:"mm_soda",name:"Soft drink",price:800},
  {id:"mm_malt",name:"Malt",price:1000},
  {id:"mm_beer",name:"Beer",price:1500},
  {id:"mm_wine",name:"Wine (small)",price:3500},
  {id:"mm_snack",name:"Snacks",price:700},
  {id:"mm_noodle",name:"Noodles",price:600},
  {id:"mm_biscuit",name:"Biscuits",price:500},
  {id:"mm_choc",name:"Chocolate",price:1200},
  {id:"mm_extra",name:"Toiletry extra",price:500}
];
SEED.forEach(function(it){if(!db.martItems.some(function(x){return x.id===it.id;}))db.martItems.push(it);});
function sites(){return db.sites&&db.sites.length?db.sites:["Ikeja","Victoria Island"];}
function ensureStock(){
  sites().forEach(function(site){
    db.martItems.forEach(function(it){
      if(!db.martStock.some(function(s){return s.item===it.id&&s.site===site;}))
        db.martStock.push({id:"ms"+it.id+"_"+site.replace(/\s/g,""),item:it.id,site:site,qty:0});
    });
  });
}
ensureStock();
function naira2(n){return typeof naira==="function"?naira(n):("NGN "+Number(n||0).toLocaleString());}
function siteOf(){return (user&&user.site)||"Ikeja";}
function stockOfItem(id,site){
  site=site||siteOf();
  var row=db.martStock.filter(function(s){return s.item===id&&s.site===site;})[0];
  return row?Number(row.qty||0):0;
}
function addStock(id,site,qty){
  ensureStock();
  var row=db.martStock.filter(function(s){return s.item===id&&s.site===site;})[0];
  if(!row){row={id:"ms"+Date.now(),item:id,site:site,qty:0};db.martStock.push(row);}
  row.qty=Math.max(0,Number(row.qty||0)+Number(qty||0));
}
function todayMart(site){
  return (db.martSales||[]).filter(function(s){
    return s.day===(typeof today==="function"?today():s.day)&&(!site||s.site===site);
  });
}
function martTotal(list){return list.reduce(function(a,s){return a+Number(s.amount||0);},0);}
function canSee(){return user&&(user.role==="frontdesk"||user.role==="accountant"||user.role==="manager"||user.role==="ceo"||user.role==="superadmin"||user.role==="storekeeper");}
function form(){
  if(!user||!(user.role==="frontdesk"||user.role==="superadmin"||user.role==="storekeeper"))return "";
  var opts=db.martItems.map(function(it){
    return "<option value='"+it.id+"'>"+it.name+" · "+naira2(it.price)+" · stock "+stockOfItem(it.id)+"</option>";
  }).join("");
  return "<div class=card><h3>Mini mart — choose first</h3>"+
    "<p>Select the item and quantity on this page, then use the gold bar.</p>"+
    "<p>Item</p><select id=martItem>"+(opts||"<option value=''>No items</option>")+"</select>"+
    "<p>Quantity</p><input id=martQty type=number min=1 value=1>"+
    "<p>Guest name (sale only, optional)</p><input id=martGuest placeholder='Guest'>"+
    "<p>Room (sale only, optional)</p><input id=martRoom placeholder='Room no'>"+
    "<p>New item name</p><input id=martNewName placeholder='e.g. Energy drink'>"+
    "<p>New item price</p><input id=martNewPrice type=number min=0 placeholder='Price'>"+
    "<p>Then tap <b>Sell mini mart</b>, <b>Receive mini mart</b> or <b>Add mart item</b>.</p></div>";
}
window.poshMartBox=function(){
  if(!canSee())return "";
  var site=siteOf();
  var stock=db.martItems.map(function(it){return "<p>"+it.name+" · "+naira2(it.price)+" · stock <b>"+stockOfItem(it.id,site)+"</b></p>";}).join("");
  var sold=todayMart(user.role==="ceo"||user.role==="superadmin"?"":site).slice().reverse().map(function(s){
    return "<p>"+s.qty+" x "+s.name+" · "+naira2(s.amount)+(s.room?(" · Rm "+s.room):"")+(s.guest?(" · "+s.guest):"")+" · "+s.by+"</p>";
  }).join("");
  return form()+"<div class=card><h3>Mini mart stock · "+site+"</h3>"+stock+"<p>Sold today <b>"+naira2(martTotal(todayMart(site)))+"</b></p></div>"+
    "<div class=card><h3>Mini mart sales today</h3>"+(sold||"<p>No mini mart sale yet.</p>")+"</div>";
};
var _vd=viewDesk;
viewDesk=function(){
  var html=_vd.apply(this,arguments);
  if(!canSee())return html;
  html=html.replace(/<p>Mini mart<\/p><input id=cinMart[\s\S]*?placeholder='Mini mart items \/ description'>/,"<p><i>Mini mart is the section below. Do not put it on the room folio.</i></p>");
  return html+poshMartBox();
};
function readChoice(){
  var id=(document.getElementById("martItem")||{}).value;
  var qty=parseInt((document.getElementById("martQty")||{}).value,10);
  var it=db.martItems.filter(function(x){return x.id===id;})[0];
  return {it:it,qty:qty,guest:((document.getElementById("martGuest")||{}).value||"").trim(),room:((document.getElementById("martRoom")||{}).value||"").trim()};
}
window.poshMartSell=function(){
  if(!user||user.role!=="frontdesk"){alert("Front Desk only");return;}
  var c=readChoice();
  if(!c.it){alert("Choose a mini mart item on the Desk page first.");return;}
  if(!(c.qty>0)){alert("Enter quantity on the Desk page first.");return;}
  if(stockOfItem(c.it.id)<c.qty){alert("Not enough stock. Receive stock first.");return;}
  addStock(c.it.id,siteOf(),-c.qty);
  var amount=c.qty*Number(c.it.price||0);
  db.martSales.push({id:"mv"+Date.now(),item:c.it.id,name:c.it.name,qty:c.qty,price:c.it.price,amount:amount,guest:c.guest,room:c.room,site:siteOf(),by:user.name,byId:user.id,day:typeof today==="function"?today():"",at:new Date().toLocaleString()});
  db.martMoves.push({id:"mm"+Date.now(),item:c.it.id,qty:-c.qty,kind:"sale",site:siteOf(),by:user.name,day:typeof today==="function"?today():"",at:new Date().toLocaleString()});
  try{save();}catch(e){}
  try{draw();}catch(e){}
  alert("Sold "+c.qty+" x "+c.it.name+" · "+naira2(amount));
};
window.poshMartReceive=function(){
  if(!user||!(user.role==="frontdesk"||user.role==="superadmin"||user.role==="storekeeper")){alert("Not allowed");return;}
  var c=readChoice();
  if(!c.it){alert("Choose a mini mart item on the Desk page first.");return;}
  if(!(c.qty>0)){alert("Enter how many received on the Desk page first.");return;}
  addStock(c.it.id,siteOf(),c.qty);
  db.martMoves.push({id:"mm"+Date.now(),item:c.it.id,qty:c.qty,kind:"receive",site:siteOf(),by:user.name,day:typeof today==="function"?today():"",at:new Date().toLocaleString()});
  try{save();}catch(e){}
  try{draw();}catch(e){}
  alert("Received "+c.qty+" x "+c.it.name+" · stock now "+stockOfItem(c.it.id));
};
window.poshMartAddItem=function(){
  if(!user||!(user.role==="superadmin"||user.role==="frontdesk")){alert("Not allowed");return;}
  var name=((document.getElementById("martNewName")||{}).value||"").trim();
  var price=parseFloat((document.getElementById("martNewPrice")||{}).value||"");
  if(!name){alert("Type the new item name on the Desk page first.");return;}
  if(!(price>=0)){alert("Type the selling price on the Desk page first.");return;}
  db.martItems.push({id:"mm"+Date.now(),name:name,price:price});
  ensureStock();
  try{save();}catch(e){}
  try{draw();}catch(e){}
  alert("Added "+name+" at "+naira2(price));
};
try{draw();}catch(e){}
}
boot();
})();
