/* 점 지구본 — 지금 공개된 판(sanctuscorporation.com) site.js «첫 화면의 점 구체»를 옮긴 것(설계 Ⅵ-2).
   접수 한 건이 여러 결제사로 이어지는 모습을 그린 장식입니다. 바뀐 점은 그리는 칸뿐입니다:
   첫 화면 전체가 아니라 <canvas id="core"> 가 든 칸(.gl-stage)의 가운데에 그리고, 반지름을 칸 크기에 맞춥니다.
   점 수·회전 속도·궤도·접수 신호·색·멈춤 조건은 원래 값 그대로입니다.
   11-19 밤(BUILD_NOTES 15장): 이름표 글자 대신 흰색 단색 로고. 로고 목록은 캔버스의 data-logos(build 가 partner_logos.json 에서 넣음).
   뒤로 돌아간 로고는 지금처럼 본 캔버스에 흐리게(점이 위에 그려짐), 앞쪽 로고는 가장자리 흐림(mask)이 없는 덧캔버스에 그립니다.
   로고는 앞쪽이면 표시 위, 뒤쪽이면 표시 아래에 두어 연결선과 겹치지 않고, 앞뒤가 바뀌는 자리에서는 짧게 겹쳐 바뀝니다.
   칸이 작아 로고가 너무 작아지면(기준 높이 LOGO_MIN_H 미만) 그 크기에서만 원래 글자를 씁니다. 로고를 못 불러와도 글자입니다. */
