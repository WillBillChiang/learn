/* ============================================================
   Learn Something New — app.js
   State machine, routing, and rendering.
   ============================================================ */

(function () {
  'use strict';

  // ---- Constants ---------------------------------------------------------

  var LEVEL_LABELS = [
    'Begin',              // index 0 → renders depth 1
    'Go Deeper',          // depth 2
    'Continue',           // depth 3
    'Press On',           // depth 4
    'Into the Technical', // depth 5
    'Reach Mastery',      // depth 6
    'Finish'              // depth 6 → completion
  ];

  var LEVEL_EYEBROWS = [
    'A First Glimpse',
    'The Core Idea',
    'Mechanism',
    'Underlying Principles',
    'Technical Depth',
    'Mastery & Frontier'
  ];

  var MAX_DEPTH = 6;

  // ---- State -------------------------------------------------------------

  var state = {
    view: 'home',           // 'home' | 'category' | 'reading' | 'complete' | 'legal'
    categorySlug: null,
    topicId: null,
    depth: 1,
    legalDoc: null          // doc key when view === 'legal' (null → legal index)
  };

  var pendingTransition = null; // { kind:'depth', dir:'deeper'|'back' } consumed by next renderReader

  // ---- Utilities ---------------------------------------------------------

  function $(sel, root) { return (root || document).querySelector(sel); }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function estReadMinutes(html) {
    if (!html) return 1;
    // Strip tags, collapse entities to spaces, count word-ish tokens.
    var text = String(html)
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z#0-9]+;/gi, ' ');
    var words = text.split(/\s+/).filter(function (w) { return w.length > 0; }).length;
    var min = Math.round(words / 220);
    return Math.max(1, min);
  }

  function formatReadTime(min) {
    return '~' + min + ' min';
  }

  function countWords(html) {
    if (!html) return 0;
    var text = String(html)
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z#0-9]+;/gi, ' ');
    return text.split(/\s+/).filter(function (w) { return w.length > 0; }).length;
  }

  function topicTotalMinutes(topic) {
    var levels = (topic && Array.isArray(topic.levels)) ? topic.levels : [];
    // Sum raw words first, then convert once — avoids per-level rounding inflation.
    var words = 0;
    for (var i = 0; i < levels.length; i++) {
      words += countWords(levels[i] && levels[i].body);
    }
    return Math.max(1, Math.round(words / 220));
  }

  // Spell small counts for the masthead eyebrow; fall back to the numeral.
  function disciplineCount(n) {
    var words = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
      'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen',
      'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty'];
    return words[n] || String(n);
  }

  function ornament(glyph) {
    var g = glyph || '✦';
    return (
      '<div class="ornament" aria-hidden="true">' +
        '<span class="rule"></span>' +
        '<span class="glyph">' + escapeHtml(g) + '</span>' +
        '<span class="rule"></span>' +
      '</div>'
    );
  }

  function ornamentLarge(glyph) {
    var g = glyph || '✦';
    return (
      '<div class="ornament is-large" aria-hidden="true">' +
        '<span class="rule"></span>' +
        '<span class="diamond"></span>' +
        '<span class="glyph">' + escapeHtml(g) + '</span>' +
        '<span class="diamond"></span>' +
        '<span class="rule"></span>' +
      '</div>'
    );
  }

  function wrapProseReveals(rootEl) {
    if (!rootEl) return;
    var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return; // keep prose static under reduced motion

    var body = rootEl.querySelector('.reader-body');
    if (!body) return;

    // Only wrap direct-child top-level blocks; leave decorative SVGs alone.
    var WRAP = { P: 1, BLOCKQUOTE: 1, PRE: 1, H3: 1, UL: 1, OL: 1 };
    var children = Array.prototype.slice.call(body.children);
    for (var i = 0; i < children.length; i++) {
      var el = children[i];
      if (!el || el.nodeType !== 1) continue;
      if (!WRAP[el.tagName]) continue;            // skip drop/finis ornaments (SVG)
      if (el.parentNode !== body) continue;
      if (el.closest('.prose-reveal')) continue;  // already wrapped
      var wrap = document.createElement('div');
      wrap.className = 'prose-reveal reveal';
      el.parentNode.insertBefore(wrap, el);
      wrap.appendChild(el);
    }
  }

  // ---- Lesson of the Day -------------------------------------------------

  // Whole-day index anchored to UTC (the boundary rolls at 00:00 UTC), counted
  // from the Unix epoch. Using UTC — not the viewer's local timezone — means
  // every visitor worldwide is on the same day index at the same instant, so
  // the lesson of the day is identical for everyone viewing the site.
  function dayIndex() {
    return Math.floor(Date.now() / 86400000);
  }

  // Deterministic "topic of the day": the same for every visitor on a given
  // UTC day, but consecutive days jump across the library (Knuth's
  // multiplicative hash spreads adjacent day indices far apart).
  function lessonOfTheDay() {
    var all = window.ALL_TOPICS || [];
    if (!all.length) return null;
    var d = dayIndex();
    var idx = (((d * 2654435761) % all.length) + all.length) % all.length;
    return all[idx] || all[0];
  }

  // Displayed in the viewer's language but anchored to the UTC calendar day, so
  // the date shown matches the UTC-based lesson pick for every visitor.
  function todayLabel() {
    try {
      return new Date().toLocaleDateString(undefined, {
        weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC'
      });
    } catch (e) {
      return '';
    }
  }

  function getCategory(slug) {
    var cats = window.CATEGORIES || [];
    for (var i = 0; i < cats.length; i++) if (cats[i].slug === slug) return cats[i];
    return null;
  }

  function categoryBySlugOrName(needle) {
    if (!needle) return null;
    var cats = window.CATEGORIES || [];
    var n = String(needle).toLowerCase();
    for (var i = 0; i < cats.length; i++) {
      if (cats[i].slug.toLowerCase() === n || cats[i].name.toLowerCase() === n) return cats[i];
    }
    return null;
  }

  function topicsIn(slug) {
    return (window.TOPICS_BY_CATEGORY && window.TOPICS_BY_CATEGORY[slug]) || [];
  }

  function topicById(id) {
    return (window.TOPICS_BY_ID && window.TOPICS_BY_ID[id]) || null;
  }

  function topicCategory(topic) {
    if (!topic) return null;
    return categoryBySlugOrName(topic.category) || categoryBySlugOrName(topic.categorySlug);
  }

  // ---- Per-category illustration markup (inline <object> for CSS tint) --

  function catIllustration(slug) {
    // Embed via <img> so styles apply via filter/opacity; SVG uses currentColor,
    // so we wrap in a span colored with --tint and use an inline-loaded SVG via
    // background isn't possible — instead we use <img> for safety and a CSS
    // overlay tint. The SVG file path is /assets/cat-<slug>.svg.
    if (!slug) return '';
    return (
      '<div class="cat-illus draw-on-view" aria-hidden="true">' +
        '<img src="assets/cat-' + slug + '.svg" alt="" loading="lazy" data-inline-svg />' +
      '</div>'
    );
  }

  function setBodyScene(slugOrEmpty) {
    if (!document.body) return;
    document.body.dataset.scene = slugOrEmpty || '';
  }

  // Announce a concise navigation message to the polite status region.
  function announce(msg) {
    try {
      var node = document.getElementById('sr-status');
      if (node) node.textContent = msg || '';
    } catch (e) { /* noop */ }
  }

  // Move focus to the most meaningful heading of the freshly mounted view,
  // so keyboard + screen-reader users land in the new content instead of <body>.
  function focusView(root) {
    if (!root) return;
    var sels;
    // Tried in priority order (querySelector on a comma-list ignores list order
    // and returns first-in-DOM, so we must check each selector individually).
    if (state.view === 'reading') sels = ['.reader-level-title', '.reader-title', '.empty-state'];
    else if (state.view === 'category') sels = ['.cat-head h1', '.empty-state'];
    else if (state.view === 'complete') sels = ['.complete h1'];
    else if (state.view === 'legal') sels = ['.legal-head h1', '.legal-index h1'];
    else sels = ['.home-title'];
    var target = null;
    for (var i = 0; i < sels.length && !target; i++) target = root.querySelector(sels[i]);
    if (!target) target = root;
    try {
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    } catch (e) {
      try { target.focus(); } catch (e2) { /* noop */ }
    }
  }

  function emitRendered(view, kind) {
    try {
      window.dispatchEvent(new CustomEvent('app:rendered', {
        detail: {
          view: view,
          kind: kind || 'view',
          state: { view: state.view, categorySlug: state.categorySlug, topicId: state.topicId, depth: state.depth }
        }
      }));
    } catch (e) { /* older browsers without CustomEvent constructor */
      try {
        var ev = document.createEvent('CustomEvent');
        ev.initCustomEvent('app:rendered', false, false, { view: view, kind: kind || 'view' });
        window.dispatchEvent(ev);
      } catch (e2) { /* noop */ }
    }
  }

  // ---- Mount with fade transition ---------------------------------------

  var mountRoot = null;
  function getRoot() {
    if (!mountRoot) mountRoot = document.getElementById('app');
    return mountRoot;
  }

  // Monotonic render token: each mount() bumps it so a stale, deferred swap
  // from a superseded render can detect it lost the race and bail.
  var renderSeq = 0;
  var pendingMountTimer = null;

  function mount(html, kind, dir, onMounted) {
    var root = getRoot();
    if (!root) return;

    var my = ++renderSeq;
    // A newer render cancels any still-pending swap from a previous one.
    if (pendingMountTimer) { clearTimeout(pendingMountTimer); pendingMountTimer = null; }

    kind = kind || 'view';
    var isDepth = (kind === 'depth' && (dir === 'deeper' || dir === 'back'));

    var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Clear any lingering transition classes
    root.classList.remove(
      'mount-exit', 'mount-exit-active', 'mount-enter', 'mount-enter-active', 'page-enter',
      'depth-exit-deeper', 'depth-exit-back', 'depth-enter-deeper', 'depth-enter-back'
    );

    var exitClass, enterClass, fadeOutMs, enterCleanupMs;

    if (isDepth && !prefersReduced) {
      exitClass  = (dir === 'deeper') ? 'depth-exit-deeper'  : 'depth-exit-back';
      enterClass = (dir === 'deeper') ? 'depth-enter-deeper' : 'depth-enter-back';
      fadeOutMs = 220;
      enterCleanupMs = 560;
      root.classList.add(exitClass);
    } else {
      // Existing generic behavior
      root.classList.add('mount-exit');
      requestAnimationFrame(function () { root.classList.add('mount-exit-active'); });
      fadeOutMs = prefersReduced ? 60 : 200;
      enterCleanupMs = prefersReduced ? 80 : 660;
    }

    pendingMountTimer = setTimeout(function () {
      pendingMountTimer = null;
      // A newer render superseded this one while we were fading out — abort.
      if (my !== renderSeq) return;
      root.innerHTML = html;
      root.classList.remove('mount-exit', 'mount-exit-active', 'depth-exit-deeper', 'depth-exit-back');

      if (isDepth && !prefersReduced) {
        root.classList.add(enterClass);
        setTimeout(function () {
          root.classList.remove('depth-enter-deeper', 'depth-enter-back');
        }, enterCleanupMs);
      } else {
        root.classList.add('mount-enter', 'page-enter');
        requestAnimationFrame(function () {
          root.classList.add('mount-enter-active');
          setTimeout(function () {
            root.classList.remove('mount-enter', 'mount-enter-active', 'page-enter');
          }, enterCleanupMs);
        });
      }

      // Each level / view starts fresh at the top.
      window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });

      // Notify visual layer that a new view has mounted.
      emitRendered(state.view, kind);

      // Optional synchronous post-mount hook (DOM is live, before paint).
      if (typeof onMounted === 'function') {
        try { onMounted(root); } catch (e) { /* noop */ }
      }
    }, fadeOutMs);
  }

  // ---- Hash routing ------------------------------------------------------

  function writeHash() {
    var h = '';
    if (state.view === 'home') h = '';
    else if (state.view === 'category') h = '#category/' + state.categorySlug;
    else if (state.view === 'reading') h = '#topic/' + state.topicId + '/' + state.depth;
    else if (state.view === 'complete') h = '#complete/' + state.topicId;
    else if (state.view === 'legal') h = '#legal' + (state.legalDoc ? '/' + state.legalDoc : '');

    if (location.hash !== h) {
      if (h === '') {
        // replaceState does NOT emit hashchange, so don't arm the suppressor
        // (it would otherwise swallow the next genuine navigation).
        history.replaceState(null, '', location.pathname + location.search);
      } else {
        // Avoid triggering hashchange-driven re-render loop
        suppressHashOnce = true;
        location.hash = h;
      }
    }
  }

  var suppressHashOnce = false;

  function readHash() {
    var raw = (location.hash || '').replace(/^#/, '');
    if (!raw) return { view: 'home' };
    var parts = raw.split('/');
    var head = parts[0];

    if (head === 'category' && parts[1]) {
      return { view: 'category', categorySlug: decodeURIComponent(parts[1]) };
    }
    if (head === 'topic' && parts[1]) {
      var d = parseInt(parts[2], 10);
      if (!d || d < 1) d = 1;
      if (d > MAX_DEPTH) d = MAX_DEPTH;
      return { view: 'reading', topicId: decodeURIComponent(parts[1]), depth: d };
    }
    if (head === 'complete' && parts[1]) {
      return { view: 'complete', topicId: decodeURIComponent(parts[1]) };
    }
    if (head === 'legal') {
      return { view: 'legal', legalDoc: parts[1] ? decodeURIComponent(parts[1]) : null };
    }
    return { view: 'home' };
  }

  function applyFromHash() {
    var r = readHash();
    if (r.view === 'home') {
      state.view = 'home';
      renderHome();
      return;
    }
    if (r.view === 'category') {
      var cat = getCategory(r.categorySlug);
      if (!cat) { state.view = 'home'; renderHome(); return; }
      state.view = 'category';
      state.categorySlug = cat.slug;
      renderCategory(cat.slug);
      return;
    }
    if (r.view === 'reading') {
      var t = topicById(r.topicId);
      if (!t) { state.view = 'home'; renderHome(); return; }
      state.view = 'reading';
      state.topicId = t.id;
      state.depth = Math.min(MAX_DEPTH, Math.max(1, r.depth || 1));
      var c = topicCategory(t);
      state.categorySlug = c ? c.slug : null;
      renderReader(t, state.depth);
      return;
    }
    if (r.view === 'complete') {
      var tc = topicById(r.topicId);
      if (!tc) { state.view = 'home'; renderHome(); return; }
      state.view = 'complete';
      state.topicId = tc.id;
      var cc = topicCategory(tc);
      state.categorySlug = cc ? cc.slug : null;
      renderComplete(tc);
      return;
    }
    if (r.view === 'legal') {
      state.view = 'legal';
      state.legalDoc = r.legalDoc || null;
      renderLegal(state.legalDoc);
      return;
    }
  }

  window.addEventListener('hashchange', function () {
    if (suppressHashOnce) { suppressHashOnce = false; return; }
    applyFromHash();
  });

  // ---- Renderers ---------------------------------------------------------

  function renderHome() {
    var cats = window.CATEGORIES || [];
    var totalTopics = (window.ALL_TOPICS || []).length;
    var missing = window.__missingData || [];

    var cardsHtml = cats.map(function (c) {
      var count = topicsIn(c.slug).length;
      var countLabel = count === 1 ? '1 topic' : count + ' topics';
      return (
        '<button class="cat-card tx-lift card-tilt" style="--tint:' + c.tint + '" ' +
          'data-slug="' + escapeHtml(c.slug) + '" ' +
          'aria-label="Open category: ' + escapeHtml(c.name) + ', ' + countLabel + '">' +
          catIllustration(c.slug) +
          '<span class="cat-glyph" aria-hidden="true">' + escapeHtml(c.glyph) + '</span>' +
          '<div class="cat-body">' +
            '<div class="cat-eyebrow">Category</div>' +
            '<h2 class="cat-name">' + escapeHtml(c.name) + '</h2>' +
            '<p class="cat-blurb">' + escapeHtml(c.blurb) + '</p>' +
          '</div>' +
          '<div class="cat-meta">' +
            '<span>' + escapeHtml(countLabel) + '</span>' +
            '<span class="arrow" aria-hidden="true">→</span>' +
          '</div>' +
        '</button>'
      );
    }).join('');

    var surpriseEnabled = totalTopics > 0;
    var surpriseHtml = (
      '<button class="cat-card surprise tx-lift card-tilt" data-action="random" ' +
        (surpriseEnabled ? '' : 'disabled aria-disabled="true" ') +
        'aria-label="Surprise me with a random topic">' +
        '<svg class="surprise-stars" viewBox="0 0 400 200" aria-hidden="true">' +
          '<circle cx="60"  cy="42"  r="1.4" fill="currentColor" opacity="0.7"/>' +
          '<circle cx="120" cy="28"  r="1.0" fill="currentColor" opacity="0.55"/>' +
          '<circle cx="200" cy="58"  r="1.6" fill="currentColor" opacity="0.85"/>' +
          '<circle cx="288" cy="36"  r="1.2" fill="currentColor" opacity="0.65"/>' +
          '<circle cx="346" cy="74"  r="1.4" fill="currentColor" opacity="0.7"/>' +
          '<circle cx="92"  cy="118" r="1.0" fill="currentColor" opacity="0.5"/>' +
          '<circle cx="262" cy="146" r="1.2" fill="currentColor" opacity="0.6"/>' +
        '</svg>' +
        '<span class="cat-glyph" aria-hidden="true">✺</span>' +
        '<div class="cat-body">' +
          '<div class="cat-eyebrow">Wander</div>' +
          '<h2 class="cat-name">Surprise Me</h2>' +
          '<p class="cat-blurb">Let chance choose what to learn tonight.</p>' +
        '</div>' +
        '<div class="cat-meta">' +
          '<span>' + (surpriseEnabled ? 'A random topic' : 'Awaiting content') + '</span>' +
          '<span class="arrow" aria-hidden="true">→</span>' +
        '</div>' +
      '</button>'
    );

    // ---- Lesson of the Day feature ----
    var lod = lessonOfTheDay();
    var lodHtml = '';
    if (lod) {
      var lodCat = topicCategory(lod);
      var lodTint = lod.color || (lodCat && lodCat.tint) || 'var(--accent)';
      var lodCatName = (lodCat && lodCat.name) || lod.category || 'Topic';
      var lodGlyph = lod.glyph || (lodCat && lodCat.glyph) || '✦';
      var lodMins = topicTotalMinutes(lod);
      var dateStr = todayLabel();
      lodHtml =
        '<section class="lesson-of-day" aria-label="Lesson of the day">' +
          '<button class="lod-card tx-lift card-tilt" style="--tint:' + escapeHtml(lodTint) + '" ' +
            'data-action="lesson" data-topic-id="' + escapeHtml(lod.id) + '" ' +
            'aria-label="Begin today’s lesson: ' + escapeHtml(lod.title) + '">' +
            '<div class="lod-aside" aria-hidden="true">' +
              '<svg class="lod-orbit" viewBox="0 0 120 120" aria-hidden="true">' +
                '<circle cx="60" cy="60" r="46" fill="none" stroke="currentColor" stroke-width="0.6" opacity="0.35"/>' +
                '<circle cx="60" cy="60" r="32" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.25"/>' +
                '<circle class="lod-orbit-dot" cx="60" cy="14" r="2.4" fill="currentColor"/>' +
              '</svg>' +
              '<span class="lod-glyph">' + escapeHtml(lodGlyph) + '</span>' +
            '</div>' +
            '<div class="lod-main">' +
              '<div class="lod-eyebrow eyebrow">Lesson of the Day' + (dateStr ? ' · ' + escapeHtml(dateStr) : '') + '</div>' +
              '<div class="lod-cat">' + escapeHtml(lodCatName) + '</div>' +
              '<h2 class="lod-title">' + escapeHtml(lod.title) + '</h2>' +
              '<p class="lod-tagline">' + escapeHtml(lod.tagline || '') + '</p>' +
              '<span class="lod-cta">' +
                '<span class="lod-cta-label">Begin today’s lesson</span>' +
                '<span class="arr" aria-hidden="true">→</span>' +
                '<span class="lod-cta-meta">6 depths · ~' + lodMins + ' min</span>' +
              '</span>' +
            '</div>' +
          '</button>' +
        '</section>';
    }

    var noticeHtml = '';
    if (missing && missing.length) {
      noticeHtml = '<div class="notice">Some content is still arriving · ' +
        escapeHtml(String(missing.length)) + ' source' + (missing.length === 1 ? '' : 's') +
        ' unavailable · the gallery opens with what is here.</div>';
    } else if (totalTopics === 0) {
      noticeHtml = '<div class="notice">The shelves are being stocked · check back shortly.</div>';
    }

    var html =
      '<section class="home">' +
        '<header class="home-masthead">' +
          '<div class="hero-orrery" aria-hidden="true">' +
            '<img src="assets/hero-orrery.svg" alt="" data-inline-svg />' +
          '</div>' +
          '<div class="masthead-inner">' +
            '<div class="home-eyebrow eyebrow">A Field Guide · ' + escapeHtml(disciplineCount(cats.length)) + ' Disciplines</div>' +
            '<h1 class="home-title shimmer-once" tabindex="-1">Learn <span class="italic">Something</span> New</h1>' +
            ornament('✦') +
            '<p class="home-subtitle">A quiet room of ideas, told in six deepening levels — from a first glimpse to the working edge.</p>' +
          '</div>' +
        '</header>' +
        noticeHtml +
        lodHtml +
        '<nav class="cat-grid stagger" aria-label="Categories">' +
          cardsHtml +
          surpriseHtml +
        '</nav>' +
      '</section>';

    setBodyScene('');
    mount(html, 'view', null, function (root) {
      if (!root) return;
      var cards = root.querySelectorAll('.cat-card[data-slug]');
      cards.forEach(function (el) {
        el.addEventListener('click', function () {
          window.LearnApp.pickCategory(el.getAttribute('data-slug'));
        });
      });
      var surprise = root.querySelector('.cat-card[data-action="random"]');
      if (surprise && !surprise.disabled) {
        surprise.addEventListener('click', function () { window.LearnApp.pickRandom(); });
      }
      var lessonBtn = root.querySelector('[data-action="lesson"]');
      if (lessonBtn) {
        lessonBtn.addEventListener('click', function () {
          window.LearnApp.pickTopic(lessonBtn.getAttribute('data-topic-id'));
        });
      }
      announce('Learn Something New — home. ' + cats.length + ' categories.');
      focusView(root);
    });
    writeHash();
  }

  function renderCategory(slug) {
    var cat = getCategory(slug);
    if (!cat) { renderHome(); return; }

    var topics = topicsIn(slug);

    var topicCardsHtml = topics.map(function (t) {
      var tint = t.color || cat.tint;
      var glyph = t.glyph || cat.glyph;
      return (
        '<button class="topic-card tx-lift card-tilt" style="--tint:' + escapeHtml(tint) + '" ' +
          'data-topic-id="' + escapeHtml(t.id) + '" ' +
          'aria-label="Read about ' + escapeHtml(t.title) + '">' +
          '<span class="topic-glyph" aria-hidden="true">' + escapeHtml(glyph) + '</span>' +
          '<div>' +
            '<div class="topic-eyebrow">' + escapeHtml(cat.name) + '</div>' +
            '<h2 class="topic-title">' + escapeHtml(t.title) + '</h2>' +
            '<p class="topic-tagline">' + escapeHtml(t.tagline || '') + '</p>' +
          '</div>' +
          '<div class="topic-meta">' +
            '<span>6 depths · <span class="meta-time">~' + topicTotalMinutes(t) + ' min</span></span>' +
            '<span class="arrow" aria-hidden="true">→</span>' +
          '</div>' +
        '</button>'
      );
    }).join('');

    var grid = topics.length
      ? '<div class="topic-grid stagger">' + topicCardsHtml + '</div>'
      : '<div class="empty-state">The essays for this category are still being set in type. Wander elsewhere — or try another shelf.</div>';

    var actionsHtml = topics.length > 1
      ? '<div class="cat-actions">' +
          '<button class="btn-ghost" data-action="random-in-cat">Random within ' + escapeHtml(cat.name) + '</button>' +
        '</div>'
      : '';

    var html =
      '<section class="category-view" style="--tint:' + cat.tint + '">' +
        '<header class="cat-head">' +
          '<nav class="crumbs" aria-label="Breadcrumb">' +
            '<button data-action="home" aria-label="Return home">Home</button>' +
            '<span class="sep" aria-hidden="true">/</span>' +
            '<span>' + escapeHtml(cat.name) + '</span>' +
          '</nav>' +
          '<div class="cat-head-illus draw-on-view" aria-hidden="true">' +
            '<img src="assets/cat-' + cat.slug + '.svg" alt="" data-inline-svg />' +
          '</div>' +
          '<div class="cat-head-glyph" aria-hidden="true">' + escapeHtml(cat.glyph) + '</div>' +
          '<h1 tabindex="-1">' + escapeHtml(cat.name) + '</h1>' +
          '<p class="cat-head-blurb">' + escapeHtml(cat.blurb) + '</p>' +
          actionsHtml +
        '</header>' +
        ornamentLarge(cat.glyph) +
        grid +
      '</section>';

    setBodyScene(cat.slug);
    mount(html, 'view', null, function (root) {
      if (!root) return;
      root.querySelectorAll('.topic-card[data-topic-id]').forEach(function (el) {
        el.addEventListener('click', function () {
          window.LearnApp.pickTopic(el.getAttribute('data-topic-id'));
        });
      });
      var homeBtn = root.querySelector('[data-action="home"]');
      if (homeBtn) homeBtn.addEventListener('click', function () { window.LearnApp.home(); });
      var rand = root.querySelector('[data-action="random-in-cat"]');
      if (rand) rand.addEventListener('click', function () {
        var list = topicsIn(slug);
        if (!list.length) return;
        var t = list[Math.floor(Math.random() * list.length)];
        window.LearnApp.pickTopic(t.id);
      });
      announce(cat.name + ' — ' + topics.length + (topics.length === 1 ? ' topic.' : ' topics.'));
      focusView(root);
    });
    writeHash();
  }

  function renderReader(topic, depth) {
    if (!topic) { renderHome(); return; }
    var cat = topicCategory(topic);
    var tint = topic.color || (cat && cat.tint) || '#b8552e';
    var catName = (cat && cat.name) || topic.category || 'Topic';
    var glyph = topic.glyph || (cat && cat.glyph) || '✦';

    var levels = Array.isArray(topic.levels) ? topic.levels : [];
    if (!levels.length) {
      setBodyScene(cat ? cat.slug : '');
      mount(
        '<section class="reader"><div class="empty-state" tabindex="-1">This essay has no body yet.</div>' +
        '<div class="continue-row"><button class="btn-ghost" data-action="home">Return home</button></div></section>',
        'view', null,
        function (root) {
          if (!root) return;
          var btn = root.querySelector('[data-action="home"]');
          if (btn) btn.addEventListener('click', function () { window.LearnApp.home(); });
          announce('This essay has no body yet.');
          focusView(root);
        }
      );
      return;
    }

    var d = Math.min(MAX_DEPTH, Math.max(1, depth || 1));
    // Find level matching depth, else fallback to index
    var level = null;
    for (var i = 0; i < levels.length; i++) {
      if (levels[i] && levels[i].depth === d) { level = levels[i]; break; }
    }
    if (!level) level = levels[Math.min(levels.length - 1, d - 1)];

    var levelTitle = (level && level.title) || LEVEL_EYEBROWS[d - 1] || 'Level ' + d;
    var levelBody  = (level && level.body) || '<p><em>This level is still being written.</em></p>';
    var pullQuote  = level && level.pullQuote;

    var levelMinutes = estReadMinutes(levelBody);
    var readTimeStr = formatReadTime(levelMinutes);

    var continueLabel = (d >= MAX_DEPTH) ? LEVEL_LABELS[6] : LEVEL_LABELS[d];
    var ariaLabel = (d >= MAX_DEPTH)
      ? 'Finish and reach the depths'
      : 'Continue to level ' + (d + 1) + ': ' + (LEVEL_EYEBROWS[d] || '');

    // Progress thread dots
    var progress = (MAX_DEPTH > 1) ? ((d - 1) / (MAX_DEPTH - 1)) : 0;
    var dotsHtml = '';
    for (var k = 1; k <= MAX_DEPTH; k++) {
      var cls = 'rail-dot';
      if (k < d) cls += ' is-done';
      else if (k === d) cls += ' is-current';
      dotsHtml += '<span class="' + cls + '"><span class="rail-dot-inner"></span></span>';
    }

    var pullQuoteHtml = pullQuote
      ? '<aside class="pullquote" role="note">' + escapeHtml(pullQuote) + '</aside>'
      : '';

    var html =
      '<article class="reader" style="--tint:' + tint + '">' +

        '<div class="scroll-hairline" aria-hidden="true"><div class="scroll-hairline-fill"></div></div>' +

        '<div class="reader-topbar">' +
          '<button class="back-btn" data-action="back" aria-label="Go back">' +
            '<span class="arr" aria-hidden="true">←</span> Back' +
          '</button>' +
          '<div class="progress-rail" role="progressbar" aria-label="Reading depth" ' +
            'aria-valuemin="1" aria-valuemax="' + MAX_DEPTH + '" aria-valuenow="' + d + '" ' +
            'aria-valuetext="Depth ' + d + ' of ' + MAX_DEPTH + ': ' + escapeHtml(levelTitle) + '">' +
            '<span class="progress-thread" style="--thread-progress:' + progress.toFixed(4) + '">' +
              '<span class="thread-track"><span class="thread-fill"></span></span>' +
              dotsHtml +
            '</span>' +
            '<span class="rail-depth-label">' +
              '<span class="rail-depth-num">' + d + ' / ' + MAX_DEPTH + '</span> · ' +
              escapeHtml(levelTitle) +
            '</span>' +
          '</div>' +
        '</div>' +

        '<header class="reader-header">' +
          '<div class="reader-eyebrow">' +
            '<span class="reader-cat-badge">' + escapeHtml(catName) + '</span>' +
            '<span class="reader-meta">' +
              '<span class="reader-readtime">' + escapeHtml(readTimeStr) + '</span>' +
              '<span class="dot" aria-hidden="true"></span>' +
              '<span>Depth ' + d + ' of ' + MAX_DEPTH + '</span>' +
            '</span>' +
          '</div>' +
          '<h1 class="reader-title">' + escapeHtml(topic.title) + '</h1>' +
          (topic.tagline ? '<p class="reader-tagline">' + escapeHtml(topic.tagline) + '</p>' : '') +
          '<h2 class="reader-level-title" tabindex="-1">' + escapeHtml(levelTitle) + '</h2>' +
        '</header>' +

        ornament(glyph) +

        '<div class="reader-body prose">' +
          '<svg class="drop-ornament" viewBox="0 0 32 32" aria-hidden="true">' +
            '<circle cx="16" cy="16" r="3" fill="currentColor"/>' +
            '<circle cx="16" cy="16" r="9" fill="none" stroke="currentColor" stroke-width="0.7" opacity="0.5"/>' +
            '<circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.3"/>' +
          '</svg>' +
          levelBody +
          '<svg class="finis-ornament" viewBox="0 0 64 16" aria-hidden="true">' +
            '<line x1="0"  y1="8" x2="22" y2="8" stroke="currentColor" stroke-width="0.6" opacity="0.5"/>' +
            '<path d="M28 8 L32 4 L36 8 L32 12 Z" fill="currentColor" opacity="0.7"/>' +
            '<line x1="42" y1="8" x2="64" y2="8" stroke="currentColor" stroke-width="0.6" opacity="0.5"/>' +
          '</svg>' +
        '</div>' +

        pullQuoteHtml +

        '<div class="continue-row">' +
          '<button class="btn-continue breathe" data-action="advance" aria-label="' + escapeHtml(ariaLabel) + '">' +
            '<span>' + escapeHtml(continueLabel) + '</span>' +
            '<span class="arr" aria-hidden="true">→</span>' +
          '</button>' +
          '<span class="keyhint" aria-hidden="true"><kbd>↵</kbd> to advance</span>' +
        '</div>' +

      '</article>';

    setBodyScene(cat ? cat.slug : '');
    var tx = pendingTransition;
    pendingTransition = null;
    var afterMount = function (root) {
      if (!root) return;
      wrapProseReveals(root);
      var advanceBtn = root.querySelector('[data-action="advance"]');
      if (advanceBtn) advanceBtn.addEventListener('click', function () { window.LearnApp.advance(); });
      var backBtn = root.querySelector('[data-action="back"]');
      if (backBtn) backBtn.addEventListener('click', function () { window.LearnApp.back(); });
      // Make visuals observe the freshly wrapped reveals (no second page wipe — gated on kind).
      emitRendered('reading', 'prose-wrapped');
      // Focus lands on the level-title <h2>, which the SR reads; announce only
      // the positional context so the title isn't voiced twice.
      announce('Depth ' + d + ' of ' + MAX_DEPTH + ' — ' + topic.title + '.');
      focusView(root);
    };
    if (tx && tx.kind === 'depth') {
      mount(html, 'depth', tx.dir, afterMount);
    } else {
      mount(html, 'view', null, afterMount);
    }
    writeHash();
  }

  function renderComplete(topic) {
    var cat = topicCategory(topic);
    var catName = (cat && cat.name) || topic.category || '';
    var catSlug = cat && cat.slug;
    var glyph = topic.glyph || (cat && cat.glyph) || '✦';

    var html =
      '<section class="complete">' +
        '<div class="complete-rings" aria-hidden="true">' +
          '<span class="ring r1"></span>' +
          '<span class="ring r2"></span>' +
          '<span class="ring r3"></span>' +
          '<span class="ring r4"></span>' +
          '<div class="complete-ornament" aria-hidden="true">' + escapeHtml(glyph) + '</div>' +
        '</div>' +
        '<div class="complete-eyebrow eyebrow">' + escapeHtml(catName) + ' · ' + escapeHtml(topic.title) + '</div>' +
        '<h1 tabindex="-1">You’ve reached <em>the depths</em>.</h1>' +
        '<p>Six levels, from a first glimpse to the working edge. Carry it with you — or descend again into something new.</p>' +
        ornamentLarge(glyph) +
        '<div class="actions">' +
          (catSlug
            ? '<button class="btn-solid" data-action="another"><span>Another in ' + escapeHtml(catName) + '</span></button>'
            : '') +
          '<button class="btn-solid btn-ghost-solid" data-action="home"><span>Return Home</span></button>' +
        '</div>' +
      '</section>';

    setBodyScene(catSlug || '');
    mount(html, 'view', null, function (root) {
      if (!root) return;
      var another = root.querySelector('[data-action="another"]');
      if (another) another.addEventListener('click', function () {
        var siblings = topicsIn(catSlug).filter(function (t) { return t.id !== topic.id; });
        if (siblings.length) {
          var pick = siblings[Math.floor(Math.random() * siblings.length)];
          window.LearnApp.pickTopic(pick.id);
        } else {
          window.LearnApp.pickCategory(catSlug);
        }
      });
      var home = root.querySelector('[data-action="home"]');
      if (home) home.addEventListener('click', function () { window.LearnApp.home(); });
      announce('Completed ' + topic.title + '. You have reached the depths.');
      focusView(root);
    });
    writeHash();
  }

  // ---- Legal documents (Terms, Privacy, Accessibility, Disclaimer) ------

  function legalSiblingsNav(activeKey) {
    var L = window.LEGAL;
    if (!L) return '';
    var items = L.order.map(function (k) {
      var d = L.docs[k];
      if (!d) return '';
      var isActive = (k === activeKey);
      return (
        '<button class="legal-tab' + (isActive ? ' is-active' : '') + '" ' +
          'data-legal="' + escapeHtml(k) + '"' +
          (isActive ? ' aria-current="page"' : '') + '>' +
          escapeHtml(d.title) +
        '</button>'
      );
    }).join('');
    return '<nav class="legal-tabs" aria-label="Legal documents">' + items + '</nav>';
  }

  function renderLegal(docKey) {
    var L = window.LEGAL;
    if (!L) { renderHome(); return; }

    var doc = docKey ? L.docs[docKey] : null;

    var html;
    if (!doc) {
      // ---- Legal index (no/unknown doc requested) ----
      var cardsHtml = L.order.map(function (k) {
        var d = L.docs[k];
        if (!d) return '';
        return (
          '<button class="legal-card tx-lift" data-legal="' + escapeHtml(k) + '" ' +
            'aria-label="Read: ' + escapeHtml(d.title) + '">' +
            '<span class="legal-card-glyph" aria-hidden="true">' + escapeHtml(d.glyph) + '</span>' +
            '<span class="legal-card-eyebrow">' + escapeHtml(d.eyebrow) + '</span>' +
            '<span class="legal-card-title">' + escapeHtml(d.title) + '</span>' +
            '<span class="legal-card-arrow" aria-hidden="true">→</span>' +
          '</button>'
        );
      }).join('');

      html =
        '<section class="legal-view legal-index">' +
          '<nav class="crumbs" aria-label="Breadcrumb">' +
            '<button data-action="home" aria-label="Return home">Home</button>' +
            '<span class="sep" aria-hidden="true">/</span>' +
            '<span>Legal</span>' +
          '</nav>' +
          '<header class="legal-head">' +
            '<div class="legal-eyebrow eyebrow">The Fine Print</div>' +
            '<h1 tabindex="-1">Legal &amp; Privacy</h1>' +
          '</header>' +
          ornament('§') +
          '<p class="legal-lede">The terms under which this small reading room ' +
            'is offered, what it does and does not keep about you, and how we ' +
            'try to keep it open to everyone.</p>' +
          '<div class="legal-grid">' + cardsHtml + '</div>' +
          '<div class="legal-updated">Last updated · ' + escapeHtml(L.updated) + '</div>' +
        '</section>';
    } else {
      // ---- A single legal document ----
      html =
        '<article class="legal-view legal-doc">' +
          '<nav class="crumbs" aria-label="Breadcrumb">' +
            '<button data-action="home" aria-label="Return home">Home</button>' +
            '<span class="sep" aria-hidden="true">/</span>' +
            '<button data-action="legal-index" aria-label="All legal documents">Legal</button>' +
            '<span class="sep" aria-hidden="true">/</span>' +
            '<span>' + escapeHtml(doc.title) + '</span>' +
          '</nav>' +
          '<header class="legal-head">' +
            '<div class="legal-eyebrow eyebrow">' + escapeHtml(doc.eyebrow) + '</div>' +
            '<h1 tabindex="-1">' + escapeHtml(doc.title) + '</h1>' +
            '<p class="legal-updated-inline">Last updated · ' + escapeHtml(L.updated) + '</p>' +
          '</header>' +
          ornament(doc.glyph) +
          '<div class="legal-body prose">' + doc.html + '</div>' +
          legalSiblingsNav(doc.key) +
          '<div class="continue-row">' +
            '<button class="btn-ghost" data-action="home">Return home</button>' +
          '</div>' +
        '</article>';
    }

    setBodyScene('');
    mount(html, 'view', null, function (root) {
      if (!root) return;
      var homeBtn = root.querySelectorAll('[data-action="home"]');
      homeBtn.forEach(function (b) {
        b.addEventListener('click', function () { window.LearnApp.home(); });
      });
      var idxBtn = root.querySelector('[data-action="legal-index"]');
      if (idxBtn) idxBtn.addEventListener('click', function () { window.LearnApp.openLegal(null); });
      root.querySelectorAll('[data-legal]').forEach(function (el) {
        el.addEventListener('click', function () {
          window.LearnApp.openLegal(el.getAttribute('data-legal'));
        });
      });
      announce(doc ? doc.title + '.' : 'Legal and privacy.');
      focusView(root);
    });
    writeHash();
  }

  // ---- Keyboard navigation ----------------------------------------------

  // Real interactive controls activate themselves on Enter/Space — don't also
  // run our nav shortcut for them (that caused double-advance). A heading with
  // tabindex="-1" (our focus target) is NOT interactive, so Enter still works.
  function isActivatable(el) {
    if (!el) return false;
    var t = el.tagName;
    return t === 'BUTTON' || t === 'A' || t === 'INPUT' ||
           t === 'TEXTAREA' || t === 'SELECT' || el.isContentEditable;
  }

  function handleKey(e) {
    // Don't intercept while user is typing in an input/textarea/select
    var tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target && e.target.isContentEditable)) return;

    // Honor modifier combos (browser shortcuts, find, etc.)
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    var key = e.key;
    var onControl = isActivatable(e.target);

    if (key === 'Escape') {
      e.preventDefault();
      window.LearnApp.home();
      return;
    }

    if (state.view === 'reading') {
      // Space is intentionally left alone so it can page-scroll the essay.
      if (key === 'ArrowRight') {
        e.preventDefault();
        window.LearnApp.advance();
      } else if (key === 'ArrowLeft' || key === 'Backspace') {
        e.preventDefault();
        window.LearnApp.back();
      } else if (key === 'Enter' && !onControl) {
        e.preventDefault();
        window.LearnApp.advance();
      }
    } else if (state.view === 'complete') {
      if (key === 'Enter' && !onControl) {
        e.preventDefault();
        window.LearnApp.home();
      }
    } else if (state.view === 'category') {
      if ((key === 'ArrowLeft' || key === 'Backspace') && !onControl) {
        e.preventDefault();
        window.LearnApp.home();
      }
    }
  }

  // ---- Public API --------------------------------------------------------

  window.LearnApp = {

    start: function () {
      // Initial render from hash (or home)
      applyFromHash();
      document.addEventListener('keydown', handleKey);
    },

    pickCategory: function (slug) {
      var cat = getCategory(slug);
      if (!cat) return;
      state.view = 'category';
      state.categorySlug = cat.slug;
      state.topicId = null;
      renderCategory(cat.slug);
    },

    pickTopic: function (topicId) {
      var t = topicById(topicId);
      if (!t) return;
      var c = topicCategory(t);
      state.view = 'reading';
      state.topicId = t.id;
      state.depth = 1;
      state.categorySlug = c ? c.slug : null;
      renderReader(t, 1);
    },

    pickRandom: function () {
      var all = window.ALL_TOPICS || [];
      if (!all.length) return;
      var t = all[Math.floor(Math.random() * all.length)];
      this.pickTopic(t.id);
    },

    advance: function () {
      if (state.view !== 'reading') return;
      var t = topicById(state.topicId);
      if (!t) { this.home(); return; }
      if (state.depth >= MAX_DEPTH) {
        state.view = 'complete';
        renderComplete(t);
        return;
      }
      state.depth += 1;
      pendingTransition = { kind: 'depth', dir: 'deeper' };
      renderReader(t, state.depth);
    },

    back: function () {
      if (state.view === 'reading') {
        if (state.depth > 1) {
          state.depth -= 1;
          var t = topicById(state.topicId);
          pendingTransition = { kind: 'depth', dir: 'back' };
          if (t) renderReader(t, state.depth);
          return;
        }
        // depth 1 → back to category if known, else home
        if (state.categorySlug) {
          this.pickCategory(state.categorySlug);
          return;
        }
        this.home();
        return;
      }
      if (state.view === 'complete') {
        var t2 = topicById(state.topicId);
        if (t2) {
          state.view = 'reading';
          state.depth = MAX_DEPTH;
          renderReader(t2, state.depth);
          return;
        }
        this.home();
        return;
      }
      if (state.view === 'category') {
        this.home();
        return;
      }
    },

    openLegal: function (docKey) {
      state.view = 'legal';
      state.legalDoc = docKey || null;
      state.topicId = null;
      state.categorySlug = null;
      state.depth = 1;
      renderLegal(state.legalDoc);
    },

    home: function () {
      state.view = 'home';
      state.categorySlug = null;
      state.topicId = null;
      state.depth = 1;
      state.legalDoc = null;
      renderHome();
    }
  };

  // ---- Boot --------------------------------------------------------------

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { window.LearnApp.start(); });
  } else {
    window.LearnApp.start();
  }
})();
