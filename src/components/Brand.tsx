/** Where the enumerated structures land, in the 32×32 box. */
const BRANCH_ENDS = [
  { x: 25, y: 8.5 },
  { x: 25, y: 16 },
  { x: 25, y: 23.5 },
] as const;

export interface BrandMarkProps {
  /**
   * Edge of the square the mark is drawn in, in pixels.
   * @default 26
   */
  size?: number;
}

/**
 * The mark: one formula opening into the structures it can be written as,
 * which is the whole of what the tool does. The enumerated ends carry the
 * second brand colour, so the mark says "one in, many out" rather than reading
 * as a bare fork at 16 px.
 *
 * Kept in step with `public/favicon.svg`, which is the same geometry written
 * out with literal colours because a file served on its own cannot read the
 * page's custom properties.
 * @param props - The mark size.
 * @param props.size - Edge of the square the mark is drawn in, in pixels.
 * @returns The mark, as an inline SVG.
 */
export function BrandMark(props: BrandMarkProps) {
  const { size = 26 } = props;

  return (
    <svg
      className="brand-mark"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="32" height="32" rx="6" fill="var(--brand)" />
      <g
        fill="none"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7 16h6" />
        <path d="M13 16 25 8.5M13 16h12M13 16 25 23.5" />
      </g>
      {BRANCH_ENDS.map((end) => (
        <circle
          key={`${end.x},${end.y}`}
          cx={end.x}
          cy={end.y}
          r="3"
          fill="var(--brand-alt)"
        />
      ))}
    </svg>
  );
}

export interface WordmarkProps {
  /**
   * Extra class names, for sizing or spacing at the place it is used.
   * @default undefined
   */
  className?: string;
}

/**
 * The name, in the two colours this site owns — the way chemcalc.org writes
 * `ChemCalc`. Always lowercase, and always the whole address minus the `.org`,
 * because the address is the name here.
 *
 * The mark's rose reaches about 4.1:1 on white, just under what text needs, so
 * the second half is set in a darkened one of the same hue.
 * @param props - The wordmark options.
 * @param props.className - Extra class names, for sizing or spacing.
 * @returns The site name, in its two colours.
 */
export function Wordmark(props: WordmarkProps) {
  const { className } = props;

  return (
    <span className={className ? `wordmark ${className}` : 'wordmark'}>
      <span className="wordmark__lead">surge</span>
      <span className="wordmark__dot">.</span>
      <span className="wordmark__alt">cheminfo</span>
    </span>
  );
}
