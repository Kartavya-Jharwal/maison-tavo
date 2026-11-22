import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Heart, Menu, Search, ShoppingBag, X, ArrowUpRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Wordmark } from './ui';

interface HeaderProps {
  onCart: () => void;
  onSearch: () => void;
  onFinder: () => void;
  onWishlist: () => void;
}

const links = [
  { label: 'Collection', href: '#collection' },
  { label: 'Our materials', href: '#materials' },
  { label: 'The atelier', href: '#atelier' },
  { label: 'Journal', href: '#journal' },
];

export function Header({ onCart, onSearch, onFinder, onWishlist }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const count = useStore((state) => state.cart.reduce((total, item) => total + item.quantity, 0));
  const wishlistCount = useStore((state) => state.wishlist.length);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 45);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menu ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menu]);

  return (
    <>
      <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="announcement">
          <span>Complimentary shipping on orders over £200</span>
          <button onClick={onFinder}>Find your perfect pan <ArrowUpRight size={11} /></button>
          <span className="announcement-right">30-day returns · Lifetime warranty</span>
        </div>
        <div className="nav-shell page-shell">
          <button className="mobile-menu-button" aria-label="Open menu" onClick={() => setMenu(true)}><Menu size={21} strokeWidth={1.5} /></button>
          <a href="#top" className="nav-logo"><Wordmark /></a>
          <nav className="desktop-nav" aria-label="Primary navigation">
            {links.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}
          </nav>
          <div className="nav-actions">
            <button onClick={onSearch} aria-label="Search products"><Search size={19} strokeWidth={1.45} /><span>Search</span></button>
            <button onClick={onWishlist} aria-label={`Wishlist with ${wishlistCount} items`} className="nav-icon-count"><Heart size={19} strokeWidth={1.45} />{wishlistCount > 0 && <span>{wishlistCount}</span>}</button>
            <button onClick={onCart} aria-label={`Shopping bag with ${count} items`} className="nav-icon-count"><ShoppingBag size={19} strokeWidth={1.45} /><span className="bag-count">{count}</span></button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menu && (
          <motion.div className="mobile-menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="mobile-menu-inner" initial={{ y: '-100%' }} animate={{ y: 0 }} exit={{ y: '-100%' }} transition={{ duration: 0.65, ease: [0.76, 0, 0.24, 1] }}>
              <div className="flex items-center justify-between"><Wordmark light /><button aria-label="Close menu" onClick={() => setMenu(false)}><X /></button></div>
              <nav>
                {links.map((link, index) => (
                  <motion.a key={link.href} href={link.href} onClick={() => setMenu(false)} initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + index * 0.07 }}>
                    <span>0{index + 1}</span>{link.label}<ArrowUpRight />
                  </motion.a>
                ))}
              </nav>
              <button className="mobile-finder" onClick={() => { setMenu(false); onFinder(); }}>Find your perfect pan <ArrowUpRight /></button>
              <button className="mobile-finder mobile-wishlist" onClick={() => { setMenu(false); onWishlist(); }}>Your wishlist ({wishlistCount}) <Heart size={18} /></button>
              <p>Objects of heat, made to last.<br />Paris · France</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
