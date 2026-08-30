(function(){
if(typeof db==="undefined")return;
if(!db.stock)db.stock={};
function isLinenId(id){return linenItems().some(function(it){return it.id===id;});}
function addLinen(map,id,n){if(!isLinenId(id))return;n=Number(n||0);if(!n)return;map[id]=(map[id]||0)+n;}
function inMonthDay(day){return String(day||"").slice(0,7)===monthKey();}
function dirtyOpen(){
  var map={};
  (db.slips||[]).forEach(function(s){
    if(!siteMatch(s.site)||s.status!=="sent")return;
    Object.keys(s.items||{}).forEach(function(k){addLinen(map,k,s.items[k]);});
  });
  return map;
}
function dirtyIn(){
  var map={};
  (db.slips||[]).forEach(function(s){
    if(!siteMatch(s.site)||s.status!=="received"||s.washed)return;
    var rec=s.receivedItems||s.items||{};
    Object.keys(rec).forEach(function(k){addLinen(map,k,rec[k]);});
  });
  return map;
}
function missNow(){
  var map={};
  siteRooms().forEach(function(r){
    Object.keys(r.missing||{}).forEach(function(k){addLinen(map,k,r.missing[k]);});
  });
  return map;
}
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
function viewLinenInv(){
  if(!(isLaundry()||mgr()||isGM()||isSuper()))return "";
  var dOpen=dirtyOpen(),dIn=dirtyIn(),miss=missNow();
  var can=isLaundry()||isSuper();
  var rows=linenItems().map(function(it){
    var clean=stockOf(it.id),par=parOf(it.id),low=clean<par;
    var act=can?"<input class=linv type=number min=0 data-item='"+it.id+"' placeholder='Qty'><button class='btn setLinv' data-id='"+it.id+"'>Set clean count</button> <button class='btn dark addLinv' data-id='"+it.id+"'>Restock in</button>":"";
    return "<div class=card><b>"+it.name+"</b>"+(low?" · LOW":"")+"<br>Clean on hand <b>"+clean+"</b> · par "+par+"<br>Dirty bags waiting "+(dOpen[it.id]||0)+" · dirty in laundry "+(dIn[it.id]||0)+"<br>Missing on rooms "+(miss[it.id]||0)+"<br>"+act+"</div>";
  }).join("");
  var unwashed=(db.slips||[]).filter(function(s){return s.status==="received"&&!s.washed&&siteMatch(s.site);});
  var wash=unwashed.map(function(s){
    var rec=s.receivedItems||s.items||{};
    var sum=Object.keys(rec).map(function(k){return rec[k]+" x "+itemName(k);}).join(", ");
    return "<div class=card><b>Washed? Rm "+s.room+"</b><p>"+sum+"</p>"+(isLaundry()?"<button class='btn washL' data-id='"+s.id+"'>Add to clean stock</button>":"")+"</div>";
  }).join("");
  return "<h1>Linen inventory</h1><div class=ok>"+(seesAll()?"":workSite()+" · ")+"Clean stock is laundry's count. Dirty bags stay out of clean until you mark them washed. Issue to a room takes from clean. Restock is replacement only.</div>"+rows+(wash?"<h3>Received dirty — add after wash</h3>"+wash:"");
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
  return viewLinenInv()+viewLinenLoss()+extra+html.replace("Received from store today","Replacement / restock from store");
};
var _vs=viewStaff;
viewStaff=function(){
  var html=_vs();
  if(mgr()||isGM()||isSuper())return viewLinenInv()+viewLinenLoss()+html;
  return html;
};
var _vb=viewBoard;
viewBoard=function(){
  var html=_vb();
  if(isGM())return viewLinenInv()+viewLinenLoss()+html;
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
  document.querySelectorAll(".washL").forEach(function(b){
    b.onclick=function(){
      if(!isLaundry())return;
      var s=(db.slips||[]).filter(function(x){return x.id===b.getAttribute("data-id");})[0];
      if(!s||s.washed||!siteMatch(s.site))return;
      var rec=s.receivedItems||s.items||{};
      Object.keys(rec).forEach(function(k){moveStock(k,rec[k],"in","Washed dirty Rm "+s.room);});
      s.washed=true;s.washedBy=user.name;s.washedAt=new Date().toLocaleString();
      save();draw();
    };
  });
  document.querySelectorAll(".setLinv").forEach(function(b){
    b.onclick=function(){
      if(!(isLaundry()||isSuper()))return;
      var id=b.getAttribute("data-id");
      var el=document.querySelector(".linv[data-item='"+id+"']");
      var n=parseInt(el&&el.value,10);
      if(!(n>=0)){alert("Enter the clean count");return;}
      var cur=stockOf(id);
      if(n>cur)moveStock(id,n-cur,"in","Laundry count set");
      else if(cur>n)moveStock(id,cur-n,"out","Laundry count set");
      save();draw();
    };
  });
  document.querySelectorAll(".addLinv").forEach(function(b){
    b.onclick=function(){
      if(!(isLaundry()||isSuper()))return;
      var id=b.getAttribute("data-id");
      var el=document.querySelector(".linv[data-item='"+id+"']");
      var n=parseInt(el&&el.value,10);
      if(!(n>0)){alert("Enter restock quantity");return;}
      moveStock(id,n,"in","Laundry restock");
      db.supplies=db.supplies||[];
      db.supplies.push({id:"su"+Date.now(),day:today(),site:workSite(),dest:"laundry",room:"",item:id,qty:n,by:user.name,at:new Date().toLocaleString()});
      save();draw();
    };
  });
  var issueLinen=document.getElementById("issueLinen");
  if(issueLinen){
    var prevIss=issueLinen.onclick;
    issueLinen.onclick=function(){
      if(!isLaundry())return;
      var items={};
      document.querySelectorAll(".liq").forEach(function(inp){var n=parseInt(inp.value,10);if(n>0)items[inp.getAttribute("data-item")]=n;});
      var ok=true;
      Object.keys(items).forEach(function(k){if(ok&&stockOf(k)<items[k])ok=false;});
      if(!ok){alert("Not enough clean stock. Wash dirty bags or restock first.");return;}
      Object.keys(items).forEach(function(k){moveStock(k,items[k],"out","Issue clean");});
      if(prevIss)prevIss.call(issueLinen);
      else save();
      draw();
    };
  }
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
