// lens: a magnifier that follows the pointer. Letters under it grow, the most at its centre, and
// the letters around them move aside, so the grown letters do not overlap much.
// speed: how fast the lens follows the pointer, grows and shrinks, times the speed option.
// radius: how far the lens reaches, in em. Letters in its inner third grow; the rest only move aside.
// zoom: how large the letter at the centre grows, as a scale (1 is its normal size).
// swap: true lets the letters near the centre swap to math glyphs as the lens passes over them.

var FOLLOW = 22;  // rad/s at speed 1: stiffness of the spring that moves the lens to the pointer
var GROW = 12;    // rad/s at speed 1: stiffness of the spring that grows and shrinks the lens
var PUSH = 0.7;   // share of the room the grown letters need that the letters around them make

// Moves s[p], with velocity s[v], toward `to` on an exact critically damped spring of stiffness k,
// for t seconds.
function ease(s, p, v, to, k, t) {
  var d = s[p] - to, e = Math.exp(-k * t), j = (s[v] + k * d) * t;
  s[v] = (s[v] - k * j) * e;
  s[p] = to + (d + j) * e;
}

export var lens = {
  name: 'lens',
  defaults: { speed: 1, radius: 6, zoom: 1.8, swap: true },
  frame: function (f) {
    var s = f.state, p = f.pointer, k = f.settings.speed * f.speed, t = f.dt / 1000;
    if (s.a === undefined) s.a = s.va = 0;
    if (p) {
      // A lens that has shrunk away starts again at the pointer instead of gliding to it.
      if (s.a < 0.05) { s.x = p.x; s.y = p.y; s.vx = s.vy = 0; }
      ease(s, 'x', 'vx', p.x, FOLLOW * k, t);
      ease(s, 'y', 'vy', p.y, FOLLOW * k, t);
    }
    ease(s, 'a', 'va', p ? 1 : 0, GROW * k, t);
    if (!p && s.a < 0.002) { s.a = s.va = 0; return false; }
    s.r = f.settings.radius * f.fs;
    s.z = (f.settings.zoom - 1) * s.a;
    return true;
  },
  glyph: function (g, out, f) {
    var s = f.state, r = s.r, dx = g.cx - s.x, dy = g.cy - s.y, d2 = dx * dx + dy * dy;
    if (d2 >= r * r) { if (g.fx) g.fx = false; return; }
    // The core (the inner third) grows; the push is the room its letters need, and it fades to 0
    // on a smoothstep between the core and the rim.
    var d = Math.sqrt(d2), c = r / 3, v = d / c, w = 0, push, q;
    if (v < 1) {
      w = (1 - v * v) * (1 - v * v);
      push = c * v * (1 - v * v * (2 / 3 - v * v / 5));
    } else {
      q = (d - c) / (r - c);
      push = c * 8 / 15 * (1 - q * q * (3 - 2 * q));
    }
    // Letters move along their line only, so lines stay straight; the gaps between lines leave the
    // grown letters room above and below.
    push *= PUSH * s.z / (d || 1);
    if (g.r) {
      var cos = Math.cos(g.r), sin = Math.sin(g.r);
      push *= dx * cos + dy * sin;
      out.x = cos * push;
      out.y = sin * push;
    } else {
      out.x = dx * push;
    }
    if (w * s.z > 0.004) out.scale = 1 + w * s.z;
    if (!f.settings.swap) return;
    if (v < 0.4 && s.a > 0.6 && f.pointer) {
      if (!g.fx) out.swap = g.fx = true;
    } else if (v > 0.6) {
      g.fx = false;
    }
  }
};
