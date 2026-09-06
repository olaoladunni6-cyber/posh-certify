(function(){
  function liveGuest(num){
    return (DB.checkins||[]).filter(function(c){
      return String(c.room)===String(num) && c.kind!=="laundry" && !c.checkedOut;
    }).pop();
  }
  function sellable(){
    return rooms().filter(function(r){
      if(r.status==="ooo") return false;
      if(r.status==="occupied") return false;
      if(liveGuest(r.number)) return false;
      return r.status==="certified";
    });
  }
  var _viewDesk=window.viewDesk;
  window.viewDesk=function(){
    var h=typeof _viewDesk==="function"?_viewDesk():"<h1>Front desk</h1>";
    var sel=sellable();
    var opts=sel.map(function(r){return "<option>"+r.number+"</option>"}).join("");
    if(!opts) opts="<option value=''>No certified vacant room</option>";
    h=h.replace(/<select id=gRoom>[\s\S]*?<\/select>/, "<select id=gRoom>"+opts+"</select>");
    var inhouse=(DB.checkins||[]).filter(function(c){ return siteOk(c.site) && c.kind!=="laundry" && !c.checkedOut; }).slice().reverse();
    h+="<div class=card><h2>In-house now (must check out before next guest)</h2>"+(inhouse.map(function(c){
      return "<p><b>"+c.guest+"</b> Rm "+c.room+" · out date "+(c.checkout||"-")+" · "+naira(c.amount)+" <button type=button class='btn coG' data-id='"+(c.id||c.guest+c.room)+"' data-room='"+c.room+"'>Check out</button></p>";
    }).join("")||"<p>None in house</p>")+"</div>";
    return h;
  };
  var _bind=window.bind;
  window.bind=function(){
    if(typeof _bind==="function") _bind();
    var btn=document.getElementById("saveFolio");
    if(btn){
      btn.onclick=function(){
        var name=(document.getElementById("gName").value||"").trim();
        var num=document.getElementById("gRoom").value;
        var out=document.getElementById("gOut").value;
        var r=byNum(num);
        if(!name||!r){ alert("Guest and room required"); return; }
        if(r.status==="occupied" || liveGuest(num)){
          alert("Rm "+num+" already has a guest. Check that guest out first.");
          return;
        }
        if(r.status!=="certified"){
          alert("Only a vacant certified room can be sold. Status is "+r.status);
          return;
        }
        if(!out){ alert("Check-out date required"); return; }
        DB.checkins.push({
          id:"ci"+Date.now(),
          guest:name,
          room:num,
          amount:parseFloat(document.getElementById("gAmt").value)||0,
          debt:parseFloat((document.getElementById("gDebt")||{}).value)||0,
          paid:parseFloat((document.getElementById("gPaid")||{}).value)||0,
          checkout:out,
          site:USER.site,
          by:USER.name,
          day:today(),
          kind:"stay",
          checkedOut:false
        });
        r.status="occupied";
        r.guest=name;
        r.checkOut=out;
        if(typeof note==="function") note("Check-in "+name+" Rm "+num);
        save();
        alert("Checked in "+name+" Rm "+num+". Room locked until check-out.");
        draw();
      };
    }
    document.querySelectorAll(".coG").forEach(function(b){
      b.onclick=function(){
        var room=b.getAttribute("data-room");
        var id=b.getAttribute("data-id");
        (DB.checkins||[]).forEach(function(c){
          if(!c.checkedOut && String(c.room)===String(room) && (String(c.id)===String(id) || !c.id)){
            c.checkedOut=true; c.outAt=now();
          }
        });
        var r=byNum(room);
        if(r){
          r.status="pending";
          r.guest="";
          r.hk=""; r.hkName=""; r.videoReady=false; r.check=false; r.videoWatched=false;
        }
        if(typeof note==="function") note("Check-out Rm "+room);
        save();
        alert("Checked out Rm "+room+". Room is vacant and needs housekeeping before the next sale.");
        draw();
      };
    });
  };
})();
