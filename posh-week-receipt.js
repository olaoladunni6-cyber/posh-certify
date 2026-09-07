(function(){
  function money(n){ return typeof naira==="function"?naira(n):("NGN "+Number(n||0).toFixed(0)); }
  function nextNo(){
    DB.receipts=DB.receipts||[];
    return "PHS-"+(DB.receipts.length+1).toString().padStart(4,"0")+"-"+String(Date.now()).slice(-4);
  }
  window.issueReceipt=function(rec){
    if(!DB) return null;
    DB.receipts=DB.receipts||[];
    rec.id=rec.id||("rc"+Date.now());
    rec.no=rec.no||nextNo();
    rec.at=rec.at||(typeof now==="function"?now():new Date().toISOString());
    rec.day=rec.day||(typeof today==="function"?today():"");
    rec.site=rec.site||(USER&&USER.site)||"";
    rec.by=rec.by||(USER&&USER.name)||"";
    rec.lines=rec.lines||[];
    rec.total=Number(rec.total||0);
    rec.paid=Number(rec.paid!=null?rec.paid:rec.total);
    rec.debt=Number(rec.debt||0);
    DB.receipts.push(rec);
    try{ save(); }catch(e){}
    return rec;
  };
  function slipHtml(r){
    var lines=(r.lines||[]).map(function(l){
      return "<tr><td>"+l.item+"</td><td style='text-align:right'>"+money(l.amount)+"</td></tr>";
    }).join("")||"<tr><td>"+(r.desc||r.kind||"Sale")+"</td><td style='text-align:right'>"+money(r.total)+"</td></tr>";
    return "<div id=poshSlip style='font-family:Georgia,serif;max-width:360px;margin:0 auto;padding:18px;border:1px solid #1c332c;background:#fff;color:#1c332c'>"+
      "<div style='text-align:center;border-bottom:2px solid #c4a35a;padding-bottom:8px'>"+
      "<div style='letter-spacing:3px;font-size:11px'>POSH HOTELS & SUITES</div>"+
      "<div style='font-size:20px;font-weight:700'>Digital Receipt</div>"+
      "<div>"+(r.site||"Nigeria")+"</div></div>"+
      "<p>No. <b>"+r.no+"</b><br>"+r.day+" · "+r.at+"<br>Cashier: "+r.by+"</p>"+
      "<p>Guest: <b>"+(r.guest||"-")+"</b><br>Room: <b>"+(r.room||"-")+"</b></p>"+
      "<table style='width:100%;border-collapse:collapse'>"+lines+
      "<tr><td style='padding-top:8px'><b>Total</b></td><td style='text-align:right;padding-top:8px'><b>"+money(r.total)+"</b></td></tr>"+
      "<tr><td>Paid</td><td style='text-align:right'>"+money(r.paid)+"</td></tr>"+
      "<tr><td>Outstanding</td><td style='text-align:right'>"+money(r.debt)+"</td></tr></table>"+
      "<p style='font-size:12px;margin-top:14px;text-align:center'>Thank you for staying with Posh.<br>This is a digital receipt. Keep for your records.</p></div>";
  }
  function slipText(r){
    var lines=(r.lines||[]).map(function(l){ return l.item+": "+money(l.amount); }).join("\n");
    return "POSH HOTELS & SUITES\nDigital Receipt "+r.no+"\n"+r.site+"\n"+r.day+"\nGuest: "+(r.guest||"-")+"  Rm "+(r.room||"-")+"\n"+(lines||(r.desc||""))+"\nTotal "+money(r.total)+"\nPaid "+money(r.paid)+"\nOutstanding "+money(r.debt)+"\nCashier "+r.by;
  }
  window.showReceipt=function(id){
    var r=(DB.receipts||[]).filter(function(x){return x.id===id || x.no===id;})[0];
    if(!r){ alert("Receipt not found"); return; }
    var w=window.open("","poshRc","width=400,height=640");
    if(!w){ alert(slipText(r)); return; }
    w.document.write("<html><head><title>"+r.no+"</title></head><body>"+slipHtml(r)+"<p style='text-align:center'><button onclick='window.print()'>Print / Save PDF</button></p></body></html>");
    w.document.close();
  };
  function list(){
    return (DB.receipts||[]).filter(function(r){ return typeof siteOk==="function"?siteOk(r.site):true; }).slice().reverse();
  }
  var _viewDesk=window.viewDesk;
  window.viewDesk=function(){
    var h=typeof _viewDesk==="function"?_viewDesk():"<h1>Desk</h1>";
    if(role()==="frontdesk"||role()==="accountant"||role()==="manager"||role()==="ceo"||role()==="superadmin"||role()==="porter"){
      h+="<div class=card><h2>Digital receipts</h2>"+(list().slice(0,30).map(function(r){
        return "<p><b>"+r.no+"</b> · "+(r.guest||"-")+" Rm "+(r.room||"-")+" · "+money(r.total)+" · "+r.kind+
          " <button type=button class='btn openRc' data-id='"+r.id+"'>Open</button> "+
          "<button type=button class='btn waRc' data-id='"+r.id+"'>WhatsApp</button></p>";
      }).join("")||"<p>No receipts yet</p>")+"</div>";
    }
    return h;
  };
  var _viewAct=window.viewAct;
  window.viewAct=function(){
    var h=typeof _viewAct==="function"?_viewAct():"<h1>Activity</h1>";
    h+="<div class=card><h2>Receipts today</h2>"+list().filter(function(r){return r.day===(typeof today==="function"?today():r.day);}).map(function(r){
      return "<p>"+r.no+" · "+r.guest+" · "+money(r.total)+"</p>";
    }).join("")+"</div>";
    return h;
  };
  var _bind=window.bind;
  window.bind=function(){
    if(typeof _bind==="function") _bind();
    var folio=document.getElementById("saveFolio");
    if(folio){
      var prev=folio.onclick;
      folio.onclick=function(){
        var name=(document.getElementById("gName")&&document.getElementById("gName").value||"").trim();
        var num=document.getElementById("gRoom")?document.getElementById("gRoom").value:"";
        var amt=parseFloat((document.getElementById("gAmt")||{}).value)||0;
        var debt=parseFloat((document.getElementById("gDebt")||{}).value)||0;
        var paid=parseFloat((document.getElementById("gPaid")||{}).value)||0;
        if(paid<=0 && amt>0) paid=amt-debt;
        var extra=(document.getElementById("gExtra")&&document.getElementById("gExtra").value)||"";
        var before=(DB.checkins||[]).length;
        if(typeof prev==="function") prev.call(folio);
        if((DB.checkins||[]).length>before || (name&&amt>=0)){
          var rec=window.issueReceipt({
            kind:"room",
            guest:name,
            room:num,
            total:amt,
            paid:paid,
            debt:debt,
            lines:[{item:"Room "+num+(extra?(" · "+extra):""),amount:amt}]
          });
          if(rec) setTimeout(function(){ window.showReceipt(rec.id); },200);
        }
      };
    }
    var sell=document.getElementById("sellMart");
    if(sell){
      var ps=sell.onclick;
      sell.onclick=function(){
        var id=document.getElementById("mItem")?document.getElementById("mItem").value:"";
        var qty=parseInt((document.getElementById("mQty")||{}).value,10)||1;
        var it=(DB.martItems||[]).filter(function(x){return x.id===id;})[0];
        if(typeof ps==="function") ps.call(sell);
        if(it){
          var rec=window.issueReceipt({
            kind:"mini mart",
            guest:"Walk-in / in-house",
            room:"-",
            total:qty*Number(it.price||0),
            paid:qty*Number(it.price||0),
            lines:[{item:qty+" x "+it.name,amount:qty*Number(it.price||0)}]
          });
          if(rec) setTimeout(function(){ window.showReceipt(rec.id); },200);
        }
      };
    }
    var wash=document.getElementById("sendWash");
    if(wash){
      var pw=wash.onclick;
      wash.onclick=function(){
        var g=(document.getElementById("wGuest")||{}).value||"";
        var rm=(document.getElementById("wRoom")||{}).value||"";
        var before=(DB.guestWashes||[]).length;
        if(typeof pw==="function") pw.call(wash);
        var last=(DB.guestWashes||[])[(DB.guestWashes||[]).length-1];
        if(last && (DB.guestWashes||[]).length>before){
          var rec=window.issueReceipt({
            kind:"guest laundry",
            guest:last.guest||g,
            room:last.room||rm,
            total:last.amount||0,
            paid:last.amount||0,
            lines:[{item:last.service||"Laundry",amount:last.amount||0}]
          });
          if(rec) setTimeout(function(){ window.showReceipt(rec.id); },200);
        }
      };
    }
    document.querySelectorAll(".openRc").forEach(function(b){
      b.onclick=function(){ window.showReceipt(b.getAttribute("data-id")); };
    });
    document.querySelectorAll(".waRc").forEach(function(b){
      b.onclick=function(){
        var r=(DB.receipts||[]).filter(function(x){return x.id===b.getAttribute("data-id");})[0];
        if(!r) return;
        window.open("https://wa.me/?text="+encodeURIComponent(slipText(r)),"_blank");
      };
    });
  };
})();
