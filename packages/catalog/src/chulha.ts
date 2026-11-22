export const chulhaCategory = {
  handle: 'chulha',
  title: 'Chulha',
  summary: 'Terracotta cookware shaped around flatbreads, chai, dal and slow-cooked meals.',
  description: 'Chulha explores familiar cooking forms in unglazed terracotta. Each shape starts with a task, from turning a paratha on a tawa to lifting the lid on a biryani handi.',
} as const;

/** Development assortment. Price, inventory and cooktop ratings await physical samples. */
export interface ChulhaConcept {
  sku: string;
  title: string;
  taxonomyLeaf: string;
  form: string;
  suggestedDish: string;
  capacityTargetLitres?: number;
  finishTarget?: string;
}

export const chulhaConcepts: ChulhaConcept[] = [
  {
    sku: 'MT-HER-TAW-P01',
    title: 'Chulha Tawa',
    taxonomyLeaf: 'Griddles & Grill Pans',
    form: 'Shallow-lipped flatbread plate with a raised centre',
    suggestedDish: 'Parathas and crêpes',
  },
  {
    sku: 'MT-HER-MAT-P01',
    title: 'Artisanal Matka',
    taxonomyLeaf: 'Tagines & Clay Cooking Pots',
    form: 'Round-bellied pot with a narrow neck',
    suggestedDish: 'Slow-cooked dal',
    capacityTargetLitres: 4,
    finishTarget: 'Raw matte terracotta',
  },
  {
    sku: 'MT-HER-PRS-P01',
    title: 'Chulha Pressure Cooker',
    taxonomyLeaf: 'Pressure Cookers & Canners',
    form: 'Pressure-vessel research concept pending independent engineering and conformity assessment',
    suggestedDish: 'Beans and grains, subject to certification',
  },
  {
    sku: 'MT-HER-KAD-P01',
    title: 'Heavy Kadhai',
    taxonomyLeaf: 'Woks',
    form: 'Deep curved bowl with twin handles',
    suggestedDish: 'Vegetables with toasted spices',
    capacityTargetLitres: 3.5,
    finishTarget: 'Smoked charcoal terracotta',
  },
  {
    sku: 'MT-HER-SCR-P01',
    title: 'Chai & Sauce Saucier',
    taxonomyLeaf: 'Saucepans',
    form: 'Straight walls, a pour spout and an extended handle',
    suggestedDish: 'Cardamom chai',
  },
  {
    sku: 'MT-HER-HND-P01',
    title: 'Daily Biryani Handi',
    taxonomyLeaf: 'Tagines & Clay Cooking Pots',
    form: 'Wide, shallow body with a substantial rim for dum cooking',
    suggestedDish: 'Layered vegetable biryani',
    capacityTargetLitres: 2.5,
    finishTarget: 'Burnished earth',
  },
  {
    sku: 'MT-HER-STK-P01',
    title: 'Chulha Multi-Use Stockpot',
    taxonomyLeaf: 'Stock Pots',
    form: 'Deep straight walls around a broad base',
    suggestedDish: 'Slow-simmered vegetable broth',
  },
];
