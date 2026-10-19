export type PaletteName = 'pastel' | 'ember' | 'ice' | 'mono' | 'shimmer';

export type GroupName =
  | 'general' | 'calculus' | 'logic' | 'linalg' | 'numbers' | 'geometry'
  | 'statistics' | 'physics' | 'engineering' | 'chemistry' | 'cs' | 'greek'
  | 'bioastro' | 'economics' | 'philosophy' | 'proofs' | 'linguistics' | 'law'
  | 'finance' | 'category' | 'functional';

export interface SymbolSet {
  label?: string;
  /** Single glyphs. A string is split into graphemes. */
  symbols: string | string[];
  /** Short multi-glyph notation, used only when `expand` is on. */
  tokens?: string[];
}

/** A font file to load with the FontFace API, or the name of a family that is already loaded. */
export type FontSource =
  | string
  | ({ family: string; url?: string; src?: string } & FontFaceDescriptors);

/** What `labelFormat` gets for one boxed glyph. */
export interface LabelCell {
  /** The glyph the slot shows now. */
  glyph: string;
  /** The original character of the slot. */
  char: string;
  /** Width change of the slot against a plain monospace slot, in CSS px (rounded). */
  dx: number;
  /** Width of the slot now, in CSS px. */
  width: number;
  color: string;
  line: number;
  column: number;
}

export type EffectName = 'breathe' | 'ripple' | 'firework' | 'lens' | 'cascade' | 'shatter';
export type LayoutName = 'lines' | 'columns' | 'grid' | 'ring';
export type ScriptName = 'latin' | 'greek' | 'cyrillic';

/** A point in CSS px from the top left of the canvas. */
export interface Point {
  x: number;
  y: number;
}

/**
 * One glyph, as an effect sees it. The engine owns every field except `fx`: read them, do not
 * write them. The engine never calls `glyph()` of an effect for the anchor word, but its glyphs are in `f.glyphs`.
 */
export interface Glyph {
  /** Index in the whole text, from 0. */
  i: number;
  /** Line of the source text, and the position in that line, from 0. */
  line: number;
  col: number;
  /** Centre of the slot at rest, CSS px. The layout sets it. */
  cx: number;
  cy: number;
  /** Size of the slot along the text, CSS px. It moves on a spring as glyphs swap. */
  w: number;
  /** Angle of the slot, radians. The layout sets it: 0 in 'lines', 'columns' and 'grid'. */
  r: number;
  /** The source character, and the glyph shown now. */
  ch: string;
  g: string;
  /** A random number in [0, 1), fixed for this glyph. */
  seed: number;
  /** true for the anchor word's glyphs. They are in `f.glyphs`, but `glyph()` is never called for them. */
  anchor: boolean;
  /** Free for the effect: state for this glyph. Starts undefined. Cleared when the effect or the text changes. */
  fx: any;
}

/**
 * What an effect sets for one glyph in one frame. Before each call to `glyph()` the engine resets
 * it to rest: x 0, y 0, scale 1, rotate 0, alpha 1, swap false, paint false.
 */
export interface GlyphOut {
  /** Offset from the slot centre, CSS px. */
  x: number;
  y: number;
  /** Size, 1 = normal. */
  scale: number;
  /** Rotation, radians, added to the slot angle. */
  rotate: number;
  /** Opacity, 0 to 1. Multiplies the glyph, its box and its label. */
  alpha: number;
  /** true: the glyph swaps now. It scrambles for a moment, then settles, as under the pointer. */
  swap: boolean;
  /** true: call the effect's `paint()` for this glyph in this frame. */
  paint: boolean;
}

/** The `idle` option. */
export interface Idle {
  /**
   * 'shuffle' (default): random letters swap by themselves, as under the pointer. With rest: 'plain'
   * they go back to plain. 'wander': a slow virtual pointer drifts over the text and runs the effect.
   */
  mode?: 'shuffle' | 'wander';
  /** 'shuffle': seconds between swaps. 'wander': the pace; the point crosses the text in about 5 × every seconds. Default 1.5. */
  every?: number;
  /** 'shuffle': the share of letters that swap each time, 0 to 1. Default 0.1. */
  amount?: number;
}

