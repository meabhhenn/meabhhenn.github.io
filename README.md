# meabhhenn.github.io

Personal portfolio. Single-page scroll site, paper-craft / collage theme:
each section is a pastel pattern field, and the content sits in tilted
paper cards with flat offset shadows.

## Files

```
index.html            all markup, five sections + the folding-paper dialog
css/styles.css        every style; mobile-first, breakpoints at 640px and 1024px
js/main.js            nav highlighting, name note, timeline peek/pin, fold engine
images/               placeholder art — replace with real photos/screenshots
```

No build step, no dependencies. Open `index.html` in a browser, or push and
GitHub Pages serves it as-is.

## Fill these in

Anything in square brackets is a placeholder:

- `[one line describing who you are]` and the two `[REPLACE: ...]` bio paragraphs
- `[skill]` / `[interest]` tags
- every timeline entry: `[dates]`, `[role title]`, `[lab or department]`,
  `[award, if any]`, and the two detail bullets
- each project: `[project name]`, `[NN · stack]`, description, optional award tag
- `[linkedin url]` / `[username]` in the contact card
- the orchestra tile's `[instrument, and how long]`
- five square photos for the activity tiles

Images: drop real files into `images/` and point the `<img src>` at them.
Portrait is 4:5, project shots are 16:10, activity tiles are square.

## Responsive behaviour

- **< 640px** — one column. The timeline is a vertical spine; card tilt is
  damped so nothing clips the viewport edge.
- **640–1023px** — two-column project grid with the second card offset. The
  timeline becomes the horizontal rail, cards alternating above and below.
- **≥ 1024px** — asymmetric three-column project grid (1.15fr 1fr 1fr) with a
  staggered third card; the hero fills 82vh.

## The paper squares

Four paper squares sit in the background shelf at the foot of the About,
Timeline, Projects and Activities sections. Click one and a dialog opens with
that square of paper and the five folds of a gum-wrapper heart.

Folds 1-3 are computed: the engine reflects every layer across the crease line
and clips it, so layers stack the way real paper does. Folds 4-5 turn paper
behind the sheet, which a reflection cannot express, so those two stages carry
authored geometry with a per-layer lift value.

Drag the marked point onto its dashed target to commit a fold; release short of
it and the paper springs back. When the fifth fold lands, the finished heart is
drawn in place of the square that was clicked and stays there for the rest of
the visit. Reloading the page puts the four squares back.

Every square and every heart lives at z-index 1, below the z-index 2 content
wraps, so they can never overlap text. Below 760px they are hidden.

## Accessibility notes

- Timeline detail opens on hover, keyboard focus, and click-to-pin on wider
  screens; below 640px each card carries its own "more detail" button with a
  44px tap target, since phones have no hover.
- The pronunciation note on "Meabh" responds to hover, focus and tap.
- `prefers-reduced-motion` disables transitions and smooth scrolling.