(function () {
  "use strict";
  var cv = document.getElementById("core");
  if (!cv || !cv.getContext) return;
  var reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var ctx = cv.getContext("2d");
  var NODES = ["KCP", "KPN", "KIS", "KOVAN", "NICE", "웰컴", "KSNET"];
  var W = 0, H = 0, R = 0, cx = 0, cy = 0, K = 1.62, mobile = false, small = false, pts = [], inner = [], dust = [], pulses = [], flash = [];
  var px = 0, py = 0, tx = 0, ty = 0, running = false, last = 0, nextPulse = 900;
  var MONO = "12px 'JetBrains Mono',ui-monospace,Consolas,monospace";
  var C_RING = "190,205,235", C_COOL = "150,176,226", C_WARM = "236,222,196", C_DUST = "170,190,230", C_TXT = "232,236,244";

  /* ---------- 로고 이름표(11-19 밤) ---------- */
  var LOGO_SCALE = 0.72;   /* 기준 폭 = 구 반지름 × 이 값(가로세로 비 5.5 로고의 폭). 메인 1440 에서 NHN KCP 높이 약 20px */
  var LOGO_MAX_S = 112;    /* 기준 폭 상한(px) */
  var LOGO_MAX_H = 22;     /* 로고 높이 상한(px) — 정사각형에 가까운 로고(코밴·KSNET)가 커지지 않게 */
  var LOGO_MIN_H = 12;     /* 기준 높이(기준 폭 ÷ 5.5)가 이보다 작으면 그 크기에서는 글자 */
  var LOGO_GAP = 10, LOGO_EDGE = 6, LOGO_PAD = 8;   /* 표시와 로고 사이 · 칸 가장자리 여백 · 어두운 테두리 여백(px) */
  var LOGOS = {}, logoS = 0, useLogos = false, lc = null, lctx = null;
  (function readLogos() {
    var raw = cv.getAttribute("data-logos"), base = cv.getAttribute("data-src-logos");
    if (!raw || !base) return;
    try { LOGOS = JSON.parse(raw); } catch (e) { LOGOS = {}; return; }
    lc = document.createElement("canvas");
    lc.className = "gl-lb"; lc.setAttribute("aria-hidden", "true");
    cv.parentNode.insertBefore(lc, cv.nextSibling);
    lctx = lc.getContext("2d");
    NODES.forEach(function (n) {
      var L = LOGOS[n]; if (!L) return;
      L.img = new Image(); L.img.decoding = "async";
      L.img.onload = function () { L.ok = true; prepLogo(L); if (reduce || !running) requestAnimationFrame(frame); };
      L.img.onerror = function () { L.ok = false; };
      L.img.src = base + L.f;
    });
  })();
  /* 로고 한 장을 지금 크기의 흰색 그림(+ 읽기 쉽게 어두운 테두리)으로 미리 그려 둡니다. 매 장면에는 이 그림만 찍습니다. */
  function prepLogo(L) {
    if (!L.ok || !logoS) return;
    var d = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.min(logoS * L.k, logoS * 1.2), h = w / L.r;
    if (h > LOGO_MAX_H) { h = LOGO_MAX_H; w = h * L.r; }
    if (L.mw && w > L.mw) { w = L.mw; h = w / L.r; }
    L.w = w; L.h = h;
    var t = document.createElement("canvas"), tc = t.getContext("2d");
    t.width = Math.max(1, Math.round(w * d)); t.height = Math.max(1, Math.round(h * d));
    tc.imageSmoothingEnabled = true; tc.imageSmoothingQuality = "high";
    tc.drawImage(L.img, 0, 0, t.width, t.height);
    if (L.m === "c") { tc.globalCompositeOperation = "source-in"; tc.fillStyle = "#fff"; tc.fillRect(0, 0, t.width, t.height); }
    var c = document.createElement("canvas"), cc = c.getContext("2d"), p = Math.round(LOGO_PAD * d);
    c.width = t.width + p * 2; c.height = t.height + p * 2;
    cc.shadowColor = "rgba(4,6,11,.85)"; cc.shadowBlur = 6 * d;
    cc.drawImage(t, p, p);
    L.c = c;
  }
  function logoOn(i) { var L = LOGOS[NODES[i]]; return useLogos && L && L.ok && L.c ? L : null; }
  /* 앞뒤가 바뀌는 자리(z ≈ 0)에서 두 자리(위·아래)를 짧게 겹쳐 바꿈 */
  function frontShare(z) { var k = Math.max(0, Math.min(1, (z / K + 0.1) / 0.2)); return k * k * (3 - 2 * k); }
  function drawLogo(i, v, q, front, f) {
    var L = logoOn(i); if (!L) return;
    var share = front ? frontShare(v[2]) : 1 - frontShare(v[2]);
    if (share < 0.01) return;
    var g = front ? lctx : ctx, dep = front ? 1 : 0.42;
    var x = q[0] - L.w / 2, y = front ? q[1] - LOGO_GAP - L.h : q[1] + LOGO_GAP;
    x = Math.max(LOGO_EDGE, Math.min(W - LOGO_EDGE - L.w, x));
    y = Math.max(LOGO_EDGE, Math.min(H - LOGO_EDGE - L.h, y));
    g.globalAlpha = Math.min(1, (0.74 * dep + f * 0.26) * share);
    g.drawImage(L.c, x - LOGO_PAD, y - LOGO_PAD, L.w + LOGO_PAD * 2, L.h + LOGO_PAD * 2);
    g.globalAlpha = 1;
  }

  function size() {
    var r = cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height; cv.width = Math.round(W * d); cv.height = Math.round(H * d);
    ctx.setTransform(d, 0, 0, d, 0, 0);
    if (lc) { lc.width = cv.width; lc.height = cv.height; lctx.setTransform(d, 0, 0, d, 0, 0); }
    mobile = window.innerWidth < 980;      /* 점 수를 줄이는 기준(원래 값) */
    small = W < 600;                       /* 이름표를 점 아래 가운데로 */
    K = small ? 1.5 : 1.62;
    /* 원래: min(화면 높이×0.235, 폭×0.135, 240)×0.9 — 칸에 맞춰 칸의 높이·폭 기준으로 바꿈 */
    R = small ? W * 0.26 : Math.min(H * 0.28, W * 0.22, 220);
    cx = W * 0.5; cy = H * 0.5;
    logoS = Math.min(R * LOGO_SCALE, LOGO_MAX_S);
    useLogos = !!lc && logoS / 5.5 >= LOGO_MIN_H;
    NODES.forEach(function (n) { if (LOGOS[n]) prepLogo(LOGOS[n]); });
    var n = mobile ? 950 : 2100, m0 = mobile ? 150 : 280; pts = []; inner = [];
    for (var m = 0; m < m0; m++) {
      var y2 = 1 - 2 * (m + 0.5) / m0, r2 = Math.sqrt(1 - y2 * y2), a2 = m * 2.399963229728653;
      inner.push([Math.cos(a2) * r2 * 0.4, y2 * 0.4, Math.sin(a2) * r2 * 0.4, Math.random()]);
    }
    for (var i = 0; i < n; i++) {
      var y = 1 - 2 * (i + 0.5) / n, rr = Math.sqrt(1 - y * y), a = i * 2.399963229728653;
      pts.push([Math.cos(a) * rr, y, Math.sin(a) * rr, Math.random()]);
    }
    dust = [];
    for (var k = 0; k < (mobile ? 26 : 60); k++) dust.push([Math.random() * W, Math.random() * H, 0.3 + Math.random() * 1.1, Math.random() * 6.28]);
    flash = NODES.map(function () { return 0; });
  }
  function rot(p, ay, ax) {
    var x = p[0], y = p[1], z = p[2], c = Math.cos(ay), s = Math.sin(ay);
    var x1 = x * c + z * s, z1 = -x * s + z * c; c = Math.cos(ax); s = Math.sin(ax);
    return [x1, y * c - z1 * s, y * s + z1 * c];
  }
  function proj(v) { var p = 5 / (5 - v[2]); return [cx + v[0] * R * p, cy + v[1] * R * p, p]; }
  function nodePos(i, t) {
    var a = i / NODES.length * 6.2832 + t * 0.00007, k = K;
    return rot([Math.cos(a) * k, Math.sin(a * 2 + 1) * 0.1, Math.sin(a) * k], 0, 0.42 + py * 0.12);
  }
  function ring(t, k, tilt, spin, alpha, front) {
    ctx.beginPath(); var on = false;
    for (var i = 0; i <= 140; i++) {
      var a = i / 140 * 6.2832 + spin, v = rot([Math.cos(a) * k, 0, Math.sin(a) * k], 0, tilt), q = proj(v);
      if ((v[2] >= 0) === front) { if (on) ctx.lineTo(q[0], q[1]); else { ctx.moveTo(q[0], q[1]); on = true; } } else on = false;
    }
    ctx.strokeStyle = "rgba(" + C_RING + "," + (front ? alpha : alpha * 0.45) + ")"; ctx.lineWidth = 1; ctx.stroke();
  }
  function drawNodes(t, front) {
    ctx.font = MONO; ctx.textBaseline = "middle";
    for (var i = 0; i < NODES.length; i++) {
      var v = nodePos(i, t);
      if (logoOn(i)) drawLogo(i, v, proj(v), front, flash[i]);   /* 로고는 앞뒤 경계에서 겹쳐 바뀌므로 양쪽 차례에서 모두 봅니다 */
      if ((v[2] >= 0) !== front) continue;
      var q = proj(v), len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
      var s = proj([v[0] / len * 1.04, v[1] / len * 1.04, v[2] / len * 1.04]);
      var dep = front ? 1 : 0.42, f = flash[i];
      var g = ctx.createLinearGradient(s[0], s[1], q[0], q[1]);
      g.addColorStop(0, "rgba(227,181,102,0)"); g.addColorStop(1, "rgba(227,181,102," + (0.3 * dep + f * 0.5) + ")");
      ctx.strokeStyle = g; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(s[0], s[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
      var z = 3.2 + f * 2.5;
      ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(0.7854);
      ctx.fillStyle = "rgba(4,6,11,.9)"; ctx.fillRect(-z, -z, z * 2, z * 2);
      ctx.strokeStyle = "rgba(255,201,122," + (0.55 * dep + f * 0.45) + ")"; ctx.strokeRect(-z, -z, z * 2, z * 2);
      if (f > 0.02) { ctx.fillStyle = "rgba(255,201,122," + f + ")"; ctx.fillRect(-1.6, -1.6, 3.2, 3.2); }
      ctx.restore();
      if (logoOn(i)) continue;
      ctx.fillStyle = "rgba(" + C_TXT + "," + (0.74 * dep + f * 0.26) + ")";
      if (small) { ctx.textAlign = "center"; ctx.fillText(NODES[i], q[0], q[1] + 15); }
      else if (q[0] >= cx) { ctx.textAlign = "left"; ctx.fillText(NODES[i], q[0] + 13, q[1]); }
      else { ctx.textAlign = "left"; ctx.fillText(NODES[i], q[0] + 9, q[1] - 14); }
    }
  }
  function frame(now) {
    var dt = Math.min(50, now - (last || now)); last = now;
    var t = reduce ? 6000 : now; px += (tx - px) * 0.04; py += (ty - py) * 0.04;
    ctx.clearRect(0, 0, W, H);
    if (lctx) lctx.clearRect(0, 0, W, H);
    var gl = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 2.5);
    gl.addColorStop(0, "rgba(227,181,102,.2)"); gl.addColorStop(0.22, "rgba(227,181,102,.09)"); gl.addColorStop(0.5, "rgba(90,120,190,.07)"); gl.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
    for (var k = 0; k < dust.length; k++) {
      var d = dust[k];
      if (!reduce) { d[0] += Math.cos(d[3]) * 0.012 * dt; d[1] += Math.sin(d[3]) * 0.008 * dt - 0.004 * dt; }
      if (d[0] < 0) d[0] += W; if (d[0] > W) d[0] -= W; if (d[1] < 0) d[1] += H; if (d[1] > H) d[1] -= H;
      ctx.fillStyle = "rgba(" + C_DUST + "," + (0.1 + 0.12 * Math.sin(t * 0.0006 + d[3] * 9)) + ")"; ctx.fillRect(d[0], d[1], d[2], d[2]);
    }
    var ay = t * 0.00013 + px * 0.5, ax = 0.3 + py * 0.22;
    ring(t, 1.28, 1.1, t * 0.00021, 0.16, false); ring(t, K, 0.42 + py * 0.12, 0, 0.15, false);
    drawNodes(t, false);
    var beat = 0.5 + 0.5 * Math.sin(t * 0.0016);
    for (var w = 0; w < inner.length; w++) {
      var ip = inner[w], iv = rot(ip, -t * 0.00034, 0.5 - py * 0.2), iq = proj(iv), idp = (iv[2] / 0.4 + 1) / 2;
      ctx.fillStyle = "rgba(255,210,140," + ((0.25 + 0.6 * idp) * (0.7 + 0.3 * beat)) + ")";
      var isz = (0.9 + idp * 1.1) * iq[2]; ctx.fillRect(iq[0] - isz / 2, iq[1] - isz / 2, isz, isz);
    }
    var scan = ((t * 0.00021) % 2.6) - 1.3;
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i], br = 1 + 0.03 * Math.sin(p[1] * 5 + t * 0.0011 + p[3] * 6.28);
      var v = rot([p[0] * br, p[1] * br, p[2] * br], ay, ax), q = proj(v), depth = (v[2] + 1) / 2;
      var band = Math.exp(-(p[1] - scan) * (p[1] - scan) * 70), tw = 0.75 + 0.25 * Math.sin(t * 0.002 + p[3] * 40);
      var al = (0.14 + 0.74 * depth * depth) * tw + band * 0.75, sz = (0.7 + depth * 1.0) * q[2] + band * 0.9;
      if (band > 0.25) ctx.fillStyle = "rgba(255,206,132," + Math.min(1, al) + ")";
      else if (depth > 0.55) ctx.fillStyle = "rgba(" + C_WARM + "," + al + ")";
      else ctx.fillStyle = "rgba(" + C_COOL + "," + al + ")";
      ctx.fillRect(q[0] - sz / 2, q[1] - sz / 2, sz, sz);
    }
    ring(t, 1.28, 1.1, t * 0.00021, 0.16, true); ring(t, K, 0.42 + py * 0.12, 0, 0.15, true);
    /* 접수 신호 — 0.65~1.95초마다 가운데에서 결제사 하나로 1.5초 */
    nextPulse -= dt;
    if (nextPulse <= 0 && !reduce) { pulses.push({ i: (Math.random() * NODES.length) | 0, p: 0 }); nextPulse = 650 + Math.random() * 1300; }
    for (var j = pulses.length - 1; j >= 0; j--) {
      var u = pulses[j]; u.p += dt / 1500;
      var nv = nodePos(u.i, t), ln = Math.sqrt(nv[0] * nv[0] + nv[1] * nv[1] + nv[2] * nv[2]);
      var e = u.p * u.p * (3 - 2 * u.p), f0 = 1.04 / ln, mm = f0 + (1 - f0) * e, m2 = f0 + (1 - f0) * Math.max(0, e - 0.16);
      var a1 = proj([nv[0] * mm, nv[1] * mm, nv[2] * mm]), a0 = proj([nv[0] * m2, nv[1] * m2, nv[2] * m2]);
      var tg = ctx.createLinearGradient(a0[0], a0[1], a1[0], a1[1]);
      tg.addColorStop(0, "rgba(255,201,122,0)"); tg.addColorStop(1, "rgba(255,201,122,.95)");
      ctx.strokeStyle = tg; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(a0[0], a0[1]); ctx.lineTo(a1[0], a1[1]); ctx.stroke();
      ctx.fillStyle = "rgba(255,226,180,.95)"; ctx.beginPath(); ctx.arc(a1[0], a1[1], 1.9, 0, 6.2832); ctx.fill();
      if (u.p >= 1) { flash[u.i] = 1; pulses.splice(j, 1); }
    }
    for (var n2 = 0; n2 < flash.length; n2++) flash[n2] *= Math.pow(0.9975, dt);
    drawNodes(t, true);
    /* 구체를 감싸는 눈금 */
    ctx.strokeStyle = "rgba(" + C_TXT + ",.22)"; ctx.lineWidth = 1;
    var b = R * (small ? 1.36 : 1.42), c0 = 11;
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (s) {
      var x = cx + s[0] * b, y = cy + s[1] * b * 0.9; ctx.beginPath(); ctx.moveTo(x - s[0] * c0, y); ctx.lineTo(x, y); ctx.lineTo(x, y - s[1] * c0); ctx.stroke();
    });
    if (running && !reduce) requestAnimationFrame(frame);
  }
  function start() { if (!running) { running = true; last = 0; requestAnimationFrame(frame); } }
  size();
  if (reduce) { requestAnimationFrame(frame); }   /* 움직임 줄이기: 신호 없이 한 장면으로 멈춤 */
  var rz; window.addEventListener("resize", function () { clearTimeout(rz); rz = setTimeout(function () { size(); if (reduce || !running) requestAnimationFrame(frame); }, 120); });
  window.addEventListener("pointermove", function (e) { tx = e.clientX / window.innerWidth - 0.5; ty = e.clientY / window.innerHeight - 0.5; }, { passive: true });
  if (!reduce) {
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { if (es[0].isIntersecting && !document.hidden) start(); else running = false; }).observe(cv);
    } else { start(); }
    document.addEventListener("visibilitychange", function () { if (document.hidden) running = false; else if (cv.getBoundingClientRect().bottom > 0) start(); });
  }
})();
