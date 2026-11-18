(() => {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // theme
  const root = document.documentElement;
  try { const t = localStorage.getItem("theme"); if (t) root.dataset.theme = t; } catch (e) {}
  $("#theme").onclick = () => {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
    initBg();
  };
  $("#yr").textContent = new Date().getFullYear();

  // mobile menu
  $("#burger").onclick = () => $("#links").classList.toggle("open");
  $$("#links a").forEach(a => a.addEventListener("click", () => $("#links").classList.remove("open")));

  // typed text
  const words = ["Machine Learning Engineer", "LLM & RAG Builder", "Computer Vision Engineer", "Tech Writer", "Movie & Music Buff"];
  const out = $("#typed");
  if (reduce) out.textContent = words[0];
  else (function type(i = 0, j = 0, del = false) {
    const w = words[i];
    out.textContent = w.slice(0, j);
    let d = del ? 35 : 85;
    if (!del && j === w.length) { del = true; d = 1400; }
    else if (del && j === 0) { del = false; i = (i + 1) % words.length; d = 350; }
    setTimeout(() => type(i, j + (del ? -1 : 1), del), d);
  })();

  // reveal + counters + bars
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target; el.classList.add("in"); io.unobserve(el);
    if (el.classList.contains("bar")) el.querySelector("i").style.setProperty("--w", el.dataset.v + "%");
    $$("[data-count]", el).forEach(count);
  }), { threshold: .15 });
  $$(".reveal").forEach((el, i) => { el.style.transitionDelay = Math.min(i % 4, 3) * 90 + "ms"; io.observe(el); });
  function count(el) {
    const to = +el.dataset.count, dec = +(el.dataset.dec || 0), suf = el.dataset.suf || "", t0 = performance.now();
    (function step(t) {
      const p = Math.min((t - t0) / 1400, 1), v = to * (1 - Math.pow(1 - p, 3));
      el.textContent = v.toFixed(dec) + suf;
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }

  // scroll progress, back-to-top, active link
  const secs = $$("main section[id]"), links = $$("#links a");
  addEventListener("scroll", () => {
    const h = document.documentElement, y = h.scrollTop;
    $("#progress").style.width = (y / (h.scrollHeight - h.clientHeight) * 100) + "%";
    $("#top").classList.toggle("show", y > 600);
    let cur = ""; secs.forEach(s => { if (s.offsetTop - 140 <= y) cur = s.id; });
    links.forEach(a => a.classList.toggle("on", a.hash === "#" + cur));
  }, { passive: true });

  // cursor glow + 3D tilt
  const glow = $("#glow");
  addEventListener("pointermove", e => { glow.style.left = e.clientX + "px"; glow.style.top = e.clientY + "px"; }, { passive: true });
  if (!reduce && matchMedia("(hover:hover)").matches) $$(".tilt").forEach(c => {
    c.addEventListener("pointermove", e => {
      const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      c.style.transform = `perspective(700px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-4px)`;
    });
    c.addEventListener("pointerleave", () => c.style.transform = "");
    c.style.transition = "transform .2s, border-color .3s, box-shadow .3s";
  });

  // particle network background
  const cv = $("#bg"), cx = cv.getContext("2d"); let pts = [], raf, mouse = { x: -999, y: -999 };
  addEventListener("pointermove", e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  function initBg() {
    cancelAnimationFrame(raf);
    const dpr = Math.min(devicePixelRatio || 1, 2), W = cv.width = innerWidth * dpr, H = cv.height = innerHeight * dpr;
    const light = root.dataset.theme === "light", col = light ? "90,70,200" : "160,140,255";
    pts = Array.from({ length: Math.min(70, Math.floor(innerWidth / 18)) }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .35 * dpr, vy: (Math.random() - .5) * .35 * dpr }));
    if (reduce) return;
    (function draw() {
      cx.clearRect(0, 0, W, H);
      pts.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1;
        cx.fillStyle = `rgba(${col},.7)`; cx.beginPath(); cx.arc(p.x, p.y, 1.6 * dpr, 0, 7); cx.fill();
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j], d = Math.hypot(p.x - q.x, p.y - q.y), m = 130 * dpr;
          if (d < m) { cx.strokeStyle = `rgba(${col},${(1 - d / m) * .22})`; cx.lineWidth = dpr * .8; cx.beginPath(); cx.moveTo(p.x, p.y); cx.lineTo(q.x, q.y); cx.stroke(); }
        }
        const md = Math.hypot(p.x - mouse.x * dpr, p.y - mouse.y * dpr);
        if (md < 160 * dpr) { cx.strokeStyle = `rgba(255,61,113,${(1 - md / (160 * dpr)) * .5})`; cx.beginPath(); cx.moveTo(p.x, p.y); cx.lineTo(mouse.x * dpr, mouse.y * dpr); cx.stroke(); }
      });
      raf = requestAnimationFrame(draw);
    })();
  }
  initBg(); let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(initBg, 200); });
})();

