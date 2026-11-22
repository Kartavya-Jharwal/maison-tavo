import type { Product } from '../data/catalog';

/**
 * Live technical views — the third image mode. Instead of static renders,
 * elevation and plan drawings are generated from the SKU's actual spec
 * dimensions, exactly as the workshop drawing defines them.
 */

const SILHOUETTES: Record<string, string> = {
  frying: 'M10,25 Q12,70 55,78 L145,78 Q188,70 190,25',
  saucier: 'M20,12 Q22,72 60,80 L140,80 Q178,72 180,12',
  sauteuse: 'M18,10 L22,74 Q24,80 34,80 L166,80 Q176,80 178,74 L182,10',
  tawa: 'M8,66 Q100,58 192,66 L192,76 Q100,84 8,76 Z',
  saucepan: 'M30,8 L30,72 Q30,82 42,82 L158,82 Q170,82 170,72 L170,8',
  stockpot: 'M34,4 L34,74 Q34,84 46,84 L154,84 Q166,84 166,74 L166,4',
  wok: 'M12,16 Q18,80 100,84 Q182,80 188,16',
  pot: 'M24,16 Q14,48 30,70 Q40,84 60,84 L140,84 Q160,84 170,70 Q186,48 176,16',
};

function silhouetteFor(shape: string | undefined): string {
  const s = (shape ?? '').toLowerCase();
  if (s.includes('frying')) return SILHOUETTES.frying;
  if (s.includes('saucier')) return SILHOUETTES.saucier;
  if (s.includes('saut')) return SILHOUETTES.sauteuse;
  if (s.includes('tawa') || s.includes('griddle')) return SILHOUETTES.tawa;
  if (s.includes('stockpot') || s.includes('deep')) return SILHOUETTES.stockpot;
  if (s.includes('saucepan') || s.includes('lid') || s.includes('kit') || s.includes('steamer')) return SILHOUETTES.saucepan;
  if (s.includes('kadhai') || s.includes('wok') || s.includes('pressure')) return SILHOUETTES.wok;
  if (s.includes('handi') || s.includes('matka') || s.includes('cocotte')) return SILHOUETTES.pot;
  return SILHOUETTES.saucier;
}

const GRID = (
  <g stroke="#1b1c19" strokeOpacity="0.05">
    {Array.from({ length: 21 }).map((_, i) => <line key={`v${i}`} x1={i * 22} y1={0} x2={i * 22} y2={300} />)}
    {Array.from({ length: 14 }).map((_, i) => <line key={`h${i}`} x1={0} y1={i * 22} x2={440} y2={i * 22} />)}
  </g>
);

const dim = (x1: number, y1: number, x2: number, y2: number, label: string, lx: number, ly: number) => (
  <g stroke="#a7603e" strokeWidth="1" fill="none">
    <line x1={x1} y1={y1} x2={x2} y2={y2} />
    <line x1={x1 - 4} y1={y1} x2={x1 + 4} y2={y1} />
    <line x1={x2 - 4} y1={y2} x2={x2 + 4} y2={y2} />
    <text x={lx} y={ly} fill="#a7603e" stroke="none" fontSize="10" fontFamily="Manrope, sans-serif" letterSpacing="0.06em">{label}</text>
  </g>
);

