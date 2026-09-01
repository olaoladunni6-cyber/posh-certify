(function(){
function boot(){
if(typeof db==="undefined"||typeof draw!=="function"){setTimeout(boot,60);return;}
if(window.__martFix)return;window.__martFix=true;
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
SEED.forEach(function(it){if(!db.martItems.some(function(x){return x.id===it.id;}))db.martItems.push({id:it.id,name:it.name,price:it.price});});
function site(){return (user&&user.site)||"Ikeja";}
function stock(id){
  var row=(db.martStock||[]).filter(function(s){return s.item===id&&s.site===site();})[0];
  return row?Number(row.qty||0):0;
}
function bump(id,n){
  var row=(db.martStock||[]).filter(function(s){return s.item===id&&s.site===site();})[0];
  if(!row){row={id:"ms"+id+"_"+site().replace(/\s/g,""),item:id,site:site(),qty:0};db.martStock.push(row);}
  row.qty=Math.max(0,Number(row.qty||0)+Number(n||0));
}
function n2(n){return "NGN "+Number(n||0).toLocaleString();}
function isDesk(){return user&&(user.role==="frontdesk"||user.role==="Front Desk"||user.role==="superadmin"||user.role==="storekeeper");}
function formHtml(){
  var opts=db.martItems.map(function(it){return "<option value='"+it.id+"'>"+it.name+" — "+n2(it.price)+" — stock "+stock(it.id)+"</option>";}).join("");
  var sold=(db.martSales||[]).filter(function(s){return s.site===site()&&s.day===(typeof today==="function"?today():s.day);}).slice().reverse().map(function(s){return "<p>"+s.qty+" x "+s.name+" · "+n2(s.amount)+" · "+(s.by||"")+"</p>";}).join("");
  return "<div class=card id=martCard><h3>Mini mart</h3>"+
    "<p>Choose item and quantity here, then use the gold bar.</p>"+
    "<p>Item</p><select id=martItem>"+(opts||"<option>No items seeded</option>")+"</select>"+
    "<p>Quantity</p><input id=martQty type=number min=1 value=1>"+
    "<p>Guest (optional)</p><input id=martGuest>"+
    "<p>Room (optional)</p><input id=martRoom>"+
    "<p>New item name</p><input id=martNewName>"+
    "<p>New item price</p><input id=martNewPrice type=number min=0>"+
    "<p>Stock at "+site()+"</p>"+db.martItems.map(function(it){return "<p>"+it.name+": <b>"+stock(it.id)+"</b></p>";}).join("")+
    "<p>Sold today</p>"+(sold||"<p>None yet.</p>")+"</div>";
}
function inject(){
  if(!isDesk())return;
  if(document.getElementById("martCard"))return;
  var wrap=document.querySelector(".wrap")||document.getElementById("app");
  if(!wrap)return;
  wrap.insertAdjacentHTML("afterbegin",formHtml());
}
var _draw=draw;
draw=function(){
  _draw.apply(this,arguments);
  try{inject();}catch(e){}
};
window.poshMartSell=function(){
  if(!isDesk()){alert("Front Desk only");return;}
  var id=(document.getElementById("martItem")||{}).value;
  var qty=parseInt((document.getElementById("martQty")||{}).value,10);
  var it=db.martItems.filter(function(x){return x.id===id;})[0];
  if(!it){alert("Choose an item from the Mini mart list on Desk.");return;}
  if(!(qty>0)){alert("Enter quantity on Desk first.");return;}
  if(stock(it.id)<qty){alert("Stock is "+stock(it.id)+". Receive stock first.");return;}
  bump(it.id,-qty);
  var amt=qty*Number(it.price||0);
  db.martSales.push({id:"mv"+Date.now(),item:it.id,name:it.name,qty:qty,price:it.price,amount:amt,guest:((document.getElementById("martGuest")||{}).value||"").trim(),room:((document.getElementById("martRoom")||{}).value||"").trim(),site:site(),by:user.name,byId:user.id,day:typeof today==="function"?today():"",at:new Date().toLocaleString()});
  try{save();}catch(e){}
  try{draw();}catch(e){}
  alert("Sold "+qty+" x "+it.name+"\n"+n2(amt));
};
window.poshMartReceive=function(){
  if(!isDesk()){alert("Not allowed");return;}
  var id=(document.getElementById("martItem")||{}).value;
  var qty=parseInt((document.getElementById("martQty")||{}).value,10);
  var it=db.martItems.filter(function(x){return x.id===id;})[0];
  if(!it){alert("Choose an item from the Mini mart list on Desk.");return;}
  if(!(qty>0)){alert("Enter quantity on Desk first.");return;}
  bump(it.id,qty);
  db.martMoves.push({id:"mm"+Date.now(),item:it.id,qty:qty,kind:"receive",site:site(),by:user.name,day:typeof today==="function"?today():"",at:new Date().toLocaleString()});
  try{save();}catch(e){}
  try{draw();}catch(e){}
  alert("Received "+qty+" x "+it.name+"\nStock now "+stock(it.id));
};
window.poshMartAddItem=function(){
  if(!isDesk()){alert("Not allowed");return;}
  var name=((document.getElementById("martNewName")||{}).value||"").trim();
  var price=parseFloat((document.getElementById("martNewPrice")||{}).value||"");
  if(!name){alert("Type the new item name on Desk first.");return;}
  if(!(price>=0)){alert("Type the price on Desk first.");return;}
  db.martItems.push({id:"mm"+Date.now(),name:name,price:price});
  try{save();}catch(e){}
  try{draw();}catch(e){}
  alert("Added "+name);
};
try{draw();}catch(e){}
}
boot();
})();