/* ================= v3: scroll engine ================= */
(() => {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), ease = t => 1 - Math.pow(1 - t, 3);

  /* ---- solar system skills ---- */
  const DATA = [
    { n: "Languages",  c: "#22d3ee", k: ["Python", "C++", "C", "Java", "SQL"] },
    { n: "AI / LLMs",  c: "#ff3d71", k: ["SLMs", "RAG", "GraphRAG", "Fine-tuning", "Pretraining", "SentencePiece", "BGE reranking"] },
    { n: "ML & Data",  c: "#a78bfa", k: ["PyTorch", "Transformers", "sentence-transformers", "NumPy", "Pandas", "Power BI"] },
    { n: "Backend",    c: "#34d399", k: ["FastAPI", "Node.js", "Express", "JSP", "PostgreSQL", "Elasticsearch", "JWT"] },
    { n: "Frontend",   c: "#fbbf24", k: ["HTML", "CSS", "JavaScript", "React", "jQuery", "Tailwind", "Bootstrap"] },
    { n: "DevOps",     c: "#fb923c", k: ["Git", "Jenkins", "Maven", "Docker", "CI/CD", "Caddy", "Postman", "Confluence"] }
  ];
  const wrap = $(".solar-wrap"), stage = $("#solar"), legend = $("#legend"); if (!wrap || !stage) return;
  const orbs = DATA.map((o, i) => {
    const ring = document.createElement("div"); ring.className = "orb"; ring.style.setProperty("--oc", o.c);
    const lab = document.createElement("span"); lab.className = "orb-l"; lab.textContent = o.n; lab.style.setProperty("--oc", o.c);
    stage.append(ring);
    const items = o.k.map((t, j) => { const e = document.createElement("span"); e.className = "sk"; e.textContent = t; e.style.setProperty("--oc", o.c); stage.append(e); return { e, off: j / o.k.length * Math.PI * 2 }; });
    const li = document.createElement("li"); li.style.setProperty("--oc", o.c); li.innerHTML = `<i></i>${o.n}`; legend.append(li);
    return { o, ring, lab, items, li, dir: i % 2 ? -1 : 1, sp: .5 - i * .05 };
  });
  const PH = -14 * Math.PI / 180, cph = Math.cos(PH), sph = Math.sin(PH);
  let W = 0, H = 0, prog = 0, hover = 0;
  const size = () => { const r = stage.getBoundingClientRect(); W = r.width; H = r.height; };
  size(); addEventListener("resize", size);
  const scroll = () => { const r = wrap.getBoundingClientRect(), tot = wrap.offsetHeight - innerHeight; prog = reduce ? 1 : clamp(-r.top / tot); };
  addEventListener("scroll", scroll, { passive: true }); scroll();
  stage.addEventListener("pointerover", e => { if (e.target.classList.contains("sk")) hover = 1; });
  stage.addEventListener("pointerout", () => hover = 0);
  let last = performance.now(), T = 0, vis = true;
  new IntersectionObserver(es => vis = es[0].isIntersecting).observe(wrap);
  const n = orbs.length, mobile = () => W < 620;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(now - last, 50) / 1000; last = now; if (!vis) return;
    T += dt * (hover ? .15 : 1) * (reduce ? 0 : 1);
    const RATIO = mobile() ? .9 : .5, aMax = Math.min(W / 2 - (mobile() ? 30 : 70), (H / 2 - 24) / RATIO), aMin = mobile() ? 46 : 110;
    let active = -1;
    orbs.forEach((ob, i) => {
      const r = ease(clamp((prog * 1.25 - i * .13) / .22)); if (r > .05) active = i;
      const a = (aMin + (aMax - aMin) * (i / (n - 1))) * r, b = a * RATIO;
      const rs = ob.ring.style; rs.width = a * 2 + "px"; rs.height = b * 2 + "px"; rs.margin = `${-b}px 0 0 ${-a}px`; rs.transform = "rotate(-14deg)"; rs.opacity = r;
      ob.ring.classList.toggle("act", i === active);
      ob.items.forEach(it => {
        const th = it.off + T * ob.sp * ob.dir + prog * 3 * ob.dir;
        const x0 = a * Math.cos(th), y0 = b * Math.sin(th), x = x0 * cph - y0 * sph, y = x0 * sph + y0 * cph;
        const depth = Math.sin(th), sc = .82 + .22 * depth * (mobile() ? .6 : 1);
        const es = it.e.style; es.transform = `translate(-50%,-50%) translate(${x}px,${y}px) scale(${sc})`; es.opacity = r * (.55 + .45 * (depth + 1) / 2); es.zIndex = depth > 0 ? 60 : 20;
      });
    });
    orbs.forEach((ob, i) => ob.li.classList.toggle("on", i <= active));
    const h = $(".solar-hint"); if (h) h.style.opacity = prog > .04 ? 0 : 1;
  }
  requestAnimationFrame(frame);

  /* ---- scrubbed words (about) ---- */
  $$(".scrub").forEach(p => { p.innerHTML = p.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(" "); });
  const scrubs = $$(".scrub");

  /* ---- timeline progress ---- */
  const tls = $$(".tl");

  /* ---- case studies visible state ---- */
  const cio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("vis"); $$("[data-count]", e.target).forEach(el => { if (!el.dataset.done) { el.dataset.done = 1; cnt(el); } }); } }), { threshold: .35 });
  $$(".case").forEach(c => cio.observe(c));
  function cnt(el) { const to = +el.dataset.count, dec = +(el.dataset.dec || 0), suf = el.dataset.suf || "", t0 = performance.now();
    (function st(t) { const p = clamp((t - t0) / 1400), v = to * ease(p); el.textContent = v.toFixed(dec) + suf; if (p < 1) requestAnimationFrame(st); })(t0); }

  /* ---- papers fly in ---- */
  const papers = $$(".paper"), pap = $("#papers");

  /* ---- parallax + scrubs per scroll ---- */
  
  function onScroll() {
    const vh = innerHeight;
    scrubs.forEach(p => { const r = p.getBoundingClientRect(), q = clamp((vh * .85 - r.top) / (r.height + vh * .35)), ws = p.children, on = Math.floor(q * ws.length * 1.05);
      for (let i = 0; i < ws.length; i++) ws[i].classList.toggle("on", reduce || i < on); });
    tls.forEach(t => { const r = t.getBoundingClientRect(), q = clamp((vh * .7 - r.top) / r.height); t.style.setProperty("--p", q);
      [...t.children].forEach(a => a.classList.toggle("lit", a.getBoundingClientRect().top < vh * .7)); });
    if (pap && !reduce) { const r = pap.getBoundingClientRect(), q = ease(clamp((vh * .95 - r.top) / (vh * .55)));
      papers.forEach((p, i) => { const d = i ? 1 : -1; p.style.setProperty("--tx", (1 - q) * d * 120 + "px"); p.style.setProperty("--ry", (1 - q) * -d * 25 + "deg"); p.style.setProperty("--rz", (1 - q) * d * 4 + "deg"); p.style.setProperty("--op", q); }); }
    if (!reduce) $$("[data-par]").forEach(el => { const r = el.parentElement.getBoundingClientRect(); el.style.transform = `translateY(${(r.top + r.height / 2 - vh / 2) * -parseFloat(el.dataset.par)}px)`; });
    $$(".case").forEach((c, i, all) => { if (i < all.length - 1) { const nx = all[i + 1].getBoundingClientRect().top, d = clamp(1 - (nx - 130) / 420); c.style.filter = `brightness(${1 - d * .45})`; c.style.transform = `scale(${1 - d * .04})`; } });
  }
  addEventListener("scroll", onScroll, { passive: true }); addEventListener("resize", onScroll); onScroll();

  /* ---- big background words ---- */
  [["about", "ABOUT"], ["journey", "JOURNEY"], ["ai", "AI / ML"], ["research", "RESEARCH"], ["work", "BUILDS"], ["writing", "WRITING"], ["contact", "CONTACT"]].forEach(([id, t]) => {
    const sec = document.getElementById(id); if (!sec) return; const d = document.createElement("div"); d.className = "bgword"; d.setAttribute("aria-hidden", "true"); d.dataset.par = ".08"; d.textContent = t; sec.prepend(d); });
})();

