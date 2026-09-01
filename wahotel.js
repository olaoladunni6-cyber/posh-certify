(function(){
function boot(){
if(typeof viewStaff!=="function"){setTimeout(boot,80);return;}
if(window.__waHotel)return;window.__waHotel=true;
function box(){
  if(!user)return "";
  if(!(user.role==="superadmin"||user.role==="manager"||user.role==="ceo"))return "";
  return "<div class=card><h3>Hotel WhatsApp lines</h3>"+
    "<p>Hotel DM line</p><input id=hotelDm value='"+(db.whatsapp||"")+"' placeholder='0803 000 0000'>"+
    "<p>Front Desk line</p><input id=hotelFd value='"+(db.frontDesk||"")+"' placeholder='0803 000 0000'>"+
    "<p>These two numbers get certify, OOO and return-to-service alerts.</p></div>";
}
var _vs=viewStaff;
viewStaff=function(){return box()+_vs.apply(this,arguments);};
var _b=bind;
bind=function(){
  _b();
  if(!document.getElementById("hotelDm"))return;
  var btn=document.createElement("button");
  btn.className="btn";btn.id="saveHotelWa";btn.textContent="Save hotel WhatsApp lines";
  var card=document.getElementById("hotelDm").parentNode;
  if(card&&!document.getElementById("saveHotelWa"))card.appendChild(btn);
  btn.onclick=function(){
    db.whatsapp=(document.getElementById("hotelDm").value||"").trim();
    db.frontDesk=(document.getElementById("hotelFd").value||"").trim();
    try{save();}catch(e){}
    if(typeof publishHotel==="function")publishHotel(function(){});
    alert("Saved.\nHotel DM: "+db.whatsapp+"\nFront Desk: "+db.frontDesk);
  };
};
try{draw();}catch(e){}
}
boot();
})();
