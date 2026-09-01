(function(){
function boot(){
if(typeof isAcct!=="function"||typeof viewDesk!=="function"){setTimeout(boot,80);return;}
if(window.__acctQuery)return;window.__acctQuery=true;
function naira2(n){if(typeof naira==="function")return naira(n);return "NGN "+Number(n||0).toLocaleString();}
function inRange(day,from,to){if(!day)return false;if(from&&day<from)return false;if(to&&day>to)return false;return true;}
function pack(list){
  var rooms=0,mart=0,extras=0,debt=0,paid=0;
  list.forEach(function(c){
    rooms+=Number(c.amount||0);
    var e=c.extras||{};
    mart+=Number(e.minimart||0);
    extras+=Number(e.early||0)+Number(e.late||0)+Number(e.laundry||0)+Number(e.other||0);
    debt+=Number(c.debt||0);
  });
  (db.debts||[]).forEach(function(d){
    (d.payments||[]).forEach(function(p){if(inRange(p.day,window.__aqFrom,window.__aqTo))paid+=Number(p.amount||0);});
  });
  return {rooms:rooms,mart:mart,extras:extras,billed:rooms+mart+extras,debt:debt,paid:paid,count:list.length};
}
function queryBox(){
  if(!(isAcct()||(typeof isGM==="function"&&isGM())||(typeof isSuper==="function"&&isSuper())))return "";
  var from=window.__aqFrom||(typeof today==="function"?today():"");
  var to=window.__aqTo||from;
  var list=(db.checkins||[]).filter(function(c){
    if(!inRange(c.day,from,to))return false;
    if(typeof siteMatch==="function"&&c.site&&!siteMatch(c.site)&&user.role!=="ceo"&&user.role!=="superadmin")return false;
    if((user.role==="ceo"||user.role==="superadmin")&&window.__aqSite&&c.site!==window.__aqSite)return false;
    return true;
  });
  var p=pack(list);
  var sites=[""].concat((db.sites||["Ikeja","Victoria Island"]).slice? (db.sites||[]):["Ikeja","Victoria Island"]);
  if(!db.sites)sites=["","Ikeja","Victoria Island"];
  return "<div class=card><h3>Query sales report</h3>"+
    "<p>From</p><input id=aqFrom type=date value='"+from+"'>"+
    "<p>To</p><input id=aqTo type=date value='"+to+"'>"+
    ((user.role==="ceo"||user.role==="superadmin")?("<p>Location</p><select id=aqSite><option value=''>All locations</option><option"+(window.__aqSite==="Ikeja"?" selected":"")+">Ikeja</option><option"+(window.__aqSite==="Victoria Island"?" selected":"")+">Victoria Island</option></select>"):"")+
    "<p>Room sales <b>"+naira2(p.rooms)+"</b></p>"+
    "<p>Mini mart <b>"+naira2(p.mart)+"</b></p>"+
    "<p>Extras <b>"+naira2(p.extras)+"</b></p>"+
    "<p>Total billed <b>"+naira2(p.billed)+"</b></p>"+
    "<p>New debt <b>"+naira2(p.debt)+"</b></p>"+
    "<p>Debt paid <b>"+naira2(p.paid)+"</b></p>"+
    "<p>Folios <b>"+p.count+"</b></p></div>";
}
var _vd=viewDesk;
viewDesk=function(){
  if(isAcct()||(typeof isGM==="function"&&isGM()))return queryBox()+_vd.apply(this,arguments);
  return _vd.apply(this,arguments);
};
var _b=bind;
bind=function(){
  _b();
  function run(){
    window.__aqFrom=(document.getElementById("aqFrom")&&document.getElementById("aqFrom").value)||"";
    window.__aqTo=(document.getElementById("aqTo")&&document.getElementById("aqTo").value)||window.__aqFrom;
    var s=document.getElementById("aqSite");window.__aqSite=s?s.value:"";
    window.__poshForceDraw=true;draw();
  }
  ["aqFrom","aqTo","aqSite"].forEach(function(id){
    var el=document.getElementById(id);if(el)el.onchange=run;
  });
  if(document.getElementById("aqFrom")&&!document.getElementById("aqGo")){
    var b=document.createElement("button");b.id="aqGo";b.className="btn";b.textContent="Query report";
    document.getElementById("aqFrom").parentNode.appendChild(b);
    b.onclick=run;
  }
};
try{draw();}catch(e){}
}
boot();
})();
