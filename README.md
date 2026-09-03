# [Your Name] — Portfolio

Personal portfolio site. Paper-craft / Mondrian theme: each section has its
own pattern background (dots, checks, crosshatch, rain-stripe), with content
sitting in semi-transparent "paper card" panels so the pattern shows through
— same idea as a full-bleed background behind a floating content column.

## Structure

```
index.html
css/
  variables.css   → colors, type scale, spacing (edit palette here)
  patterns.css    → the 5 reusable background patterns
  base.css        → resets, typography, the .paper-card component
  layout.css      → nav, section layout, responsive project grid
  components.css  → theme toggle button, small bits
js/
  main.js         → dark mode toggle (persists via localStorage)
images/
  profile-placeholder.svg  → swap this for your real photo
  projects/                → drop project screenshots here
```

## What to replace before submitting

Everything in `[brackets]` inside `index.html` is a placeholder:
- Your name (title tag, nav logo, footer, hero heading)
- About Me bio text (2 paragraphs) + skill/interest tags
- Your profile photo (`images/profile-placeholder.svg` → your own image)
- The 3 project cards (title + description; add real projects as you build them)
- Contact links (email, GitHub, LinkedIn)

## Running locally

No build step — just open `index.html` in a browser, or serve it locally:

```bash
python3 -m http.server 8000
```

then visit `http://localhost:8000`.

## Deploying to GitHub Pages

1. Create a new repo on GitHub (or use one named `yourusername.github.io` for
   a root-domain URL).
2. Push this folder's contents to the repo root:
   ```bash
   git init
   git add .
   git commit -m "Initial portfolio"
   git branch -M main
   git remote add origin https://github.com/yourusername/your-repo.git
   git push -u origin main
   ```
3. On GitHub: Settings → Pages → Source → deploy from `main` branch, `/root`.
4. Your site will be live at `https://yourusername.github.io/your-repo/`
   (or `https://yourusername.github.io/` if you used the special repo name).

## Adding a new project later

Copy one `<article class="project-card paper-card">...</article>` block in
the Projects section, fill in the title/description, and it'll automatically
join the responsive grid (stacks on mobile, forms the mondrian layout on
desktop ≥1024px).

## Notes on the theme

- `images/mondrian-bg.svg` is one continuous background collage (checkerboard,
  polka dots, crosshatch, plaid, diagonal stripes, solid color blocks) fixed
  behind the whole page — edit it directly in a text/vector editor to change
  colors, shapes, or proportions. It's wired in via `.site-bg` in
  `layout.css`.
- Content sections and the nav sit on top using the translucent `.paper-card`
  / `--card-bg` treatment so the collage shows through, mostly-white,
  the same way a full-bleed illustration sits behind a floating content
  column on other reference sites.
- `css/patterns.css` still has the individual pattern classes (`.pattern-dots`,
  `.pattern-checks`, etc.) — no longer used for whole sections, but handy if
  you want to accent a single project card or element later.
- Dark mode flips the palette (see `[data-theme="dark"]` in `variables.css`)
  and applies a CSS filter to `.site-bg` (invert + hue-rotate) so the
  background stays legible instead of glaring white — feel free to hand-tune
  that filter, it's an approximation.
- The origami crane interactive feature (drag-to-crease) is intentionally
  not built yet — planned as a follow-up addition to the hero section.
