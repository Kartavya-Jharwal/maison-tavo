import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, Check, Download, LockKeyhole, PackageCheck, X } from 'lucide-react';
import { formatPrice, getProduct } from '../data/catalog';
import { getCartSubtotal, getLinePrice, useStore } from '../store/useStore';
import { Button, Wordmark } from './ui';

interface CheckoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Details = { firstName: string; lastName: string; email: string; address: string; city: string; postal: string; country: string };
type Reservation = { id: string; createdAt: string; total: number; details: Details; delivery: string; note: string; lines: string[] };

const initialDetails: Details = { firstName: '', lastName: '', email: '', address: '', city: '', postal: '', country: 'United States' };

export function Checkout({ open, onOpenChange }: CheckoutProps) {
  const cart = useStore((state) => state.cart);
  const promo = useStore((state) => state.promoCode);
  const clearCart = useStore((state) => state.clearCart);
  const setPromoCode = useStore((state) => state.setPromoCode);
  const [step, setStep] = useState(1);
  const [details, setDetails] = useState<Details>(initialDetails);
  const [errors, setErrors] = useState<Partial<Record<keyof Details, string>>>({});
  const [delivery, setDelivery] = useState<'standard' | 'express'>('standard');
  const [note, setNote] = useState('');
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const subtotal = getCartSubtotal(cart);
  const discount = promo === 'TAVO10' ? subtotal * 0.1 : 0;
  const shipping = delivery === 'express' ? 35 : subtotal >= 200 ? 0 : 15;
  const total = subtotal - discount + shipping;

  useEffect(() => {
    if (open && cart.length > 0 && !reservation) setStep(1);
  }, [open]);

  const update = (field: keyof Details, value: string) => {
    setDetails((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = () => {
    const next: Partial<Record<keyof Details, string>> = {};
    (Object.keys(details) as (keyof Details)[]).forEach((key) => { if (!details[key].trim()) next[key] = 'Required'; });
    if (details.email && !/^\S+@\S+\.\S+$/.test(details.email)) next.email = 'Enter a valid email';
    if (details.postal && details.postal.trim().length < 3) next.postal = 'Check postal code';
    setErrors(next);
    if (Object.keys(next).length === 0) setStep(2);
  };

  const reserve = () => {
    const id = `MT-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    const lines = cart.map((item) => `${getProduct(item.productId)?.name ?? item.productId} — ${item.size} × ${item.quantity} — ${formatPrice(getLinePrice(item) * item.quantity)}`);
    const record = { id, createdAt: new Date().toISOString(), total, details, delivery, note, lines };
    const previous = JSON.parse(localStorage.getItem('maison-tavo-reservations') || '[]') as unknown[];
    localStorage.setItem('maison-tavo-reservations', JSON.stringify([...previous, { ...record, items: cart }]));
    setReservation(record);
    clearCart();
    setPromoCode('');
    setStep(4);
  };

  const download = () => {
    if (!reservation) return;
    const lines = [
      'MAISON TAVO — ORDER RESERVATION', `Reservation: ${reservation.id}`, `Created: ${new Date(reservation.createdAt).toLocaleString()}`, '',
      `Reserved for: ${reservation.details.firstName} ${reservation.details.lastName}`, `Email: ${reservation.details.email}`,
      `${reservation.details.address}, ${reservation.details.city}, ${reservation.details.postal}, ${reservation.details.country}`,
      `Delivery: ${reservation.delivery}`, reservation.note ? `Gift note: ${reservation.note}` : '', '',
      ...reservation.lines,
      '', `Total reserved value: ${formatPrice(reservation.total)} USD`, '',
      'This is a no-charge reservation created by the Maison Tavo storefront preview. No payment was collected.',
    ];
    const url = URL.createObjectURL(new Blob([lines.filter(Boolean).join('\n')], { type: 'text/plain' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${reservation.id}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const close = () => {
    onOpenChange(false);
    if (reservation) {
      setReservation(null);
      setDetails(initialDetails);
      setNote('');
      setStep(1);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(value) => value ? onOpenChange(true) : close()}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild><motion.div className="dialog-overlay checkout-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} /></Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div className="checkout-dialog" initial={{ opacity: 0, y: 35 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 25 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
                <Dialog.Title className="sr-only">Checkout</Dialog.Title>
                <Dialog.Description className="sr-only">Reserve your Maison Tavo order. No payment is collected in this storefront preview.</Dialog.Description>
                <header className="checkout-header"><Wordmark /><div className="checkout-preview-note"><LockKeyhole size={13} /> Preview checkout · No payment collected</div><Dialog.Close onClick={close} aria-label="Close checkout"><X /></Dialog.Close></header>
                {step < 4 && (
                  <div className="checkout-steps">{['Your details', 'Delivery', 'Review'].map((label, index) => <button key={label} className={step === index + 1 ? 'active' : step > index + 1 ? 'complete' : ''} onClick={() => { if (index + 1 < step) setStep(index + 1); }}><span>{step > index + 1 ? <Check size={12} /> : `0${index + 1}`}</span>{label}</button>)}</div>
                )}
                <div className="checkout-body">
                  <div className="checkout-main">
                    <AnimatePresence mode="wait">
                      {step === 1 && (
                        <motion.section key="details" className="checkout-step" initial={{ opacity: 0, x: 25 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                          <span className="checkout-kicker">YOUR DETAILS</span><h2>Where shall we send it?</h2><p>Your details are used only to create this local reservation.</p>
                          <div className="checkout-form-grid">
                            <label>First name<input value={details.firstName} onChange={(e) => update('firstName', e.target.value)} autoComplete="given-name" />{errors.firstName && <em>{errors.firstName}</em>}</label>
                            <label>Last name<input value={details.lastName} onChange={(e) => update('lastName', e.target.value)} autoComplete="family-name" />{errors.lastName && <em>{errors.lastName}</em>}</label>
                            <label className="full">Email address<input type="email" value={details.email} onChange={(e) => update('email', e.target.value)} autoComplete="email" />{errors.email && <em>{errors.email}</em>}</label>
                            <label className="full">Street address<input value={details.address} onChange={(e) => update('address', e.target.value)} autoComplete="street-address" />{errors.address && <em>{errors.address}</em>}</label>
                            <label>City<input value={details.city} onChange={(e) => update('city', e.target.value)} autoComplete="address-level2" />{errors.city && <em>{errors.city}</em>}</label>
                            <label>Postal code<input value={details.postal} onChange={(e) => update('postal', e.target.value)} autoComplete="postal-code" />{errors.postal && <em>{errors.postal}</em>}</label>
                            <label className="full">Country<select value={details.country} onChange={(e) => update('country', e.target.value)}><option>United States</option><option>Canada</option><option>United Kingdom</option><option>France</option><option>Germany</option><option>Australia</option><option>Japan</option></select>{errors.country && <em>{errors.country}</em>}</label>
                          </div>
                          <Button variant="dark" onClick={validate}>Continue to delivery</Button>
                        </motion.section>
                      )}
                      {step === 2 && (
                        <motion.section key="delivery" className="checkout-step" initial={{ opacity: 0, x: 25 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                          <span className="checkout-kicker">DELIVERY</span><h2>Choose your pace.</h2><p>Every piece is inspected and wrapped by hand before dispatch.</p>
                          <div className="delivery-options">
                            <button className={delivery === 'standard' ? 'selected' : ''} onClick={() => setDelivery('standard')}><span className="radio-dot" /><div><strong>Atelier delivery</strong><p>Tracked and insured · 4–7 business days</p></div><b>{subtotal >= 200 ? 'Complimentary' : formatPrice(15)}</b></button>
                            <button className={delivery === 'express' ? 'selected' : ''} onClick={() => setDelivery('express')}><span className="radio-dot" /><div><strong>Express delivery</strong><p>Priority dispatch · 2–3 business days</p></div><b>{formatPrice(35)}</b></button>
                          </div>
                          <label className="gift-note">Gift note <span>Optional · handwritten on our atelier card</span><textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 240))} placeholder="A few words for the recipient…" maxLength={240} /><small>{note.length}/240</small></label>
                          <div className="checkout-nav"><button onClick={() => setStep(1)}><ArrowLeft /> Back</button><Button variant="dark" onClick={() => setStep(3)}>Review reservation</Button></div>
                        </motion.section>
                      )}
                      {step === 3 && (
                        <motion.section key="review" className="checkout-step" initial={{ opacity: 0, x: 25 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                          <span className="checkout-kicker">REVIEW</span><h2>One last look.</h2><p>This preview creates a no-charge reservation on your device. In a Hydrogen deployment, this step connects to Shopify’s secure checkout.</p>
                          <div className="review-block"><div><span>Deliver to</span><button onClick={() => setStep(1)}>Edit</button></div><p><strong>{details.firstName} {details.lastName}</strong><br />{details.address}<br />{details.city}, {details.postal}<br />{details.country}<br />{details.email}</p></div>
                          <div className="review-block"><div><span>Delivery</span><button onClick={() => setStep(2)}>Edit</button></div><p><strong>{delivery === 'express' ? 'Express delivery · 2–3 business days' : 'Atelier delivery · 4–7 business days'}</strong>{note && <><br />Gift note: “{note}”</>}</p></div>
                          <div className="honest-checkout-note"><LockKeyhole size={20} /><p><strong>No payment is taken.</strong> Your reservation and receipt are stored only in this browser. No order is transmitted to a warehouse.</p></div>
                          <div className="checkout-nav"><button onClick={() => setStep(2)}><ArrowLeft /> Back</button><Button variant="copper" onClick={reserve}>Reserve order · {formatPrice(total)}</Button></div>
                        </motion.section>
                      )}
                      {step === 4 && reservation && (
                        <motion.section key="confirmation" className="checkout-confirmation" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
                          <div className="confirmation-icon"><PackageCheck size={35} strokeWidth={1.2} /></div><span>RESERVATION RECORDED</span><h2>Your kitchen awaits.</h2><p>Your no-charge reservation <strong>{reservation.id}</strong> is saved on this device. No payment was collected and nothing has been shipped.</p>
                          <div className="confirmation-detail"><span>Reserved value</span><strong>{formatPrice(reservation.total)}</strong><span>Delivery</span><strong>{reservation.delivery === 'express' ? 'Express · 2–3 days' : 'Atelier · 4–7 days'}</strong></div>
                          <div className="confirmation-actions"><Button variant="dark" onClick={download}><Download size={15} /> Download receipt</Button><Button variant="outline" onClick={close}>Continue exploring</Button></div>
                        </motion.section>
                      )}
                    </AnimatePresence>
                  </div>
                  {step < 4 && (
                    <aside className="checkout-summary"><span>Your selection</span>{cart.map((item) => { const product = getProduct(item.productId); if (!product) return null; return <div className="checkout-summary-line" key={item.key}><div><img src={product.image} alt="" /><b>{item.quantity}</b></div><p><strong>{product.name}</strong><span>{item.size}<br />{item.color}</span></p><em>{formatPrice(getLinePrice(item) * item.quantity)}</em></div>; })}<dl><div><dt>Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>{discount > 0 && <div><dt>TAVO10</dt><dd>−{formatPrice(discount)}</dd></div>}<div><dt>Delivery</dt><dd>{shipping ? formatPrice(shipping) : 'Complimentary'}</dd></div><div><dt>Total · USD</dt><dd>{formatPrice(total)}</dd></div></dl><p>Complimentary returns within 30 days.</p></aside>
                  )}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
