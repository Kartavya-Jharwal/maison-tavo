import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ShoppingBag, X } from 'lucide-react';
import { type Product } from './data/catalog';
import { useStore } from './store/useStore';
import { RoundRoom } from './components/Gallery3D';
import { ProductDialog } from './components/ProductDialog';
import { CartDrawer } from './components/CartDrawer';
import { Checkout } from './components/Checkout';
import { Wordmark } from './components/ui';

export { RoundRoom };

export default function App() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [toast, setToast] = useState('');
  const cartCount = useStore((state) => state.cart.reduce((sum, item) => sum + item.quantity, 0));

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <div className="round-room-shell">
      <div className="round-room-topbar">
        <div className="page-shell round-room-topbar-inner">
          <Wordmark light />
          <span className="round-room-module-tag">HYDROGEN DROP-IN MODULE · &lt;RoundRoom /&gt;</span>
          <button className="round-room-bag-btn" onClick={() => setCartOpen(true)} aria-label={`Open bag with ${cartCount} items`}>
            <ShoppingBag size={16} />
            <span>Bag ({cartCount})</span>
          </button>
        </div>
      </div>

      <main>
        <RoundRoom
          initialSeries="forge"
          onProduct={setSelectedProduct}
          onToast={setToast}
        />
      </main>

      <ProductDialog product={selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)} onAdded={setToast} />
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} onProduct={setSelectedProduct} onCheckout={() => { setCartOpen(false); setTimeout(() => setCheckoutOpen(true), 180); }} />
      <Checkout open={checkoutOpen} onOpenChange={setCheckoutOpen} />

      <AnimatePresence>
        {toast && (
          <motion.div className="toast" role="status" initial={{ opacity: 0, y: 25, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 15, scale: 0.97 }}>
            <span className="toast-check"><Check size={14} /></span>
            <p>{toast}</p>
            <button onClick={() => { setToast(''); setCartOpen(true); }}><ShoppingBag size={15} /> View bag</button>
            <button className="toast-close" onClick={() => setToast('')} aria-label="Dismiss notification"><X size={14} /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
