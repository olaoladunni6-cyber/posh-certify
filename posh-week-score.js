(function(){
  function penaltyOf(s){
    var k=String(s.score||s.kind||"").toLowerCase();
    if(s.penalty!=null && s.penalty!=="") return Number(s.penalty)||0;
    if(k==="unsatisfactory"||k==="return"||k==="returned") return 500;
    if(k==="no salary"||k==="nosalary"||k==="no-pay") return 0;
    return 0;
  }
  function rows(){
    return (DB.scores||[]).filter(function(s){ return siteOk(s.site); }).slice().sort(function(a,b){
      return String(a.day||a.at||"").localeCompare(String(b.day||b.at||""));
    });
  }
  window.viewPay=function(){
    var list=rows();
    var run=0, by={};
    var body=list.map(function(s){
      var p=penaltyOf(s);
      run+=p;
      var hk=s.hk||s.name||s.who||"-";
      by[hk]=by[hk]||{n:0,p:0,uns:0,ok:0,none:0};
      by[hk].n++; by[hk].p+=p;
      var k=String(s.score||"").toLowerCase();
      if(k==="unsatisfactory"||k==="return") by[hk].uns++;
      else if(k==="no salary") by[hk].none++;
      else by[hk].ok++;
      return "<tr><td>"+(s.day||(s.at||"").slice(0,10))+"</td><td>"+hk+"</td><td>"+(s.room||"-")+"</td><td>"+(s.score||"-")+"</td><td>"+(s.remark||s.note||"-")+"</td><td>"+(p?naira(p):"-")+"</td><td>"+naira(run)+"</td></tr>";
    }).join("")||"<tr><td colspan=7>No scores yet</td></tr>";
    var sum=Object.keys(by).map(function(n){
      return "<tr><td colspan=2><b>"+n+"</td><td colspan=3>OK "+by[n].ok+" · Unsat "+by[n].uns+" · No salary "+by[n].none+"</td><td colspan=2><b>"+naira(by[n].p)+"</b></td></tr>";
    }).join("");
    var form="";
    if(role()==="manager"||role()==="superadmin"){
      var hks=(DB.users||[]).filter(function(u){return u.role==="housekeeper"&&siteOk(u.site);});
      form="<div class=card><h2>Score housekeeper</h2><select id=scHk>"+hks.map(function(u){return "<option value='"+u.name+"'>"+u.name+"</option>"}).join("")+"</select>"+
        "<input id=scRm placeholder='Room'><select id=scVal><option>satisfactory</option><option>unsatisfactory</option><option>no salary</option></select>"+
        "<input id=scRk placeholder='Remark'><button type=button class=btn id=saveScore>Save score</button><p>Unsatisfactory = ₦500 penalty. No salary = day not paid (listed, penalty 0 here).</p></div>";
    }
    return "<h1>Housekeeper scores</h1>"+form+
      "<div class=card style='overflow:auto'><table style='width:100%;border-collapse:collapse;font-size:13px'>"+
      "<tr><th style='text-align:left'>Date</th><th>Housekeeper</th><th>Room</th><th>Score</th><th>Remark</th><th>Penalty</th><th>Cumulative</th></tr>"+
      body+
      "<tr><td colspan=5><b>Total penalties</b></td><td colspan=2><b>"+naira(run)+"</b></td></tr>"+
      sum+
      "</table></div>";
  };
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
      var pen=sc==="unsatisfactory"?500:0;
      DB.scores=DB.scores||[];
      DB.scores.push({hk:hk,room:rm,score:sc,remark:rk,penalty:pen,day:today(),at:now(),site:USER.site,by:USER.name});
      save(); alert(hk+" — "+sc+(pen?(" ₦"+pen):"")); draw();
    };
    document.querySelectorAll(".score").forEach(function(btn){
      var prev=btn.onclick;
      btn.onclick=function(ev){
        var remark=prompt("Remark for this score","")||"";
        var sc=btn.getAttribute("data-s");
        var rid=btn.getAttribute("data-id");
        var r=findRoom(rid);
        var pen=sc==="unsatisfactory"?500:0;
        DB.scores=DB.scores||[];
        DB.scores.push({hk:r&&r.hkName||"",room:r&&r.number||"",score:sc,remark:remark,penalty:pen,day:today(),at:now(),site:USER.site,by:USER.name});
        save();
        if(typeof prev==="function") try{ prev.call(btn,ev); }catch(e){}
        draw();
      };
    });
  };
})();
