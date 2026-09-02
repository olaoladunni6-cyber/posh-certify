(function(){
function boot(){
  if(!document.body){setTimeout(boot,40);return;}
  if(window.__tapFix)return;window.__tapFix=true;
  if(!document.getElementById("safePad")){
    var s=document.createElement("style");
    s.id="safePad";
    s.textContent="html,body{padding-bottom:96px} .wrap{padding-bottom:96px} button,a,[onclick]{touch-action:manipulation;-webkit-tap-highlight-color:#c4a574}";
    document.head.appendChild(s);
  }
  document.addEventListener("touchend",function(ev){
    var t=ev.target;
    if(!t)return;
    if(t.closest)t=t.closest("button,a,[data-act],[data-ext]")||t;
    if(!t||t.tagName==="INPUT"||t.tagName==="TEXTAREA"||t.tagName==="SELECT")return;
    if(t.tagName==="BUTTON"||t.getAttribute("data-act")||t.getAttribute("data-ext")){
      if(typeof t.onclick==="function"){
        ev.preventDefault();
        t.onclick();
      }
    }
  },true);
}
boot();
})();
