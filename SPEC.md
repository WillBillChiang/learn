# Learn Something New — Build Spec

A beautiful, artistic single-page web app that lets a user pick a category (or "Random") and progressively learn a topic in deepening levels — from poetic intro to technical mastery.

## File Layout

```
/index.html                 — single page shell
/css/style.css              — main stylesheet
/css/typography.css         — type system
/css/animations.css         — transitions/keyframes
/js/app.js                  — state, routing, render
/js/topics.js               — loads & indexes all topic data
/data/<category>.js         — TOPICS_<CATEGORY> array per file (see schema)
/data/index.js              — aggregates all categories
/assets/                    — any SVG / decorative assets
```

## Data Schema (strict)

Each `data/<category>.js` file exports a global array on `window`:

```js
window.TOPICS_SCIENCE = [
  {
    id: "entropy",                       // kebab-case, unique
    category: "Science",                  // pretty name
    title: "Entropy",                     // topic title
    tagline: "The universe's bias toward disorder.", // 1 sentence hook
    color: "#c97b4a",                     // accent color for the topic
    glyph: "❋",                          // single unicode glyph used as decoration (no emojis if you can avoid)
    levels: [
      // Exactly 6 levels required, depth 1 → 6
      {
        depth: 1,
        title: "A First Glimpse",        // poetic, inviting
        body: "<p>...</p><p>...</p>",    // HTML string, 2-4 short paragraphs, plain language analogy
        pullQuote: "A short evocative line."  // optional
      },
      {
        depth: 2,
        title: "The Core Idea",
        body: "<p>...</p>",              // 3-5 paragraphs, slightly more concrete
        pullQuote: "..."
      },
      {
        depth: 3,
        title: "How It Actually Works",
        body: "<p>...</p>",              // mechanism, examples, history
      },
      {
        depth: 4,
        title: "The Underlying Principles",
        body: "<p>...</p>",              // formal definitions, relationships
      },
      {
        depth: 5,
        title: "Technical Depth",
        body: "<p>...</p><p>Equation: <code>S = k ln W</code></p>",  // equations, edge cases, real notation
      },
      {
        depth: 6,
        title: "Mastery & Frontier",
        body: "<p>...</p>",              // open problems, expert-level nuance, references in prose
      }
    ]
  },
  // ... more topics
]
```

### Content quality bar
- Each level body should be **substantive** — not 1 sentence. Aim:
  - Level 1: 120–180 words, poetic
  - Level 2: 180–250 words
  - Level 3: 250–350 words, with concrete examples
  - Level 4: 300–400 words, formal but readable
  - Level 5: 350–500 words, includes notation/equations/code in `<code>` or `<pre>` tags
  - Level 6: 350–500 words, references real papers/people/open questions
- Use `<p>`, `<h3>`, `<ul>`, `<ol>`, `<blockquote>`, `<code>`, `<pre>`, `<em>`, `<strong>`
- Do NOT use external images
- All HTML must be valid; escape `<` and `>` inside code as `&lt;` `&gt;`
- Tone: confident, literary, but never condescending. Think *The New Yorker* meets a great textbook.

## Categories

The site ships with these 8 categories. Each agent picks the categories assigned to them.

| Category | Slug | File |
|---|---|---|
| Science | science | data/science.js |
| Mathematics | mathematics | data/mathematics.js |
| Technology | technology | data/technology.js |
| Philosophy | philosophy | data/philosophy.js |
| History | history | data/history.js |
| Art | art | data/art.js |
| Nature | nature | data/nature.js |
| Cosmos | cosmos | data/cosmos.js |

Each category file ships **3 topics minimum** (so 24+ total topics across the site).

## Visual Design System

### Aesthetic
**"Museum monograph meets midnight observatory."** Inspired by editorial magazines (The Atlantic, MIT Tech Review), Renaissance-era illustrated manuscripts, and modern reading apps (Readwise, Are.na). It should feel like reading a beautiful printed book that quietly comes alive.

### Color Palette (use exactly)

```
--paper:        #f4ede0    /* warm cream base */
--paper-deep:   #ebe1cf
--ink:          #1a1410    /* near-black with brown */
--ink-soft:     #3d322a
--ink-mute:     #6b5d50
--accent:       #b8552e    /* burnt sienna */
--accent-deep:  #8a3a1a
--gold:         #b8923a
--sage:         #6b7d5c
--dusk:         #2c3447    /* deep blue for night sections */
--rule:         rgba(26,20,16,0.12)
```

### Typography
- **Display**: 'Cormorant Garamond', serif — for hero, topic titles
- **Body**: 'Crimson Pro', serif — for reading content (warm, literary)
- **UI**: 'Inter', sans-serif — for buttons, labels, level indicators
- **Mono**: 'JetBrains Mono', monospace — for equations and code

Load all from Google Fonts.

### Layout Principles
- Generous whitespace (think gallery wall labels)
- Max content width: 680px for reading; 1200px for cards
- Line-height 1.7–1.85 in body
- All headings have ample top margin
- Decorative rules: thin gold or sienna divider lines (½ pt feel)
- Use small caps for section labels

### Interactions
- Soft fade + slight upward translate on level transition (~400ms)
- Hover on category cards: gentle lift + accent border bloom
- "Continue" button: a wide soft pill at the bottom, breathes (subtle pulse)
- Reading progress: dotted progression rail at top (6 dots, fill as you advance)
- All cursor interactions are smooth; no abrupt jumps

### Page States
1. **Cover / Home** — Title "Learn Something New", subtitle, a grid of 8 category cards + a large "Surprise Me" tile.
2. **Topic Reader** — Title block at top, current-level title, body content, progress rail, "Continue" button (label changes by level: "Begin" → "Go Deeper" → "Continue" → "Press On" → "Into the Technical" → "Reach Mastery" → "Finish").
3. **Completion** — After level 6, a final "You've reached the depths" screen with: option to pick another topic in same category, or return home.

## API (window) — Frontend Agent will provide

```js
window.LearnApp = {
  start(),              // boot
  pickCategory(slug),
  pickTopic(topicId),
  pickRandom(),
  advance(),            // next level
  back(),
  home(),
}
```

`window.ALL_TOPICS` is the flat array assembled by `js/topics.js`.

## Build Constraints
- No build step. Plain HTML/CSS/vanilla JS.
- Must work by opening `index.html` directly in a browser (file://) or via any static server.
- No external JS libraries. Google Fonts only.
- All transitions in CSS or requestAnimationFrame.
- Accessible: keyboard nav (Enter to advance, Esc to home), aria labels, prefers-reduced-motion respected.
