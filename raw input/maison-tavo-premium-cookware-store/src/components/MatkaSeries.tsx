import { motion } from 'motion/react';
import { ArrowUpRight, Check, Flame, Zap } from 'lucide-react';
import { matkaAnatomy } from '../data/matka';
import { productsInSeries } from '../data/catalog';
import { useStore } from '../store/useStore';
import { Button, SectionLabel } from './ui';

function Cutaway() {
  return (
    <svg viewBox="0 0 400 420" className="matka-cutaway" role="img" aria-label="Cross-section of a Matka Series vessel: clay body, embedded mesh, magnetic puck and Kansa base plate">
      {/* clay body */}
      <path d="M90,80 Q60,170 80,270 Q95,340 200,345 Q305,340 320,270 Q340,170 310,80 Q260,55 200,55 Q140,55 90,80 Z" fill="#a9704f" />
      <path d="M104,88 Q76,172 94,266 Q108,328 200,333 Q292,328 306,266 Q324,172 296,88 Q252,67 200,67 Q148,67 104,88 Z" fill="#b07a58" />
      {/* mesh cage */}
      <g stroke="#5a4636" strokeWidth="1.6" fill="none" opacity="0.8">
        {Array.from({ length: 7 }).map((_, i) => <path key={`h${i}`} d={`M${95 + i * 4},${110 + i * 32} Q200,${122 + i * 32} ${305 - i * 4},${110 + i * 32}`} />)}
        {Array.from({ length: 9 }).map((_, i) => <path key={`v${i}`} d={`M${112 + i * 22},75 Q${104 + i * 24},200 ${118 + i * 20},338`} />)}
      </g>
      {/* magnetic puck */}
      <ellipse cx="200" cy="322" rx="72" ry="14" fill="#3c372f" />
      <ellipse cx="200" cy="318" rx="72" ry="14" fill="#55503f" />
      {/* kansa base plate */}
      <path d="M118,340 Q200,352 282,340 L292,360 Q200,378 108,360 Z" fill="#c98d5e" />
      <g stroke="#8d5c3e" strokeWidth="1.3" opacity="0.7">
        {Array.from({ length: 6 }).map((_, i) => <path key={`k${i}`} d={`M${120 + i * 28},344 q10,8 24,10`} fill="none" />)}
      </g>
      {/* leaders */}
      <g stroke="#f3efe7" strokeWidth="1" opacity="0.75">
        <line x1="96" y1="150" x2="26" y2="120" /><line x1="106" y1="240" x2="26" y2="232" />
        <line x1="150" y1="320" x2="26" y2="318" /><line x1="140" y1="356" x2="26" y2="386" />
      </g>
      <g fill="#f3efe7" fontFamily="Manrope, sans-serif" fontSize="9" letterSpacing="0.08em">
        <text x="26" y="110">UNGLAZED CLAY BODY</text>
        <text x="26" y="222">3D WIRE MESH CAGE</text>
        <text x="26" y="308">MAGNETIC PUCK · 430 STEEL</text>
        <text x="26" y="402">HAND-HAMMERED KANSA · 80:20</text>
      </g>
      <text x="322" y="60" fill="#d8a17a" fontSize="10" fontFamily="Manrope, sans-serif" letterSpacing="0.14em">SECTION A–A</text>
    </svg>
  );
}

export function MatkaSeries({ onBrowseCatalog, onToast }: { onBrowseCatalog: () => void; onToast: (message: string) => void }) {
  const lineup = productsInSeries('matka');
  const toggleWaitlist = useStore((state) => state.toggleWaitlist);
  const waitlist = useStore((state) => state.waitlist);

  return (
    <section id="matka-series" className="matka-section">
      <div className="page-shell matka-grid">
        <div className="matka-copy">
          <SectionLabel light>The Matka Series</SectionLabel>
          <h2>Clay,<br /><em>re-engineered.</em></h2>
          <p className="matka-lead">Modern kitchens moved to induction and stranded one of humanity’s oldest cooking technologies: porous, unglazed terracotta. The Matka Series brings it back, engineered from the base up.</p>
          <div className="matka-anatomy">
            {matkaAnatomy.map((layer, index) => (
              <motion.div key={layer.layer} initial={{ opacity: 0, x: -25 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
                <span className={`anatomy-swatch swatch-${index}`} />
                <div><strong>{layer.layer}</strong><p>{layer.note}</p></div>
              </motion.div>
            ))}
          </div>
          <div className="matka-ip">
            <div><Flame size={18} strokeWidth={1.3} /><div><strong>Floating interlock, patent-pending</strong><p>Curved non-rigid mesh anchors allow 0.2 mm of lateral micro-flexion, decoupling the thermal expansion of metal and clay.</p></div></div>
            <div><Zap size={18} strokeWidth={1.3} /><div><strong>Vacuum slurry pressing</strong><p>Inert-atmosphere firing encapsulates the mesh in clay with zero voids at 1,000°C and above.</p></div></div>
          </div>
          <div className="matka-actions"><Button variant="copper" onClick={onBrowseCatalog}>Browse the seven-piece lineup <ArrowUpRight size={15} /></Button><span>Pre-launch · interest open, no charge</span></div>
        </div>
        <div className="matka-visual">
          <Cutaway />
          <span className="matka-positioning-note">POSITIONED BETWEEN HERITAGE FLAME COOKING AND INDUSTRIAL IH DONABE — NEITHER, BY DESIGN</span>
        </div>
      </div>
      <div className="page-shell matka-lineup">
        {lineup.map((product, index) => {
          const joined = waitlist.includes(product.id);
          return (
            <motion.div key={product.id} className="matka-sku" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.06 }}>
              <div className="matka-sku-image"><img src={product.image} alt={product.name} loading="lazy" /><span>{product.shape}</span></div>
              <strong>{product.name}</strong>
              <p>{product.oneLiner}</p>
              <div className="matka-sku-foot">
                <em>from {product.price ? `£${product.price}` : 'TBC'}</em>
                <button className={joined ? 'joined' : ''} onClick={() => { toggleWaitlist(product.id); onToast(joined ? `${product.name} — interest removed` : `${product.name} — we will write at launch`); }}>
                  {joined ? <><Check size={12} /> Joined</> : 'Join interest'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
