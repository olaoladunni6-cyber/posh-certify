(function(){
  function itemName(id){
    var it=(DB.lauItems||[]).filter(function(x){return x.id===id})[0];
    return it?it.name:id;
  }
  function lines(items){
    if(!items) return "<p>No item counts</p>";
    if(typeof items!=="object") return "<p>"+items+"</p>";
    return Object.keys(items).map(function(k){
      return "<p>"+itemName(k)+": <b>"+items[k]+"</b></p>";
    }).join("")||"<p>No item counts</p>";
  }
  var _viewLaundry=window.viewLaundry;
  window.viewLaundry=function(){
    var h=typeof _viewLaundry==="function"?_viewLaundry():"<h1>Laundry</h1>";
    h=h.replace(/Housekeeper dirty bags/g,"Housekeeper items received");
    h=h.replace(/No HK bags/g,"No HK item slips");
    h=h.replace(/Dirty received/g,"Items received");
    var block="<div class=card><h2>Housekeeper items (not bags)</h2>";
    block+=((DB.slips||[]).filter(function(s){return siteOk(s.site)}).slice().reverse().map(function(s){
      var rec="";
      if(role()==="laundry" && s.status==="sent"){
        rec="<p>Enter qty actually received per item</p>";
        Object.keys(s.items||{}).forEach(function(k){
          rec+="<label>"+itemName(k)+" sent "+s.items[k]+" · received <input class=rcv data-slip='"+s.id+"' data-item='"+k+"' type=number value='"+s.items[k]+"'></label>";
        });
        rec+="<button type=button class='btn recItems' data-id='"+s.id+"'>Confirm items received</button>";
      } else {
        rec=lines(s.received||s.items)+"<p>Status: "+s.status+"</p>";
        if(role()==="laundry" && s.status==="received") rec+="<button type=button class='btn issSlip' data-id='"+s.id+"'>Issue same items clean</button>";
      }
      return "<div class=card><b>Rm "+s.room+"</b> · "+(s.by||"")+"<br>Sent:"+lines(s.items)+rec+"</div>";
    }).join("")||"<p>No housekeeper item slips</p>");
    block+="</div>";
    return h+block;
  };
  var _bind=window.bind;
  window.bind=function(){
    if(typeof _bind==="function") _bind();
    document.querySelectorAll(".recItems").forEach(function(b){
      b.onclick=function(){
        var id=b.getAttribute("data-id");
        var s=(DB.slips||[]).filter(function(x){return x.id===id})[0];
        if(!s) return;
        var rec={};
        document.querySelectorAll(".rcv[data-slip='"+id+"']").forEach(function(inp){
          rec[inp.getAttribute("data-item")]=parseInt(inp.value,10)||0;
        });
        s.received=rec; s.status="received"; s.receivedAt=now(); s.receivedBy=USER.name;
        Object.keys(rec).forEach(function(k){
          DB.lauMoves.push({kind:"received_dirty",item:k,qty:rec[k],site:s.site,by:USER.name,at:now(),room:s.room});
        });
        save(); alert("Items received logged"); draw();
      };
    });
  };
})();
