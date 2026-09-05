/*
  js/main.js — Meabh Hennessy, 15-113 Project 1.

  AI USAGE: drafted with Claude (claude.ai), then reworked by hand. See
  PROMPTS.md for the log.

  What is in here:
    1. nav scroll state — an IntersectionObserver marks the section you are in
       and fills that nav tab with the section's colour
    2. timeline — each card opens on hover on desktop, on a button tap on
       mobile, and cards open independently of one another
    3. the folding feature (the part I care about) — click a gum wrapper in the
       margin of any section and a dialog walks you through the eight folds of
       a gum-wrapper heart. Folds 1-4 are computed as real reflections of the
       paper across the crease line; from fold 5 the paper leaves the flat
       plane, which a reflection cannot express, so those stages carry authored
       geometry with a per-layer lift value. When the eighth fold lands, the
       finished heart is drawn in place of the wrapper that was clicked and
       stays there. Reloading puts the flat wrappers back.

  The fold sequence is mine and took three attempts to get into the code: the
  AI kept folding a square in half diagonally, which is not how it works. The
  real method is four corners in to point both ends, fold in half for a centre
  crease, open it back out, then bring each half up along that crease.
*/

/* Meabh Hennessy — portfolio behaviour
   1. nav tab highlighting on scroll
   2. name pronunciation note (tap support)
   3. timeline: hover to peek, click to pin
   4. the folding paper: a real fold engine + a five-fold gum-wrapper heart
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
  /* a gum wrapper is a rectangular strip, not a square */
  var SQUARE = [[8, 78], [192, 78], [192, 122], [8, 122]];
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

  /* The gum-wrapper heart, folded the way it really is. Four corner folds point
     both ends of the strip; a fifth fold puts a crease down the middle and the
     sixth opens it again; the last two bring each half up along that crease, so
     the two points stand as the lobes and the fold at the foot is the point of
     the heart. Eight folds, all authored — the paper leaves the flat plane from
     the fifth fold on, which a reflection cannot express. */
  var STEPS = [
    { kind: "valley", grab: [8,78], target: [24,96], tilt: 0,
      title: "top left corner in to the centre line",
      hint: "Silver side down, long edges left and right. Fold the top left corner in until the left edge lies along the middle of the strip.",
      layers: [
        { pts: [[40,78],[192,78],[192,122],[8,122],[8,100]], face: 0, lift: 0 },
        { pts: [[40,78],[8,100],[36,104]], face: 1, lift: 0.12 }
      ] },
    { kind: "valley", grab: [8,122], target: [24,104], tilt: 0,
      title: "bottom left corner in, the end is a point",
      hint: "The bottom left corner the same way. The left end of the wrapper now comes to a point.",
      layers: [
        { pts: [[40,78],[192,78],[192,122],[40,122],[8,100]], face: 0, lift: 0 },
        { pts: [[40,78],[8,100],[36,104]], face: 1, lift: 0.12 },
        { pts: [[40,122],[8,100],[36,96]], face: 1, lift: 0.12 }
      ] },
    { kind: "valley", grab: [192,78], target: [176,96], tilt: 0,
      title: "top right corner in",
      hint: "Now the top right corner, in to the middle line exactly as before.",
      layers: [
        { pts: [[40,78],[160,78],[192,100],[192,122],[40,122],[8,100]], face: 0, lift: 0 },
        { pts: [[40,78],[8,100],[36,104]], face: 1, lift: 0.12 },
        { pts: [[40,122],[8,100],[36,96]], face: 1, lift: 0.12 },
        { pts: [[160,78],[192,100],[164,104]], face: 1, lift: 0.12 }
      ] },
    { kind: "valley", grab: [192,122], target: [176,104], tilt: 0,
      title: "bottom right corner in, both ends are points",
      hint: "And the bottom right. Both ends are points — the wrapper is a long arrow at each end.",
      layers: [
        { pts: [[40,78],[160,78],[192,100],[160,122],[40,122],[8,100]], face: 0, lift: 0 },
        { pts: [[40,78],[8,100],[36,104]], face: 1, lift: 0.12 },
        { pts: [[40,122],[8,100],[36,96]], face: 1, lift: 0.12 },
        { pts: [[160,78],[192,100],[164,104]], face: 1, lift: 0.12 },
        { pts: [[160,122],[192,100],[164,96]], face: 1, lift: 0.12 }
      ] },
    { kind: "valley", grab: [8,100], target: [192,100], tilt: 0,
      title: "fold it in half to make the centre crease",
      hint: "Fold the whole thing in half, right end onto left, and press the crease down the middle.",
      layers: [
        { pts: [[100,78],[160,78],[192,100],[160,122],[100,122]], face: 0, lift: 0 },
        { pts: [[100,78],[152,78],[182,100],[152,122],[100,122]], face: 1, lift: 0.12 }
      ] },
    { kind: "valley", grab: [100,100], target: [100,100], tilt: 0,
      title: "open it back out, the crease stays",
      hint: "Open it straight back out. All you wanted was that centre crease to fold against.",
      layers: [
        { pts: [[40,78],[160,78],[192,100],[160,122],[40,122],[8,100]], face: 0, lift: 0 },
        { pts: [[40,78],[8,100],[36,104]], face: 1, lift: 0.12 },
        { pts: [[40,122],[8,100],[36,96]], face: 1, lift: 0.12 },
        { pts: [[160,78],[192,100],[164,104]], face: 1, lift: 0.12 },
        { pts: [[160,122],[192,100],[164,96]], face: 1, lift: 0.12 }
      ] },
    { kind: "mountain", grab: [192,100], target: [140,60], tilt: 0.16,
      title: "bring the right half up along the crease",
      hint: "Take the right half and bring it up along the centre crease, so its point stands up beside the middle.",
      layers: [
        { pts: [[40,78],[100,78],[100,122],[40,122],[8,100]], face: 0, lift: 0 },
        { pts: [[100,66],[114,38],[154,38],[176,58],[176,74],[100,150]], face: 1, lift: 0 },
        { pts: [[40,78],[8,100],[36,104]], face: 1, lift: 0.12 },
        { pts: [[40,122],[8,100],[36,96]], face: 1, lift: 0.12 }
      ] },
    { kind: "mountain", grab: [8,100], target: [60,60], tilt: 0.2,
      title: "a gum-wrapper heart",
      hint: "The left half up the same way. The two points are the lobes and the fold at the foot is the point of the heart.",
      layers: [
        { pts: [[100,66],[86,38],[46,38],[24,58],[24,74],[100,162]], face: 0, lift: 0 },
        { pts: [[100,66],[114,38],[154,38],[176,58],[176,74],[100,162]], face: 1, lift: 0 }
      ] }
  ];

  var KIND_LABEL = {
    valley: "valley fold — a flat crease, the paper stays in plane",
    mountain: "mountain fold — creased the other way, turned behind",
    round: "shaping fold — a tip turned back to leave a flat shoulder"
  };
  var KIND_COLOR = {
    valley: "var(--ink-mute)",
    mountain: "var(--pink)",
    round: "var(--sage)"
  };

  /* the finished heart, plus a sheen sliver that reads as foil */
  var HEART_SHEEN = "20,14.2 20,31.8 6.4,15.4 5.6,11";
  var HEART_PARTS = [
    ["20,13.2 17.2,7.6 9.2,7.6 4.8,11.6 4.8,14.8 20,32.4", 0],
    ["20,13.2 22.8,7.6 30.8,7.6 35.2,11.6 35.2,14.8 20,32.4", 1]
  ];

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
  var stepTitle = document.getElementById("step-title");
  var stepHint = document.getElementById("step-hint");
  var foldType = document.getElementById("fold-type");
  var progressText = document.getElementById("progress-text");
  var progressFill = document.getElementById("progress-fill");
  var freeNote = document.getElementById("free-note");
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

    stepLabel.textContent = done ? STEPS.length + " folds · one gum-wrapper heart" : "fold " + (state.step + 1) + " of " + STEPS.length;
    stepTitle.textContent = done ? "a gum-wrapper heart" : st.title;
    stepHint.textContent = done
      ? "That is the whole sequence. Your heart is now sitting exactly where its wrapper was — close this and go and find it."
      : st.hint;
    foldType.textContent = done ? "free fold — drag anywhere to keep folding" : KIND_LABEL[st.kind];
    foldType.style.color = done ? "var(--sage)" : KIND_COLOR[st.kind];
    progressText.textContent = done ? "heart complete" : "points at 4 · crease at 6 · heart at 8";
    progressFill.style.width = Math.round((Math.min(state.step, STEPS.length) / STEPS.length) * 100) + "%";
    foldBtn.textContent = done ? "flat wrapper" : "fold this one for me";
    freeNote.hidden = !done;
    paper.classList.toggle("is-dragging", !!state.drag);
  }

  /* the finished heart takes the place of the square that was clicked */
  function plantHeart() {
    var seed = state.seed;
    if (!seed || seed.classList.contains("is-folded")) return;
    var svg = el("svg", { viewBox: "4 6.8 32.4 26.8", "aria-hidden": "true" });
    HEART_PARTS.forEach(function (part) {
      svg.appendChild(el("polygon", {
        points: part[0],
        fill: part[1] ? "#d3d7d6" : "#e7e9e8",
        stroke: "#2b2b28",
        "stroke-width": 1.4,
        "stroke-linejoin": "round"
      }));
    });
    svg.appendChild(el("polygon", {
      points: HEART_SHEEN, fill: "#ffffff", opacity: 0.5, stroke: "none"
    }));
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
