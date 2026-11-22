import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, Check, X } from 'lucide-react';
import { formatPrice, getProduct, type Product } from '../data/catalog';
import { Button } from './ui';

interface CompareProps {
  ids: string[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onProduct: (product: Product) => void;
}

export function Compare({ ids, onRemove, onClear, onProduct }: CompareProps) {
  const selected = ids.map(getProduct).filter((product): product is Product => !!product);
  const rows: { label: string; value: (product: Product) => string }[] = [
    { label: 'Material', value: (p) => p.material },
    { label: 'Starting price', value: (p) => formatPrice(p.price) },
    { label: 'Available sizes', value: (p) => p.sizes.map((size) => size.name).join(' · ') },
    { label: 'Induction', value: (p) => p.induction ? 'Native compatibility' : 'Adapter required' },
    { label: 'Best for', value: (p) => p.bestFor.join(' · ') },
    { label: 'Weight', value: (p) => p.specs.find((spec) => spec.label === 'Weight')?.value ?? 'See specifications' },
    { label: 'Oven safe', value: (p) => p.specs.find((spec) => spec.label === 'Oven safe')?.value ?? 'See specifications' },
    { label: 'In this batch', value: (p) => `${p.stock} pieces` },
  ];

  return (
    <>
      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div className="compare-tray" initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} transition={{ type: 'spring', damping: 26 }}>
            <div className="compare-thumbs">{selected.map((product) => <button key={product.id} onClick={() => onRemove(product.id)} aria-label={`Remove ${product.name} from comparison`}><img src={product.image} alt="" /><X size={11} /></button>)}{Array.from({ length: 3 - selected.length }).map((_, index) => <span key={index}>+</span>)}</div>
            <span>Compare <small>{selected.length}/3 pieces</small></span>
            <Dialog.Root>
              <Dialog.Trigger asChild><Button variant="copper" disabled={selected.length < 2}>Compare now <ArrowUpRight size={15} /></Button></Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="dialog-overlay" />
                <Dialog.Content className="compare-dialog">
                  <div className="compare-header"><div><span>SIDE BY SIDE</span><Dialog.Title>Find your difference.</Dialog.Title><Dialog.Description>A material-led comparison of your selected pieces.</Dialog.Description></div><Dialog.Close aria-label="Close comparison"><X /></Dialog.Close></div>
                  <div className="compare-table-wrap"><table><thead><tr><th>THE DETAILS</th>{selected.map((product) => <th key={product.id}><button className="compare-table-remove" onClick={() => onRemove(product.id)}><X size={13} /></button><img src={product.image} alt={product.name} /><span>{product.frenchName}</span><strong>{product.name}</strong></th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.label}><th>{row.label}</th>{selected.map((product) => <td key={product.id}>{row.label === 'Induction' && product.induction && <Check size={13} />}{row.value(product)}</td>)}</tr>)}<tr><th /><>{selected.map((product) => <td key={product.id}><Dialog.Close asChild><Button variant="outline" onClick={() => onProduct(product)}>View piece <ArrowUpRight size={14} /></Button></Dialog.Close></td>)}</></tr></tbody></table></div>
                  <button className="compare-clear" onClick={onClear}>Clear comparison</button>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
            <button className="compare-tray-clear" onClick={onClear} aria-label="Clear comparison"><X size={17} /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
