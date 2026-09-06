/*
  js/main.js — Meabh Hennessy, 15-113 Project 1.

  AI USAGE: drafted with Claude (claude.ai), then reworked by hand. See
  PROMPTS.md for the log.

  What is in here:
    1. nav scroll state — an IntersectionObserver marks the section you are in
       and fills that nav tab with the section's colour
    2. timeline — each card opens on hover on desktop, on a button tap on
       mobile, and cards open independently of one another
    3. the folding feature — click a gum wrapper in the
       margin of any section. Every one of the eight is a flat fold, so none of
       the shapes are drawn by hand: the code declares eight crease lines and
       computes every frame by splitting each layer of paper on the line and
       reflecting the half that moves. Then, the finished
       heart is drawn in place of the wrapper that was clicked and stays there.
       Reloading puts the flat wrappers back.
*/

/* Meabh Hennessy — portfolio behaviour
   1. nav tab highlighting on scroll
   2. name pronunciation note (tap support)
   3. timeline: hover to peek, click to pin
   4. the folding paper: one crease pattern, solved fold by fold
   No libraries, no build step. */

(function () {
  "use strict";

  /* ---------- 1. nav ---------- */

  var tabs = Array.prototype.slice.call(document.querySelectorAll("[data-tab]"));
  var sections = ["about", "timeline", "projects", "activities", "contact"];

  function setActive(id) {
    tabs.forEach(function (t) {
      t.classList.toggle("is-active", t.getAttribute("data-tab") === id);
    });
  }

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) setActive(en.target.id);
      });
    }, { rootMargin: "-45% 0px -45% 0px" });
    sections.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }
  setActive("about");

  /* ---------- 2. name note ---------- */

  var nameEl = document.getElementById("name-trigger");
  if (nameEl) {
    nameEl.addEventListener("click", function () {
      nameEl.classList.toggle("is-open");
    });
    nameEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        nameEl.classList.toggle("is-open");
      }
    });
  }

  /* ---------- 3. timeline peek / pin ---------- */

  var entries = Array.prototype.slice.call(document.querySelectorAll(".rail__entry"));
  var pinned = null;

  entries.forEach(function (entry) {
    var mark = entry.querySelector(".rail__mark");
    var toggle = entry.querySelector(".tl-toggle");

    function peek(on) {
      if (pinned === entry) return;
      entry.classList.toggle("is-open", on);
    }

    entry.addEventListener("mouseenter", function () { peek(true); });
    entry.addEventListener("mouseleave", function () { peek(false); });

    if (mark) {
      mark.addEventListener("focus", function () { peek(true); });
      mark.addEventListener("blur", function () { peek(false); });
      mark.addEventListener("click", function () {
        if (pinned === entry) {
          pinned = null;
          entry.classList.remove("is-open");
          mark.setAttribute("aria-expanded", "false");
        } else {
          if (pinned) {
            pinned.classList.remove("is-open");
            var prev = pinned.querySelector(".rail__mark");
            if (prev) prev.setAttribute("aria-expanded", "false");
          }
          pinned = entry;
          entry.classList.add("is-open");
          mark.setAttribute("aria-expanded", "true");
        }
      });
    }

    /* phones have no hover, so each card carries its own toggle below 640px */
    if (toggle) {
      toggle.addEventListener("click", function () {
        var open = entry.classList.toggle("is-open");
        pinned = open ? entry : (pinned === entry ? null : pinned);
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        var lbl = toggle.querySelector("span") || toggle;
        lbl.textContent = open ? "hide detail" : "more detail";
      });
    }
  });

  /* ---------- 3b. activity tiles: tap/keyboard route to the reveal ---------- */

  Array.prototype.slice.call(document.querySelectorAll(".act-tile")).forEach(function (tile) {
    var info = tile.querySelector(".act-info");
    if (!info) return;
    info.addEventListener("click", function () {
      var open = tile.classList.toggle("is-open");
      info.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  /* ---------- 4. the folding paper ---------- */

  var SVG_NS = "http://www.w3.org/2000/svg";
  var S = 200;
  /* A gum wrapper is a rectangular strip, and its PROPORTION is what decides
     whether the fold ends up a heart: 200 x 44 is about 4.5:1, the ratio of a
     real stick-gum wrapper. Fold it at 3:1 and the same eight creases give a
     wide V; at 6:1 they give a narrow spike. 4.5:1 lands on an 88 x 100 heart. */
  var SQUARE = [[0, 78], [200, 78], [200, 122], [0, 122]];
  var SNAP = 28;

  /* fold geometry: a fold reflects everything on one side of a line across it */
  function sideOf(p, a, b) {
    return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
  }
  function reflect(p, a, b) {
    var dx = b[0] - a[0], dy = b[1] - a[1], d = dx * dx + dy * dy;
    if (!d) return [p[0], p[1]];
    var t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / d;
    return [2 * (a[0] + t * dx) - p[0], 2 * (a[1] + t * dy) - p[1]];
  }
  function clipHalf(poly, a, b, keepSign) {
    var out = [], n = poly.length;
    for (var i = 0; i < n; i++) {
      var c = poly[i], d = poly[(i + 1) % n];
      var sc = sideOf(c, a, b) * keepSign, sd = sideOf(d, a, b) * keepSign;
      if (sc >= -0.0001) out.push(c);
      if ((sc > 0.0001 && sd < -0.0001) || (sc < -0.0001 && sd > 0.0001)) {
        var t = sc / (sc - sd);
        out.push([c[0] + (d[0] - c[0]) * t, c[1] + (d[1] - c[1]) * t]);
      }
    }
    return out.length >= 3 ? out : null;
  }
  function foldLayers(layers, a, b, movingRef) {
    var sign = sideOf(movingRef, a, b) >= 0 ? 1 : -1;
    var stay = [], moved = [];
    layers.forEach(function (L) {
      var keep = clipHalf(L.pts, a, b, -sign);
      if (keep) stay.push({ pts: keep, face: L.face, lift: L.lift || 0 });
      var mv = clipHalf(L.pts, a, b, sign);
      if (mv) moved.push({ pts: mv.map(function (p) { return reflect(p, a, b); }), face: L.face ? 0 : 1, lift: L.lift || 0 });
    });
    return stay.concat(moved.reverse());
  }
  function perpBisector(p, q) {
    var mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
    var dx = q[0] - p[0], dy = q[1] - p[1], len = Math.hypot(dx, dy) || 1;
    return [[mx + dy / len * 400, my - dx / len * 400], [mx - dy / len * 400, my + dx / len * 400]];
  }
  function ptsStr(arr) {
    return arr.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" ");
  }

  /* ---- the crease pattern ----

     Every stage of this fold is a FLAT fold, which means the whole thing can be
     computed instead of drawn by hand. A flat fold is one operation: pick a
     crease line, cut every layer of paper along it, leave the layers on one
     side where they are, and reflect the layers on the other side across the
     line (turning each reflected layer over, so its other face shows, and
     restacking them on top). That is exactly what foldLayers() above does, so a
     stage only has to say WHERE the crease is and WHICH side moves.

     The eight folds of a gum-wrapper heart:
       1-4  each corner in to the centre line, like the nose of a paper
            aeroplane, so both ends of the strip come to a point
       5    fold the strip in half across the middle to lay in a centre crease
       6    open it back out again — the crease is all you wanted
       7    bring the right half up so its bottom edge lies along that centre
            crease. Aligning an edge with another line is a reflection: the
            crease for it is the 45 degree line through the point where the
            bottom edge meets the centre crease, at [100, 122]
       8    the left half up the same way, mirrored

     Folds 7 and 8 are the ones that make the heart: each half swings a quarter
     turn, the two pointed ends become the lobes, and the wedge of paper that
     never moves is the point at the bottom.

     "move" is any point on the side of the crease that travels; the sign of
     sideOf() against it tells foldLayers which half to reflect. "grab" and
     "target" are the point you drag and where it lands, so the interface can
     be dragged rather than clicked. */
  var CREASES = [
    { a: [0, 100],   b: [22, 78],   move: [0, 78],    grab: [0, 78],    target: [22, 100],  tilt: 0 },
    { a: [0, 100],   b: [22, 122],  move: [0, 122],   grab: [0, 122],   target: [22, 100],  tilt: 0 },
    { a: [200, 100], b: [178, 78],  move: [200, 78],  grab: [200, 78],  target: [178, 100], tilt: 0 },
    { a: [200, 100], b: [178, 122], move: [200, 122], grab: [200, 122], target: [178, 100], tilt: 0 },
    { a: [100, 38],  b: [100, 162], move: [200, 100], grab: [200, 100], target: [0, 100],   tilt: 0 },
    { unfold: true,                                   grab: [100, 78],  target: [100, 78],  tilt: 0 },
    { a: [60, 162],  b: [140, 82],  move: [200, 100], grab: [200, 100], target: [122, 22],  tilt: 0.18 },
    { a: [60, 82],   b: [140, 162], move: [0, 100],   grab: [0, 100],   target: [78, 22],   tilt: 0.2 }
  ];

  /* run the crease pattern once at load: FRAMES[i] is the paper after i folds.
     An unfold step restores the frame from before the fold it undoes, which is
     what opening a crease actually does. */
  var FRAMES = [[{ pts: SQUARE, face: 0, lift: 0 }]];
  CREASES.forEach(function (c, i) {
    FRAMES.push(c.unfold ? FRAMES[i - 1] : foldLayers(FRAMES[i], c.a, c.b, c.move));
  });

  var STEPS = CREASES.map(function (c, i) {
    return {
      kind: i < 6 ? "valley" : "mountain",
      grab: c.grab, target: c.target, tilt: c.tilt,
      crease: c.unfold ? null : [c.a, c.b],
      layers: FRAMES[i + 1]
    };
  });

  /* the heart that gets planted in the margin is the last frame of the fold,
     measured and normalised — not a second hand-drawn shape that could drift
     out of step with what you just folded */
  var HEART = (function () {
    var last = FRAMES[FRAMES.length - 1];
    var xs = [], ys = [];
    last.forEach(function (L) {
      L.pts.forEach(function (p) { xs.push(p[0]); ys.push(p[1]); });
    });
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
    var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    return {
      viewBox: [x0 - 3, y0 - 3, (x1 - x0) + 6, (y1 - y0) + 6].join(" "),
      layers: last
    };
  })();

  var modal = document.getElementById("fold-modal");
  var paper = document.getElementById("paper");
  if (!modal || !paper) return;

  var polyLayer = document.getElementById("poly-layer");
  var creaseLayer = document.getElementById("crease-layer");
  var tiltGroup = document.getElementById("stage-tilt");
  var flipGroup = document.getElementById("stage-flip");
  var shadow = document.getElementById("paper-shadow");
  var ghost = document.getElementById("ghost");
  var creaseHint = document.getElementById("crease-hint");
  var targetDot = document.getElementById("target-dot");
  var grabDot = document.getElementById("grab-dot");
  var stepLabel = document.getElementById("step-label");
  var progressFill = document.getElementById("progress-fill");
  var foldBtn = document.getElementById("do-fold");

  var state = {
    step: 0,
    layers: [{ pts: SQUARE, face: 0, lift: 0 }],
    creases: [],
    flipped: false,
    drag: null,
    free: false,
    seed: null
  };

  function currentTilt() {
    if (state.free) return 0.7;
    var st = STEPS[state.step];
    return st ? st.tilt : 0.7;
  }

  function toPaper(e) {
    var r = paper.getBoundingClientRect();
    var x = ((e.clientX - r.left) / r.width) * 252 - 26;
    var y = ((e.clientY - r.top) / r.height) * 252 - 26;
    var tilt = currentTilt();
    if (tilt > 0) {
      y = (y - 100) / (1 - 0.3 * tilt) + 100;
      x = x - (100 - y) * 0.12 * tilt;
    }
    if (state.flipped) x = S - x;
    return [x, y];
  }

  function el(name, attrs) {
    var node = document.createElementNS(SVG_NS, name);
    Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    return node;
  }

  function render() {
    var st = STEPS[state.step];
    var done = state.free || !st;

    var layers = state.layers;
    var ghostLine = null;

    if (state.drag && !state.drag.free && st && !st.layers) {
      var line = perpBisector(st.grab, state.drag.at);
      if (Math.hypot(state.drag.at[0] - st.grab[0], state.drag.at[1] - st.grab[1]) > 6) {
        layers = foldLayers(state.layers, line[0], line[1], st.grab);
        ghostLine = line;
      }
    } else if (state.drag && state.drag.free) {
      var fl = perpBisector(state.drag.from, state.drag.at);
      if (Math.hypot(state.drag.at[0] - state.drag.from[0], state.drag.at[1] - state.drag.from[1]) > 10) {
        layers = foldLayers(state.layers, fl[0], fl[1], state.drag.from);
        ghostLine = fl;
      }
    }

    var tilt = currentTilt();
    var sy = 1 - 0.3 * tilt;
    var skew = -0.12 * tilt;
    tiltGroup.setAttribute("transform",
      "translate(100,100) matrix(1,0," + skew.toFixed(3) + "," + sy.toFixed(3) + ",0,0) translate(-100,-100)");
    flipGroup.setAttribute("transform", state.flipped ? "translate(" + S + ",0) scale(-1,1)" : "");
    shadow.setAttribute("cy", 100 + 92 * sy + 14);
    shadow.setAttribute("rx", 58 + 20 * tilt);

    creaseLayer.textContent = "";
    if (state.layers.length === 1) {
      state.creases.forEach(function (c) {
        creaseLayer.appendChild(el("line", {
          x1: c[0][0], y1: c[0][1], x2: c[1][0], y2: c[1][1],
          stroke: "#8a8578", "stroke-width": 1, "stroke-dasharray": "5 4", opacity: 0.9
        }));
      });
    }

    polyLayer.textContent = "";
    layers.forEach(function (L) {
      polyLayer.appendChild(el("polygon", {
        points: ptsStr(L.pts),
        fill: L.face ? "url(#backFace)" : "#fffdf8",
        stroke: "#2b2b28",
        "stroke-width": L.lift ? 1.6 : 1.3,
        opacity: L.lift ? (0.9 + 0.1 * (1 - L.lift)).toFixed(2) : 1,
        style: "filter:drop-shadow(1px 2px 1.5px rgba(43,43,40,0.18))"
      }));
    });

    if (ghostLine) {
      ghost.setAttribute("x1", ghostLine[0][0]);
      ghost.setAttribute("y1", ghostLine[0][1]);
      ghost.setAttribute("x2", ghostLine[1][0]);
      ghost.setAttribute("y2", ghostLine[1][1]);
      ghost.setAttribute("opacity", 0.8);
    } else {
      ghost.setAttribute("opacity", 0);
    }

    if (!done && st.crease && !state.drag) {
      creaseHint.setAttribute("x1", st.crease[0][0]);
      creaseHint.setAttribute("y1", st.crease[0][1]);
      creaseHint.setAttribute("x2", st.crease[1][0]);
      creaseHint.setAttribute("y2", st.crease[1][1]);
      creaseHint.setAttribute("opacity", 0.45);
    } else {
      creaseHint.setAttribute("opacity", 0);
    }

    if (done) {
      grabDot.setAttribute("opacity", 0);
      targetDot.setAttribute("opacity", 0);
    } else {
      grabDot.setAttribute("cx", st.grab[0]);
      grabDot.setAttribute("cy", st.grab[1]);
      grabDot.setAttribute("opacity", state.drag ? 0 : 0.9);
      targetDot.setAttribute("cx", st.target[0]);
      targetDot.setAttribute("cy", st.target[1]);
      targetDot.setAttribute("opacity", 0.85);
    }

    stepLabel.textContent = done ? "one gum-wrapper heart" : "fold " + (state.step + 1) + " of " + STEPS.length;
    progressFill.style.width = Math.round((Math.min(state.step, STEPS.length) / STEPS.length) * 100) + "%";
    foldBtn.textContent = done ? "flat wrapper" : "fold";
    paper.classList.toggle("is-dragging", !!state.drag);
  }

  /* the finished heart takes the place of the wrapper that was clicked */
  function plantHeart() {
    var seed = state.seed;
    if (!seed || seed.classList.contains("is-folded")) return;
    var svg = el("svg", { viewBox: HEART.viewBox, "aria-hidden": "true" });
    HEART.layers.forEach(function (L) {
      svg.appendChild(el("polygon", {
        points: ptsStr(L.pts),
        fill: L.face ? "#d3d7d6" : "#e7e9e8",
        stroke: "#2b2b28",
        "stroke-width": 1.6,
        "stroke-linejoin": "round"
      }));
    });
    seed.innerHTML = "";
    seed.appendChild(svg);
    seed.classList.add("is-folded");
    seed.setAttribute("aria-label", "A folded gum-wrapper heart");
    seed.disabled = true;
  }

  function commit() {
    var i = state.step;
    var st = STEPS[i];
    if (!st) return;
    state.layers = st.layers
      ? st.layers.map(function (L) { return { pts: L.pts, face: L.face, lift: L.lift }; })
      : foldLayers(state.layers, st.crease[0], st.crease[1], st.grab);
    if (st.crease) state.creases = state.creases.concat([st.crease]);
    state.step = i + 1;
    state.drag = null;
    if (state.step >= STEPS.length) {
      state.free = true;
      plantHeart();
    }
    render();
  }

  function reset(keepCreases) {
    state.layers = [{ pts: SQUARE, face: 0, lift: 0 }];
    state.step = 0;
    state.free = false;
    state.flipped = false;
    state.drag = null;
    if (!keepCreases) state.creases = [];
    render();
  }

  function stepBack() {
    var target = Math.max(0, (state.free ? STEPS.length : state.step) - 1);
    var layers = [{ pts: SQUARE, face: 0, lift: 0 }];
    var creases = [];
    for (var i = 0; i < target; i++) {
      var st = STEPS[i];
      layers = st.layers
        ? st.layers.map(function (L) { return { pts: L.pts, face: L.face, lift: L.lift }; })
        : foldLayers(layers, st.crease[0], st.crease[1], st.grab);
      if (st.crease) creases = creases.concat([st.crease]);
    }
    state.step = target;
    state.layers = layers;
    state.creases = creases;
    state.free = false;
    state.drag = null;
    render();
  }

  paper.addEventListener("pointerdown", function (e) {
    if (state.free) {
      var fp = toPaper(e);
      e.preventDefault();
      state.drag = { free: true, from: fp, at: fp };
      render();
      return;
    }
    var st = STEPS[state.step];
    if (!st) return;
    var p = toPaper(e);
    if (Math.hypot(p[0] - st.grab[0], p[1] - st.grab[1]) > 38) return;
    e.preventDefault();
    state.drag = { at: st.grab };
    render();
  });

  window.addEventListener("pointermove", function (e) {
    var d = state.drag;
    if (!d) return;
    var p = toPaper(e);
    if (d.free) {
      state.drag = { free: true, from: d.from, at: p };
      render();
      return;
    }
    var st = STEPS[state.step];
    if (!st) return;
    var near = Math.hypot(p[0] - st.target[0], p[1] - st.target[1]) <= SNAP;
    state.drag = { at: near ? st.target : p, snapped: near };
    render();
  });

  window.addEventListener("pointerup", function () {
    var d = state.drag;
    if (!d) return;
    if (d.free) {
      if (Math.hypot(d.at[0] - d.from[0], d.at[1] - d.from[1]) > 14) {
        var line = perpBisector(d.from, d.at);
        state.layers = foldLayers(state.layers, line[0], line[1], d.from);
      }
      state.drag = null;
      render();
      return;
    }
    if (d.snapped) {
      commit();
    } else {
      state.drag = null;
      render();
    }
  });

  paper.addEventListener("dblclick", function () {
    state.flipped = !state.flipped;
    render();
  });

  Array.prototype.forEach.call(document.querySelectorAll(".seed"), function (seed) {
    seed.addEventListener("click", function () {
      if (seed.classList.contains("is-folded")) return;
      state.seed = seed;
      reset(false);
      modal.hidden = false;
      render();
    });
  });
  document.getElementById("close-fold").addEventListener("click", function () {
    modal.hidden = true;
  });
  modal.addEventListener("click", function (e) {
    if (e.target === modal) modal.hidden = true;
  });
  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modal.hidden) modal.hidden = true;
  });

  foldBtn.addEventListener("click", function () {
    if (state.free || !STEPS[state.step]) reset(false);
    else commit();
  });
  document.getElementById("step-back").addEventListener("click", stepBack);
  document.getElementById("start-over").addEventListener("click", function () { reset(false); });

  render();
})();