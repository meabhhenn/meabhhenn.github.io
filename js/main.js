/* Meabh Hennessy — portfolio behaviour
   1. nav tab highlighting on scroll
   2. name pronunciation note (tap support)
   3. timeline: hover to peek, click to pin
   4. the folding paper: a real fold engine + the traditional crane sequence
   No libraries, no build step. */

(function () {
  "use strict";

  /* ---------- 1. nav ---------- */

  var tabs = Array.prototype.slice.call(document.querySelectorAll("[data-tab]"));
  var sections = ["about", "timeline", "projects", "contact"];

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

  /* ---------- 4. the folding paper ---------- */

  var SVG_NS = "http://www.w3.org/2000/svg";
  var S = 200;
  var SQUARE = [[0, 0], [S, 0], [S, S], [0, S]];
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

  /* The traditional crane. The first four folds are real reflections computed by
     the engine; the petal and reverse folds lift paper off the plane, which a
     mirror cannot express, so those stages carry authored geometry with a lift
     value per layer and the stage tilts into perspective. */
  var STEPS = [
    { kind: "valley", grab: [0, 0], target: [S, S], crease: [[S, 0], [0, S]], tilt: 0,
      title: "diagonal, corner to corner",
      hint: "Coloured side up. Pull the top-left corner onto the bottom-right one and crease hard." },
    { kind: "valley", grab: [S, 0], target: [0, S], crease: [[0, 0], [S, S]], tilt: 0,
      title: "the other diagonal",
      hint: "Unfold, then fold the other way — right corner across to the left. Two diagonals creased." },
    { kind: "valley", grab: [0, S], target: [100, 100], crease: [[0, 100], [S, 300]], tilt: 0.15,
      title: "left flap to the point",
      hint: "Bring the bottom-left corner up to the top point. Half the preliminary base." },
    { kind: "valley", grab: [S, S], target: [100, 100], crease: [[100, S], [S, 100]], tilt: 0.25,
      title: "right flap to the point",
      hint: "Mirror it on the right. You now have the preliminary base — a smaller square with four loose corners at the bottom." },
    { kind: "petal", grab: [100, 186], target: [100, 36], tilt: 0.4,
      title: "petal fold, front",
      hint: "Take the bottom point of the front layer only and swing it all the way up to the top point. The two side corners fold themselves inward as it goes.",
      layers: [
        { pts: [[100, 34], [158, 112], [100, 190], [42, 112]], face: 0, lift: 0 },
        { pts: [[100, 34], [130, 100], [100, 126], [70, 100]], face: 1, lift: 0.6 },
        { pts: [[70, 100], [100, 126], [100, 186]], face: 1, lift: 0.3 },
        { pts: [[130, 100], [100, 126], [100, 186]], face: 1, lift: 0.3 }
      ] },
    { kind: "petal", grab: [100, 186], target: [100, 40], tilt: 0.45,
      title: "petal fold, back",
      hint: "Turn the paper over and do exactly the same thing again. Now both sides are petalled and you are holding the bird base.",
      layers: [
        { pts: [[100, 40], [150, 112], [100, 152], [50, 112]], face: 0, lift: 0 },
        { pts: [[100, 44], [126, 104], [100, 124], [74, 104]], face: 1, lift: 0.65 },
        { pts: [[92, 148], [74, 196], [100, 152]], face: 1, lift: 0.25 },
        { pts: [[108, 148], [126, 196], [100, 152]], face: 1, lift: 0.25 }
      ] },
    { kind: "valley", grab: [74, 194], target: [98, 194], tilt: 0.45,
      title: "narrow the left point",
      hint: "Fold the outer edge of the left hanging point in to the centre line, so the point becomes a thin spike. A crane needs a slim neck.",
      layers: [
        { pts: [[100, 40], [150, 112], [100, 152], [50, 112]], face: 0, lift: 0 },
        { pts: [[100, 44], [126, 104], [100, 124], [74, 104]], face: 1, lift: 0.65 },
        { pts: [[94, 148], [86, 196], [100, 152]], face: 1, lift: 0.25 },
        { pts: [[108, 148], [126, 196], [100, 152]], face: 1, lift: 0.25 }
      ] },
    { kind: "valley", grab: [126, 194], target: [102, 194], tilt: 0.45,
      title: "narrow the right point",
      hint: "The same fold mirrored on the right point. Two thin spikes now — one will be the neck, the other the tail.",
      layers: [
        { pts: [[100, 40], [150, 112], [100, 152], [50, 112]], face: 0, lift: 0 },
        { pts: [[100, 44], [126, 104], [100, 124], [74, 104]], face: 1, lift: 0.65 },
        { pts: [[94, 148], [86, 196], [100, 152]], face: 1, lift: 0.25 },
        { pts: [[106, 148], [114, 196], [100, 152]], face: 1, lift: 0.25 }
      ] },
    { kind: "reverse", grab: [92, 194], target: [46, 56], tilt: 0.5,
      title: "reverse fold the neck",
      hint: "Swing the left spike up between its own layers, so it points up and to the left instead of down. This is the neck.",
      layers: [
        { pts: [[100, 46], [146, 112], [100, 156], [54, 112]], face: 0, lift: 0 },
        { pts: [[100, 50], [124, 104], [100, 122], [76, 104]], face: 1, lift: 0.6 },
        { pts: [[92, 120], [46, 56], [58, 66], [100, 128]], face: 1, lift: 0.8 },
        { pts: [[106, 150], [114, 196], [100, 154]], face: 1, lift: 0.25 }
      ] },
    { kind: "reverse", grab: [110, 194], target: [168, 76], tilt: 0.55,
      title: "reverse fold the tail",
      hint: "The same move on the right spike, swung up at a shallower angle. Now it reads as a bird.",
      layers: [
        { pts: [[100, 48], [142, 112], [100, 158], [58, 112]], face: 0, lift: 0 },
        { pts: [[92, 120], [46, 56], [58, 66], [100, 128]], face: 1, lift: 0.8 },
        { pts: [[108, 124], [168, 76], [174, 90], [112, 136]], face: 1, lift: 0.8 },
        { pts: [[100, 52], [122, 102], [100, 120], [78, 102]], face: 0, lift: 0.6 }
      ] },
    { kind: "mountain", grab: [46, 56], target: [34, 66], tilt: 0.55,
      title: "fold the head",
      hint: "Pinch the very tip of the neck and fold it back down on itself. That small fold is the head and beak.",
      layers: [
        { pts: [[100, 48], [142, 112], [100, 158], [58, 112]], face: 0, lift: 0 },
        { pts: [[92, 120], [48, 58], [60, 68], [100, 128]], face: 1, lift: 0.8 },
        { pts: [[48, 58], [30, 64], [40, 74], [56, 68]], face: 0, lift: 0.85 },
        { pts: [[108, 124], [168, 76], [174, 90], [112, 136]], face: 1, lift: 0.8 },
        { pts: [[100, 52], [122, 102], [100, 120], [78, 102]], face: 0, lift: 0.6 }
      ] },
    { kind: "valley", grab: [142, 112], target: [176, 112], tilt: 0.6,
      title: "open the wings",
      hint: "Hold the body and draw both wings out sideways until they spread. One paper crane.",
      layers: [
        { pts: [[100, 124], [26, 108], [58, 142]], face: 0, lift: 0.2 },
        { pts: [[100, 124], [174, 108], [142, 142]], face: 1, lift: 0.2 },
        { pts: [[100, 116], [114, 134], [100, 172], [86, 134]], face: 0, lift: 0 },
        { pts: [[92, 120], [48, 58], [60, 68], [100, 128]], face: 1, lift: 0.8 },
        { pts: [[48, 58], [30, 64], [40, 74], [56, 68]], face: 0, lift: 0.85 },
        { pts: [[108, 124], [168, 76], [174, 90], [112, 136]], face: 1, lift: 0.8 }
      ] }
  ];

  var KIND_LABEL = {
    valley: "valley fold — a flat crease, the paper stays in plane",
    petal: "petal fold — the flap lifts off the paper and squashes",
    reverse: "reverse fold — the paper turns inside out along its crease",
    mountain: "mountain fold — creased the other way, folded behind"
  };
  var KIND_COLOR = {
    valley: "var(--ink-mute)",
    petal: "var(--sage)",
    reverse: "var(--blue)",
    mountain: "var(--pink)"
  };

  var ROOSTS = [
    { sec: "about", top: "13%", left: "6%", w: 40, rot: -13, back: "#f2e4e4" },
    { sec: "timeline", top: "8%", left: "86%", w: 34, rot: 9, back: "#e2ece3" },
    { sec: "projects", top: "78%", left: "4%", w: 44, rot: -6, back: "#f5e9cd" },
    { sec: "contact", top: "20%", left: "82%", w: 38, rot: 14, back: "#e0eaf4" },
    { sec: "about", top: "72%", left: "90%", w: 30, rot: 7, back: "#f2e4e4" },
    { sec: "timeline", top: "82%", left: "9%", w: 42, rot: -11, back: "#e2ece3" },
    { sec: "projects", top: "12%", left: "90%", w: 32, rot: 11, back: "#f5e9cd" },
    { sec: "contact", top: "74%", left: "10%", w: 36, rot: -8, back: "#e0eaf4" }
  ];

  var CRANE_PARTS = [
    ["22,18 6,4 10,20", 0],
    ["22,18 38,4 34,20", 1],
    ["22,18 10,20 20,31", 0],
    ["22,18 34,20 41,26", 1],
    ["22,18 2,12 7,15", 0]
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
    craneCount: 0
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

    stepLabel.textContent = done ? STEPS.length + " folds · one crane" : "fold " + (state.step + 1) + " of " + STEPS.length;
    stepTitle.textContent = done ? "a paper crane" : st.title;
    stepHint.textContent = done
      ? "That is the whole traditional sequence. Your crane has joined the flock in the page behind this — close it and look around."
      : st.hint;
    foldType.textContent = done ? "free fold — drag anywhere to keep folding" : KIND_LABEL[st.kind];
    foldType.style.color = done ? "var(--sage)" : KIND_COLOR[st.kind];
    progressText.textContent = done ? "crane complete" : "square base at 4 · bird base at 6 · crane at 12";
    progressFill.style.width = Math.round((Math.min(state.step, STEPS.length) / STEPS.length) * 100) + "%";
    foldBtn.textContent = done ? "flat square" : "fold this one for me";
    freeNote.hidden = !done;
    paper.classList.toggle("is-dragging", !!state.drag);
  }

  function releaseCrane() {
    var roost = ROOSTS[state.craneCount];
    if (!roost) return;
    state.craneCount += 1;
    var host = document.querySelector('[data-flock="' + roost.sec + '"]');
    if (!host) return;
    var svg = el("svg", {
      viewBox: "0 0 44 34",
      width: roost.w,
      "aria-hidden": "true",
      style: "top:" + roost.top + ";left:" + roost.left + ";opacity:0.9;transform:rotate(" + roost.rot + "deg)"
    });
    CRANE_PARTS.forEach(function (part) {
      svg.appendChild(el("polygon", {
        points: part[0],
        fill: part[1] ? roost.back : "#fffdf8",
        stroke: "#2b2b28",
        "stroke-width": 1.2
      }));
    });
    host.appendChild(svg);
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
      releaseCrane();
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

  document.getElementById("open-fold").addEventListener("click", function () {
    modal.hidden = false;
    render();
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
