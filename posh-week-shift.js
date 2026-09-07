(function(){
  function ensure(){
    if(!DB.fdChecks || !DB.fdChecks.length) DB.fdChecks=["Float counted","Keys accounted","Lobby tidy","Printer working"];
    if(!DB.fdClose || !DB.fdClose.length) DB.fdClose=["Cash reconciled","Keys returned","Lobby checked","Handover note written"];
    if(!DB.fdOut || !DB.fdOut.length) DB.fdOut=["Shift report submitted","Incidents logged","Next shift briefed","App published"];
    if(!DB.clocks) DB.clocks=[];
    if(!DB.shiftReports) DB.shiftReports=[];
  }
  function lastClock(){
    return (DB.clocks||[]).filter(function(c){return c.who===USER.id || c.who===USER.name;}).pop();
  }
  function inNow(){
    var c=lastClock();
    return c && c.action==="in";
  }
  function listHtml(arr, prefix){
    return (arr||[]).map(function(t,i){
      return "<label><input type=checkbox class="+prefix+" data-i='"+i+"'> "+t+"</label>";
    }).join("");
  }
  function editor(title, key, addId, saveClass){
    var arr=DB[key]||[];
    var h="<div class=card><h2>"+title+"</h2>";
    h+=arr.map(function(t,i){
      return "<p><input class='"+saveClass+"' data-k='"+key+"' data-i='"+i+"' value='"+String(t).replace(/"/g,""")+"'> <button type=button class='btn delCk' data-k='"+key+"' data-i='"+i+"'>Remove</button></p>";
    }).join("");
    h+="<input id='"+addId+"' placeholder='New item'><button type=button class='btn addCk' data-k='"+key+"' data-add='"+addId+"'>Add item</button> <button type=button class='btn savCk' data-k='"+key+"'>Save list</button></div>";
    return h;
  }
  var _viewDesk=window.viewDesk;
  window.viewDesk=function(){
    ensure();
    var h=typeof _viewDesk==="function"?_viewDesk():"<h1>Front desk</h1>";
    if(role()==="frontdesk"||role()==="superadmin"||role()==="manager"){
      var st=inNow()?"CLOCKED IN":"CLOCKED OUT";
      h="<div class=card style='background:#f3e6c5'><h2>Shift clock — "+st+"</h2>"+
        "<button type=button class=btn id=inBtn>Clock in</button> "+
        "<button type=button class=btn id=outBtn>Clock out</button>"+
        "<p>Last: "+(lastClock()?(lastClock().action+" "+lastClock().at):"none")+"</p></div>"+h;
      h+="<div class=card><h2>Opening checklist</h2>"+listHtml(DB.fdChecks,"opCk")+"<button type=button class=btn id=subOpen>Submit opening checklist</button></div>";
      h+="<div class=card><h2>Closing checklist</h2>"+listHtml(DB.fdClose,"clCk")+"<button type=button class=btn id=subClose>Submit closing checklist</button></div>";
      h+="<div class=card><h2>Clock-out checklist</h2>"+listHtml(DB.fdOut,"xoCk")+"<p>Tick these before Clock out.</p></div>";
    }
    return h;
  };
  var _viewLists=window.viewLists;
  window.viewLists=function(){
    ensure();
    var h=typeof _viewLists==="function"?_viewLists():"<h1>Lists</h1>";
    if(role()==="superadmin"){
      h+=editor("Front desk opening checklist","fdChecks","addOpen","edCk");
      h+=editor("Front desk closing checklist","fdClose","addClose","edCk");
      h+=editor("Front desk clock-out checklist","fdOut","addOut","edCk");
    }
    return h;
  };
  function ticked(cls){
    var n=0,on=0;
    document.querySelectorAll("."+cls).forEach(function(c){ n++; if(c.checked) on++; });
    return {n:n,on:on,ok:n>0&&on===n};
  }
  function stamp(kind, items){
    DB.shiftReports.push({kind:kind,site:USER.site,by:USER.name,who:USER.id,day:today(),at:now(),items:items||[]});
    if(typeof note==="function") note(kind+" "+USER.name);
    save();
  }
  var _bind=window.bind;
  window.bind=function(){
    if(typeof _bind==="function") _bind();
    ensure();
    var inn=document.getElementById("inBtn");
    if(inn) inn.onclick=function(){
      if(inNow()){ alert("Already clocked in"); return; }
      DB.clocks.push({who:USER.id,name:USER.name,site:USER.site,action:"in",at:now(),day:today()});
      save(); alert("Clocked in "+new Date().toLocaleTimeString()); draw();
    };
    var out=document.getElementById("outBtn");
    if(out) out.onclick=function(){
      if(!inNow()){ alert("Clock in first"); return; }
      var xo=ticked("xoCk");
      if(xo.n && !xo.ok){ alert("Complete the clock-out checklist first"); return; }
      DB.clocks.push({who:USER.id,name:USER.name,site:USER.site,action:"out",at:now(),day:today()});
      stamp("clock-out", DB.fdOut.slice());
      save(); alert("Clocked out"); draw();
    };
    var so=document.getElementById("subOpen");
    if(so) so.onclick=function(){
      var t=ticked("opCk");
      if(!t.ok){ alert("Tick every opening item"); return; }
      stamp("opening", DB.fdChecks.slice()); alert("Opening checklist submitted"); draw();
    };
    var sc=document.getElementById("subClose");
    if(sc) sc.onclick=function(){
      var t=ticked("clCk");
      if(!t.ok){ alert("Tick every closing item"); return; }
      stamp("closing", DB.fdClose.slice()); alert("Closing checklist submitted"); draw();
    };
    document.querySelectorAll(".addCk").forEach(function(b){
      b.onclick=function(){
        var k=b.getAttribute("data-k");
        var el=document.getElementById(b.getAttribute("data-add"));
        var v=el&&el.value.trim(); if(!v) return;
        DB[k]=DB[k]||[]; DB[k].push(v); save(); draw();
      };
    });
    document.querySelectorAll(".delCk").forEach(function(b){
      b.onclick=function(){
        var k=b.getAttribute("data-k"); var i=parseInt(b.getAttribute("data-i"),10);
        (DB[k]||[]).splice(i,1); save(); draw();
      };
    });
    document.querySelectorAll(".savCk").forEach(function(b){
      b.onclick=function(){
        var k=b.getAttribute("data-k");
        var next=[];
        document.querySelectorAll(".edCk[data-k='"+k+"']").forEach(function(inp){ if(inp.value.trim()) next.push(inp.value.trim()); });
        DB[k]=next; save(); alert("Checklist saved"); draw();
      };
    });
  };
})();
