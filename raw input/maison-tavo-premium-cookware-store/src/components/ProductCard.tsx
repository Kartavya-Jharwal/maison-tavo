import { motion } from 'motion/react';
import { ArrowUpRight, Check, Heart, Plus } from 'lucide-react';
import { formatPrice, totalAvailability, type Product } from '../data/catalog';
import { useStore } from '../store/useStore';
import { StarRating } from './ui';

interface ProductCardProps {
  product: Product;
  index?: number;
  onOpen: (product: Product) => void;
  onToast: (message: string) => void;
  compared: boolean;
  onCompare: (productId: string) => void;
}

export function ProductCard({ product, index = 0, onOpen, onToast, compared, onCompare }: ProductCardProps) {
  const wished = useStore((state) => state.wishlist.includes(product.id));
  const toggleWishlist = useStore((state) => state.toggleWishlist);
  const toggleWaitlist = useStore((state) => state.toggleWaitlist);
  const waitlisted = useStore((state) => state.waitlist.includes(product.id));
  const addItem = useStore((state) => state.addItem);

  const preLaunch = product.status === 'pre-launch';
  const available = totalAvailability(product);

  const quickAdd = () => {
    if (preLaunch) {
      toggleWaitlist(product.id);
      onToast(waitlisted ? `${product.name} removed from the waitlist` : `${product.name} — we will write to you at launch`);
      return;
    }
    const size = product.sizes[Math.min(1, product.sizes.length - 1)];
    addItem(product, size.name, product.colors[0].name);
    onToast(`${product.name} added to your bag`);
  };

  return (
    <motion.article
      layout
      className="product-card"
      initial={{ opacity: 0, y: 45 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay: (index % 4) * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="product-image-wrap" onClick={() => onOpen(product)}>
        <div className="product-image-bg" />
        <motion.img src={product.image} alt={`${product.frenchName} — ${product.name}`} loading="lazy" whileHover={{ scale: 1.065, rotate: -1.5 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }} />
        {product.badge && <span className={`product-badge ${preLaunch ? 'badge-prelaunch' : ''}`}>{product.badge}</span>}
        {available <= 6 && available > 0 && !preLaunch && <span className="product-low-flag">Low stock · {available} left</span>}
        <button className={`wishlist-button ${wished ? 'active' : ''}`} aria-label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`} onClick={(event) => { event.stopPropagation(); toggleWishlist(product.id); }}>
          <Heart size={17} fill={wished ? 'currentColor' : 'none'} strokeWidth={1.4} />
        </button>
        <button className="quick-view" onClick={() => onOpen(product)}>View the piece <ArrowUpRight size={15} /></button>
        <button className={`quick-add ${preLaunch ? 'prelaunch' : ''}`} onClick={(event) => { event.stopPropagation(); quickAdd(); }} aria-label={preLaunch ? `Join waitlist for ${product.name}` : `Quick add ${product.name}`}>
          {preLaunch ? <Check size={18} /> : <Plus size={18} />}<span>{preLaunch ? (waitlisted ? 'On waitlist' : 'Waitlist') : 'Quick add'}</span>
        </button>
      </div>
      <div className="product-info">
        <div className="product-title-row">
          <button onClick={() => onOpen(product)}><span>{product.frenchName}</span><h3>{product.name}</h3></button>
          <span className="product-price">{preLaunch ? <small>Indicative </small> : product.sizes.length > 1 ? <small>From </small> : null}{formatPrice(product.price)}</span>
        </div>
        <p>{product.oneLiner}</p>
        <div className="product-bottom-row">
          {preLaunch ? <span className="prelaunch-note">Launching with the Matka Series</span> : <StarRating rating={product.rating} count={product.reviewCount} />}
          <button className={`compare-toggle ${compared ? 'active' : ''}`} onClick={() => onCompare(product.id)} aria-pressed={compared} disabled={preLaunch}>
            <span>{compared && <Check size={10} />}</span> Compare
          </button>
        </div>
      </div>
    </motion.article>
  );
}
