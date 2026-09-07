(function(){
  function money(n){ return typeof naira==="function"?naira(n):("NGN "+Number(n||0).toLocaleString()); }
  function folios(){
    return (DB.checkins||[]).filter(function(c){ return siteOk(c.site) && c.kind!=="laundry"; }).slice().sort(function(a,b){
      return String(a.day||a.at||"").localeCompare(String(b.day||b.at||""));
    });
  }
  function folioTable(){
    var runA=0,runP=0,runD=0;
    var body=folios().map(function(c){
      var amt=Number(c.amount||0), paid=Number(c.paid||0), debt=Number(c.debt||0);
      if(paid<=0 && amt) paid=Math.max(0,amt-debt);
      runA+=amt; runP+=paid; runD+=debt;
      return "<tr><td>"+(c.day||"")+"</td><td>"+(c.guest||"-")+"</td><td>"+c.room+"</td><td>"+(c.checkedOut?"out":"in")+"</td><td>"+money(amt)+"</td><td>"+money(paid)+"</td><td>"+money(debt)+"</td><td>"+money(runA)+"</td></tr>";
    }).join("")||"<tr><td colspan=8>No folios</td></tr>";
    return "<div class=card style='overflow:auto'><h2>Folio book (cumulative)</h2><table style='width:100%;border-collapse:collapse;font-size:13px'>"+
      "<tr><th align=left>Date</th><th>Guest</th><th>Rm</th><th>Stay</th><th>Charge</th><th>Paid</th><th>Debt</th><th>Cumulative charge</th></tr>"+
      body+
      "<tr><td colspan=4><b>Totals</b></td><td><b>"+money(runA)+"</b></td><td><b>"+money(runP)+"</b></td><td><b>"+money(runD)+"</b></td><td><b>"+money(runA)+"</b></td></tr></table></div>";
  }
  function rcTable(){
    var list=(DB.receipts||[]).filter(function(r){return siteOk(r.site);}).slice().sort(function(a,b){return String(a.day||"").localeCompare(String(b.day||""));});
    var run=0;
    var body=list.map(function(r){
      run+=Number(r.total||0);
      return "<tr><td>"+(r.day||"")+"</td><td>"+r.no+"</td><td>"+(r.guest||"-")+"</td><td>"+(r.kind||"")+"</td><td>"+money(r.total)+"</td><td>"+money(run)+"</td></tr>";
    }).join("")||"<tr><td colspan=6>No receipts</td></tr>";
    return "<div class=card style='overflow:auto'><h2>Receipts (cumulative)</h2><table style='width:100%;border-collapse:collapse;font-size:13px'>"+
      "<tr><th align=left>Date</th><th>No</th><th>Guest</th><th>Type</th><th>Amount</th><th>Cumulative</th></tr>"+
      body+"<tr><td colspan=4><b>Total</b></td><td colspan=2><b>"+money(run)+"</b></td></tr></table></div>";
  }
  function martTable(){
    var list=(DB.martSales||[]).filter(function(s){return siteOk(s.site);}).slice().sort(function(a,b){return String(a.day||"").localeCompare(String(b.day||""));});
    var run=0;
    var body=list.map(function(s){
      var amt=Number(s.amount||0); run+=amt;
      return "<tr><td>"+(s.day||"")+"</td><td>"+(s.name||"")+"</td><td>"+(s.qty||1)+"</td><td>"+money(amt)+"</td><td>"+money(run)+"</td></tr>";
    }).join("")||"<tr><td colspan=5>No mart sales</td></tr>";
    return "<div class=card style='overflow:auto'><h2>Mini mart (cumulative)</h2><table style='width:100%;border-collapse:collapse;font-size:13px'>"+
      "<tr><th align=left>Date</th><th>Item</th><th>Qty</th><th>Amount</th><th>Cumulative</th></tr>"+
      body+"<tr><td colspan=3><b>Total</b></td><td colspan=2><b>"+money(run)+"</b></td></tr></table></div>";
  }
  var _viewDesk=window.viewDesk;
  window.viewDesk=function(){
    var h=typeof _viewDesk==="function"?_viewDesk():"<h1>Desk</h1>";
    if(role()==="frontdesk"||role()==="manager"||role()==="accountant"||role()==="ceo"||role()==="superadmin"){
      h+=folioTable()+rcTable();
    }
    return h;
  };
  var _viewMart=window.viewMart;
  window.viewMart=function(){
    var h=typeof _viewMart==="function"?_viewMart():"<h1>Mart</h1>";
    h+=martTable();
    return h;
  };
  var _viewAct=window.viewAct;
  window.viewAct=function(){
    var h=typeof _viewAct==="function"?_viewAct():"<h1>Activity</h1>";
    if(role()==="manager"||role()==="ceo"||role()==="accountant"||role()==="superadmin"){
      h+=folioTable()+rcTable()+martTable();
    }
    return h;
  };
})();
