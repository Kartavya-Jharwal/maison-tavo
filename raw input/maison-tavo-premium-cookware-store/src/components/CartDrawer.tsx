import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Check, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { formatPrice, getProduct, products, type Product } from '../data/catalog';
import { getCartSubtotal, getLinePrice, useStore } from '../store/useStore';
import { Button, Wordmark } from './ui';

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCheckout: () => void;
  onProduct: (product: Product) => void;
}

export function CartDrawer({ open, onOpenChange, onCheckout, onProduct }: CartDrawerProps) {
  const cart = useStore((state) => state.cart);
  const updateQuantity = useStore((state) => state.updateQuantity);
  const removeItem = useStore((state) => state.removeItem);
  const [promoInput, setPromoInput] = useState('');
  const [promoMessage, setPromoMessage] = useState('');
  const promo = useStore((state) => state.promoCode);
  const setPromoCode = useStore((state) => state.setPromoCode);
  const subtotal = getCartSubtotal(cart);
  const discount = promo === 'TAVO10' ? subtotal * 0.1 : 0;
  const shipping = subtotal >= 200 || subtotal === 0 ? 0 : 15;
  const total = subtotal - discount + shipping;
  const freeShippingRemaining = Math.max(0, 200 - subtotal);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild><motion.div className="dialog-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} /></Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div className="cart-drawer" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 32, stiffness: 310 }}>
                <div className="cart-header"><div><Dialog.Title>Your selection</Dialog.Title><Dialog.Description>{cart.reduce((sum, item) => sum + item.quantity, 0)} {cart.length === 1 ? 'piece' : 'pieces'} · Saved in this browser</Dialog.Description></div><Dialog.Close aria-label="Close bag"><X size={21} /></Dialog.Close></div>

                {cart.length === 0 ? (
                  <div className="empty-cart">
                    <div><ShoppingBag size={34} strokeWidth={1} /></div>
                    <h2>Your bag is beautifully empty.</h2>
                    <p>Begin with one pan. It may be all your kitchen needs.</p>
                    <Button variant="dark" onClick={() => { onOpenChange(false); document.querySelector('#collection')?.scrollIntoView({ behavior: 'smooth' }); }}>See the collection</Button>
                    <div className="empty-cart-suggestion"><img src={products[0].image} alt="" /><span>Not sure where to begin?<small>The Frying Pan is our signature.</small></span><button onClick={() => { onOpenChange(false); onProduct(products[0]); }}><ArrowRight /></button></div>
                  </div>
                ) : (
                  <>
                    <div className="shipping-progress">
                      <p>{freeShippingRemaining > 0 ? <>You’re <strong>{formatPrice(freeShippingRemaining)}</strong> from complimentary shipping.</> : <><Check size={14} /> Complimentary shipping is yours.</>}</p>
                      <div><motion.span animate={{ width: `${Math.min(100, subtotal / 250 * 100)}%` }} /></div>
                    </div>
                    <div className="cart-lines">
                      <AnimatePresence initial={false}>
                        {cart.map((item) => {
                          const product = getProduct(item.productId);
                          if (!product) return null;
                          return (
                            <motion.article layout key={item.key} className="cart-line" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50, height: 0, marginBottom: 0 }}>
                              <button className="cart-line-image" onClick={() => { onOpenChange(false); onProduct(product); }}><img src={product.image} alt={product.name} /></button>
                              <div className="cart-line-info">
                                <div><span>{product.frenchName}</span><h3>{product.name}</h3><p>{item.size} · {item.color}</p>{item.engraving && <p>Engraving: “{item.engraving}”</p>}</div>
                                <div className="cart-line-bottom"><div className="quantity-control small"><button onClick={() => updateQuantity(item.key, item.quantity - 1)} aria-label="Decrease quantity"><Minus size={12} /></button><span>{item.quantity}</span><button onClick={() => updateQuantity(item.key, item.quantity + 1)} aria-label="Increase quantity"><Plus size={12} /></button></div><strong>{formatPrice(getLinePrice(item) * item.quantity)}</strong></div>
                              </div>
                              <button className="remove-line" onClick={() => removeItem(item.key)} aria-label={`Remove ${product.name}`}><Trash2 size={14} /></button>
                            </motion.article>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                    <div className="cart-footer">
                      <div className="promo-row"><input value={promoInput} onChange={(event) => setPromoInput(event.target.value)} placeholder="Atelier code" aria-label="Promotion code" /><button onClick={() => {
                        const code = promoInput.trim().toUpperCase();
                        if (code === 'TAVO10') { setPromoCode(code); setPromoMessage('10% atelier privilege applied.'); }
                        else { setPromoCode(''); setPromoMessage(code ? 'This code is not recognised.' : 'Enter a code first.'); }
                      }}>Apply</button></div>
                      {promoMessage && <p className={promo ? 'promo-success' : 'promo-error'}>{promoMessage}</p>}
                      <dl className="cart-totals"><div><dt>Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>{discount > 0 && <div className="discount"><dt>Atelier privilege</dt><dd>−{formatPrice(discount)}</dd></div>}<div><dt>Shipping</dt><dd>{shipping === 0 ? 'Complimentary' : formatPrice(shipping)}</dd></div><div className="cart-total"><dt>Total <small>USD</small></dt><dd>{formatPrice(total)}</dd></div></dl>
                      <Button full variant="copper" onClick={onCheckout}>Continue to checkout</Button>
                      <p className="cart-fineprint">30-day returns · Secure order reservation · No payment collected in this preview</p>
                    </div>
                  </>
                )}
                <div className="cart-brand"><Wordmark /></div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
