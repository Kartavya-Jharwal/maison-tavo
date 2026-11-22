import { useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, Search, X } from 'lucide-react';
import { formatPrice, products, type Product } from '../data/catalog';

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProduct: (product: Product) => void;
}

export function SearchDialog({ open, onOpenChange, onProduct }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return products.slice(0, 4);
    return products.filter((product) => [product.name, product.frenchName, product.material, product.category, product.description, product.induction ? 'induction compatible' : 'induction adapter', ...product.bestFor, ...product.details, ...product.specs.flatMap((spec) => [spec.label, spec.value])].join(' ').toLowerCase().includes(term));
  }, [query]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild><motion.div className="dialog-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} /></Dialog.Overlay>
            <Dialog.Content asChild onOpenAutoFocus={(event) => event.preventDefault()}>
              <motion.div className="search-dialog" initial={{ opacity: 0, y: -30, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.98 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
                <Dialog.Title className="sr-only">Search Maison Tavo</Dialog.Title>
                <Dialog.Description className="sr-only">Search by product, material, or cooking technique.</Dialog.Description>
                <div className="search-input-row">
                  <Search size={25} strokeWidth={1.3} />
                  <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="What are you looking for?" aria-label="Search products" />
                  <Dialog.Close aria-label="Close search"><X size={21} /></Dialog.Close>
                </div>
                <div className="search-meta"><span>{query ? `${results.length} result${results.length === 1 ? '' : 's'}` : 'The essentials'}</span><span>ESC TO CLOSE</span></div>
                <div className="search-results">
                  {results.map((product, index) => (
                    <motion.button
                      key={product.id}
                      className="search-result"
                      onClick={() => { onOpenChange(false); onProduct(product); }}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.045 }}
                    >
                      <img src={product.image} alt="" />
                      <span className="search-result-copy"><small>{product.frenchName}</small><strong>{product.name}</strong><em>{product.material}</em></span>
                      <span className="search-result-price">{formatPrice(product.price)}<ArrowUpRight size={16} /></span>
                    </motion.button>
                  ))}
                  {results.length === 0 && (
                    <div className="search-empty"><span>No pieces found for “{query}”.</span><p>Try “copper”, “braising”, or “induction”.</p><button onClick={() => setQuery('')}>View the essentials</button></div>
                  )}
                </div>
                <div className="search-suggestions"><span>Popular:</span>{['Copper', 'Induction', 'Sauces', 'Gifting'].map((term) => <button key={term} onClick={() => setQuery(term)}>{term}</button>)}</div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