/** What an effect gets in each frame. */
export interface EffectFrame {
  /** requestAnimationFrame time, ms. */
  now: number;
  /** Real time since the last frame, ms, at most 100. */
  dt: number;
  /** The pointer, or null when it is not on the text. With motion: 'always' or idle: { mode: 'wander' } a slow wandering point stands in. */
  pointer: Point | null;
  /** true in frames where the pointer moved. */
  moved: boolean;
  /** Font size (1 em), line height and canvas size, CSS px. */
  fs: number;
  lineH: number;
  width: number;
  height: number;
  /** The `speed` option. Multiply your own speed setting with it. */
  speed: number;
  /** The hover radius, CSS px: the font size times the `hoverRadius` option. */
  radius: number;
  /** The palette colours. */
  palette: string[];
  /** The canvas font, for example "24px ui-monospace, ...". */
  font: string;
  /** The effect's `defaults` with the user's settings over them. */
  settings: Record<string, any>;
  /** Free for the effect: state for this mount. Starts as {}. Cleared when the effect changes. */
  state: Record<string, any>;
  /** Every glyph, in text order, so `glyphs[g.i] === g`. */
  glyphs: Glyph[];
}

/**
 * A hover effect. Every preset is one of these, and you can write your own. Effects run inside the
 * engine's one frame loop, with real frame time. With reduced motion or motion: 'still' the engine
 * does not call them.
 */
export interface Effect {
  name: string;
  /** Settings and their default values. The user's `effect: { name, ...settings }` goes over them. */
  defaults?: Record<string, any>;
  /**
   * Called once per frame, before `glyph()`. Return true while the effect still moves something,
   * and the loop keeps running. Return false and the loop can sleep: the engine eases every glyph
   * back to rest in about 0.2 s. Without `frame()`, `glyph()` runs only in frames where the pointer
   * moved, and swaps are its only output (as 'breathe').
   */
  frame?(f: EffectFrame): boolean;
  /** Called for each glyph in frames where `frame()` returned true. `out` starts at rest. */
  glyph(g: Glyph, out: GlyphOut, f: EffectFrame): void;
  /**
   * Optional. Draws extras for one glyph (sparks, dots) after the engine draws it, if `out.paint`
   * was set. ctx is in CSS px with no transform.
   */
  paint?(ctx: CanvasRenderingContext2D, g: Glyph, out: GlyphOut, f: EffectFrame): void;
  /** How far, in line heights, a glyph or its paint can go from its slot. The engine redraws that much around it. Default 1. */
  reach?: number;
}

/**
 * A layout places the slots: from each glyph's slot size `w` and the element's size, it sets each
 * glyph's centre `cx`, `cy` and angle `r`. Every built-in layout is one of these, 'lines' too, and
 * you can write your own. Add it with `register`, as an effect.
 */
export interface Layout {
  name: string;
  defaults?: Record<string, any>;
  /**
   * true: line i is the strip of the canvas from i to i + 1 line heights, and a slot change moves
   * only its own line, so the engine redraws only the changed strips. Otherwise it redraws all.
   */
  bands?: boolean;
  /** true: slots stack down the canvas, and labels read down beside their box instead of under it. */
  vertical?: boolean;
  /**
   * Gives the font size and the canvas height, and `pad`: em that every slot gets along the text
   * on top of its glyph's width. Called on start, resize, font load and update, never in the
   * frame loop, so it can read `viewH`. Optional: without it, the size of 'lines' (the widest line
   * fits the width, with `fit`; a line height per line).
   */
  size?(m: LayoutMetrics): { fs: number; height: number; pad?: number };
  /**
   * Sets `cx`, `cy` and `r` of every glyph from the slot sizes `w`. Called once after `size()`, in
   * frames where something changed (`m.dirty[i]` is true for each line whose slots changed), and
   * once more in every frame while it returns true (for springs of its own). It must not read the
   * page: use only what `m` holds.
   */
  place(m: LayoutMetrics): boolean | void;
}

/** A glyph as a layout sees it. */
export interface LayoutGlyph extends Glyph {
  /** Size of the slot along the text at rest (its own character, plain), em. */
  pw: number;
  /** Where the slot size `w` is going, CSS px. */
  peak: number;
  /** Free for the layout, for example the slot's offset along its line. */
  x: number;
}

