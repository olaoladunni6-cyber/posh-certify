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
  {id:"mm_condom",name:"Toiletry extra",price:500}
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
function itemOf(id){return db.martItems.filter(function(x){return x.id===id;})[0]||{id:id,name:id,price:0};}
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
function canEditItems(){return user&&(user.role==="superadmin"||user.role==="storekeeper"||user.role==="frontdesk");}
function canSee(){return user&&(user.role==="frontdesk"||user.role==="accountant"||user.role==="manager"||user.role==="ceo"||user.role==="superadmin"||user.role==="storekeeper");}
window.poshMartBox=function(){
  if(!canSee())return "";
  var site=siteOf();
  var stock=db.martItems.map(function(it){
    return "<p>"+it.name+" · "+naira2(it.price)+" · stock <b>"+stockOfItem(it.id,site)+"</b></p>";
  }).join("");
  var sales=todayMart(user.role==="ceo"||user.role==="superadmin"?"":site).slice().reverse();
  var sold=sales.map(function(s){
    return "<p>"+s.qty+" x "+s.name+" · "+naira2(s.amount)+(s.room?(" · Rm "+s.room):"")+(s.guest?(" · "+s.guest):"")+" · "+s.by+"</p>";
  }).join("");
  return "<div class=card><h3>Mini mart · "+site+"</h3><p>Stock and mini mart sales are separate from room sales and ancillary extras.</p>"+stock+
    "<p>Sold today <b>"+naira2(martTotal(todayMart(site)))+"</b></p></div>"+
    "<div class=card><h3>Mini mart sales today</h3>"+(sold||"<p>No mini mart sale yet.</p>")+"</div>";
};
var _vd=viewDesk;
viewDesk=function(){
  var html=_vd.apply(this,arguments);
  if(!canSee())return html;
  html=html.replace(/<p>Mini mart<\/p><input id=cinMart[\s\S]*?placeholder='Mini mart items \/ description'>/,"<p><i>Mini mart is recorded in the Mini mart section below, not on the room folio.</i></p>");
  return html.replace("<h1>Front desk</h1>","<h1>Front desk</h1>")+poshMartBox();
};
var _va=typeof viewAccounts==="function"?viewAccounts:null;
if(_va)viewAccounts=function(){return _va.apply(this,arguments)+poshMartBox();};
if(typeof salesPack==="function"){
  var _sp=salesPack;
  salesPack=function(list){
    var p=_sp(list);
    var site=siteOf();
    var mart=martTotal(todayMart(user&&(user.role==="ceo"||user.role==="superadmin")?"":site));
    p.mart=mart;
    p.extras=sumField?sumField(list,typeof extrasNoMart==="function"?extrasNoMart:function(c){var e=c.extras||{};return Number(e.early||0)+Number(e.late||0)+Number(e.laundry||0)+Number(e.other||0);}):p.extras;
    p.billed=Number(p.rooms||0)+Number(p.extras||0)+Number(p.mart||0);
    return p;
  };
}
window.poshMartSell=function(){
  if(!user||user.role!=="frontdesk"){alert("Front Desk only");return;}
  ensureStock();
  var names=db.martItems.map(function(it,i){return (i+1)+". "+it.name+" · "+naira2(it.price)+" · stock "+stockOfItem(it.id);}).join("\n");
  var pick=prompt("Sell which mini mart item? Type the number\n"+names,"1");
  if(pick===null)return;
  var idx=parseInt(pick,10)-1;
  var it=db.martItems[idx];
  if(!it){alert("Unknown item");return;}
  var qty=parseInt(prompt("How many "+it.name+"?","1"),10);
  if(!(qty>0))return;
  if(stockOfItem(it.id)<qty){alert("Not enough stock. Receive stock first.");return;}
  var guest=prompt("Guest name (optional)","")||"";
  var room=prompt("Room number (optional)","")||"";
  addStock(it.id,siteOf(),-qty);
  var amount=qty*Number(it.price||0);
  db.martSales.push({id:"mv"+Date.now(),item:it.id,name:it.name,qty:qty,price:it.price,amount:amount,guest:String(guest).trim(),room:String(room).trim(),site:siteOf(),by:user.name,byId:user.id,day:typeof today==="function"?today():"",at:new Date().toLocaleString()});
  db.martMoves.push({id:"mm"+Date.now(),item:it.id,qty:-qty,kind:"sale",site:siteOf(),by:user.name,day:typeof today==="function"?today():"",at:new Date().toLocaleString()});
  try{save();}catch(e){}
  alert("Mini mart sale\n"+qty+" x "+it.name+"\n"+naira2(amount)+"\nStock left "+stockOfItem(it.id));
};
window.poshMartReceive=function(){
  if(!canEditItems()){alert("Not allowed");return;}
  ensureStock();
  var names=db.martItems.map(function(it,i){return (i+1)+". "+it.name+" · stock "+stockOfItem(it.id);}).join("\n");
  var pick=prompt("Receive which item? Type the number\n"+names,"1");
  if(pick===null)return;
  var it=db.martItems[parseInt(pick,10)-1];
  if(!it){alert("Unknown item");return;}
  var qty=parseInt(prompt("How many "+it.name+" received?","10"),10);
  if(!(qty>0))return;
  addStock(it.id,siteOf(),qty);
  db.martMoves.push({id:"mm"+Date.now(),item:it.id,qty:qty,kind:"receive",site:siteOf(),by:user.name,day:typeof today==="function"?today():"",at:new Date().toLocaleString()});
  try{save();}catch(e){}
  alert("Received "+qty+" x "+it.name+"\nStock now "+stockOfItem(it.id));
};
window.poshMartAddItem=function(){
  if(!(user&&(user.role==="superadmin"||user.role==="frontdesk"))){alert("Super Admin or Front Desk");return;}
  var name=prompt("New mini mart item name");if(!name)return;
  var price=parseFloat(prompt("Selling price in Naira","500"));if(!(price>=0))return;
  db.martItems.push({id:"mm"+Date.now(),name:String(name).trim(),price:price});
  ensureStock();
  try{save();}catch(e){}
  alert("Added "+name+" at "+naira2(price));
};
try{draw();}catch(e){}
}
boot();
})();
