import { motion } from 'motion/react';
import { ArrowUpRight, Check } from 'lucide-react';
import { bundles, formatPrice, getProduct } from '../data/catalog';
import { useStore } from '../store/useStore';
import { Button, SectionLabel } from './ui';

export function Bundles({ onToast }: { onToast: (message: string) => void }) {
  const addItem = useStore((state) => state.addItem);

  const addBundle = (bundleId: string) => {
    const bundle = bundles.find((b) => b.id === bundleId);
    if (!bundle) return;
    bundle.contents.forEach((item) => {
      const product = getProduct(item.productId);
      if (product) addItem(product, item.size, product.colors[0].name);
    });
    onToast(`${bundle.name} added — ${bundle.contents.length} pieces, lids included`);
  };

  return (
    <section id="bundles" className="bundles-section">
      <div className="page-shell">
        <div className="bundles-heading" data-reveal>
          <div><SectionLabel>Set architecture</SectionLabel><h2>Bundles that<br /><em>think ahead.</em></h2></div>
          <p>Organised by household size and cooking style, so the box arrives with the lids already chosen. Lids are free inside every set.</p>
        </div>
        <div className="bundles-grid" data-reveal-group>
          {bundles.map((bundle) => {
            const hero = bundle.id === 'bundle-everyday';
            const master = bundle.id === 'bundle-master';
            return (
              <motion.article key={bundle.id} whileHover={{ y: -5 }} className={`bundle-card ${hero ? 'bundle-hero' : ''} ${master ? 'bundle-master' : ''}`}>
                <div className="bundle-top"><span className="bundle-tier">{bundle.tier}</span>{bundle.badge && <span className="bundle-flag">{bundle.badge}</span>}</div>
                <h3>{bundle.name}</h3>
                <p className="bundle-positioning">{bundle.positioning}</p>
                <ul className="bundle-contents">
                  {master ? (
                    <li>Every core silhouette in medium & large<span>14 vessels</span></li>
                  ) : bundle.contents.map((item) => {
                    const product = getProduct(item.productId);
                    return <li key={item.productId + item.size}>{product?.name}<span>{item.size}</span></li>;
                  })}
                </ul>
                <div className="bundle-lids"><Check size={12} />Lids included free: {bundle.includedLids.join(' · ')}</div>
                <div className="bundle-price-row">
                  <div><s>{formatPrice(bundle.value)}</s><strong>{formatPrice(bundle.price)}</strong></div>
                  <span className="bundle-save">Save {formatPrice(bundle.value - bundle.price)}</span>
                </div>
                <Button variant={hero ? 'copper' : 'dark'} full onClick={() => addBundle(bundle.id)}>Add the full set <ArrowUpRight size={15} /></Button>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