/* ================= v4: projects, interactions, contact ================= */
(() => {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches, fine = matchMedia("(hover:hover)").matches;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---- curated projects, categorised from the code ---- */
  const G = "https://github.com/shubhamraut789/";
  const CATS = { ai: "AI / ML", cv: "Computer Vision", sys: "Systems", web: "Web", data: "Data & Geo" };
  const P = [
    ["Compliance Clerk", "ai", "LLM pipeline that reads scanned Gujarat government PDFs (e-Challan receipts, NA permission orders) with Gemini Vision and writes a standard 13-column Excel report.", ["Python", "Gemini", "OCR"], "Compliance_Clerk"],
    ["Text-to-Query", "ai", "Chat interface that turns plain English into SQL with Cohere and returns results from MySQL as CSV or Excel, built for a banking use case.", ["Node.js", "Express", "Cohere", "MySQL"], "Text-to-Query"],
    ["Remembering Chatbot", "ai", "Command-line chatbot that remembers durable facts about each user across sessions, extracting them with Gemini and ignoring passing moods.", ["Python", "Gemini"], "Remembering-Chatbot"],
    ["Financial Reconciliation", "ai", "Unsupervised matching of bank statements to check registers: unique-amount seeding, then SVD-based cross-language retrieval for the rest.", ["Python", "scikit-learn", "SVD"], "Financial_Reconciliation"],
    ["Multi-Task CV Pipeline", "cv", "Oriented-box Faster R-CNN, a joint segmentation and depth U-Net, and PointNet for 3D point clouds, tracked with Weights & Biases.", ["PyTorch", "OpenCV"], "Multi-Task-CV-Pipeline"],
    ["Real-Time Face Compression", "cv", "PCA eigenface compression and reconstruction for real-time video calls, tested on limited data, occlusions and pose changes.", ["Python", "NumPy", "OpenCV"], "Real-Time-Face-Compression-Using-PCA-EigenValues-Python-Numpy-OpenCV"],
    ["Content-Aware Image Resizing", "cv", "Seam carving in C++ that resizes images by removing low-energy seams so the important content stays intact.", ["C++", "OpenCV"], "content-aware-image-resizing-algorithm"],
    ["Temple Path Reconstruction", "data", "Least-cost path reconstruction between temples over a cost surface built from slope, forests, water bodies and roads.", ["GeoPandas", "rasterio", "scikit-image"], "temples_path_reconstruction"],
    ["Data Visualisation", "data", "Statistical visualisation for behavioural research: spotting misleading charts and visualising personality traits from movement data.", ["R", "Statistics"], "Data-Visualisation"],
    ["Particle Swarm Optimization", "data", "Python implementation of particle swarm optimisation with a draggable visual demo.", ["Python"], "Particle-Swarm-Optimization"],
    ["POSIX Shell", "sys", "A custom shell in C++ with built-ins, pipes, redirection, background jobs, signal handling and autocomplete.", ["C++", "POSIX"], "POSIX-SHELL-Implementation"],
    ["Peer-to-Peer File System", "sys", "Distributed file sharing with synchronised trackers, user groups and client upload and download, written in C++.", ["C++", "Sockets"], "peer-to-peer-Distributed-File-System"],
    ["ShubhList", "web", "My animated watch, hear and read lists, with a friends' suggestion inbox that needs my approval.", ["JavaScript", "Supabase"], "shubhlist"],
    ["Payroll Management", "web", "Employee and admin portal: employees see their details, admins add, update and delete records.", ["Node.js", "Handlebars"], "Payroll_Management"],
    ["Payment Gateway", "web", "Razorpay donation flow built for a charitable trust during the Sparks Foundation internship.", ["HTML", "CSS", "JS", "Razorpay"], "Payment-Gateway"],
    ["Spotify Clone", "web", "A front-end recreation of the Spotify player with playlists and playback controls.", ["HTML", "CSS", "JS"], "Spotify-App-Clone"]
  ];
  const box = $("#repos"), fl = $("#repoFilters"); let cur = "all";
  if (box) {
    const counts = { all: P.length }; P.forEach(p => counts[p[1]] = (counts[p[1]] || 0) + 1);
    fl.innerHTML = [["all", "All"], ...Object.entries(CATS)].map(([k, v], i) => `<button data-f="${k}" class="${i ? "" : "on"}">${v}<span class="n">${counts[k] || 0}</span></button>`).join("");
    const draw = () => {
      box.innerHTML = P.filter(p => cur === "all" || p[1] === cur).map((p, i) => `
        <a class="repo in" style="animation-delay:${i * 45}ms" href="${G}${esc(p[4])}" target="_blank" rel="noopener">
          <div class="top"><span class="badge ${p[1]}">${CATS[p[1]]}</span><span class="meta">↗</span></div>
          <h4>${esc(p[0])}</h4><p>${esc(p[2])}</p>
          <div class="tg">${p[3].map(t => `<i>${esc(t)}</i>`).join("")}</div>
          <span class="go">View code →</span></a>`).join("");
    };
    fl.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; cur = b.dataset.f; $$("#repoFilters button").forEach(x => x.classList.toggle("on", x === b)); draw(); });
    box.addEventListener("pointermove", e => { const c = e.target.closest(".repo"); if (!c) return; const r = c.getBoundingClientRect(); c.style.setProperty("--mx", e.clientX - r.left + "px"); c.style.setProperty("--my", e.clientY - r.top + "px"); });
    draw();
  }

  /* ---- hero name letters ---- */
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  $$("[data-split]").forEach(el => { const t = el.textContent, n = t.length; el.textContent = "";
    [...t].forEach((c, i) => { const s = document.createElement("span"); s.className = "ch"; s.textContent = c === " " ? "\u00a0" : c; s.style.animationDelay = (.35 + i * .045) + "s";
      const q = i / (n - 1), col = q < .5 ? mix([255, 61, 113], [124, 92, 255], q * 2) : mix([124, 92, 255], [34, 211, 238], (q - .5) * 2); s.style.color = `rgb(${col})`; el.append(s); }); });

  /* ---- magnetic buttons ---- */
  if (fine && !reduce) $$("[data-mag]").forEach(b => {
    b.addEventListener("pointermove", e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px,${(e.clientY - r.top - r.height / 2) * .35}px)`; });
    b.addEventListener("pointerleave", () => b.style.transform = "");
  });

  /* ---- cursor ---- */
  if (fine && !reduce) {
    const d = document.createElement("div"), r = document.createElement("div"); d.id = "cur"; r.id = "cur2"; document.body.append(d, r);
    let x = 0, y = 0, rx = 0, ry = 0;
    addEventListener("pointermove", e => { x = e.clientX; y = e.clientY; d.style.opacity = r.style.opacity = 1; d.style.transform = `translate(${x}px,${y}px)`; }, { passive: true });
    document.addEventListener("pointerleave", () => d.style.opacity = r.style.opacity = 0);
    (function loop() { rx += (x - rx) * .16; ry += (y - ry) * .16; r.style.transform = `translate(${rx}px,${ry}px)`; requestAnimationFrame(loop); })();
    document.addEventListener("pointerover", e => document.body.classList.toggle("hov", !!e.target.closest("a,button,.sk,[data-mag]")));
  }

  /* ---- marquee driven by scroll speed ---- */
  const mq = $("#mq");
  if (mq && !reduce) { mq.style.animation = "none"; let off = 0, ly = scrollY, vel = 0;
    (function tick() { const y = scrollY; vel += ((y - ly) - vel) * .12; ly = y; off -= .8 + Math.abs(vel) * .5; const half = mq.scrollWidth / 2; if (-off >= half) off += half; mq.style.transform = `translateX(${off}px)`; requestAnimationFrame(tick); })(); }

  /* ---- kicker scramble ---- */
  if (!reduce) { const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ/<>_";
    const so = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; so.unobserve(e.target); const el = e.target, t = el.textContent; let f = 0;
      const id = setInterval(() => { el.textContent = [...t].map((c, i) => c === " " || i < f / 2 ? c : chars[Math.random() * chars.length | 0]).join(""); if (++f > t.length * 2) { el.textContent = t; clearInterval(id); } }, 28); }), { threshold: 1 });
    $$(".kicker").forEach(k => so.observe(k)); }

  /* ---- email (assembled in script so it isn't plain text in the HTML) ---- */
  const addr = ["shubhamraut9860", "gmail.com"].join("@");
  const mb = $("#mailBig"); if (mb) { mb.href = "mailto:" + addr; $("#mailTxt").textContent = addr; }
  $$("[data-mail-link]").forEach(a => a.href = "mailto:" + addr);
  const cp = $("#copyMail"); if (cp) cp.onclick = async () => { try { await navigator.clipboard.writeText(addr); cp.textContent = "Copied ✓"; } catch (e) { cp.textContent = addr; } setTimeout(() => cp.textContent = "Copy address", 2200); };
  const f = $("#cform"); if (f) f.addEventListener("submit", e => { e.preventDefault();
    const n = f.n.value.trim(), m = f.m.value.trim(), note = $("#cnote");
    if (!n || !m) { note.textContent = "Please add your name and a message."; note.style.color = "var(--a)"; return; }
    note.style.color = ""; note.textContent = "Opening your email app...";
    location.href = `mailto:${addr}?subject=${encodeURIComponent(f.s.value.trim() || "Hello from your portfolio")}&body=${encodeURIComponent(m + "\n\n— " + n)}`; });
})();