/** What a layout gets. Sizes are CSS px unless the name says em. */
export interface LayoutMetrics {
  /** Element content width, and the canvas height from `size()`. */
  width: number;
  height: number;
  /** The viewport height. Read it only in `size()`. */
  viewH: number;
  /** In `size()`: the element's CSS font size with fit: false, else 0. After it: the font size. */
  fs: number;
  fit: boolean;
  maxSize: number;
  expand: boolean;
  /** The `speed` option, at least 0.25. */
  speed: number;
  /** Line height, em; and line height and box height, CSS px, after `size()`. */
  lineEm: number;
  lineH: number;
  boxH: number;
  /**
   * Each line: its glyphs, where its anchor word is ([a0, a1), a1 is 0 without one), its plain
   * size along the text in em (`natural`), and the middle of its anchor word in em from the line's
   * start (`mid`). A layout can keep its own data for a line on these objects, as 'lines' keeps
   * `top` and `left`.
   */
  lines: Array<{ cells: LayoutGlyph[]; a0: number; a1: number; natural: number; mid: number; [key: string]: any }>;
  /** The anchor word: its line and its glyphs [from, to), or null. */
  anchor: { line: number; from: number; to: number } | null;
  /** The layout's `defaults` with the user's settings over them. */
  settings: Record<string, any>;
  /** Free for the layout: state for this mount. Cleared after every `size()`, before `place()`. */
  state: Record<string, any>;
  /** In `place()`: true for each line whose slots changed since the last call. */
  dirty: boolean[];
  /** Real time since the last frame, ms; 0 outside the frame loop. */
  dt: number;
}

export interface Options {
  lines?: string[];
  /**
   * How the slots are placed. 'lines' (default): centred lines. 'columns': vertical columns
   * (settings `columnGap`: em between two columns, which are 1 em wide, default 0.5; `spacing`, from
   * v0.5.0: em from the middle of one column to the next, wins over `columnGap` when set;
   * `columnOrder`: 'rtl', 'ltr' or 'auto', default 'auto': right to left when most characters are
   * CJK). 'grid': a grid where a wide
   * glyph pushes its row and column apart. 'ring': around a circle (setting `gap`: em between two
   * lines, default 1). A name needs its module registered (see `register`), except 'lines'.
   * `{ name, ...settings }` sets the layout's settings.
   */
  layout?: LayoutName | Layout | ({ name: LayoutName | string } & Record<string, unknown>);
  /**
   * What the pointer does. 'breathe' (default): glyphs near the pointer scramble and their slots
   * widen. 'wave' was removed in v0.5.0: it gives 'breathe' and a console warning. A name needs
   * its module registered (see `register`), except 'breathe'.
   * `{ name, ...settings }` sets the effect's settings. A list runs several at once, in order:
   * `['ripple', { name: 'lens', strength: 0.5 }]`. Their offsets and rotations add, their scales
   * and opacities multiply, and any of them can swap a glyph. `strength` (0 to 1, default 1)
   * scales what one effect does; its swaps count for that share of the glyphs.
   */
  effect?: EffectValue | EffectValue[];
  /**
   * Scripts that swaps take look-alike letters from: an array of names, or names with weights.
   * 'latin' is the math alphabets and symbols (the default behaviour), 'greek' Greek letters that
   * look like the Latin one (A to Λ), 'cyrillic' Cyrillic ones (R to Я). Each swap of a Latin
   * letter picks a script by weight; a letter that script has no look-alike for swaps as 'latin'.
   * Default null: 'latin' only.
   */
  scripts?: ScriptName[] | Partial<Record<ScriptName, number>> | null;
  palette?: PaletteName | string[];
  substitute?: number;
  color?: number;
  box?: number;
  boxStyle?: 'detect' | 'soft';
  /** How much each box's edges vary, in and out, as detection boxes do: 0 (each fits its slot) to 1. Default 0.5. */
  boxJitter?: number;
  /** The most glyphs of a word one box can cover. Default 3; 1: one glyph each. */
  boxSpan?: number;
  labels?: number;
  labelFormat?: ((cell: LabelCell) => string) | null;
  symbols?: 'all' | Array<GroupName | string>;
  sets?: Record<string, SymbolSet> | null;
  tokens?: boolean;
  symbolMix?: number;
  legible?: number;
  lookalikes?: Record<string, string> | null;
  words?: number;
  wordMap?: Record<string, string> | null;
  /**
   * When the effect runs. 'hover': where the pointer is. 'always': also with a slow wandering point
   * while the pointer is away, and a shortcut for idle: { mode: 'shuffle', every: 0.18, amount: 0.025 }.
   * 'still': no animation.
   */
  motion?: 'hover' | 'always' | 'still';
  /**
   * Motion while the pointer is away. Default false: none, and no timer or frame for it. The pointer
   * takes over at once, and idle motion comes back 1.2 s after it leaves (with rest: 'plain', after
   * the revert). It stops off screen, in a hidden tab, and with reduced motion or motion: 'still'.
   */
  idle?: false | Idle;
  /** 'glyphs': glyphs at rest. 'plain': plain text at rest, glyphs only where the pointer touches. */
  rest?: 'glyphs' | 'plain';
  /** With rest: 'plain', seconds after the pointer leaves before the text goes back to plain. Default 0: at once. */
  revert?: number;
  /**
   * A word that never changes and never moves. A string pins its first match (a whole word if
   * there is one), `true` the first *highlighted* word. Its middle stays at the middle of the
   * element, and its line grows outward from it. Default null: no anchor.
   */
  anchor?: string | boolean | null;
  /** Extra space between letters, in em. Can be negative. Default -0.04. */
  tracking?: number;
  /** The width of a space, in em. Default 0.3 (a monospace space is about 0.6). */
  wordSpacing?: number;
  intro?: boolean;
  speed?: number;
  hoverRadius?: number;
  expand?: boolean;
  base?: string;
  highlight?: string;
  font?: string;
  fonts?: FontSource[];
  fit?: boolean;
  maxSize?: number;
}

