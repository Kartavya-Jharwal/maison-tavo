import { useEffect, useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Heart, Minus, Plus, ShieldCheck, ShoppingBag, Truck, X } from 'lucide-react';
import { availabilityFor, bundlesContaining, formatPrice, getProduct, isLow, type Product } from '../data/catalog';
import { useStore } from '../store/useStore';
import { TechnicalDrawing } from './TechnicalDrawing';
import { Button, StarRating } from './ui';

interface ProductDialogProps {
  product: Product | null;
  onOpenChange: (open: boolean) => void;
  onAdded: (message: string) => void;
}

type MediaMode = 'studio' | 'kitchen' | 'technical';

export function ProductDialog({ product, onOpenChange, onAdded }: ProductDialogProps) {
  const [sizeIndex, setSizeIndex] = useState(0);
  const [colorIndex, setColorIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState<'details' | 'specs' | 'care'>('details');
  const [engrave, setEngrave] = useState(false);
  const [engraving, setEngraving] = useState('');
  const [mode, setMode] = useState<MediaMode>('studio');
  const [imageIndex, setImageIndex] = useState(0);
  const [techView, setTechView] = useState<'elevation' | 'plan'>('elevation');

  const addItem = useStore((state) => state.addItem);
  const toggleWaitlist = useStore((state) => state.toggleWaitlist);
  const wished = useStore((state) => product ? state.wishlist.includes(product.id) : false);
  const waitlisted = useStore((state) => product ? state.waitlist.includes(product.id) : false);
  const toggleWishlist = useStore((state) => state.toggleWishlist);

  useEffect(() => {
    if (!product) return;
    setSizeIndex(Math.min(1, product.sizes.length - 1));
    setColorIndex(0);
    setQuantity(1);
    setTab('details');
    setEngrave(false);
    setEngraving('');
    setMode('studio');
    setImageIndex(0);
    setTechView('elevation');
  }, [product?.id]);

  const bundles = useMemo(() => (product ? bundlesContaining(product.id) : []), [product]);
  const maintenanceKit = product?.maintenanceKitId ? getProduct(product.maintenanceKitId) : undefined;

  if (!product) {
    return (
      <Dialog.Root open={false} onOpenChange={onOpenChange}>
        <div className="sr-only" />
      </Dialog.Root>
    );
  }

  const preLaunch = product.status === 'pre-launch';
  const size = product.sizes[sizeIndex];
  const available = availabilityFor(product, size.name);
  const low = isLow(product, size.name);

  const mediaImages: string[] = mode === 'studio' ? product.images.studio : mode === 'kitchen' ? product.images.context : [];
  const currentImage = mediaImages[Math.min(imageIndex, mediaImages.length - 1)];

  const compat = [
    { label: 'Induction', ok: product.compatibility.induction },
    { label: 'Gas', ok: product.compatibility.gas },
    { label: 'Electric', ok: product.compatibility.electric },
    { label: product.compatibility.ovenSafeC ? `Oven ${product.compatibility.ovenSafeC}°C` : 'Oven', ok: !!product.compatibility.ovenSafeC },
    { label: 'Dishwasher', ok: product.compatibility.dishwasher },
  ];

  return (
    <Dialog.Root open onOpenChange={onOpenChange}>
      <Dialog.Portal forceMount>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="product-dialog">
          <Dialog.Close className="dialog-close" aria-label="Close product details"><X size={20} /></Dialog.Close>
          <div className="product-dialog-media">
            <span className="vertical-caption">MAISON TAVO · {product.frenchName.toUpperCase()}</span>
            <AnimatePresence mode="wait">
              {mode === 'technical' ? (
                <motion.div key={`tech-${techView}`} className="technical-frame" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                  <TechnicalDrawing product={product} view={techView} />
                </motion.div>
              ) : (
                <motion.img key={`${mode}-${currentImage}`} src={currentImage} alt={product.name} className={mode === 'kitchen' ? 'context-photo' : ''} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} />
              )}
            </AnimatePresence>
            <div className="media-modes" role="tablist" aria-label="Image view">
              {(['studio', 'kitchen', 'technical'] as MediaMode[]).map((m) => (
                <button key={m} role="tab" aria-selected={mode === m} className={mode === m ? 'active' : ''} onClick={() => { setMode(m); setImageIndex(0); }}>
                  {m === 'studio' ? 'Studio' : m === 'kitchen' ? 'In the kitchen' : 'Technical'}
                </button>
              ))}
            </div>
            <div className="media-thumbs">
              {mode === 'technical' ? (
                <>
                  <button className={techView === 'elevation' ? 'active' : ''} onClick={() => setTechView('elevation')}>Elevation</button>
                  <button className={techView === 'plan' ? 'active' : ''} onClick={() => setTechView('plan')}>Plan</button>
                </>
              ) : (
                mediaImages.map((img, i) => <button key={img + i} className={imageIndex === i ? 'active' : ''} onClick={() => setImageIndex(i)} aria-label={`Image ${i + 1}`}><img src={img} alt="" /></button>)
              )}
            </div>
            <span className="media-footnote">HAND-FINISHED · INDIVIDUALLY INSPECTED</span>
          </div>

          <div className="product-dialog-content">
            <div className="product-dialog-heading">
              <div>
                <span className="product-dialog-eyebrow">{product.frenchName} · {product.shape ?? product.material}</span>
                <Dialog.Title>{product.name}</Dialog.Title>
              </div>
              <button className={wished ? 'text-copper' : ''} onClick={() => toggleWishlist(product.id)} aria-label="Toggle wishlist"><Heart fill={wished ? 'currentColor' : 'none'} size={20} strokeWidth={1.4} /></button>
            </div>
            <p className="product-one-liner">“{product.oneLiner}”</p>
            <Dialog.Description className="product-dialog-description">{product.description}</Dialog.Description>
            <div className="product-dialog-rating">
              {preLaunch ? <span className="prelaunch-note">Pre-launch · indicative pricing</span> : <StarRating rating={product.rating} count={product.reviewCount} />}
              <span className={low ? 'low' : ''}>
                {preLaunch ? 'Interest open — no charge' : available === 0 ? 'Between batches' : low ? `Only ${available} left` : 'In stock'}
              </span>
            </div>

            <fieldset className="variant-fieldset">
              <legend><span>Size · measured inner-rim</span><strong>{size.name}</strong></legend>
              <div className={`size-options ${product.sizes.length > 3 ? 'many' : ''}`}>
                {product.sizes.map((s, index) => {
                  const stock = preLaunch ? 0 : availabilityFor(product, s.name);
                  return (
                    <button key={s.name} className={sizeIndex === index ? 'selected' : ''} onClick={() => setSizeIndex(index)} aria-pressed={sizeIndex === index}>
                      <span>{s.name}</span><small>{s.detail}</small><em>{formatPrice(s.price)}</em>
                      {stock > 0 && stock <= 6 && <i className="low-dot" aria-label="Low stock" />}
                      {sizeIndex === index && <Check size={13} />}
                    </button>
                  );
                })}
              </div>
              <div className="size-meta">
                {size.capacityL !== undefined && <span>{size.capacityL} L</span>}
                {size.weightKg !== undefined && <span>{size.weightKg} kg</span>}
                {size.baseDiameterCm !== undefined && <span>Ø {size.baseDiameterCm} cm base</span>}
                {size.inductionZoneCm !== undefined && <span>{size.inductionZoneCm} cm induction zone</span>}
                <span>SKU {size.sku}</span>
              </div>
            </fieldset>

            {product.colors.length > 1 && (
              <fieldset className="variant-fieldset color-fieldset">
                <legend><span>Finish</span><strong>{product.colors[colorIndex].name}</strong></legend>
                <div className="color-options">
                  {product.colors.map((color, index) => <button key={color.name} className={colorIndex === index ? 'selected' : ''} onClick={() => setColorIndex(index)} aria-label={color.name} aria-pressed={colorIndex === index}><span style={{ background: color.hex }} />{colorIndex === index && <Check size={12} />}</button>)}
                </div>
              </fieldset>
            )}

            <div className="compat-grid">
              <span className="compat-title">Works with</span>
              <div className="compat-items">
                {compat.map((c) => <span key={c.label} className={c.ok ? 'ok' : 'no'}><Check size={11} />{c.label}</span>)}
                {product.fitsLids.map((lid) => <span key={lid} className="chip">Fits {lid}</span>)}
                {product.kansaSafe && <span className="chip">Kansa-safe</span>}
              </div>
              {maintenanceKit && <p className="compat-kit">Maintained by <span className="kit-link">{maintenanceKit.name} · {formatPrice(maintenanceKit.price)}</span> — find it under Accessories</p>}
            </div>

            {!preLaunch && (
              <div className="engraving-row">
                <label><input type="checkbox" checked={engrave} onChange={(event) => setEngrave(event.target.checked)} /><span className="custom-checkbox">{engrave && <Check size={12} />}</span><span>Add hand engraving <small>+ £35</small></span></label>
                <AnimatePresence>{engrave && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}><input value={engraving} onChange={(event) => setEngraving(event.target.value.slice(0, 12).replace(/[^a-zA-Z0-9 .&-]/g, ''))} placeholder="Up to 12 characters" aria-label="Engraving text" maxLength={12} /><span>{engraving.length}/12</span></motion.div>}</AnimatePresence>
              </div>
            )}

            <div className="purchase-row">
              {!preLaunch && <div className="quantity-control"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity"><Minus size={14} /></button><span>{quantity}</span><button onClick={() => setQuantity(Math.min(Math.max(1, available), quantity + 1))} aria-label="Increase quantity"><Plus size={14} /></button></div>}
              {preLaunch ? (
                <Button variant={waitlisted ? 'outline' : 'dark'} full onClick={() => { toggleWaitlist(product.id); onAdded(waitlisted ? 'Removed from the waitlist' : `Waitlist joined for ${product.name}`); }}>
                  {waitlisted ? <><Check size={15} /> On the waitlist</> : 'Join the launch waitlist'}
                </Button>
              ) : (
                <Button variant="dark" full disabled={available === 0 || (engrave && !engraving.trim())} onClick={() => {
                  addItem(product, size.name, product.colors[colorIndex].name, quantity, engrave ? engraving.trim() : '');
                  onAdded(`${quantity} × ${product.name} (${size.name}) added to your bag`);
                  onOpenChange(false);
                }}><ShoppingBag size={16} /> {available === 0 ? 'Between batches' : <>Add to bag · {formatPrice((size.price + (engrave ? 35 : 0)) * quantity)}</>}</Button>
              )}
            </div>
            <div className="purchase-notes"><span><Truck size={15} />{preLaunch ? 'Ships at launch — no charge today' : 'Ships in 1–2 business days'}</span><span><ShieldCheck size={15} />Lifetime structural warranty</span></div>

            {bundles.length > 0 && (
              <div className="bundle-inclusion">
                <span>Included in</span>
                {bundles.slice(0, 3).map((bundle) => <span key={bundle.id} className="chip">{bundle.name} · save {formatPrice(bundle.value - bundle.price)}</span>)}
              </div>
            )}

            <div className="product-tabs">
              <div role="tablist">{(['details', 'specs', 'care'] as const).map((item) => <button key={item} role="tab" aria-selected={tab === item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item === 'specs' ? 'Specifications' : item === 'care' ? 'Care & use' : 'Details'}</button>)}</div>
              <AnimatePresence mode="wait">
                <motion.div key={tab} className="product-tab-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }}>
                  {tab === 'details' && <ul>{product.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>}
                  {tab === 'specs' && <dl>{product.specs.map((spec) => <div key={spec.label}><dt>{spec.label}</dt><dd>{spec.value}</dd></div>)}<div><dt>Handles</dt><dd>{product.handleConfig}</dd></div><div><dt>Shopify category</dt><dd>{product.shopifyCategory.path.split(' > ').slice(-1)[0]}</dd></div></dl>}
                  {tab === 'care' && (
                    <div className="care-panel">
                      <p>{product.care}</p>
                      <span className="care-sub">Use cases</span>
                      <div className="chips-row">{product.useCases.map((u) => <span key={u}>{u}</span>)}</div>
                      {product.recipes.length > 0 && <>
                        <span className="care-sub">From the journal</span>
                        {product.recipes.map((recipe) => <div key={recipe.name} className="recipe-line"><strong>{recipe.name}</strong><p>{recipe.note}</p></div>)}
                      </>}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
