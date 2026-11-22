import type { VesselKind } from '../components/three/vessels';

/**
 * Universal commerce schema — series / SKU / bundle / compatibility.
 * Two series: Forge (five-ply steel, copper and cast iron on one sizing grid
 * and one lid system) and Matka (pre-launch terracotta + Kansa).
 */

export type SeriesId = 'forge' | 'matka';
export type Category = 'Pans' | 'Pots' | 'Specialty' | 'Sets' | 'Accessories';
export type Material = 'Copper' | 'Stainless steel' | 'Cast iron' | 'Mixed' | 'Five-ply stainless' | 'Unglazed terracotta & Kansa';
export type ProductStatus = 'live' | 'pre-launch';

export interface Series {
  id: SeriesId;
  name: string;
  tagline: string;
  material: string;
  blurb: string;
  status: ProductStatus;
}

export interface SizeVariant {
  name: string;
  price: number;
  detail: string;
  sku: string;
  capacityL?: number;
  weightKg?: number;
  heightCm?: number;
  baseDiameterCm?: number;
  inductionZoneCm?: number;
}

export interface ProductColor {
  name: string;
  hex: string;
}

export interface ProductImages {
  studio: string[];
  context: string[];
  /* technical views are drawn live from specs (elevation + plan) */
}

export interface Compatibility {
  induction: boolean;
  gas: boolean;
  electric: boolean;
  ovenSafeC?: number;
  dishwasher: boolean;
}

export interface Recipe {
  name: string;
  note: string;
}

export interface ShopifyCategory {
  path: string;
  taxonomyId: string | null; // resolved via Shopify taxonomy API at sync
}

export interface Product {
  id: string;
  seriesId: SeriesId;
  name: string;
  frenchName: string; // craft subtitle shown above the name
  category: Category;
  shape?: string; // vessel shape inside a series
  material: Material;
  price: number; // from lowest size
  image: string;
  contextImage: string;
  images: ProductImages;
  model?: VesselKind;
  badge?: string;
  status: ProductStatus;
  oneLiner: string; // one-line quick summary for sync feeds
  short: string;
  description: string; // deeper lineup copy
  sizes: SizeVariant[];
  colors: ProductColor[];
  stock: number; // display fallback; live figures come from the inventory ledger
  rating: number;
  reviewCount: number;
  details: string[];
  specs: { label: string; value: string }[];
  care: string;
  bestFor: string[];
  induction: boolean; // legacy quick flag
  compatibility: Compatibility;
  handleConfig: string;
  fitsLids: string[];
  maintenanceKitId?: string;
  kansaSafe?: boolean;
  useCases: string[];
  recipes: Recipe[];
  shopifyCategory: ShopifyCategory;
}

const px = (id: number) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200`;

export const journalEntries = [
  {
    id: 'language-of-copper',
    number: 'I',
    title: 'The living language of copper',
    category: 'Materials',
    readTime: '4 min read',
    image: px(38569164),
    excerpt: 'Why the world’s most responsive cooking metal is also the most expressive.',
    intro: 'Copper records a life in the kitchen. Heat darkens it, hands brighten it, and every polish reveals another version of the same object.',
    paragraphs: [
      'The practical argument for copper begins with conductivity. It distributes heat rapidly and responds almost as soon as the flame changes. For a delicate sauce or a precise caramel, that responsiveness is not a luxury; it is control.',
      'The emotional argument is patina. A pristine mirror finish is only the first chapter. With use, copper shifts through rose, russet and deep umber. This is not damage. It is the visible record of meals made and repeated.',
      'Care is a choice rather than a rule. Polish before a gathering if you love brilliance, or leave the surface untouched and let time compose it. The stainless cooking interior remains unchanged either way.',
    ],
  },
  {
    id: 'heat-is-an-ingredient',
    number: 'II',
    title: 'Heat is an ingredient',
    category: 'Technique',
    readTime: '6 min read',
    image: px(3933188),
    excerpt: 'A cook’s guide to preheating, listening and knowing when to turn the flame down.',
    intro: 'Great pans do not ask for more heat. They ask you to pay closer attention to the heat you already have.',
    paragraphs: [
      'Begin lower than instinct suggests. Conductive cookware reaches working temperature quickly, and excessive preheating is the usual cause of sticking. A few drops of water should dance, not violently explode, across a stainless surface.',
      'Once food enters the pan, resist moving it. A proper sear releases naturally as the crust forms. Listen for a steady, confident sizzle; silence means the pan has cooled, while harsh spattering often means the flame is too high.',
      'Finally, use residual heat. Copper and stainless respond quickly when removed from the flame; cast iron continues cooking for longer. Knowing which material is in your hand lets you finish with timing instead of intervention.',
    ],
  },
  {
    id: 'five-pan-kitchen',
    number: 'III',
    title: 'The five-pan kitchen',
    category: 'The edit',
    readTime: '5 min read',
    image: px(8629103),
    excerpt: 'Fewer, better vessels: building a kitchen around the way you actually cook.',
    intro: 'A complete kitchen is not measured by the number of objects in it, but by how naturally each object earns its place.',
    paragraphs: [
      'Start with a frying pan sized for your usual table, not your largest imaginable gathering. Add a saucier for anything stirred, a saucepan for anything poured, and a cocotte for anything that benefits from time.',
      'The fifth piece is personal. Choose a rondeau if you entertain, a kadhai if your cooking is fast and fluid, or a grill pan if high heat and char define your table. Your habits, not convention, should make that decision.',
      'This is also why we sell pieces individually. Collections are useful when they reflect a real need; otherwise, one remarkable pan used daily is the more luxurious possession.',
    ],
  },
];
