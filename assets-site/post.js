/* ============================================================
   post.js — comportamiento compartido de los artículos del blog Musselli
   Lo carga {slug}/index.html con  <script src="/assets-site/post.js" defer></script>
   Idéntico en todos los posts. No genera datos: sólo lee el texto ya renderizado.
   ============================================================ */

/* iniciales "RM" si no carga la foto del autor */
function picFallback(img, cls){
  var s = document.createElement("span");
  s.className = cls + " initials";
  s.textContent = "RM";
  img.replaceWith(s);
}

(function(){
  "use strict";

  /* Tiempo de lectura — se calcula del propio texto del artículo (no es un dato inventado). */
  (function(){
    var body = document.querySelector(".article__body");
    if(!body) return;
    var words = (body.innerText.trim().match(/\S+/g) || []).length;
    var min = Math.max(1, Math.round(words / 200));
    var el = document.getElementById("readtime");
    if(el){
      el.textContent = min + " min de lectura";
      el.hidden = false;
      var d = document.getElementById("rt-dot");
      if(d) d.hidden = false;
    }
  })();

  /* Índice — se arma con los <h2> del cuerpo. Excluye "Conclusión/Cierre/Resumen final".
     Si quedan menos de 2, no se muestra. */
  (function(){
    var toc = document.getElementById("toc");
    var body = document.querySelector(".article__body");
    if(!toc || !body) return;
    var hs = [].slice.call(body.querySelectorAll("h2")).filter(function(h){
      return !/^\s*(conclusi[oó]n|cierre|resumen final)\s*$/i.test(h.textContent);
    });
    if(hs.length < 2) return;
    var slugify = function(s){
      return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
              .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    };
    var items = hs.map(function(h, i){
      if(!h.id) h.id = slugify(h.textContent) || ("sec-" + (i + 1));
      var n = ("0" + (i + 1)).slice(-2);
      return '<li><a href="#' + h.id + '"><span class="n">' + n + '</span><span>' + h.textContent + '</span></a></li>';
    }).join("");
    toc.innerHTML = '<div class="toc__label">En este artículo</div><ol>' + items + '</ol>';
    toc.hidden = false;
  })();

  /* Barra de progreso de lectura */
  (function(){
    var bar = document.getElementById("progress");
    if(!bar) return;
    function upd(){
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (h.scrollTop / max * 100) : 0) + "%";
    }
    addEventListener("scroll", upd, { passive: true });
    addEventListener("resize", upd);
    upd();
  })();

  /* Reveal on scroll */
  (function(){
    var els = document.querySelectorAll("[data-reveal]");
    if(!("IntersectionObserver" in window)){
      els.forEach(function(e){ e.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function(en){
      en.forEach(function(e){
        if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -6% 0px" });
    els.forEach(function(e){ io.observe(e); });
  })();

  /* Menú móvil */
  (function(){
    var mm = document.getElementById("mobilemenu");
    if(!mm) return;
    var open = document.querySelector("[data-open-menu]");
    var close = document.querySelector("[data-close-menu]");
    if(open) open.addEventListener("click", function(){ mm.classList.add("open"); });
    if(close) close.addEventListener("click", function(){ mm.classList.remove("open"); });
    mm.querySelectorAll("a").forEach(function(a){
      a.addEventListener("click", function(){ mm.classList.remove("open"); });
    });
  })();

})();
