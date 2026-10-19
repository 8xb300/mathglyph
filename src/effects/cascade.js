// cascade: letters near the pointer drop from above into their slots in columns, like rain. The
// columns start one after another, the nearest to the pointer first, so only a few fall at a time.
// The letters of a column fall together, scramble and fade in as they fall, then lock in place with
// a small bounce.
// speed: how fast the letters fall and lock in, and how often a column starts, times the speed option.
// radius: how near the pointer a letter must be to fall, in em.
// fall: how far above its slot a letter starts to fall, in em, at most 3.

// Times in ms at speed 1.
var GAP = 80;      // between the starts of two columns
var OUT = 60;      // the letters of a column fade out in place, then they fall
var FALL = 280;    // at a steady speed, fading in
var LOCK = 200;    // and land with a critically damped bounce: an offset of v * t * e^(-BOUNCE * t)
var BOUNCE = 32;   // per second
var COLUMN = 0.6;  // em: the width of a column

export var cascade = {
  name: 'cascade',
  defaults: { speed: 1, radius: 3, fall: 2.5 },
  reach: 2,
  frame: function (f) {
    var s = f.state, p = f.pointer, more = s.d < Infinity;
    if (!s.cols) s.cols = [];
    s.k = Math.max(f.settings.speed * f.speed, 0.05);
    s.h = Math.min(f.settings.fall, 3) * f.fs;
    s.w = COLUMN * f.fs;
    if (p && f.moved) s.moved = f.now;
    // Starts the column that the last frame found nearest to the pointer.
    if (p && more && !(f.now < s.next)) {
      s.cols[s.c] = f.now + OUT / s.k;
      s.next = f.now + GAP / s.k;
      s.end = s.cols[s.c] + (FALL + LOCK) / s.k;
    }
    s.d = Infinity;
    return !!(p && (f.moved || more)) || f.now < s.end;
  },
  glyph: function (g, out, f) {
    var s = f.state, e = (f.now - g.fx) * s.k;  // ms since its fall began, at speed 1
    if (e < FALL + LOCK) {
      if (e < 0) {
        out.alpha = -e / OUT;
      } else if (e < FALL) {
        // It fades in as it falls, so it is faint over the line above, and it does not show
        // until all of it is below the top of the canvas.
        var u = e / FALL, y = out.y = -s.h * (1 - u);
        out.alpha = u * Math.min(1, Math.max(0, (g.cy + y - 0.5 * f.fs) / (0.25 * f.fs)));
        out.swap = true;
      } else {
        e = (e - FALL) / 1000;
        out.y = s.h / FALL * 1000 * e * Math.exp(-BOUNCE * e);
      }
      return;
    }
    var p = f.pointer, r = f.settings.radius * f.fs;
    if (!p) return;
    var dx = g.cx - p.x, dy = g.cy - p.y;
    if (dx * dx + dy * dy > r * r) return;
    // The letters of a column that are near the pointer fall together, so they stay a line apart.
    // A column can fall again once its letters have landed, if the pointer has moved since.
    var c = Math.round(g.cx / s.w), t = s.cols[c];
    if (t > f.now) g.fx = t;
    else if (!(t + (FALL + LOCK) / s.k > f.now || t > s.moved) && Math.abs(dx) < s.d) {
      s.d = Math.abs(dx);
      s.c = c;
    }
  }
};
