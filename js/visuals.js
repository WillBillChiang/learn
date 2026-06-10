/* ============================================================
   Learn Something New — visuals.js
   Decorative ambient layer:
     · Constellation/ink particle canvas backdrop
     · Cursor halo (desktop fine-pointer only)
     · IntersectionObserver scroll-reveal
     · SVG stroke-draw trigger on view
     · Scene palette swap (body[data-scene])
   All effects defensively no-op on failure and respect
   prefers-reduced-motion.
   ============================================================ */

(function () {
  'use strict';

  // ---------- Guards ----------------------------------------------------

  var prefersReduced = false;
  try {
    prefersReduced = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) { /* noop */ }

  var hasFinePointer = false;
  try {
    hasFinePointer = window.matchMedia &&
      window.matchMedia('(pointer: fine)').matches;
  } catch (e) { /* noop */ }

  // ---------- Scene palette --------------------------------------------

  // Per-scene tints for the ambient backdrop, expressed as rgb tuples.
  var SCENE_PALETTE = {
    default:     { r: 184, g: 85,  b: 46  }, // sienna
    cosmos:      { r: 196, g: 184, b: 138 }, // muted gold on dusk
    nature:      { r: 107, g: 125, b: 92  }, // sage
    science:     { r: 184, g: 85,  b: 46  },
    mathematics: { r: 107, g: 125, b: 92  },
    technology:  { r: 100, g: 90,  b: 80  },
    philosophy:  { r: 138, g: 58,  b: 26  },
    history:     { r: 184, g: 146, b: 58  },
    art:         { r: 162, g: 94,  b: 58  },
    music:       { r: 120, g: 86,  b: 140 },
    digital:     { r: 58,  g: 90,  b: 125 }, // steel blue, matches scene bg
    money:       { r: 125, g: 98,  b: 51  }, // antique gold-brown
    body:        { r: 168, g: 90,  b: 74  }, // warm clay
    mind:        { r: 107, g: 74,  b: 125 }, // muted violet
    craft:       { r: 176, g: 107, b: 58  }, // burnt umber
    home:        { r: 125, g: 90,  b: 58  }, // hearth brown
    uiux:        { r: 58,  g: 125, b: 140 }, // muted teal-cyan
    fashion:     { r: 168, g: 84,  b: 122 }  // mauve-rose
  };

  function currentScenePalette() {
    var k = (document.body && document.body.dataset && document.body.dataset.scene) || '';
    return SCENE_PALETTE[k] || SCENE_PALETTE['default'];
  }

  // ---------- Scene behavior layer ------------------------------------
  // Drawn AFTER the base particle field. Subtle, low-CPU, additive.
  // rgb is the "r,g,b" string of the current scene palette.

  var sceneState = {
    shootingStar: null,         // cosmos: {x,y,vx,vy,life}
    nextShootAt: 0,
    pollen: null,               // nature: array of rising motes
    nodes: null,                // technology/digital grid
    pulses: null,               // technology/digital traveling pulses
    nextPulseAt: 0,
    wavePhase: 0,               // music: sine phase
    flecks: null                // art: drifting gilt flecks
  };

  function rgbaStr(rgb, a) { return 'rgba(' + rgb + ',' + a.toFixed(3) + ')'; }

  function behaviorCosmos(ctx, t, dt, rgb, w, h) {
    // Occasional shooting star sweeping diagonally.
    if (!sceneState.shootingStar && t > sceneState.nextShootAt) {
      if (sceneState.nextShootAt === 0) { sceneState.nextShootAt = t + 4000; return; }
      sceneState.shootingStar = {
        x: Math.random() * w * 0.6,
        y: Math.random() * h * 0.4,
        vx: 0.5 + Math.random() * 0.4,
        vy: 0.18 + Math.random() * 0.12,
        life: 0, max: 900
      };
      sceneState.nextShootAt = t + 6000 + Math.random() * 9000;
    }
    var s = sceneState.shootingStar;
    if (s) {
      s.life += dt;
      s.x += s.vx * dt * 0.6;
      s.y += s.vy * dt * 0.6;
      var p = 1 - s.life / s.max;
      if (p <= 0 || s.x > w + 40 || s.y > h + 40) { sceneState.shootingStar = null; }
      else {
        var tailX = s.x - s.vx * 60, tailY = s.y - s.vy * 60;
        var grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
        grad.addColorStop(0, rgbaStr(rgb, 0));
        grad.addColorStop(1, rgbaStr(rgb, 0.5 * p));
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY); ctx.lineTo(s.x, s.y); ctx.stroke();
        ctx.beginPath();
        ctx.fillStyle = rgbaStr(rgb, 0.7 * p);
        ctx.arc(s.x, s.y, 1.4, 0, Math.PI * 2); ctx.fill();
      }
    }
    // Brighter "constellation" links: redraw a few strong links among nearest stars.
    // (Base field already draws faint links; here just emphasize a few.)
  }

  function behaviorNature(ctx, t, dt, rgb, w, h) {
    if (!sceneState.pollen) {
      sceneState.pollen = [];
      var c = w < 700 ? 14 : 22;
      for (var i = 0; i < c; i++) {
        sceneState.pollen.push({
          x: Math.random() * w, y: Math.random() * h,
          r: 0.8 + Math.random() * 1.6,
          sway: Math.random() * Math.PI * 2,
          vy: 0.12 + Math.random() * 0.16
        });
      }
    }
    var arr = sceneState.pollen;
    for (var j = 0; j < arr.length; j++) {
      var m = arr[j];
      m.y -= m.vy * (dt / 16);
      m.sway += 0.01 * (dt / 16);
      var x = m.x + Math.sin(m.sway) * 8;
      if (m.y < -10) { m.y = h + 10; m.x = Math.random() * w; }
      var a = 0.18 + 0.12 * Math.sin(m.sway * 2);
      ctx.beginPath();
      ctx.fillStyle = rgbaStr(rgb, a);
      ctx.arc(x, m.y, m.r, 0, Math.PI * 2); ctx.fill();
    }
  }

  function behaviorScience(ctx, t, dt, rgb, w, h) {
    // A few faint centers; nearest particles get a thin orbit ring drawn.
    var centers = [
      { x: w * 0.28, y: h * 0.34 },
      { x: w * 0.72, y: h * 0.62 }
    ];
    for (var c = 0; c < centers.length; c++) {
      var cx = centers[c].x, cy = centers[c].y;
      var ringR = 60 + 18 * Math.sin(t * 0.0006 + c);
      ctx.strokeStyle = rgbaStr(rgb, 0.10);
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.ellipse(cx, cy, ringR, ringR * 0.42, c * 0.6, 0, Math.PI * 2);
      ctx.stroke();
      // an orbiting mote
      var ang = t * 0.0009 * (c ? -1 : 1);
      var ox = cx + Math.cos(ang) * ringR;
      var oy = cy + Math.sin(ang) * ringR * 0.42;
      ctx.beginPath();
      ctx.fillStyle = rgbaStr(rgb, 0.5);
      ctx.arc(ox, oy, 1.6, 0, Math.PI * 2); ctx.fill();
    }
  }

  function behaviorGrid(ctx, t, dt, rgb, w, h) {
    // technology / digital: faint node grid + traveling pulses along edges.
    if (!sceneState.nodes) {
      sceneState.nodes = [];
      var step = w < 700 ? 120 : 160;
      for (var gx = step / 2; gx < w; gx += step) {
        for (var gy = step / 2; gy < h; gy += step) {
          sceneState.nodes.push({ x: gx + (Math.random() - 0.5) * 24, y: gy + (Math.random() - 0.5) * 24 });
        }
      }
      sceneState.pulses = [];
    }
    var nodes = sceneState.nodes;
    // faint nodes
    for (var i = 0; i < nodes.length; i++) {
      ctx.beginPath();
      ctx.fillStyle = rgbaStr(rgb, 0.16);
      ctx.arc(nodes[i].x, nodes[i].y, 1.1, 0, Math.PI * 2); ctx.fill();
    }
    // spawn pulses between adjacent nodes
    if (t > sceneState.nextPulseAt && nodes.length > 1) {
      var a = nodes[(Math.random() * nodes.length) | 0];
      var b = nodes[(Math.random() * nodes.length) | 0];
      if (a !== b) sceneState.pulses.push({ a: a, b: b, p: 0, sp: 0.0006 + Math.random() * 0.0006 });
      sceneState.nextPulseAt = t + 700 + Math.random() * 1200;
    }
    var pulses = sceneState.pulses;
    for (var k = pulses.length - 1; k >= 0; k--) {
      var pu = pulses[k];
      pu.p += pu.sp * dt;
      if (pu.p >= 1) { pulses.splice(k, 1); continue; }
      var ease = pu.p;
      var x = pu.a.x + (pu.b.x - pu.a.x) * ease;
      var y = pu.a.y + (pu.b.y - pu.a.y) * ease;
      // faint connecting line
      ctx.strokeStyle = rgbaStr(rgb, 0.06);
      ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.moveTo(pu.a.x, pu.a.y); ctx.lineTo(pu.b.x, pu.b.y); ctx.stroke();
      // moving pulse dot
      ctx.beginPath();
      ctx.fillStyle = rgbaStr(rgb, 0.55 * (1 - Math.abs(0.5 - pu.p) * 1.4));
      ctx.arc(x, y, 1.8, 0, Math.PI * 2); ctx.fill();
    }
  }

  function behaviorMath(ctx, t, dt, rgb, w, h) {
    // faint drifting lattice + one slow sine curve
    var off = (t * 0.004) % 80;
    ctx.strokeStyle = rgbaStr(rgb, 0.05);
    ctx.lineWidth = 0.5;
    for (var x = -80 + off; x < w; x += 80) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + h * 0.2, h); ctx.stroke();
    }
    // drifting curve
    ctx.strokeStyle = rgbaStr(rgb, 0.12);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var px = 0; px <= w; px += 12) {
      var py = h * 0.5 + Math.sin(px * 0.006 + t * 0.0007) * h * 0.10;
      if (px === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  function behaviorPhilosophy(ctx, t, dt, rgb, w, h) {
    // Slow concentric "thought" rings expanding from a single still centre —
    // contemplative, never busy. Two rings, phase-offset.
    var cx = w * 0.5, cy = h * 0.46;
    var period = 9000;
    for (var i = 0; i < 2; i++) {
      var phase = ((t + i * period * 0.5) % period) / period; // 0..1
      var maxR = Math.min(w, h) * 0.42;
      var r = 30 + phase * maxR;
      var a = 0.14 * (1 - phase);
      if (a <= 0.002) continue;
      ctx.strokeStyle = rgbaStr(rgb, a);
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    // a quiet point at the centre
    ctx.beginPath();
    ctx.fillStyle = rgbaStr(rgb, 0.35);
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function behaviorHistory(ctx, t, dt, rgb, w, h) {
    // Faint horizontal strata that drift slowly downward like sediment / the
    // ruled lines of an old ledger — a sense of accreted time.
    var spacing = h < 600 ? 56 : 74;
    var drift = (t * 0.006) % spacing;
    ctx.lineWidth = 0.6;
    for (var y = -spacing + drift; y < h; y += spacing) {
      var wobble = Math.sin(y * 0.01 + t * 0.0002) * 6;
      ctx.strokeStyle = rgbaStr(rgb, 0.05);
      ctx.beginPath();
      ctx.moveTo(0, y + wobble);
      ctx.lineTo(w, y - wobble);
      ctx.stroke();
    }
  }

  function behaviorArt(ctx, t, dt, rgb, w, h) {
    // Slow-drifting gilt flecks — like dust in a gallery sunbeam.
    if (!sceneState.flecks) {
      sceneState.flecks = [];
      var c = w < 700 ? 12 : 18;
      for (var i = 0; i < c; i++) {
        sceneState.flecks.push({
          x: Math.random() * w, y: Math.random() * h,
          r: 0.8 + Math.random() * 1.8,
          ang: Math.random() * Math.PI * 2,
          sp: 0.1 + Math.random() * 0.18,
          drift: Math.random() * Math.PI * 2
        });
      }
    }
    var arr = sceneState.flecks;
    for (var j = 0; j < arr.length; j++) {
      var f = arr[j];
      f.drift += 0.006 * (dt / 16);
      f.x += Math.cos(f.ang) * f.sp * (dt / 16) + Math.sin(f.drift) * 0.2;
      f.y += Math.sin(f.ang) * f.sp * (dt / 16) * 0.4;
      if (f.x < -10) f.x = w + 10; else if (f.x > w + 10) f.x = -10;
      if (f.y < -10) f.y = h + 10; else if (f.y > h + 10) f.y = -10;
      var a = 0.16 + 0.14 * Math.sin(f.drift * 1.6);
      ctx.beginPath();
      ctx.fillStyle = rgbaStr(rgb, a);
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function behaviorMusic(ctx, t, dt, rgb, w, h) {
    // gentle horizontal waveform low on screen
    sceneState.wavePhase += dt * 0.0016;
    var baseY = h * 0.82;
    ctx.lineWidth = 1.2;
    for (var layer = 0; layer < 2; layer++) {
      ctx.strokeStyle = rgbaStr(rgb, layer === 0 ? 0.16 : 0.08);
      ctx.beginPath();
      for (var px = 0; px <= w; px += 8) {
        var amp = (h * 0.05) * (1 + 0.4 * layer);
        var py = baseY + Math.sin(px * 0.012 + sceneState.wavePhase + layer * 1.3) * amp
                       * Math.sin(px * 0.0016 + t * 0.0003);
        if (px === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  }

  function behaviorMind(ctx, t, dt, rgb, w, h) {
    // A single slow "breath": one soft radial swell near centre, rising and
    // fading on a long cycle — contemplative, never busy.
    var cx = w * 0.5, cy = h * 0.5;
    var period = 7000;
    var phase = (t % period) / period;            // 0..1
    var ease = 0.5 - 0.5 * Math.cos(phase * Math.PI * 2); // smooth in/out 0..1..0
    var r = Math.min(w, h) * (0.16 + 0.20 * ease);
    var a = 0.10 * ease;
    if (a > 0.003) {
      var grad = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
      grad.addColorStop(0, rgbaStr(rgb, a));
      grad.addColorStop(1, rgbaStr(rgb, 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function behaviorWarmHearth(ctx, t, dt, rgb, w, h) {
    // money / craft / home: a few slow embers rising from low on the canvas —
    // a quiet hearth glow. Low count, gentle.
    if (!sceneState.flecks) {
      sceneState.flecks = [];
      var c = w < 700 ? 8 : 12;
      for (var i = 0; i < c; i++) {
        sceneState.flecks.push({
          x: Math.random() * w,
          y: h - Math.random() * h * 0.5,
          r: 0.8 + Math.random() * 1.4,
          vy: 0.10 + Math.random() * 0.12,
          sway: Math.random() * Math.PI * 2
        });
      }
    }
    var arr = sceneState.flecks;
    for (var j = 0; j < arr.length; j++) {
      var f = arr[j];
      f.y -= f.vy * (dt / 16);
      f.sway += 0.012 * (dt / 16);
      var x = f.x + Math.sin(f.sway) * 6;
      if (f.y < -10) { f.y = h + 10; f.x = Math.random() * w; }
      // fade out as they rise
      var a = 0.20 * Math.max(0, f.y / h);
      ctx.beginPath();
      ctx.fillStyle = rgbaStr(rgb, a);
      ctx.arc(x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  var SCENE_BEHAVIOR = {
    cosmos:      behaviorCosmos,
    nature:      behaviorNature,
    science:     behaviorScience,
    technology:  behaviorGrid,
    digital:     behaviorGrid,
    mathematics: behaviorMath,
    music:       behaviorMusic,
    philosophy:  behaviorPhilosophy,
    history:     behaviorHistory,
    art:         behaviorArt,
    mind:        behaviorMind,
    money:       behaviorWarmHearth,
    craft:       behaviorWarmHearth,
    home:        behaviorWarmHearth,
    uiux:        behaviorGrid,
    fashion:     behaviorWarmHearth
    // body: base particle field only (warm clay tint already distinguishes it)
  };

  function currentSceneKey() {
    return (document.body && document.body.dataset && document.body.dataset.scene) || '';
  }

  function drawSceneBehavior(ctx, t, dt, rgb, w, h) {
    var fn = SCENE_BEHAVIOR[currentSceneKey()];
    if (fn) fn(ctx, t, dt, rgb, w, h);
  }

  function resetSceneState() {
    sceneState.pollen = null;
    sceneState.nodes = null;
    sceneState.pulses = null;
    sceneState.shootingStar = null;
    sceneState.nextShootAt = 0;
    sceneState.nextPulseAt = 0;
    sceneState.flecks = null;
  }

  // ---------- Ambient canvas backdrop ----------------------------------

  var canvas, ctx;
  var particles = [];
  var canvasW = 0, canvasH = 0;
  var dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  var rafId = null;
  var lastTime = 0;
  var lastDrawAt = 0;
  // Cap the canvas to ~25fps on touch/coarse devices to save battery; the field
  // is purely ambient so the lower rate is imperceptible. Desktop stays uncapped.
  var minFrameMs = hasFinePointer ? 0 : 40;
  var pageVisible = !document.hidden;
  var pointer = { x: -9999, y: -9999, active: false };

  function initCanvas() {
    canvas = document.getElementById('ambient');
    if (!canvas) return false;
    try {
      ctx = canvas.getContext('2d');
    } catch (e) { ctx = null; }
    if (!ctx) return false;

    resizeCanvas();
    seedParticles();
    window.addEventListener('resize', debounce(function () {
      resizeCanvas();
      seedParticles();
      resetSceneState();
    }, 200));
    document.addEventListener('visibilitychange', function () {
      pageVisible = !document.hidden;
      if (pageVisible) startLoop();
      else stopLoop();
    });
    return true;
  }

  function resizeCanvas() {
    if (!canvas) return;
    canvasW = window.innerWidth;
    canvasH = window.innerHeight;
    canvas.width  = Math.floor(canvasW * dpr);
    canvas.height = Math.floor(canvasH * dpr);
    canvas.style.width  = canvasW + 'px';
    canvas.style.height = canvasH + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function seedParticles() {
    particles = [];
    if (!canvas) return;
    // Slightly fewer on small screens
    var count = canvasW < 700 ? 50 : 80;
    for (var i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvasW,
        y: Math.random() * canvasH,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        r: 0.6 + Math.random() * 1.4,
        // gentle individual flicker
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function drawFrame(t) {
    if (!ctx) return;
    rafId = requestAnimationFrame(drawFrame);

    // Frame-rate cap on coarse-pointer devices (skip the draw, keep scheduling).
    if (minFrameMs && (t - lastDrawAt) < minFrameMs) return;
    lastDrawAt = t;

    var dt = Math.min(50, t - lastTime || 16);
    lastTime = t;

    ctx.clearRect(0, 0, canvasW, canvasH);

    var pal = currentScenePalette();
    var rgb = pal.r + ',' + pal.g + ',' + pal.b;

    // Update + draw particles
    var n = particles.length;
    for (var i = 0; i < n; i++) {
      var p = particles[i];
      p.x += p.vx * (dt / 16);
      p.y += p.vy * (dt / 16);

      // gentle wrap
      if (p.x < -10) p.x = canvasW + 10;
      else if (p.x > canvasW + 10) p.x = -10;
      if (p.y < -10) p.y = canvasH + 10;
      else if (p.y > canvasH + 10) p.y = -10;

      var flicker = 0.55 + 0.45 * Math.sin(p.phase + t * 0.0008);
      ctx.beginPath();
      ctx.fillStyle = 'rgba(' + rgb + ',' + (0.32 * flicker).toFixed(3) + ')';
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Connection lines between near neighbors
    var threshold = 110;
    var thresholdSq = threshold * threshold;
    ctx.lineWidth = 0.6;
    for (var i2 = 0; i2 < n; i2++) {
      var a = particles[i2];
      for (var j = i2 + 1; j < n; j++) {
        var b = particles[j];
        var dx = a.x - b.x, dy = a.y - b.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < thresholdSq) {
          var alpha = (1 - d2 / thresholdSq) * 0.18;
          ctx.strokeStyle = 'rgba(' + rgb + ',' + alpha.toFixed(3) + ')';
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // Per-scene behavior layer (subtle, additive)
    if (!prefersReduced) {
      drawSceneBehavior(ctx, t, dt, rgb, canvasW, canvasH);
    }

    // Cursor halo (desktop only)
    if (pointer.active && hasFinePointer && !prefersReduced) {
      var grad = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 140);
      grad.addColorStop(0, 'rgba(' + rgb + ',0.18)');
      grad.addColorStop(1, 'rgba(' + rgb + ',0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, 140, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function startLoop() {
    if (prefersReduced || !ctx) return;
    if (rafId !== null) return;
    lastTime = performance.now();
    rafId = requestAnimationFrame(drawFrame);
  }

  function stopLoop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  // ---------- Cursor halo tracking -------------------------------------

  function initCursor() {
    if (!hasFinePointer || prefersReduced) return;
    window.addEventListener('mousemove', function (e) {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    }, { passive: true });
    window.addEventListener('mouseleave', function () {
      pointer.active = false;
    });
  }

  // ---------- Pointer-tracked card tilt --------------------------------

  var supportsHover = false;
  try {
    supportsHover = window.matchMedia &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  } catch (e) { /* noop */ }

  function initCardTilt(root) {
    if (prefersReduced || !supportsHover) return;
    var scope = root || document;
    var cards = scope.querySelectorAll('.card-tilt');
    for (var i = 0; i < cards.length; i++) {
      (function (card) {
        if (card.__tiltBound) return;
        card.__tiltBound = true;
        card.addEventListener('pointermove', function (e) {
          if (e.pointerType && e.pointerType !== 'mouse') return; // touch/pen no-op
          var rect = card.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          var mx = (e.clientX - rect.left) / rect.width;
          var my = (e.clientY - rect.top) / rect.height;
          card.style.setProperty('--mx', mx.toFixed(3));
          card.style.setProperty('--my', my.toFixed(3));
          card.style.setProperty('--tilt-active', '1');
        }, { passive: true });
        card.addEventListener('pointerleave', function () {
          card.style.setProperty('--tilt-active', '0');
          card.style.setProperty('--mx', '0.5');
          card.style.setProperty('--my', '0.5');
        });
      })(cards[i]);
    }
  }

  // ---------- Reader scroll-progress hairline --------------------------

  var hairlineRaf = null;
  function updateHairline() {
    hairlineRaf = null;
    var fill = document.querySelector('.scroll-hairline-fill');
    if (!fill) return;
    var doc = document.documentElement;
    var max = (doc.scrollHeight - window.innerHeight);
    var p = max > 0 ? (window.scrollY || doc.scrollTop || 0) / max : 0;
    if (p < 0) p = 0; else if (p > 1) p = 1;
    fill.style.setProperty('--scroll-progress', p.toFixed(4));
  }

  function onHairlineScroll() {
    if (hairlineRaf !== null) return;
    hairlineRaf = requestAnimationFrame(updateHairline);
  }

  var hairlineBound = false;
  function initScrollHairline() {
    var fill = document.querySelector('.scroll-hairline-fill');
    if (!fill) return;
    if (prefersReduced) {
      // Static: an inert, empty hairline.
      fill.style.setProperty('--scroll-progress', '0');
      return;
    }
    if (!hairlineBound) {
      window.addEventListener('scroll', onHairlineScroll, { passive: true });
      window.addEventListener('resize', onHairlineScroll, { passive: true });
      hairlineBound = true;
    }
    updateHairline();
  }

  // ---------- Scroll-reveal observer -----------------------------------

  var revealObserver = null;

  function initReveal() {
    if (!('IntersectionObserver' in window)) {
      // Fallback: immediately reveal anything currently in DOM.
      var els = document.querySelectorAll('.reveal');
      for (var i = 0; i < els.length; i++) els[i].classList.add('is-in');
      return;
    }
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          // Trigger any SVG draw-on-view inside this element
          var paths = entry.target.querySelectorAll('.draw-on-view, .draw-paths');
          if (paths && paths.length) {
            for (var k = 0; k < paths.length; k++) paths[k].classList.add('is-drawn');
          }
          if (entry.target.classList.contains('draw-on-view') ||
              entry.target.classList.contains('draw-paths')) {
            entry.target.classList.add('is-drawn');
          }
          if (revealObserver) revealObserver.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.08
    });
  }

  function attachReveals() {
    if (!revealObserver) return;
    var els = document.querySelectorAll('.reveal:not(.is-in)');
    for (var i = 0; i < els.length; i++) {
      revealObserver.observe(els[i]);
    }
    // Also observe draw-on-view roots not nested under .reveal
    var draws = document.querySelectorAll('.draw-on-view:not(.is-drawn)');
    for (var j = 0; j < draws.length; j++) {
      revealObserver.observe(draws[j]);
    }
  }

  // ---------- Scene swap based on hash / state -------------------------

  function deriveSceneFromHash() {
    var raw = (location.hash || '').replace(/^#/, '');
    if (!raw) return '';
    var parts = raw.split('/');
    if (parts[0] === 'category' && parts[1]) {
      return decodeURIComponent(parts[1]).toLowerCase();
    }
    if (parts[0] === 'topic' && parts[1]) {
      var id = decodeURIComponent(parts[1]);
      var t = (window.TOPICS_BY_ID && window.TOPICS_BY_ID[id]);
      if (t) {
        var catName = (t.category || '').toLowerCase();
        var cats = window.CATEGORIES || [];
        for (var i = 0; i < cats.length; i++) {
          if (cats[i].slug.toLowerCase() === catName || cats[i].name.toLowerCase() === catName) {
            return cats[i].slug;
          }
        }
      }
    }
    if (parts[0] === 'complete' && parts[1]) {
      var id2 = decodeURIComponent(parts[1]);
      var t2 = (window.TOPICS_BY_ID && window.TOPICS_BY_ID[id2]);
      if (t2) {
        var catName2 = (t2.category || '').toLowerCase();
        var cats2 = window.CATEGORIES || [];
        for (var i2 = 0; i2 < cats2.length; i2++) {
          if (cats2[i2].slug.toLowerCase() === catName2 || cats2[i2].name.toLowerCase() === catName2) {
            return cats2[i2].slug;
          }
        }
      }
    }
    return '';
  }

  // Keep the mobile browser chrome (status bar / address bar) in step with the
  // scene — dusk for the dark cosmos scene, warm paper for everything else.
  function updateThemeColor(sceneKey) {
    try {
      var meta = document.querySelector('meta[name="theme-color"]');
      if (!meta) return;
      meta.setAttribute('content', sceneKey === 'cosmos' ? '#2c3447' : '#f4ede0');
    } catch (e) { /* noop */ }
  }

  var lastSceneKey = null;
  function syncScene() {
    if (!document.body) return;
    // app.js may have already set this; if not, derive from hash.
    if (!document.body.dataset.scene) {
      document.body.dataset.scene = deriveSceneFromHash();
    }
    var k = document.body.dataset.scene || '';
    if (k !== lastSceneKey) { resetSceneState(); updateThemeColor(k); lastSceneKey = k; }
  }

  // ---------- Page transition overlay ----------------------------------

  function currentSceneTint() {
    try {
      var slug = currentSceneKey();
      var cats = window.CATEGORIES || [];
      for (var i = 0; i < cats.length; i++) {
        if (cats[i].slug === slug) return cats[i].tint;
      }
    } catch (e) { /* noop */ }
    return null;
  }

  var hasBooted = false;  // skip the wipe on the very first render (nothing to transition from)

  function flashTransition() {
    if (prefersReduced) return;
    var el = document.getElementById('page-transition');
    if (!el) return;
    var tint = currentSceneTint();
    if (tint) el.style.setProperty('--tint', tint);
    else el.style.removeProperty('--tint');
    el.classList.remove('is-active');
    // force reflow
    void el.offsetWidth;
    el.classList.add('is-active');
    setTimeout(function () { el.classList.remove('is-active'); }, 700);
  }

  // ---------- Utilities ------------------------------------------------

  function debounce(fn, wait) {
    var t = null;
    return function () {
      var args = arguments, self = this;
      if (t) clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, args); }, wait);
    };
  }

  // ---------- Inline-SVG hydration -------------------------------------
  // Any <img data-inline-svg src="..."> gets fetched and replaced inline,
  // so CSS currentColor tinting works. Cached after first fetch.

  var svgCache = {};

  function hydrateInlineSVGs() {
    var imgs = document.querySelectorAll('img[data-inline-svg]');
    for (var i = 0; i < imgs.length; i++) {
      (function (img) {
        var src = img.getAttribute('src');
        if (!src) return;
        if (svgCache[src]) {
          replaceImgWithSvg(img, svgCache[src]);
          return;
        }
        try {
          fetch(src, { credentials: 'same-origin' })
            .then(function (r) { return r.ok ? r.text() : ''; })
            .then(function (txt) {
              if (!txt) return;
              svgCache[src] = txt;
              // The original img may have been removed by a re-render
              if (img.parentNode) replaceImgWithSvg(img, txt);
            })
            .catch(function () { /* fail silently — img will just render as-is */ });
        } catch (e) { /* file:// + no fetch — fall back to <img> rendering */ }
      })(imgs[i]);
    }
  }

  function replaceImgWithSvg(img, svgText) {
    try {
      var parent = img.parentNode;
      if (!parent) return;
      var wrap = document.createElement('div');
      wrap.innerHTML = svgText.trim();
      var svg = wrap.querySelector('svg');
      if (!svg) return;
      // Carry classes/attrs across
      svg.setAttribute('aria-hidden', 'true');
      if (img.className) svg.setAttribute('class', img.className);
      parent.replaceChild(svg, img);
      // Trigger any in-view stroke draw immediately if parent is visible
      var draw = parent.closest && parent.closest('.draw-on-view, .is-in');
      if (draw && draw.classList.contains('is-in')) {
        var paths = svg.querySelectorAll('.draw-paths');
        for (var k = 0; k < paths.length; k++) paths[k].classList.add('is-drawn');
      }
    } catch (e) { /* noop */ }
  }

  // ---------- Wire-up --------------------------------------------------

  function init() {
    try {
      if (initCanvas()) startLoop();
    } catch (e) { /* noop */ }
    try { initCursor(); } catch (e) { /* noop */ }
    try { initReveal(); attachReveals(); } catch (e) { /* noop */ }
    try { hydrateInlineSVGs(); } catch (e) { /* noop */ }
    syncScene();
    try { initCardTilt(document); } catch (e) { /* noop */ }
    try { initScrollHairline(); } catch (e) { /* noop */ }

    // Re-attach reveals + sync scene each time the app mounts a new view.
    window.addEventListener('app:rendered', function (e) {
      syncScene();
      var kind = (e && e.detail && e.detail.kind) || 'view';
      // Defer slightly so any deferred DOM is settled.
      setTimeout(function () {
        attachReveals();
        hydrateInlineSVGs();
        initCardTilt(document);
        initScrollHairline();
        // No wipe on the boot render (no prior page) or on prose re-wrap.
        if (kind !== 'prose-wrapped' && hasBooted) flashTransition();
        hasBooted = true;
      }, 20);
    });

    // Fallback: react to hash changes even if app.js didn't dispatch.
    window.addEventListener('hashchange', function () {
      setTimeout(function () {
        syncScene();
        attachReveals();
        hydrateInlineSVGs();
      }, 30);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
