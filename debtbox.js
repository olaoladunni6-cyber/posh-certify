(function(){
function boot(){
if(typeof viewDesk!=="function"){setTimeout(boot,80);return;}
if(window.__debtBox)return;window.__debtBox=true;
if(!db.debts)db.debts=[];
var _vd=viewDesk;
viewDesk=function(){
  var html=_vd.apply(this,arguments);
  return html.replace(
    "<p>Debt (unpaid balance)</p><input id=cinDebt type=number min=0 placeholder='Amount on debt'><input id=cinDebtNote placeholder='Why debt / due date'>",
    "<p>New debt today</p><input id=cinDebt type=number min=0 placeholder='New debt taken today'><input id=cinDebtNote placeholder='Why this new debt'>"+
    "<p>Outstanding paid today</p><input id=cinPaid type=number min=0 placeholder='Old debt collected today'><input id=cinPaidNote placeholder='Who paid / receipt no'>"
  );
};
function applyPaid(amt,note,guest,room){
  if(!(amt>0))return 0;
  var left=amt;
  (db.debts||[]).filter(function(d){return Number(d.remaining||0)>0&&siteMatch(d.site);}).forEach(function(d){
    if(left<=0)return;
    var take=Math.min(left,Number(d.remaining||0));
    d.payments=d.payments||[];
    d.payments.push({id:"p"+Date.now(),amount:take,note:note||"Outstanding paid today",by:user.name,guest:guest||"",room:room||"",day:today(),at:new Date().toLocaleString()});
    d.remaining=Math.max(0,Number(d.remaining||0)-take);
    left-=take;
  });
  if(left>0){
    db.debts.push({id:"dbpay"+Date.now(),guest:guest||"Payment",room:room||"",site:workSite(),amount:0,remaining:0,note:"Unallocated payment "+left,by:user.name,day:today(),at:new Date().toLocaleString(),payments:[{id:"p"+Date.now(),amount:left,note:note||"Paid today",by:user.name,day:today(),at:new Date().toLocaleString()}]});
  }
  return amt;
}
window.applyDebtPaidToday=applyPaid;
var _b=bind;
bind=function(){
  _b();
  var save=document.getElementById("saveCin");
  if(!save||save.getAttribute("data-debtbox"))return;
  save.setAttribute("data-debtbox","1");
  var prev=save.onclick;
  save.onclick=function(){
    if(prev)prev();
    var paid=parseFloat((document.getElementById("cinPaid")&&document.getElementById("cinPaid").value)||"0")||0;
    var note=(document.getElementById("cinPaidNote")&&document.getElementById("cinPaidNote").value||"").trim();
    var guest=(document.getElementById("cinName")&&document.getElementById("cinName").value||"").trim();
    var room=(document.getElementById("cinRoom")&&document.getElementById("cinRoom").value)||"";
    if(paid>0){applyPaid(paid,note,guest,room);try{save();}catch(e){}}
  };
};
try{draw();}catch(e){}
}
boot();
})();
