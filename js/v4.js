/* 상투스코퍼레이션 v4 공용 스크립트 — 모든 쪽이 함께 씁니다(BUILD_NOTES.md 4장).
   원칙: 스크립트가 없어도 모든 글이 보입니다. 이 파일은 움직임과 열고 닫기만 덧붙입니다.
   움직임 줄이기 설정이면 마지막 상태를 바로 보여 줍니다. */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  var reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var finePointer = !!(window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches);
  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }

  /* 옛 주소(#work 등)를 새 쪽으로 넘기는 일은 3단계(11-19)에 메인 <head> 의 짧은 스크립트로 옮겼습니다(lib/core.py REDIRECT_JS). */
  var hd = $("#hd");

  /* ---------- 머리 메뉴: 메인 맨 위에서는 숨기고 10px 넘게 내리면 내려옴 ---------- */
  if (hd) {
    var onScroll = function () { hd.classList.toggle("is-on", window.scrollY > 10); };
    if (hd.getAttribute("data-mode") === "home") {
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    } else {
      hd.classList.add("is-on");
    }
    /* 펼침 판(서비스 ▾ · 성장 지원 ▾) */
    /* fix_a(11-19): 마우스를 올려 연 판을 누르면 닫히던 것을 고침. 누르면 «고정»되어 마우스가 떠나도 열린 채 있고,
       다시 누르거나 바깥을 누르거나 Esc 를 누르면 닫힙니다. 키보드(Enter·Space)는 전처럼 열고 닫습니다. */
    var dds = $$("[data-dd]", hd);
    var closeAll = function (except) {
      dds.forEach(function (dd) {
        if (dd === except) return;
        dd.classList.remove("open");
        dd.removeAttribute("data-pin");
        var b = $(".dd-btn", dd); if (b) b.setAttribute("aria-expanded", "false");
      });
    };
    var setOpen = function (dd, on) {
      if (on) closeAll(dd);
      dd.classList.toggle("open", on);
      if (!on) dd.removeAttribute("data-pin");
      $(".dd-btn", dd).setAttribute("aria-expanded", on ? "true" : "false");
    };
    var desktop = function () { return window.matchMedia("(min-width: 1080px)").matches; };
    dds.forEach(function (dd) {
      var btn = $(".dd-btn", dd), timer = 0;
      btn.addEventListener("click", function () {
        var open = dd.classList.contains("open"), pinned = dd.hasAttribute("data-pin");
        if (open && !pinned) { dd.setAttribute("data-pin", ""); return; }  /* 마우스로 열린 판: 누르면 고정 */
        if (open) { setOpen(dd, false); return; }
        setOpen(dd, true); dd.setAttribute("data-pin", "");
      });
      if (finePointer) {
        dd.addEventListener("mouseenter", function () { if (desktop()) { clearTimeout(timer); if (!dd.classList.contains("open")) setOpen(dd, true); } });
        dd.addEventListener("mouseleave", function () {
          if (desktop() && !dd.hasAttribute("data-pin")) { timer = setTimeout(function () { if (!dd.hasAttribute("data-pin")) setOpen(dd, false); }, 140); }
        });
      }
      dd.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && dd.classList.contains("open")) { setOpen(dd, false); btn.focus(); e.stopPropagation(); }
      });
      dd.addEventListener("focusout", function (e) {
        if (desktop() && e.relatedTarget && !dd.contains(e.relatedTarget)) setOpen(dd, false);
      });
    });
    doc.addEventListener("click", function (e) { if (!e.target.closest || !e.target.closest("[data-dd]")) closeAll(null); });
    /* 휴대폰 메뉴 */
    var mbtn = $(".menu-btn", hd), mnav = $("#mnav");
    var setMenu = function (on) {
      hd.classList.toggle("open", on);
      mbtn.setAttribute("aria-expanded", on ? "true" : "false");
      doc.body.classList.toggle("menu-open", on);
      if (on) { var f = $("a,button", mnav); if (f) f.focus(); }
    };
    if (mbtn && mnav) {
      mbtn.addEventListener("click", function () { setMenu(!hd.classList.contains("open")); });
      doc.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && hd.classList.contains("open")) { setMenu(false); mbtn.focus(); }
      });
      $$("a", mnav).forEach(function (a) { a.addEventListener("click", function () { if (!desktop()) setMenu(false); }); });
      window.addEventListener("resize", function () { if (desktop() && hd.classList.contains("open")) setMenu(false); });
    }
  }

  /* ---------- 첫 화면 영상 ---------- */
  var hero = $(".hero"), video = $("#hero-video"), pause = $("#hero-pause"), media = $("#hero-media");
  if (hero) {
    var shown = false;
    var reveal = function () { if (!shown) { shown = true; hero.classList.add("in"); } };
    if (reduce) { reveal(); }
    /* fix_a(11-19): 움직임 줄이기 설정이면 영상은 첫 장면에 멈춘 채로 두고, 단추는 «영상 재생» 상태로 보여 줍니다(누르면 재생). */
    if (video && reduce && pause) {
      pause.hidden = false;
      pause.setAttribute("aria-pressed", "true");
      pause.setAttribute("aria-label", "영상 재생");
      pause.addEventListener("click", function () {
        var paused = video.paused;
        if (paused) { video.play(); video.classList.add("on"); } else { video.pause(); }
        pause.setAttribute("aria-pressed", paused ? "false" : "true");
        pause.setAttribute("aria-label", paused ? "영상 멈춤" : "영상 재생");
      });
    }
    if (video && !reduce) {
      var playing = function () { video.classList.add("on"); reveal(); if (pause) pause.hidden = false; };
      video.addEventListener("playing", playing, { once: true });
      video.addEventListener("loadeddata", reveal, { once: true });
      var p = video.play();
      if (p && p.catch) p.catch(function () { reveal(); });
      if (pause) {
        pause.addEventListener("click", function () {
          var paused = video.paused;
          if (paused) { video.play(); } else { video.pause(); }
          pause.setAttribute("aria-pressed", paused ? "false" : "true");
          pause.setAttribute("aria-label", paused ? "영상 멈춤" : "영상 재생");
        });
      }
      /* 화면 밖이면 멈춰 둠 */
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (es) {
          var userPaused = pause && pause.getAttribute("aria-pressed") === "true";
          if (es[0].isIntersecting) { if (!userPaused && video.paused) video.play().catch(function () {}); }
          else if (!video.paused) video.pause();
        }).observe(hero);
      }
    }
    setTimeout(reveal, 400);
    /* 1440 이상에서만: 스크롤 0→900px 동안 영상 틀이 줄어듦(adyen 비율, 설계 Ⅵ-1) */
    if (media && !reduce) {
      var ticking = false;
      var clip = function () {
        ticking = false;
        if (window.innerWidth < 1440) { media.style.clipPath = ""; hero.style.removeProperty("--clip-y"); return; }
        var k = Math.min(1, Math.max(0, window.scrollY / 900));
        media.style.clipPath = k ? "inset(" + (120 * k).toFixed(1) + "px " + (24 * k).toFixed(1) + "px round " + (12 * k).toFixed(1) + "px)" : "";
        /* fix_a(11-19): «AI로 제작한 연출 영상»·멈춤 단추가 줄어드는 영상 틀 안쪽에 붙어 따라 올라감 */
        hero.style.setProperty("--clip-y", (120 * k).toFixed(1) + "px");
      };
      window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(clip); } }, { passive: true });
      window.addEventListener("resize", clip);
      clip();
    }
  }

  /* ---------- 등장 움직임(.rv · .anim · .st-row) ---------- */
  var targets = $$(".rv, .anim, .st-row");
  if (!reduce && "IntersectionObserver" in window && targets.length) {
    root.classList.add("rv-ready");
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("on"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -15% 0px", threshold: 0 });
    targets.forEach(function (t) { io.observe(t); });
    /* 숫자 세기: «7곳» 하나만, 최종값의 60%에서 1.6초 */
    $$("[data-count]").forEach(function (el) {
      var end = parseFloat(el.getAttribute("data-count")), row = el.closest(".st-row") || el;
      var started = false;
      var run = function () {
        if (started) return; started = true;
        var t0 = performance.now(), from = Math.round(end * 0.6);
        el.textContent = from;
        var step = function (now) {
          var k = Math.min(1, (now - t0) / 1600), e = 1 - Math.pow(1 - k, 3);
          el.textContent = Math.round(from + (end - from) * e);
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      };
      new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { run(); o.disconnect(); } }, { rootMargin: "0px 0px -14% 0px" }).observe(row);
    });
  } else {
    targets.forEach(function (t) { t.classList.add("on"); });
  }

  /* ---------- 지구본 구역: 마우스를 따라오는 빛(C-12) ---------- */
  var gsec = $(".globe-sec");
  if (gsec && finePointer && !reduce) {
    gsec.addEventListener("pointermove", function (e) {
      var r = gsec.getBoundingClientRect();
      gsec.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%");
      gsec.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%");
    }, { passive: true });
  }

  /* ---------- 코드 창 탭(intake.ts · growth.ts) ---------- */
  $$("[role=tablist]").forEach(function (list) {
    var tabs = $$("[role=tab]", list);
    var select = function (t, focus) {
      tabs.forEach(function (x) {
        var on = x === t;
        x.setAttribute("aria-selected", on ? "true" : "false");
        x.tabIndex = on ? 0 : -1;
        var pane = doc.getElementById(x.getAttribute("aria-controls"));
        if (pane) pane.hidden = !on;
      });
      if (focus) t.focus();
    };
    /* HTML 은 모든 칸을 펼친 채로 보냅니다(스크립트가 없으면 다 보임). 여기서 고른 탭 하나만 남깁니다. */
    select(tabs.filter(function (x) { return x.getAttribute("aria-selected") === "true"; })[0] || tabs[0], false);
    var box = list.closest(".code");
    if (box) box.classList.add("ready");
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(t, false); });
      t.addEventListener("keydown", function (e) {
        var n = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (n) { e.preventDefault(); select(tabs[(i + n + tabs.length) % tabs.length], true); }
      });
    });
  });

  /* ---------- 수수료 비교 계산 창(C-47) ---------- */
  var won = function (manwon) {
    var v = Math.round(manwon * 10) / 10;
    if (v >= 10000) { var eok = Math.floor(v / 10000), rest = Math.round(v - eok * 10000); return eok + "억" + (rest ? " " + rest.toLocaleString("ko-KR") + "만" : "") + " 원"; }
    return v.toLocaleString("ko-KR") + "만 원";
  };
  $$("[data-calc]").forEach(function (box) {
    var out = function (k) { return $('[data-c="' + k + '"]', box); };
    var bars = $$(".bar-row .bar i", box);
    $$(".seg button", box).forEach(function (b) {
      b.addEventListener("click", function () {
        var m = parseFloat(b.getAttribute("data-v"));
        $$(".seg button", box).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        var was = m * 0.028, now = m * 0.008;
        out("was").textContent = "월 " + won(was);
        out("now").textContent = "월 " + won(now);
        out("year").textContent = won((was - now) * 12);
        if (bars[0]) bars[0].style.setProperty("--w", "100%");
        if (bars[1]) bars[1].style.setProperty("--w", (now / was * 100).toFixed(1) + "%");
      });
    });
  });

  /* ---------- 하위 쪽: 쪽 안 차례에서 지금 보는 구역 표시 ---------- */
  /* fix_a(11-19): 지나간 구역 강조가 남던 것을 고침. 스크롤할 때마다 «화면 40% 선보다 위에서 시작한 마지막 구역»을 다시 계산하고,
     첫 구역에 닿기 전(첫 화면)에는 강조를 끕니다. 쪽 끝까지 내리면 마지막 구역을 켭니다. */
  var sn = $(".subnav");
  if (sn) {
    var pairs = [];
    $$("a[href^='#']", sn).forEach(function (a) { var s = doc.getElementById(a.getAttribute("href").slice(1)); if (s) pairs.push([s, a]); });
    var cur = null, snTick = false;
    var spy = function () {
      snTick = false;
      var line = window.innerHeight * 0.4, hit = null;
      pairs.forEach(function (p) { if (p[0].getBoundingClientRect().top <= line) hit = p[1]; });
      if (pairs.length && window.innerHeight + window.scrollY >= doc.documentElement.scrollHeight - 4) hit = pairs[pairs.length - 1][1];
      if (hit !== cur) {
        if (cur) cur.classList.remove("is-cur");
        cur = hit;
        if (cur) cur.classList.add("is-cur");
      }
    };
    window.addEventListener("scroll", function () { if (!snTick) { snTick = true; requestAnimationFrame(spy); } }, { passive: true });
    window.addEventListener("resize", spy);
    spy();
  }

  /* ---------- 마우스 효과(11-19 밤, BUILD_NOTES 15장) ----------
     ① 바탕 빛: 커서를 따라 네이비 바탕 위에 옅은 금색·아이스 블루 빛이 따라옵니다. 글·카드 뒤에 깔리고(z-index -1) 누르기를 막지 않습니다.
     ② 카드 테두리: 커서 가까운 카드의 테두리가 옅은 금색으로 밝아집니다(outline 만, 크기·배치는 그대로).
     ③ 바닥 픽셀 SANCTUS: 커서가 지나간 칸이 금색으로 밝아졌다가 천천히 어두운 색으로 돌아갑니다(짧은 물결). 글자 모양은 그대로입니다.
     ①② 는 마우스가 있는 기기에서만, ③ 은 터치 기기에서 누른 자리 둘레만 한 번. 움직임 줄이기 설정이면 셋 다 하지 않습니다.
     requestAnimationFrame 고리 하나가 셋을 함께 그리고, 움직임이 가라앉거나 탭이 안 보이면 멈춥니다. 패럴랙스는 쓰지 않습니다. */
  if (!reduce && window.requestAnimationFrame) (function () {
    var CARD_SEL = ".svc,.gc,.cd,.bt,.sp,.elc,.gg-card,.cmp-card,.pt-grid>li,.gl-names>li,.pr>li,.steps li,.fw-nodes>li,.fw-hub," +
      ".frame,.code,.calc,.rcpt,.case-fig,.cta-box,.tl-box,.mgr,.mg-fig,.ch-board,.er-box,.cto,.ct-fig,.doc-sec.alt,.ft .who";
    var CARD_R = 160;          /* 카드 바깥 이 거리(px)부터 테두리가 밝아지기 시작 */
    var FOLLOW = 0.2;          /* 빛이 커서를 따라가는 정도(장면당, 60fps 기준). 튀지 않게 넘치지 않는 감쇠만 씁니다 */
    var PIX_CORE = 2.2, PIX_RIP_V = 0.016, PIX_RIP_MAX = 4, PIX_FADE = 900;   /* 칸 단위 · 칸/ms · 칸 · ms(밝기가 1/e 로 줄어드는 시간, 약 2초에 원래 색) */
    var pix = $(".ft-pix");
    var glow = null, cards = [], vis = [], cells = [];
    var mx = 0, my = 0, gx = 0, gy = 0, inside = false, moved = false, rafId = 0, lastT = 0;
    var ripples = [], lastRip = { x: -99, y: -99, t: 0 }, pixNear = false, tap = null;

    if (finePointer) {
      glow = doc.createElement("div");
      glow.className = "fx-glow";
      glow.setAttribute("aria-hidden", "true");
      doc.body.insertBefore(glow, doc.body.firstChild);
      cards = $$(CARD_SEL);
      cards.forEach(function (c) { c.classList.add("fx-card"); c._fxg = 0; c._fxw = 0; });
      if ("IntersectionObserver" in window) {
        var cio = new IntersectionObserver(function (es) {
          es.forEach(function (e) {
            var i = vis.indexOf(e.target);
            if (e.isIntersecting && i < 0) vis.push(e.target);
            else if (!e.isIntersecting && i >= 0) { vis.splice(i, 1); e.target._fxg = 0; e.target._fxw = 0; e.target.style.removeProperty("--fx-g"); }
          });
        }, { rootMargin: CARD_R + "px" });
        cards.forEach(function (c) { cio.observe(c); });
      } else { vis = cards.slice(); }
    }
    if (pix) {
      $$("rect", pix).forEach(function (r) {
        cells.push({ el: r, x: parseFloat(r.getAttribute("x")) + 0.43, y: parseFloat(r.getAttribute("y")) + 0.43, h: 0, s: 0 });
      });
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (es) { pixNear = es[0].isIntersecting; }, { rootMargin: "120px" }).observe(pix);
      } else { pixNear = true; }
    }
    if (!glow && !cells.length) return;

    var kick = function () { if (!rafId && !doc.hidden) { lastT = 0; rafId = requestAnimationFrame(tick); } };
    var ease = function (base, dt) { return 1 - Math.pow(1 - base, dt / 16.7); };

    /* 화면 좌표 → 픽셀 글자 좌표(칸 단위). getScreenCTM 은 스크롤·크기 변화를 그대로 반영합니다. */
    var toPix = function (x, y) {
      var m = pix.getScreenCTM(); if (!m) return null;
      var v = m.inverse();
      return { x: v.a * x + v.c * y + v.e, y: v.b * x + v.d * y + v.f };
    };
    var vbW = pix ? (pix.viewBox && pix.viewBox.baseVal ? pix.viewBox.baseVal.width : 41) : 0;
    var heat = function (p, now) {
      if (!p || p.x < -PIX_CORE || p.x > vbW + PIX_CORE || p.y < -PIX_CORE || p.y > 9 + PIX_CORE) return false;
      cells.forEach(function (c) {
        var dx = c.x - p.x, dy = c.y - p.y, d2 = dx * dx + dy * dy;
        if (d2 < PIX_CORE * PIX_CORE) c.h = Math.max(c.h, 0.95 * (1 - d2 / (PIX_CORE * PIX_CORE)));
      });
      var md = Math.abs(p.x - lastRip.x) + Math.abs(p.y - lastRip.y);
      if (md > 1.2 || now - lastRip.t > 160) {
        ripples.push({ x: p.x, y: p.y, t: now });
        if (ripples.length > 8) ripples.shift();
        lastRip = { x: p.x, y: p.y, t: now };
      }
      return true;
    };

    function tick(now) {
      rafId = 0;
      var dt = lastT ? Math.min(50, now - lastT) : 16.7, active = false, i, c;
      lastT = now;
      /* --- 읽기(배치 계산)를 먼저 모두 하고, 쓰기는 뒤에 한꺼번에 --- */
      if (glow && inside) {
        var k = ease(FOLLOW, dt);
        gx += (mx - gx) * k; gy += (my - gy) * k;
        if (Math.abs(mx - gx) + Math.abs(my - gy) > 0.4) active = true;
      }
      var targets = [];
      for (i = 0; i < vis.length; i++) {
        c = vis[i];
        var tg = 0;
        if (inside) {
          var r = c.getBoundingClientRect();
          var ox = Math.max(r.left - gx, 0, gx - r.right), oy = Math.max(r.top - gy, 0, gy - r.bottom), d;
          if (ox || oy) d = Math.sqrt(ox * ox + oy * oy);
          else d = Math.min(gx - r.left, r.right - gx, gy - r.top, r.bottom - gy) * 0.5;  /* 안쪽: 테두리에 가까울수록 밝게 */
          if (d < CARD_R) { tg = 1 - d / CARD_R; tg *= tg; }
        }
        targets.push(tg);
      }
      var p = null;
      if (cells.length && pixNear && finePointer && inside && moved) p = toPix(mx, my);   /* 픽셀 글자는 커서 자리 그대로(따라오는 빛보다 빠르게) */
      if (cells.length && tap) { var tp = toPix(tap.x, tap.y); if (tp) heat(tp, now); tap = null; }
      if (p) heat(p, now);
      moved = false;
      /* --- 쓰기 --- */
      if (glow && inside) glow.style.transform = "translate3d(" + gx.toFixed(1) + "px," + gy.toFixed(1) + "px,0)";
      var kc = ease(0.22, dt);
      for (i = 0; i < vis.length; i++) {
        c = vis[i];
        c._fxg += (targets[i] - c._fxg) * kc;
        if (Math.abs(targets[i] - c._fxg) > 0.004) active = true; else c._fxg = targets[i];
        if (Math.abs(c._fxg - c._fxw) > 0.004 || (c._fxg === 0 && c._fxw !== 0)) {
          c._fxw = c._fxg;
          if (c._fxg) c.style.setProperty("--fx-g", c._fxg.toFixed(3)); else c.style.removeProperty("--fx-g");
        }
      }
      if (cells.length) {
        for (i = ripples.length - 1; i >= 0; i--) {
          var rp = ripples[i], rad = (now - rp.t) * PIX_RIP_V;
          if (rad > PIX_RIP_MAX) { ripples.splice(i, 1); continue; }
          var amp = 0.55 * (1 - rad / PIX_RIP_MAX);
          cells.forEach(function (cl) {
            var dd = Math.sqrt((cl.x - rp.x) * (cl.x - rp.x) + (cl.y - rp.y) * (cl.y - rp.y)), band = 1 - Math.abs(dd - rad) / 0.9;
            if (band > 0) cl.h = Math.max(cl.h, band * amp);
          });
          active = true;
        }
        var fade = Math.exp(-dt / PIX_FADE);
        cells.forEach(function (cl) {
          if (cl.h < 0.004) cl.h = 0; else { cl.h *= fade; active = true; }
          if (Math.abs(cl.h - cl.s) > 0.008 || (!cl.h && cl.s)) {
            cl.s = cl.h;
            if (!cl.h) { cl.el.style.fill = ""; return; }
            /* 색은 빨리 금색(--amber)으로, 밝기는 천천히 — 반쯤 식은 칸도 회갈색이 아니라 옅은 금색으로 보이게 */
            var hc = Math.min(1, cl.h * 2.5), ha = Math.pow(cl.h, 0.75);
            cl.el.style.fill = "rgba(" + Math.round(238 - 11 * hc) + "," + Math.round(241 - 60 * hc) + "," +
              Math.round(246 - 144 * hc) + "," + (0.08 + 0.87 * ha).toFixed(3) + ")";
          }
        });
      }
      if (active) rafId = requestAnimationFrame(tick);
    }

    if (finePointer) {
      doc.addEventListener("pointermove", function (e) {
        if (e.pointerType && e.pointerType !== "mouse") return;
        mx = e.clientX; my = e.clientY;
        if (!inside) { inside = true; gx = mx; gy = my; if (glow) { glow.style.transform = "translate3d(" + gx + "px," + gy + "px,0)"; glow.classList.add("on"); } }
        moved = true;
        kick();
      }, { passive: true });
      var leave = function () { inside = false; if (glow) glow.classList.remove("on"); kick(); };
      doc.addEventListener("mouseout", function (e) { if (!e.relatedTarget) leave(); });   /* 커서가 창 밖으로 */
      window.addEventListener("blur", leave);
      window.addEventListener("scroll", function () { if (inside) { moved = pixNear; kick(); } }, { passive: true });
    }
    /* 터치·펜: 누른 자리 둘레만 한 번 밝아짐 */
    if (cells.length) {
      doc.addEventListener("pointerdown", function (e) {
        if (e.pointerType === "mouse" || !pixNear) return;
        tap = { x: e.clientX, y: e.clientY };
        kick();
      }, { passive: true });
    }
    doc.addEventListener("visibilitychange", function () {
      if (doc.hidden) { if (rafId) cancelAnimationFrame(rafId); rafId = 0; inside = false; if (glow) glow.classList.remove("on"); }
    });
  })();
})();