/** One effect: a name, a module, or a name or module with settings and a `strength`. */
export type EffectValue =
  | EffectName
  | Effect
  | ({ name: EffectName | string; strength?: number } & Record<string, unknown>);

export interface MathGlyph {
  update(options: Options): void;
  replay(): void;
  reroll(): void;
  destroy(): void;
  /**
   * Wakes the glyphs at a point, as a pointer that touches the text there and leaves: the effect
   * reacts, and with rest: 'plain' the text settles back. x and y: CSS px from the top left of the
   * canvas that mathglyph draws in (the first child of the element). Does nothing with reduced
   * motion or motion: 'still'.
   */
  burst(x: number, y: number): void;
  /**
   * Moves the pointer to a point, as a real pointer would. Real pointer events still apply. Does
   * nothing with reduced motion or motion: 'still'.
   */
  setPointer(x: number, y: number): void;
  /** The pointer leaves the text. */
  clearPointer(): void;
  /** Stops the frame loop until `resume()`. Nothing moves while paused, except by `step()`. */
  pause(): void;
  resume(): void;
  /** While paused: moves time on by `ms`, in frames of at most 1/60 s. For frame-by-frame recording. */
  step(ms: number): void;
  /**
   * 'wake': the frame loop starts. 'settle': it stops, because nothing moves. Gives a function
   * that removes the listener.
   */
  on(event: 'wake' | 'settle', listener: () => void): () => void;
  off(event: 'wake' | 'settle', listener: () => void): void;
}

export function mount(element: HTMLElement, options?: Options): MathGlyph;

/**
 * Adds effects and layouts, so that `effect` and `layout` can name them. The all-in-one script
 * build (mathglyph.all.iife.min.js) registers every one.
 */
export function register(...modules: Array<Effect | Layout>): void;

export const palettes: Record<PaletteName, string[]>;
export const sets: Record<GroupName, { label: string; symbols: string[]; tokens: string[] }>;
export const words: Record<string, string>;
export const lookalike: Record<string, string>;
export const defaults: Required<Omit<Options, 'labelFormat' | 'sets' | 'lookalikes' | 'wordMap'>> & {
  labelFormat: null;
};
