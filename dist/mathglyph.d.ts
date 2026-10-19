export type PaletteName = 'pastel' | 'ember' | 'ice' | 'mono';

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

export interface Options {
  lines?: string[];
  palette?: PaletteName | string[];
  substitute?: number;
  color?: number;
  box?: number;
  boxStyle?: 'detect' | 'soft';
  labels?: number;
  labelFormat?: ((cell: LabelCell) => string) | null;
  symbols?: 'all' | Array<GroupName | string>;
  sets?: Record<string, SymbolSet>;
  tokens?: boolean;
  symbolMix?: number;
  legible?: number;
  lookalikes?: Record<string, string>;
  words?: number;
  wordMap?: Record<string, string>;
  motion?: 'hover' | 'always' | 'still';
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

export interface MathGlyph {
  update(options: Options): void;
  replay(): void;
  reroll(): void;
  destroy(): void;
}

export function mount(element: HTMLElement, options?: Options): MathGlyph;

export const palettes: Record<PaletteName, string[]>;
export const sets: Record<GroupName, { label: string; symbols: string[]; tokens: string[] }>;
export const words: Record<string, string>;
export const lookalike: Record<string, string>;
export const defaults: Required<Omit<Options, 'labelFormat' | 'sets' | 'lookalikes' | 'wordMap'>> & {
  labelFormat: null;
};
