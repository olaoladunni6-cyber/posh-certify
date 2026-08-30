(function(){
if(typeof db==="undefined")return;
function isLinenId(id){return linenItems().some(function(it){return it.id===id;});}
function addLinen(map,id,n){if(!isLinenId(id))return;n=Number(n||0);if(!n)return;map[id]=(map[id]||0)+n;}
function inMonthDay(day){return String(day||"").slice(0,7)===monthKey();}
function linenPack(scope){
  var sent={},recv={},issued={},miss={},restock={},short={};
  (db.slips||[]).forEach(function(s){
    if(!siteMatch(s.site))return;
    var d=s.day||"";
    if(scope==="month"){if(d&&!inMonthDay(d))return;}
    else if(d!==today())return;
    Object.keys(s.items||{}).forEach(function(k){addLinen(sent,k,s.items[k]);});
    if(s.status==="received"){
      var rec=s.receivedItems||s.items||{};
      Object.keys(rec).forEach(function(k){addLinen(recv,k,rec[k]);});
      Object.keys(s.items||{}).forEach(function(k){
        var a=Number((s.items||{})[k]||0),b=Number(rec[k]||0);
        if(a>b)addLinen(short,k,a-b);
      });
    }
  });
  (db.linenIssues||[]).forEach(function(x){
    if(!siteMatch(x.site))return;
    var d=x.day||"";
    if(scope==="month"){if(d&&!inMonthDay(d))return;}
    else if(d!==today())return;
    Object.keys(x.items||{}).forEach(function(k){addLinen(issued,k,x.items[k]);});
  });
  siteRooms().forEach(function(r){
    Object.keys(r.missing||{}).forEach(function(k){addLinen(miss,k,r.missing[k]);});
  });
  (db.supplies||[]).forEach(function(s){
    if(s.dest!=="laundry"||!siteMatch(s.site))return;
    var d=s.day||"";
    if(scope==="month"){if(d&&!inMonthDay(d))return;}
    else if(d!==today())return;
    addLinen(restock,s.item,s.qty);
  });
  var ids={};
  [sent,recv,issued,miss,restock,short].forEach(function(m){Object.keys(m).forEach(function(k){ids[k]=1;});});
  return {sent:sent,recv:recv,issued:issued,miss:miss,restock:restock,short:short,ids:Object.keys(ids)};
}
function lossPieces(p){return p.ids.reduce(function(n,id){return n+Number(p.miss[id]||0)+Number(p.short[id]||0)+Number(p.restock[id]||0);},0);}
function viewLinenLoss(){
  if(!(isLaundry()||mgr()||isGM()||isSuper()))return "";
  function table(title,scope){
    var p=linenPack(scope);
    if(!p.ids.length)return "<div class=card><h3>"+title+"</h3><p>No linen movement yet.</p></div>";
    var rows=p.ids.map(function(id){
      var loss=Number(p.miss[id]||0)+Number(p.short[id]||0)+Number(p.restock[id]||0);
      return "<p><b>"+itemName(id)+"</b><br>Sent dirty "+(p.sent[id]||0)+" · received "+(p.recv[id]||0)+" · short on receive "+(p.short[id]||0)+"<br>Issued clean "+(p.issued[id]||0)+" · missing on rooms now "+(p.miss[id]||0)+" · store restock "+(p.restock[id]||0)+"<br>Loss count <b>"+loss+"</b></p>";
    }).join("");
    return "<div class=card><h3>"+title+"</h3><p>Loss = missing on rooms + short when laundry received + store restock (replacement only).</p>"+rows+"<p><b>Total pieces: "+lossPieces(p)+"</b></p></div>";
  }
  return "<h1>Linen loss</h1>"+table("Today · "+today(),"day")+table("This month · "+monthKey(),"month");
}
var _slips=viewSlips;
viewSlips=function(){
  var html=_slips();
  var open=(db.slips||[]).filter(function(s){return s.status==="sent"&&siteMatch(s.site);});
  var extra=open.map(function(s){
    if(!isLaundry())return "";
    var rec=linenItems().map(function(it){var n=Number((s.items||{})[it.id]||0);return "<div class=row><span>"+it.name+" sent "+n+"</span><input class=rq type=number min=0 data-slip='"+s.id+"' data-item='"+it.id+"' value='"+(n||"")+"'></div>";}).join("");
    return rec?"<div class=card><b>Count received · Rm "+s.room+"</b>"+rec+"</div>":"";
  }).join("");
  return viewLinenLoss()+extra+html.replace("Received from store today","Replacement / restock from store");
};
var _vs=viewStaff;
viewStaff=function(){
  var html=_vs();
  if(mgr()||isGM()||isSuper())return viewLinenLoss()+html;
  return html;
};
var _vb=viewBoard;
viewBoard=function(){
  var html=_vb();
  if(isGM())return viewLinenLoss()+html;
  return html;
};
var _b=bind;
bind=function(){
  _b();
  document.querySelectorAll(".recv").forEach(function(b){
    var prev=b.onclick;
    b.onclick=function(){
      if(!isLaundry())return;
      var id=b.getAttribute("data-id");
      var s=(db.slips||[]).filter(function(x){return x.id===id;})[0];
      if(s){
        var rec={};
        document.querySelectorAll(".rq[data-slip='"+id+"']").forEach(function(inp){
          var n=parseInt(inp.value,10);if(n>0)rec[inp.getAttribute("data-item")]=n;
        });
        if(Object.keys(rec).length)s.receivedItems=rec;
        s.day=s.day||today();
      }
      if(prev)prev.call(b);
      else{if(s){s.status="received";s.receivedBy=user.name;}save();draw();}
    };
  });
  var sendL=document.getElementById("sendL");
  if(sendL){
    var prevSend=sendL.onclick;
    sendL.onclick=function(){
      if(prevSend)prevSend.call(sendL);
      var last=(db.slips||[])[(db.slips||[]).length-1];
      if(last&&!last.day){last.day=today();save();}
    };
  }
};
draw();
})();
