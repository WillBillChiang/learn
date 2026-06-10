/* ============================================================
   topics.js — aggregates per-category topic arrays into
   global indexes used by app.js.
   Designed to be safe even if some data files failed to load.
   ============================================================ */

(function () {
  window.ALL_TOPICS = window.ALL_TOPICS || [];
  window.TOPICS_BY_ID = {};
  window.TOPICS_BY_CATEGORY = {};

  window.CATEGORIES = [
    { slug: 'science',     name: 'Science',     glyph: '❋', tint: '#c97b4a', blurb: 'The patient art of asking nature.' },
    { slug: 'mathematics', name: 'Mathematics', glyph: '∞', tint: '#6b7d5c', blurb: 'Pure thought made rigorous.' },
    { slug: 'technology',  name: 'Technology',  glyph: '◈', tint: '#3d322a', blurb: 'The machines we wrote into being.' },
    { slug: 'philosophy',  name: 'Philosophy',  glyph: '❦', tint: '#8a3a1a', blurb: 'The questions that refuse to settle.' },
    { slug: 'history',     name: 'History',     glyph: '☙', tint: '#b8923a', blurb: 'How we got from there to here.' },
    { slug: 'art',         name: 'Art',         glyph: '✦', tint: '#a25e3a', blurb: 'Beauty as a way of knowing.' },
    { slug: 'nature',      name: 'Nature',      glyph: '❀', tint: '#5e7250', blurb: 'The living world, observed closely.' },
    { slug: 'cosmos',      name: 'Cosmos',      glyph: '✺', tint: '#2c3447', blurb: 'Everything, written in stars.' },
    { slug: 'money',       name: 'Money',       glyph: '❖', tint: '#7d6233', blurb: 'The grammar of wealth and debt.' },
    { slug: 'body',        name: 'Body',        glyph: '⚘', tint: '#a85a4a', blurb: 'The machinery you live inside.' },
    { slug: 'mind',        name: 'Mind',        glyph: '❦', tint: '#6b4a7d', blurb: 'The instrument turned upon itself.' },
    { slug: 'craft',       name: 'Craft',       glyph: '✶', tint: '#b06b3a', blurb: 'Skills worth a lifetime.' },
    { slug: 'home',        name: 'Home',        glyph: '❧', tint: '#7d5a3a', blurb: 'The quiet systems behind your walls.' },
    { slug: 'digital',     name: 'Digital',     glyph: '⚜', tint: '#3a5a7d', blurb: 'The world that lives in the wires.' },
    { slug: 'music',       name: 'Music',       glyph: '♪', tint: '#78568c', blurb: 'The architecture of sound and silence.' },
    { slug: 'uiux',        name: 'UI & UX',     glyph: '▦', tint: '#3a7d8c', blurb: 'Designing the space between you and the screen.' },
    { slug: 'fashion',     name: 'Fashion',     glyph: '✄', tint: '#a8547a', blurb: 'Cloth, cut, and the language of dress.' }
  ];

  for (var i = 0; i < window.CATEGORIES.length; i++) {
    var c = window.CATEGORIES[i];
    var key = 'TOPICS_' + c.slug.toUpperCase();
    var list = (window[key] && Array.isArray(window[key])) ? window[key] : [];
    window.TOPICS_BY_CATEGORY[c.slug] = list;
    for (var j = 0; j < list.length; j++) {
      var t = list[j];
      if (!t || !t.id) continue;
      window.ALL_TOPICS.push(t);
      window.TOPICS_BY_ID[t.id] = t;
    }
  }
})();
