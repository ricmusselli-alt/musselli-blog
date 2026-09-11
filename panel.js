/* ============================================================
   Musselli · Panel de Operaciones — lógica compartida
   Carga Supabase, resuelve el login, dibuja el header con el
   menú de secciones y expone helpers (api, edgeFn, esc, $).
   Cada página llama a Panel.init({ page:'portada', onReady }).
   ============================================================ */
(function () {
  const SUPABASE_URL = "https://zquxompfcahmjquobnvk.supabase.co";
  const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxdXhvbXBmY2FobWpxdW9ibnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxMDk2NjAsImV4cCI6MjEwMzY4NTY2MH0.ZMa0_ZFsEKVK0lRydq1zjxQDcteGXxOKdmr00D-62wk";

  const sb = window.supabase.createClient(SUPABASE_URL, ANON_KEY);
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  let token = null, userEmail = "";

  const SECCIONES = [
    { page: "portada",   href: "index.html",         ico: "◈", txt: "Portada" },
    { page: "contenido", href: "contenido.html",     ico: "▦", txt: "Contenido" },
    { page: "costos",    href: "costos.html",        ico: "$", txt: "Costos" },
    { page: "datos",     href: "base-datos.html",    ico: "☷", txt: "Base de datos" },
    { page: "notif",     href: "notificaciones.html", ico: "◔", txt: "Notificaciones" },
  ];

  function esc(s) {
    return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  // signo "?" con explicación al pasar el mouse (desktop) o al tocarlo (mobile / click).
  // Uso: Panel.ayuda("Este botón sirve para...")
  function ayuda(texto, abajo) {
    return `<span class="ayuda${abajo ? " abajo" : ""}" data-ayuda="${esc(texto)}" role="img" aria-label="Ayuda">?</span>`;
  }
  // click/tap en cualquier "?" del panel → alerta con el texto completo (el hover ya lo
  // muestra en desktop, pero en mobile no hay hover; esto lo hace accesible en los dos).
  document.addEventListener("click", (ev) => {
    const el = ev.target.closest && ev.target.closest(".ayuda");
    if (el) alert(el.dataset.ayuda || "");
  });

  // Token siempre fresco: el cliente de Supabase renueva la sesión en segundo
  // plano, pero la variable `token` local quedaba congelada del init y se vencía
  // a la hora → "no_autorizado" en cualquier acción hasta recargar la página.
  async function currentToken() {
    try {
      const { data } = await sb.auth.getSession();
      if (data && data.session) { token = data.session.access_token; return token; }
    } catch (_) { /* usamos el que haya */ }
    return token;
  }

  async function api(method, body) {
    const t = await currentToken();
    const res = await fetch(SUPABASE_URL + "/functions/v1/admin-registry", {
      method,
      headers: { Authorization: "Bearer " + t, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const m = typeof data.error === "string" ? data.error : data.error ? JSON.stringify(data.error) : "HTTP " + res.status;
      throw new Error(m);
    }
    return data;
  }

  async function edgeFn(name, body) {
    const res = await fetch(SUPABASE_URL + "/functions/v1/" + name, {
      method: "POST",
      headers: { Authorization: "Bearer " + ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) {
      const m = typeof data.error === "string" ? data.error : data.error ? JSON.stringify(data.error) : "HTTP " + res.status;
      throw new Error(m);
    }
    return data;
  }

  function buildHeader(page) {
    const nav = SECCIONES.map(
      (s) => `<a href="${s.href}" class="${s.page === page ? "on" : ""}">
        <span class="ico">${s.ico}</span><span class="txt">${s.txt}</span></a>`
    ).join("");
    const initial = (userEmail || "·").charAt(0).toUpperCase();
    const bar = document.createElement("header");
    bar.className = "site-bar";
    bar.innerHTML = `
      <a class="site-bar__logo" href="index.html">
        <img src="logos/_musselli.png" alt="Musselli"
             onerror="this.style.display='none';this.nextElementSibling.style.display='inline'">
        <span class="fallback" style="display:none">MUSSELLI</span>
      </a>
      <nav class="site-nav">${nav}</nav>
      <span class="site-bar__tools">
        <span class="avatar" id="pnlAvatar" title="${esc(userEmail)}">
          <img id="pnlAvatarImg" alt="" hidden><span id="pnlAvatarIni">${esc(initial)}</span>
        </span>
        <button class="btn-ghost btn-mini" id="pnlLogout">Salir</button>
      </span>`;
    document.body.prepend(bar);

    const saved = localStorage.getItem("musselli_avatar");
    if (saved) { $("#pnlAvatarImg").src = saved; $("#pnlAvatarImg").hidden = false; $("#pnlAvatarIni").hidden = true; }
    $("#pnlAvatar").addEventListener("click", () => {
      const inp = document.createElement("input");
      inp.type = "file"; inp.accept = "image/*";
      inp.onchange = () => {
        const f = inp.files[0]; if (!f) return;
        const r = new FileReader();
        r.onload = () => { try { localStorage.setItem("musselli_avatar", r.result); location.reload(); } catch (e) { alert("La imagen es muy pesada."); } };
        r.readAsDataURL(f);
      };
      inp.click();
    });
    $("#pnlLogout").addEventListener("click", async () => { await sb.auth.signOut(); location.reload(); });
  }

  function showLogin() {
    const scr = document.createElement("div");
    scr.id = "loginScreen";
    scr.innerHTML = `
      <div id="loginScreen__bg"></div><div id="loginScreen__grad"></div>
      <div id="login">
        <span class="kicker">Ecosistema Musselli</span>
        <h1>Panel <span>·</span> Operaciones</h1>
        <p>Acceso restringido.</p>
        <form id="pnlLoginForm">
          <div class="campo"><input type="email" id="pnlEmail" placeholder="correo" autocomplete="username" required></div>
          <div class="campo"><input type="password" id="pnlPass" placeholder="contraseña" autocomplete="current-password" required></div>
          <button type="submit" class="btn-primary" id="pnlLoginBtn">Entrar</button>
        </form>
        <div class="msg" id="pnlLoginMsg"></div>
      </div>`;
    document.body.appendChild(scr);
    $("#pnlLoginForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = $("#pnlLoginBtn"), m = $("#pnlLoginMsg");
      btn.disabled = true; m.className = "msg"; m.textContent = "Entrando…";
      const { data, error } = await sb.auth.signInWithPassword({ email: $("#pnlEmail").value, password: $("#pnlPass").value });
      if (error) { m.className = "msg err"; m.textContent = "No se pudo entrar: " + error.message; btn.disabled = false; return; }
      token = data.session.access_token; userEmail = data.user.email || "";
      location.reload();
    });
  }

  async function init(opts) {
    opts = opts || {};
    const { data } = await sb.auth.getSession();
    if (!data.session) { showLogin(); return; }
    token = data.session.access_token;
    userEmail = data.session.user.email || "";
    buildHeader(opts.page || "");
    if (typeof opts.onReady === "function") {
      try { await opts.onReady(); }
      catch (e) { console.error(e); const w = $(".wrap"); if (w) w.insertAdjacentHTML("afterbegin", `<div class="msg err">Error: ${esc(e.message)}</div>`); }
    }
  }

  window.Panel = {
    init, api, edgeFn, esc, ayuda, $, $$,
    get token() { return token; },
    get email() { return userEmail; },
    SUPABASE_URL, ANON_KEY, sb,
  };
})();
