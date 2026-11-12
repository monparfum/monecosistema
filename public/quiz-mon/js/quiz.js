/* =====================================================================
   QUIZ DE PERSONALIDADE OLFATIVA — MON PARFUM · quiz.js (lógica)
   ---------------------------------------------------------------------
   Pontuação
     · Parte 1 (comportamental): 1 ponto por resposta  → 5 pontos
     · Parte 2 (olfativa):       2 pontos por resposta → 14 pontos
     · Total possível: 19 pontos
   Desempate (aplicado em ordem, para o predominante e o secundário)
     1. maior pontuação total
     2. maior pontuação nas perguntas olfativas
     3. perfil escolhido na pergunta olfativa mais recente
     4. ordem fixa: Diplomático, Comunicador, Sistemático, Dominante
   Contatos: nome, e-mail e WhatsApp são pedidos antes do início, com
   consentimento obrigatório, e enviados ao endereço definido em
   DATA.LEAD.endpoint (duas etapas: "inicio" e "resultado").
   ===================================================================== */
(function () {
  "use strict";
  var DATA = window.MONQ_DATA;
  if (!DATA) { console.error("MON quiz: data.js não carregado."); return; }

  var Q = DATA.QUESTIONS, P = DATA.PROFILES, ORDER = DATA.ORDER;
  var POINTS = { 1: 1, 2: 2 };
  var root = document.getElementById("monq");
  if (!root) return;

  /* ---------- utilidades ---------- */
  function $(sel, ctx) { return (ctx || root).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || root).querySelectorAll(sel)); }
  function r(name) { return root.querySelector('[data-r="' + name + '"]'); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function src(file) { return /^(data:|https?:)/.test(file) ? file : DATA.IMG + file; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function track(evt, data) {
    try { if (window.dataLayer) window.dataLayer.push(Object.assign({ event: evt }, data || {})); } catch (e) {}
    try { if (typeof window.gtag === "function") window.gtag("event", evt, data || {}); } catch (e) {}
  }
  function postHeight() { // ajuste automático de altura quando o quiz está dentro de um iframe
    try { if (window.parent !== window) window.parent.postMessage({ monqHeight: document.documentElement.scrollHeight }, "*"); } catch (e) {}
  }

  /* imagens: carregamento com tratamento de erro */
  function setImg(img, file) {
    if (!img || !file) return;
    img.loading = img.loading || "lazy";
    img.decoding = "async";
    img.onerror = function () { img.style.visibility = "hidden"; if (img.parentNode) img.parentNode.classList.add("is-missing"); };
    img.src = src(file);
  }

  /* ---------- captação de contatos ---------- */
  var L = DATA.LEAD || { required: false }, lead = null;
  try { var saved = sessionStorage.getItem("monq_lead"); if (saved) lead = JSON.parse(saved); } catch (e) {}

  function uid() { return "mon-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8); }
  function onlyDigits(v) { return String(v || "").replace(/\D/g, ""); }
  function maskPhone(v) {
    var d = onlyDigits(v).slice(0, 11);
    if (d.length <= 2) return d ? "(" + d : "";
    if (d.length <= 6) return "(" + d.slice(0, 2) + ") " + d.slice(2);
    if (d.length <= 10) return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6);
    return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
  }
  function sendLead(stage, extra) {
    if (!lead) return;
    var payload = Object.assign({}, lead, extra || {}, { etapa: stage, enviado_em: new Date().toISOString() });
    try { window.dispatchEvent(new CustomEvent("monquiz:lead", { detail: payload })); } catch (e) {}
    try { if (window.parent !== window) window.parent.postMessage({ monqLead: payload }, "*"); } catch (e) {}
    if (L.endpoint) {
      try {
        fetch(L.endpoint, { method: "POST", mode: "no-cors", keepalive: true,
          headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) }).catch(function () {});
      } catch (e) {}
    }
  }
  function firstName() { return lead && lead.nome ? lead.nome.trim().split(/\s+/)[0] : ""; }

  function fillLeadTexts() {
    $$("[data-l]").forEach(function (el) { var k = el.getAttribute("data-l"); if (L[k]) el.textContent = L[k]; });
    var f = $(".monq-form"); if (!f) return;
    f.whatsapp.addEventListener("input", function () { f.whatsapp.value = maskPhone(f.whatsapp.value); });
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var err = $(".monq-form-err"), bad = null;
      [f.nome, f.email, f.whatsapp].forEach(function (i) { i.removeAttribute("aria-invalid"); });
      if (f.site.value) return; // proteção contra robôs
      var nome = f.nome.value.trim().replace(/\s+/g, " "), email = f.email.value.trim(), zap = onlyDigits(f.whatsapp.value);
      if (nome.split(" ").length < 2 || nome.length < 5) bad = [f.nome, "Informe seu nome completo (nome e sobrenome)."];
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) bad = [f.email, "Confira o seu e-mail."];
      else if (zap.length < 10 || zap.length > 11) bad = [f.whatsapp, "Informe o WhatsApp com DDD, por exemplo (48) 99999-9999."];
      else if (!f.consentimento.checked) bad = [f.consentimento, "Para continuar, marque a autorização de uso dos dados."];
      if (bad) { err.textContent = bad[1]; bad[0].setAttribute("aria-invalid", "true"); try { bad[0].focus(); } catch (x) {} return; }
      err.textContent = "";
      lead = { id: uid(), nome: nome, email: email, whatsapp: maskPhone(zap), consentimento: "sim",
               origem: "quiz-olfativo", pagina: location.href.split("#")[0] };
      try { sessionStorage.setItem("monq_lead", JSON.stringify(lead)); } catch (x) {}
      sendLead("inicio");
      track("quiz_olfativo_cadastro"); // sem dados pessoais
      begin();
    });
  }

  /* ---------- estado ---------- */
  var state = { current: 0, answers: [], order: [] }; // answers[i] = índice da alternativa (ordem original)

  function newOrder() { state.order = Q.map(function (q) { return shuffle(q.o.map(function (_, i) { return i; })); }); }

  function show(name) {
    $$(".monq-screen").forEach(function (s) { s.classList.toggle("is-active", s.getAttribute("data-screen") === name); });
    var top = root.getBoundingClientRect().top + window.pageYOffset - 20;
    if (window.pageYOffset > top) window.scrollTo({ top: top, behavior: "smooth" });
    setTimeout(postHeight, 60);
  }

  /* ---------- perguntas ---------- */
  function renderQuestion() {
    var i = state.current, q = Q[i], n = Q.length;
    $(".monq-progress-fill").style.width = ((i) / n * 100) + "%";
    $(".monq-progress").setAttribute("aria-valuenow", i + 1);
    $(".monq-progress-label").textContent = "Pergunta " + (i + 1) + " de " + n;
    $(".monq-q-part").textContent = q.part === 1 ? "Parte 1 · Seu jeito de ser" : "Parte 2 · Seu universo olfativo";
    var title = $(".monq-q-title"); title.textContent = q.t;

    var box = $(".monq-options"), hasImg = q.part === 2;
    box.className = "monq-options" + (hasImg ? " monq-options--img" : "");
    box.innerHTML = "";
    state.order[i].forEach(function (oi) {
      var o = q.o[oi], b = document.createElement("button");
      b.type = "button"; b.className = "monq-opt" + (hasImg ? " monq-opt--img" : "");
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", state.answers[i] === oi ? "true" : "false");
      b.setAttribute("data-oi", oi);
      if (hasImg) {
        b.innerHTML = '<span class="monq-opt-img"><img alt=""></span><span class="monq-opt-cap">' + esc(o.t) + "</span>";
        setImg(b.querySelector("img"), o.img);
        b.querySelector("img").loading = "eager";
      } else {
        b.textContent = o.t;
      }
      b.addEventListener("click", function () { select(oi); });
      box.appendChild(b);
    });
    $('[data-action="back"]').style.visibility = i === 0 ? "hidden" : "visible";
    var next = $('[data-action="next"]');
    next.textContent = i === n - 1 ? "Ver meu resultado →" : "Avançar →";
    next.disabled = state.answers[i] === undefined;
    $(".monq-hint").textContent = state.answers[i] === undefined ? "Escolha uma alternativa para continuar." : "";
    setTimeout(postHeight, 60);
  }

  function select(oi) {
    state.answers[state.current] = oi;
    $$(".monq-opt").forEach(function (b) { b.setAttribute("aria-checked", b.getAttribute("data-oi") == oi ? "true" : "false"); });
    $('[data-action="next"]').disabled = false;
    $(".monq-hint").textContent = "";
  }

  /* navegação por setas dentro do grupo de alternativas */
  root.addEventListener("keydown", function (e) {
    if (!e.target.classList || !e.target.classList.contains("monq-opt")) return;
    var opts = $$(".monq-opt"), k = opts.indexOf(e.target), step = 0;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") step = 1;
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") step = -1;
    if (!step) return;
    e.preventDefault();
    opts[(k + step + opts.length) % opts.length].focus();
  });

  function next() {
    if (state.answers[state.current] === undefined) { $(".monq-hint").textContent = "Escolha uma alternativa para continuar."; return; }
    if (state.current < Q.length - 1) { state.current++; renderQuestion(); focusTitle(); }
    else finish();
  }
  function back() { if (state.current > 0) { state.current--; renderQuestion(); focusTitle(); } }
  function focusTitle() { var t = $(".monq-q-title"); try { t.focus({ preventScroll: true }); } catch (e) {} }

  /* ---------- cálculo ---------- */
  function score(answers) {
    var s = {}, olf = {}, last = {};
    ORDER.forEach(function (k) { s[k] = 0; olf[k] = 0; last[k] = -1; });
    answers.forEach(function (oi, qi) {
      var q = Q[qi]; if (oi === undefined || !q) return;
      var p = q.o[oi].p, pts = POINTS[q.part];
      s[p] += pts;
      if (q.part === 2) { olf[p] += pts; last[p] = qi; }
    });
    function cmp(a, b) {
      return (s[b] - s[a]) || (olf[b] - olf[a]) || (last[b] - last[a]) || (ORDER.indexOf(a) - ORDER.indexOf(b));
    }
    var rank = ORDER.slice().sort(cmp);
    var total = ORDER.reduce(function (t, k) { return t + s[k]; }, 0);
    return { scores: s, olfactory: olf, rank: rank, main: rank[0], second: rank[1], total: total };
  }

  /* ---------- resultado ---------- */
  function renderResult(res) {
    var M = P[res.main], S2 = P[res.second];
    root.style.setProperty("--main", M.color);
    r("name").textContent = M.name;
    r("identity").textContent = M.identity;
    r("secondLine").textContent = res.scores[res.second] > 0 ? ("com segunda faceta " + S2.name) : "";
    r("description").textContent = M.description;

    /* mapa em quadrante (posições do material MON) + barras */
    var max = Math.max.apply(null, ORDER.map(function (k) { return res.scores[k]; })) || 1;
    r("quadrant").innerHTML = ORDER.map(function (k) {
      var pr = P[k], sc = res.scores[k], size = sc > 0 ? 14 + Math.round((sc / max) * 56) : 12;
      return '<div class="monq-q-cell' + (k === res.main ? " is-main" : "") + '"><b style="color:' + pr.color + '">' + pr.name + "</b>" +
        '<span class="monq-q-dot' + (sc > 0 ? "" : " is-zero") + '" data-size="' + size + '" style="width:0;height:0;background:' + pr.color + '"></span>' +
        "<small>" + sc + (sc === 1 ? " ponto" : " pontos") + "</small></div>";
    }).join("");
    r("quadrant").setAttribute("aria-label", "Mapa de afinidades: " + ORDER.map(function (k) { return P[k].name + " " + res.scores[k] + " de 19 pontos"; }).join(", "));
    r("bars").innerHTML = res.rank.map(function (k) {
      var pct = Math.round(res.scores[k] / 19 * 100);
      return '<div class="monq-bar"><span class="monq-bar-name">' + P[k].name + '</span><span class="monq-bar-track"><i data-w="' + pct + '" style="background:' + P[k].color + '"></i></span><span class="monq-bar-val">' + res.scores[k] + " / 19</span></div>";
    }).join("");
    setTimeout(function () {
      $$(".monq-q-dot").forEach(function (d) { var z = d.getAttribute("data-size"); d.style.width = z + "px"; d.style.height = z + "px"; });
      $$(".monq-bar-track i").forEach(function (b) { b.style.width = b.getAttribute("data-w") + "%"; });
    }, 120);

    r("families").innerHTML = M.families.map(function (f) { return "<li>" + esc(f.name) + "<small>Na roda de Edwards: " + esc(f.edwards) + "</small></li>"; }).join("");
    r("notes").innerHTML = M.notes.map(function (n) { return '<span class="monq-chip">' + esc(n) + "</span>"; }).join("");
    r("accords").innerHTML = M.accords.map(function (a) { return "<li><b>" + esc(a[0]) + "</b>: " + esc(a[1]) + "</li>"; }).join("");

    if (res.scores[res.second] > 0) {
      r("secondCard").style.display = "";
      r("secondName").textContent = S2.name;
      r("secondText").textContent = S2.secondary;
    } else { r("secondCard").style.display = "none"; }

    r("reflection").innerHTML = DATA.REFLECTION.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("");

    r("expTitle").textContent = DATA.EXPERIENCE.title;
    r("expText").textContent = DATA.EXPERIENCE.text;
    r("expLink").href = DATA.EXPERIENCE.url; r("expLink").textContent = DATA.EXPERIENCE.button;
    r("courses").innerHTML = M.courses.map(function (c) {
      var co = DATA.COURSES[c]; if (!co) return "";
      return '<a class="monq-course" href="' + co.url + '" target="_blank" rel="noopener"><strong>' + esc(co.nome) + "</strong><span>" + esc(co.desc) + "</span><em>Conhecer o curso →</em></a>";
    }).join("");

    r("ctaTitle").textContent = DATA.CTA.title;
    r("ctaText").innerHTML = DATA.CTA.text.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("");
    r("ctaLink").href = DATA.CTA.url; r("ctaLink").textContent = DATA.CTA.button;

    r("method").innerHTML = DATA.METHOD.map(function (m) { return "<h4>" + esc(m[0]) + "</h4><p>" + esc(m[1]) + "</p>"; }).join("");
    root.setAttribute("data-main", res.main); root.setAttribute("data-second", res.second);
  }

  function finish() {
    $(".monq-progress-fill").style.width = "100%";
    var res = score(state.answers);
    renderResult(res);
    var ey = $('[data-screen="result"] .monq-result-head .monq-eyebrow');
    if (ey) ey.textContent = firstName() ? firstName() + ", seu perfil olfativo predominante" : "Seu perfil olfativo predominante";
    sendLead("resultado", { perfil: P[res.main].name, segunda_faceta: res.scores[res.second] > 0 ? P[res.second].name : "",
      pontos: ORDER.map(function (k) { return P[k].name + " " + res.scores[k]; }).join(" · ") });
    show("result");
    var h = r("name"); try { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); } catch (e) {}
    track("quiz_olfativo_resultado", { perfil: P[res.main].name, segunda_faceta: P[res.second].name });
  }

  /* ---------- compartilhar ---------- */
  function share() {
    var main = P[root.getAttribute("data-main")], sec = P[root.getAttribute("data-second")];
    var url = location.href.split("#")[0];
    var text = "Fiz o quiz de personalidade olfativa da MON Parfum: meu perfil é " + main.name + (sec ? " (segunda faceta " + sec.name + ")" : "") + ". Descubra o seu:";
    var toast = $(".monq-toast");
    function done(msg) { toast.textContent = msg; setTimeout(function () { toast.textContent = ""; }, 3500); }
    if (navigator.share) {
      navigator.share({ title: "Qual é a sua personalidade olfativa?", text: text, url: url }).then(function () { track("quiz_olfativo_compartilhar"); }).catch(function () {});
    } else if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text + " " + url).then(function () { done("Texto e link copiados. É só colar onde quiser compartilhar."); }, function () { openWhats(); });
    } else { openWhats(); }
    function openWhats() { var a = document.createElement("a"); a.href = "https://wa.me/?text=" + encodeURIComponent(text + " " + url); a.target = "_blank"; a.rel = "noopener"; document.body.appendChild(a); a.click(); a.remove(); done("Abrimos o WhatsApp para você compartilhar."); }
  }

  function begin() { state.current = 0; state.answers = []; newOrder(); renderQuestion(); show("quiz"); focusTitle(); track("quiz_olfativo_inicio"); }

  /* ---------- ações ---------- */
  root.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest("[data-action]") : null; if (!a) return;
    var act = a.getAttribute("data-action");
    if (act === "start") {
      if (L.required && !lead) { show("lead"); var fi = $(".monq-form input[name=nome]"); setTimeout(function () { try { fi.focus(); } catch (x) {} }, 350); }
      else begin();
    }
    if (act === "home") show("intro");
    if (act === "next") next();
    if (act === "back") back();
    if (act === "restart") { state.current = 0; state.answers = []; newOrder(); show("intro"); }
    if (act === "share") share();
  });

  /* ---------- inicialização ---------- */
  $$("img[data-logo]").forEach(function (i) { setImg(i, i.getAttribute("data-logo") === "l" ? DATA.LOGO_LIGHT : DATA.LOGO); i.loading = "eager"; });
  setImg($('img[data-img="hero"]'), DATA.HERO); $('img[data-img="hero"]').loading = "eager";
  setImg($('img[data-img="experience"]'), DATA.EXPERIENCE_IMG);
  newOrder();
  fillLeadTexts();
  window.addEventListener("resize", postHeight);
  window.addEventListener("load", postHeight);

  /* pré-carrega as imagens da próxima pergunta (navegação mais fluida) */
  root.addEventListener("click", function () {
    var nq = Q[state.current + 1]; if (!nq || nq.part !== 2) return;
    nq.o.forEach(function (o) { var im = new Image(); im.src = src(o.img); });
  });

  /* interface para testes automatizados */
  window.MONQ_TEST = { score: score, questions: Q, profiles: P };
})();
