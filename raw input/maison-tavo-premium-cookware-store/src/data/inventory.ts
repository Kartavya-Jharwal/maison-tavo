/**
 * INVENTORY LEDGER — push target for the inventory agent.
 *
 * A separate process (warehouse sync / inventory sub-agent) overwrites this
 * module or POSTs equivalent JSON, which is written here at build/deploy time.
 * The storefront never invents stock figures: `getStock(sku)` is the single
 * source of truth for every size picker, quick-add guard and low-stock flag.
 *
 * SKU prefixes: FG- five-ply steel · FG-CU- copper · FG-CI- cast iron · MK- Matka.
 */

export interface LedgerEntry {
  stock: number;
  reserved: number;
  location: string;
}

export const INVENTORY_LEDGER: Record<string, LedgerEntry> = {
  /* Forge Series — five-ply steel vessels */
  'FG-FP-20': { stock: 22, reserved: 2, location: 'LON-A1' },
  'FG-FP-24': { stock: 34, reserved: 5, location: 'LON-A1' },
  'FG-FP-28': { stock: 18, reserved: 3, location: 'LON-A1' },
  'FG-SC-20': { stock: 16, reserved: 1, location: 'LON-A2' },
  'FG-SC-24': { stock: 21, reserved: 2, location: 'LON-A2' },
  'FG-SC-26': { stock: 9, reserved: 1, location: 'LON-A2' },
  'FG-ST-24': { stock: 19, reserved: 2, location: 'LON-A3' },
  'FG-ST-28': { stock: 12, reserved: 3, location: 'LON-A3' },
  'FG-TW-26': { stock: 25, reserved: 1, location: 'LON-B1' },
  'FG-TW-30': { stock: 14, reserved: 2, location: 'LON-B1' },
  'FG-SP-16': { stock: 27, reserved: 2, location: 'LON-B2' },
  'FG-SP-20': { stock: 23, reserved: 4, location: 'LON-B2' },
  'FG-SK-20': { stock: 11, reserved: 1, location: 'LON-B3' },
  'FG-SK-24': { stock: 8, reserved: 2, location: 'LON-B3' },
  'FG-SK-28': { stock: 5, reserved: 1, location: 'LON-B3' },
  'FG-KD-24': { stock: 17, reserved: 2, location: 'LON-C1' },
  'FG-KD-28': { stock: 13, reserved: 3, location: 'LON-C1' },
  'FG-KD-32': { stock: 4, reserved: 1, location: 'LON-C1' },
  /* Forge Series — copper line (made in small numbered batches, Paris) */
  'FG-CU-FP-20': { stock: 7, reserved: 0, location: 'PAR-A1' },
  'FG-CU-FP-24': { stock: 9, reserved: 1, location: 'PAR-A1' },
  'FG-CU-FP-28': { stock: 6, reserved: 0, location: 'PAR-A1' },
  'FG-CU-SP-16': { stock: 6, reserved: 1, location: 'PAR-A2' },
  'FG-CU-SP-20': { stock: 5, reserved: 0, location: 'PAR-A2' },
  'FG-CU-RD-24': { stock: 3, reserved: 0, location: 'PAR-B1' },
  'FG-CU-RD-28': { stock: 2, reserved: 0, location: 'PAR-B1' },
  'FG-CU-SK-20': { stock: 3, reserved: 0, location: 'PAR-B2' },
  'FG-CU-SK-24': { stock: 2, reserved: 0, location: 'PAR-B2' },
  'FG-CU-SK-28': { stock: 1, reserved: 0, location: 'PAR-B2' },
  /* Forge Series — cast-iron line */
  'FG-CI-CC-20': { stock: 5, reserved: 0, location: 'PAR-C1' },
  'FG-CI-CC-24': { stock: 7, reserved: 1, location: 'PAR-C1' },
  'FG-CI-CC-28': { stock: 4, reserved: 0, location: 'PAR-C1' },
  'FG-CI-GR-26': { stock: 8, reserved: 0, location: 'PAR-C2' },
  'FG-CI-GR-30': { stock: 5, reserved: 0, location: 'PAR-C2' },
  /* Forge Series — accessories */
  'FG-LD-20': { stock: 48, reserved: 6, location: 'LON-D1' },
  'FG-LD-24': { stock: 42, reserved: 5, location: 'LON-D1' },
  'FG-LD-28': { stock: 36, reserved: 4, location: 'LON-D1' },
  'FG-STM-24': { stock: 15, reserved: 1, location: 'LON-D2' },
  'FG-STM-28': { stock: 12, reserved: 2, location: 'LON-D2' },
  'FG-STM-30': { stock: 7, reserved: 0, location: 'LON-D2' },
  'FG-KIT-01': { stock: 60, reserved: 3, location: 'LON-D3' },
  /* Matka Series — pre-launch, zero sellable stock */
  'MK-TW-30': { stock: 0, reserved: 0, location: 'JAI-PRE' },
  'MK-MK-40': { stock: 0, reserved: 0, location: 'JAI-PRE' },
  'MK-PC-50': { stock: 0, reserved: 0, location: 'JAI-PRE' },
  'MK-KD-35': { stock: 0, reserved: 0, location: 'JAI-PRE' },
  'MK-CS-12': { stock: 0, reserved: 0, location: 'JAI-PRE' },
  'MK-HD-45': { stock: 0, reserved: 0, location: 'JAI-PRE' },
  'MK-ST-80': { stock: 0, reserved: 0, location: 'JAI-PRE' },
};

const LOW_STOCK_THRESHOLD = 6;

export function getStock(sku: string): number {
  const entry = INVENTORY_LEDGER[sku];
  if (!entry) return 0;
  return Math.max(0, entry.stock - entry.reserved);
}

export function isLowStock(sku: string): boolean {
  const available = getStock(sku);
  return available > 0 && available <= LOW_STOCK_THRESHOLD;
}