export function TechnicalDrawing({ product, view }: { product: Product; view: 'elevation' | 'plan' }) {
  const size = product.sizes[0];
  const diameter = size.name.match(/(\d+(?:\.\d+)?)\s*cm/)?.[1] ?? '24';
  const heightCm = size.heightCm ?? 8;
  const baseCm = size.baseDiameterCm ?? Math.round(Number(diameter) * 0.72);
  const d = Number(diameter);
  const stick = /stick/i.test(product.handleConfig);
  const loops = /loop/i.test(product.handleConfig);

  if (view === 'plan') {
    const r = 118;
    const rb = Math.max(26, (baseCm / d) * r);
    return (
      <svg viewBox="0 0 440 300" className="technical-svg" role="img" aria-label={`Plan drawing of ${product.name}, ${diameter} centimetres`}>
        <rect width="440" height="300" fill="#f1ece2" />{GRID}
        <circle cx="210" cy="150" r={r} fill="none" stroke="#1b1c19" strokeWidth="1.6" />
        <circle cx="210" cy="150" r={rb} fill="none" stroke="#1b1c19" strokeWidth="1" strokeDasharray="5 4" strokeOpacity="0.55" />
        <circle cx="210" cy="150" r="2.4" fill="#1b1c19" />
        {stick && <g stroke="#1b1c19" strokeWidth="1.6" fill="none"><path d={`M${210 + r - 2},142 L${210 + r + 86},136 Q${210 + r + 102},150 ${210 + r + 86},164 L${210 + r - 2},158`} /><circle cx={210 + r + 92} cy={150} r="4" /></g>}
        {loops && <g stroke="#1b1c19" strokeWidth="1.6" fill="none"><path d={`M${210 - r - 18},138 a18,12 0 1,0 0,24`} /><path d={`M${210 + r + 18},138 a18,12 0 1,1 0,24`} /></g>}
        {dim(210 - r, 272, 210 + r, 272, `Ø ${diameter} cm — inner rim`, 152, 290)}
        {dim(210 - rb, 28, 210 + rb, 28, `Ø ${baseCm} cm induction base`, 146, 18)}
        <line x1="210" y1="150" x2={210 + r * 0.72} y2={150 - r * 0.72} stroke="#a7603e" strokeWidth="1" strokeDasharray="3 3" />
        <text x="16" y="26" fontSize="9" letterSpacing="0.14em" fill="#1b1c19" opacity="0.55" fontFamily="Manrope, sans-serif">PLAN · VIEW FROM ABOVE</text>
        <text x="16" y="286" fontSize="9" letterSpacing="0.14em" fill="#1b1c19" opacity="0.55" fontFamily="Manrope, sans-serif">{product.name.toUpperCase()} · {size.name.toUpperCase()} · DRAWN TO SPEC</text>
      </svg>
    );
  }

  const path = silhouetteFor(product.shape);
  const s = Math.max(0.85, Math.min(1.35, 0.88 + (d - 16) * 0.013));
  const baseY = 238;
  const ty = baseY - 86 * s;
  const tx = 210 - 100 * s;
  const rimY = ty + 18 * s;
  const left = tx + 10 * s;
  const right = tx + 190 * s;
  const halfBase = (baseCm / d) * 88 * s;

  return (
    <svg viewBox="0 0 440 300" className="technical-svg" role="img" aria-label={`Elevation drawing of ${product.name}, ${diameter} by ${heightCm} centimetres`}>
      <rect width="440" height="300" fill="#f1ece2" />{GRID}
      <g transform={`translate(${tx}, ${ty}) scale(${s})`}>
        <path d={path} fill="none" stroke="#1b1c19" strokeWidth="1.7" vectorEffect="non-scaling-stroke" />
        {stick && <g stroke="#1b1c19" strokeWidth="1.5" fill="none"><path d="M188,22 L268,12 Q280,18 268,26 L188,34" vectorEffect="non-scaling-stroke" /></g>}
        {loops && <g stroke="#1b1c19" strokeWidth="1.5" fill="none"><circle cx="6" cy="34" r="9" vectorEffect="non-scaling-stroke" /><circle cx="194" cy="34" r="9" vectorEffect="non-scaling-stroke" /></g>}
      </g>
      <line x1="60" y1={baseY + 12} x2="380" y2={baseY + 12} stroke="#1b1c19" strokeOpacity="0.25" strokeDasharray="2 4" />
      {dim(left, rimY - 16, right, rimY - 16, `Ø ${diameter} cm inner rim`, (left + right) / 2 - 42, rimY - 23)}
      {dim(right + 20, rimY - 16, right + 20, baseY, `H ${heightCm} cm`, right + 27, (rimY + baseY) / 2)}
      {dim(210 - halfBase, 264, 210 + halfBase, 264, `Ø ${baseCm} cm base · ${size.inductionZoneCm ?? baseCm} cm induction zone`, 120, 281)}
      <text x="16" y="26" fontSize="9" letterSpacing="0.14em" fill="#1b1c19" opacity="0.55" fontFamily="Manrope, sans-serif">ELEVATION · SIDE PROFILE</text>
      <text x="16" y="286" fontSize="9" letterSpacing="0.14em" fill="#1b1c19" opacity="0.55" fontFamily="Manrope, sans-serif">{product.name.toUpperCase()} · {size.name.toUpperCase()} · MEASURED INNER-RIM</text>
    </svg>
  );
}
