(function(){
  function penaltyOf(s){
    var k=String(s.score||s.kind||s.r||"").toLowerCase();
    if(s.penalty!=null && s.penalty!=="") return Number(s.penalty)||0;
    if(k==="unsatisfactory"||k==="unsat"||k==="return"||k==="returned"||k==="rts") return 500;
    return 0;
  }
  function label(s){
    var k=String(s.score||s.r||"").toLowerCase();
    if(k==="sat"||k==="satisfactory") return "satisfactory";
    if(k==="unsat"||k==="unsatisfactory") return "unsatisfactory";
    if(k==="nosal"||k==="no salary"||k==="nosalary") return "no salary";
    if(k==="return"||k==="returned"||k==="rts") return "return";
    return s.score||s.r||"-";
  }
  function rows(){
    return (DB.scores||[]).filter(function(s){ return siteOk(s.site); }).slice().sort(function(a,b){
      return String(a.day||a.at||"").localeCompare(String(b.day||b.at||""));
    });
  }
  function page(){
    var list=rows();
    var run=0, by={};
    var body=list.map(function(s){
      var p=penaltyOf(s); run+=p;
      var hk=s.hk||s.name||s.who||"-";
      by[hk]=by[hk]||{ok:0,uns:0,ret:0,none:0,p:0};
      var lb=label(s);
      if(lb==="unsatisfactory") by[hk].uns++;
      else if(lb==="return") by[hk].ret++;
      else if(lb==="no salary") by[hk].none++;
      else by[hk].ok++;
      by[hk].p+=p;
      return "<tr><td>"+(s.day||String(s.at||"").slice(0,10))+"</td><td>"+hk+"</td><td>"+(s.room||"-")+"</td><td>"+lb+"</td><td>"+(s.remark||s.note||"-")+"</td><td>"+(p?naira(p):"-")+"</td><td>"+naira(run)+"</td></tr>";
    }).join("")||"<tr><td colspan=7>No scores yet</td></tr>";
    var sum=Object.keys(by).map(function(n){
      return "<tr><td colspan=2><b>"+n+"</b></td><td colspan=3>Satisfactory "+by[n].ok+" · Unsatisfactory "+by[n].uns+" · Returns "+by[n].ret+" · No salary "+by[n].none+"</td><td colspan=2><b>"+naira(by[n].p)+"</b></td></tr>";
    }).join("");
    var form="";
    if(role()==="manager"||role()==="superadmin"||role()==="ceo"){
      var listHk=(typeof hks==="function"?hks():[]);
      form="<div class=card><h2>Score housekeeper (duty manager)</h2>"+
        "<select id=scHk>"+listHk.map(function(u){return "<option value='"+u.name+"'>"+u.name+"</option>";}).join("")+"</select>"+
        "<input id=scRm placeholder='Room number'>"+
        "<select id=scVal><option value='satisfactory'>Satisfactory — full pay</option><option value='unsatisfactory'>Unsatisfactory — ₦500</option><option value='return'>Return / reclean — ₦500</option><option value='no salary'>No salary — day not paid</option></select>"+
        "<input id=scRk placeholder='Remark (required for unsat / return / no salary)'>"+
        "<button type=button class=btn id=saveScore>Save score</button>"+
        "<p>Satisfactory = full day pay. Unsatisfactory or each return = ₦500. Abandoned / incomplete = no salary for that day.</p></div>";
    }
    return "<h1>Housekeeper scores</h1>"+form+
      "<div class=card style='overflow:auto'><table style='width:100%;border-collapse:collapse;font-size:13px'>"+
      "<tr><th align=left>Date</th><th>Housekeeper</th><th>Room</th><th>Score</th><th>Remark</th><th>Penalty</th><th>Cumulative</th></tr>"+
      body+
      "<tr><td colspan=5><b>Total penalties to date</b></td><td colspan=2><b>"+naira(run)+"</b></td></tr>"+
      sum+"</table></div>";
  }
  window.viewScore=page;
  window.viewPay=page;
  function addScore(hk,room,sc,remark){
    var lb=String(sc||"").toLowerCase();
    if(lb==="sat") lb="satisfactory";
    if(lb==="unsat") lb="unsatisfactory";
    if(lb==="nosal") lb="no salary";
    if(lb==="rts") lb="return";
    if((lb==="unsatisfactory"||lb==="return"||lb==="no salary") && !(remark||"").trim()){
      remark=prompt("Remark for "+lb,"")||"";
    }
    var pen=(lb==="unsatisfactory"||lb==="return")?500:0;
    DB.scores=DB.scores||[];
    DB.scores.push({hk:hk,room:room||"",score:lb,remark:remark||"",penalty:pen,day:today(),at:now(),site:USER.site,by:USER.name});
    if(typeof note==="function") note("HK score "+hk+" "+lb+(pen?(" ₦"+pen):"")+" "+(remark||""));
    save();
  }
  var _bind=window.bind;
  window.bind=function(){
    if(typeof _bind==="function") _bind();
    var b=document.getElementById("saveScore");
    if(b) b.onclick=function(){
      var hk=document.getElementById("scHk").value;
      var sc=document.getElementById("scVal").value;
      var rm=(document.getElementById("scRm").value||"").trim();
      var rk=(document.getElementById("scRk").value||"").trim();
      if(!hk){ alert("Pick housekeeper"); return; }
      if((sc==="unsatisfactory"||sc==="return"||sc==="no salary") && !rk){ alert("Remark required"); return; }
      addScore(hk,rm,sc,rk);
      alert(hk+" — "+sc+(sc==="unsatisfactory"||sc==="return"?" ₦500":""));
      draw();
    };
    document.querySelectorAll(".sc").forEach(function(btn){
      btn.onclick=function(){
        var id=btn.getAttribute("data-id");
        var r=btn.getAttribute("data-r");
        var u=(DB.users||[]).filter(function(x){return x.id===id;})[0];
        addScore(u?u.name:id,"",r,"");
        draw();
      };
    });
    document.querySelectorAll("#rts").forEach(function(btn){
      var prev=btn.onclick;
      btn.onclick=function(ev){
        var r=findRoom(ROOM);
        addScore(r&&r.hkName||"",r&&r.number||"","return","Returned for reclean");
        if(typeof prev==="function") prev.call(btn,ev);
      };
    });
  };
})();
