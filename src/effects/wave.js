// wave: letters near the pointer bob up and down in a soft wave that runs along the text.
// speed: how fast the wave runs, times the speed option.
// radius: how far from the pointer letters move, in em.
// height: how far a letter at the pointer rises and falls, in em.
// length: the distance between two crests, in em.
// swap: the chance that a letter swaps when a crest lifts it, from 0 to 1.

var HZ = 0.9;      // crests per second that pass a letter at speed 1
var FADE = 450;    // ms the wave takes to fade in or out
var FOLLOW = 90;   // ms time constant of the wave's centre as it follows the pointer

export var wave = {
  name: 'wave',
  defaults: { speed: 1, radius: 5, height: 0.22, length: 4.5, swap: 0.25 },
  frame: function (f) {
    var s = f.state, p = f.pointer, set = f.settings, was = s.e || 0;
    if (p && !was) {
      s.x = p.x;
      s.y = p.y;
    } else if (p) {
      var k = 1 - Math.exp(-f.dt / FOLLOW);
      s.x += (p.x - s.x) * k;
      s.y += (p.y - s.y) * k;
    }
    var e = s.e = Math.min(1, Math.max(0, was + (p ? f.dt : -f.dt) / FADE));
    s.dc = f.dt / 1000 * HZ * set.speed * f.speed;
    s.c = ((s.c || 0) + s.dc) % 1;
    s.r = set.radius * f.fs;
    s.h = set.height * f.fs * e * e * (3 - 2 * e);
    s.l = set.length * f.fs;
    // Upright text that runs down (the first two glyphs of a line are one above the other) sways
    // sideways. Turned slots (the ring) give their direction in g.r.
    var a = f.glyphs[0], b = f.glyphs[1];
    s.v = b && b.line === a.line && !a.r && Math.abs(b.cy - a.cy) > Math.abs(b.cx - a.cx) ? Math.PI / 2 : 0;
    // One more frame after the fade ends, so glyph() puts every letter back at rest itself.
    return e > 0 || was > 0;
  },
  glyph: function (g, out, f) {
    var s = f.state, r = s.r, dx = g.cx - s.x, dy = g.cy - s.y;
    if (dx > r || dx < -r || dy > r || dy < -r) return;
    var q = 1 - (dx * dx + dy * dy) / (r * r);
    if (q <= 0) return;
    q *= q;
    // t: the direction the text runs here. The crests run along it, and letters move across it.
    // u is a whole number where a crest is.
    var t = g.r + s.v, cos = t ? Math.cos(t) : 1, sin = t ? Math.sin(t) : 0;
    var u = (g.cx * cos + g.cy * sin) / s.l - s.c - 0.25, h = -s.h * q * Math.cos(2 * Math.PI * u);
    if (Math.floor(u + s.dc) !== Math.floor(u) && q * s.e > 0.5 && Math.random() < f.settings.swap) out.swap = true;
    out.x = -sin * h;
    out.y = cos * h;
  }
};
