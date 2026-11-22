import type { SeriesId } from './products';

/**
 * Material architecture for the Round Room's exploded, thermal and cutaway views.
 * Layers are keyed by the material set currently rendered, so the physics panel
 * always describes the metal or clay the visitor is actually looking at.
 */

export type MaterialSet = 'clay' | 'fiveply' | 'copper' | 'iron';
export type LayerPart = 'body' | 'core' | 'lining' | 'enamel' | 'mesh' | 'puck' | 'plate';
export type Tone = 'patina' | 'copper' | 'clay' | 'kansa' | 'ivory';

export interface LayerSpec {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  desc: string;
  part: LayerPart;
  /** Vertical displacement at full explosion, in scene units. */
  offset: number;
  stats: { label: string; value: string }[];
}

export interface PhysicsBar {
  label: string;
  value: string;
  pct: number;
  tone: Tone;
}

export interface MaterialProfile {
  set: MaterialSet;
  name: string;
  layers: LayerSpec[];
  physics: PhysicsBar[];
  formulaTitle: string;
  formula: { label: string; value: string }[];
  /** How far heat climbs the wall in the thermal view. */
  spread: number;
  thermalNote: string;
}

export const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

export const materialSetFor = (finish: string): MaterialSet =>
  ['terracotta', 'burnished', 'charcoal'].includes(finish) ? 'clay' : finish === 'copper' ? 'copper' : finish === 'iron' ? 'iron' : 'fiveply';

export const MATERIAL_PROFILES: Record<MaterialSet, MaterialProfile> = {
  clay: {
    set: 'clay',
    name: 'Mitti + Kansa',
    spread: 0.95,
    thermalNote: 'Heat concentrates at the Kansa base; the clay walls hold it.',
    layers: [
      {
        id: 'clay-body', part: 'body', offset: 1.25,
        tag: 'Layer I · Exterior & interior',
        title: 'Natural unglazed terracotta',
        subtitle: 'Petalite-reinforced low-expansion clay',
        desc: 'An unglazed clay matrix blended with lithium petalite and quartz grog. It keeps the micro-porosity that lets steam circulate and preserves the natural alkalinity of the food, while resisting the thermal shock of direct heat.',
        stats: [
          { label: 'Heat conductivity', value: '≈ 1.2 W/m·K · retention' },
          { label: 'Bonding', value: 'Vitrified kiln matrix, 1,050°C' },
          { label: 'Origin', value: 'Indus Valley earthenware craft' },
        ],
      },
      {
        id: 'wire-rebar', part: 'mesh', offset: 0.35,
        tag: 'Layer II · Structural core',
        title: '3D wire mesh rebar',
        subtitle: '410 stainless interlocking cage',
        desc: 'Borrowed from reinforced concrete: a co-moulded stainless mesh spreads micro-stress through the matrix as the vessel heats and cools, so expansion never concentrates into a crack between clay and metal.',
        stats: [
          { label: 'Heat conductivity', value: '≈ 25 W/m·K · structural bridge' },
          { label: 'Bonding', value: 'Floating anchors, 0.2 mm flex' },
          { label: 'Origin', value: 'Civil infrastructure engineering' },
        ],
      },
      {
        id: 'induction-puck', part: 'puck', offset: -0.45,
        tag: 'Layer III · Electromagnetic core',
        title: 'Ferromagnetic induction puck',
        subtitle: 'High-permeability 430 stainless, 3 mm',
        desc: 'A perforated ferromagnetic disc embedded at the base. It captures the cooktop’s alternating field and turns it into heat at once, which is what lets unglazed clay cook on induction at all.',
        stats: [
          { label: 'Heat conductivity', value: '≈ 26 W/m·K · induction capture' },
          { label: 'Bonding', value: 'Sintered into the base mould' },
          { label: 'Origin', value: 'Contemporary induction hardware' },
        ],
      },
      {
        id: 'kansa-base', part: 'plate', offset: -1.25,
        tag: 'Layer IV · Exterior base',
        title: 'Hand-hammered Kansa plate',
        subtitle: '80:20 copper–tin bell metal',
        desc: 'A traditional bell-metal base. It spreads heat across the floor of the vessel about forty times faster than the clay above it, and shields the unglazed base from chips on a glass hob.',
        stats: [
          { label: 'Heat conductivity', value: '≈ 50 W/m·K · lateral spread' },
          { label: 'Bonding', value: 'Precision mechanical lock rim' },
          { label: 'Origin', value: 'Ayurvedic bell-metal tradition' },
        ],
      },
    ],
    physics: [
      { label: 'Thermal shock (CTE)', value: 'Near-zero · petalite', pct: 92, tone: 'patina' },
      { label: 'Magnetic permeability', value: '430 ferromagnetic puck', pct: 85, tone: 'kansa' },
      { label: 'Natural porosity', value: '14.2% · alkaline', pct: 68, tone: 'clay' },
      { label: 'Re-crafting index', value: '100% circular', pct: 100, tone: 'ivory' },
    ],
    formulaTitle: 'Clay matrix formula',
    formula: [
      { label: 'Illite terracotta clay', value: '55%' },
      { label: 'Lithium petalite (LiAlSi₄O₁₀)', value: '30%' },
      { label: 'Sintered quartz grog', value: '15%' },
    ],
  },
  fiveply: {
    set: 'fiveply',
    name: 'Forge five-ply',
    spread: 2.4,
    thermalNote: 'The aluminium core carries heat up the wall to the rim.',
    layers: [
      {
        id: 'steel-304', part: 'body', offset: 1.1,
        tag: 'Layer I · Cooking surface',
        title: '18/10 stainless interior',
        subtitle: 'Austenitic 304, 0.5 mm',
        desc: 'The only metal that touches food. Non-reactive with tomato, wine and tamarind, it holds a polish and releases a sear once the crust has formed.',
        stats: [
          { label: 'Heat conductivity', value: '≈ 16 W/m·K' },
          { label: 'Bonding', value: 'Roll-bonded under heat & pressure' },
          { label: 'Role', value: 'Food contact, corrosion barrier' },
        ],
      },
      {
        id: 'aluminium-core', part: 'core', offset: 0.25,
        tag: 'Layer II · Thermal core',
        title: 'Triple aluminium core',
        subtitle: '3003 aluminium across three plies, 2.0 mm',
        desc: 'The reason the line is five-ply. Aluminium runs from the centre of the base to the very rim, so heat reaches the walls instead of pooling where the flame or coil sits.',
        stats: [
          { label: 'Heat conductivity', value: '≈ 190 W/m·K · spread' },
          { label: 'Bonding', value: 'Five-ply roll bond, edge to edge' },
          { label: 'Role', value: 'Even heat, core to rim' },
        ],
      },
      {
        id: 'steel-430', part: 'plate', offset: -0.95,
        tag: 'Layer III · Exterior',
        title: '430 ferritic exterior',
        subtitle: 'Magnetic stainless, 0.5 mm',
        desc: 'The outer ply is ferritic, so it couples with an induction field. Its base diameter is matched to the 14.5, 18 and 21 cm coil zones of standard hobs.',
        stats: [
          { label: 'Heat conductivity', value: '≈ 26 W/m·K · induction capture' },
          { label: 'Bonding', value: 'Outer ply of the roll bond' },
          { label: 'Role', value: 'Induction coupling, durability' },
        ],
      },
    ],
    physics: [
      { label: 'Thermal response', value: 'Core to rim', pct: 86, tone: 'copper' },
      { label: 'Heat retention', value: 'Moderate', pct: 58, tone: 'clay' },
      { label: 'Magnetic permeability', value: '430 ferritic exterior', pct: 90, tone: 'kansa' },
      { label: 'Food-contact reactivity', value: 'Non-reactive 18/10', pct: 100, tone: 'patina' },
    ],
    formulaTitle: 'Five-ply stack · 3.0 mm',
    formula: [
      { label: '18/10 stainless (304) interior', value: '0.5 mm' },
      { label: '3003 aluminium core × 3 plies', value: '2.0 mm' },
      { label: '430 ferritic stainless exterior', value: '0.5 mm' },
    ],
  },
  copper: {
    set: 'copper',
    name: 'Forge copper',
    spread: 2.8,
    thermalNote: 'The fastest climb in the house — copper answers within seconds.',
    layers: [
      {
        id: 'copper-body', part: 'body', offset: 0,
        tag: 'Layer I · Body',
        title: 'Solid copper body',
        subtitle: 'C110 copper, 2.5 mm',
        desc: 'Copper conducts heat roughly twenty-five times faster than stainless. The pan follows the flame almost instantly, up and down, which is what makes caramel and beurre blanc forgiving.',
        stats: [
          { label: 'Heat conductivity', value: '≈ 390 W/m·K' },
          { label: 'Forming', value: 'Spun and hand-finished' },
          { label: 'Origin', value: 'French copper tradition' },
        ],
      },
      {
        id: 'steel-lining', part: 'lining', offset: 1.2,
        tag: 'Layer II · Lining',
        title: '18/10 stainless lining',
        subtitle: 'Bonded inner skin, 0.25 mm',
        desc: 'A thin stainless skin keeps copper away from food without slowing it down. Unlike tin, it never needs re-lining.',
        stats: [
          { label: 'Heat conductivity', value: '≈ 16 W/m·K · non-reactive' },
          { label: 'Bonding', value: 'Metallurgically bonded' },
          { label: 'Role', value: 'Food contact, zero maintenance' },
        ],
      },
    ],
    physics: [
      { label: 'Thermal response', value: 'Fastest in the house', pct: 98, tone: 'copper' },
      { label: 'Heat retention', value: 'Low — responds, then releases', pct: 40, tone: 'clay' },
      { label: 'Magnetic permeability', value: 'None — adapter required', pct: 0, tone: 'kansa' },
      { label: 'Food-contact reactivity', value: 'Lined, non-reactive', pct: 100, tone: 'patina' },
    ],
    formulaTitle: 'Wall stack · 2.75 mm',
    formula: [
      { label: 'C110 copper body', value: '2.5 mm' },
      { label: '18/10 stainless lining', value: '0.25 mm' },
      { label: 'Cast bronze handle', value: 'Riveted' },
    ],
  },
  iron: {
    set: 'iron',
    name: 'Forge cast iron',
    spread: 1.3,
    thermalNote: 'A slow climb and a long hold — the mass stores heat.',
    layers: [
      {
        id: 'cast-iron', part: 'body', offset: 0,
        tag: 'Layer I · Body',
        title: 'Grey cast iron',
        subtitle: 'Sand-cast, 4 mm walls',
        desc: 'Iron is not a fast conductor, but its mass is the point: once hot it stays hot, which is why braises hold a steady shiver and bread gets its crust.',
        stats: [
          { label: 'Heat conductivity', value: '≈ 52 W/m·K · high mass' },
          { label: 'Forming', value: 'Sand-cast in a single pour' },
          { label: 'Role', value: 'Retention, fully ferromagnetic' },
        ],
      },
      {
        id: 'enamel', part: 'enamel', offset: 1.15,
        tag: 'Layer II · Coating',
        title: 'Satin vitreous enamel',
        subtitle: 'Fused glass, 0.3 mm',
        desc: 'Glass fused onto the iron at around 800°C. It seals the metal from acids and moisture, so the pot never needs seasoning.',
        stats: [
          { label: 'Heat conductivity', value: '≈ 1 W/m·K' },
          { label: 'Bonding', value: 'Kiln-fused to the iron' },
          { label: 'Role', value: 'Sealed, non-reactive surface' },
        ],
      },
    ],
    physics: [
      { label: 'Thermal response', value: 'Slow, even', pct: 34, tone: 'copper' },
      { label: 'Heat retention', value: 'Highest in the house', pct: 96, tone: 'clay' },
      { label: 'Magnetic permeability', value: 'Fully ferromagnetic', pct: 95, tone: 'kansa' },
      { label: 'Food-contact reactivity', value: 'Sealed by enamel', pct: 100, tone: 'patina' },
    ],
    formulaTitle: 'Wall stack · 4.3 mm',
    formula: [
      { label: 'Grey cast iron', value: '4.0 mm' },
      { label: 'Satin vitreous enamel', value: '0.3 mm' },
      { label: 'Solid brass knob', value: 'Lid' },
    ],
  },
};

export interface Brief {
  kicker: string;
  title: string;
  lead: string;
  paragraphs: { heading: string; body: string }[];
  points: string[];
}

export const BRIEFS: Record<SeriesId, Brief> = {
  matka: {
    kicker: 'Material brief · Matka Series',
    title: 'Re-engineering ancestral earthenware for the induction era',
    lead: 'Unglazed terracotta, a magnetic core and hand-hammered bronze, built to work on a modern hob.',
    paragraphs: [
      { heading: 'The culinary problem.', body: 'Urban kitchens are moving to induction and flat-top radiant cooktops. That shift strands thousands of years of terracotta cooking, prized for moisture-retaining porosity and its gentle alkalinity.' },
      { heading: 'The material answer.', body: 'A low-expansion lithium clay matrix, co-moulded around a 3D stainless rebar cage, sits on a ferromagnetic puck and a hand-hammered Kansa plate. The clay still does the cooking; the metal makes it possible.' },
    ],
    points: [
      'CTE decoupling: floating mesh anchors allow 0.2 mm of lateral flex between metal and clay.',
      'Induction capture: an embedded 430-steel puck turns the cooktop field into heat.',
      'Zero chemical glaze: a natural, unglazed, breathable cooking surface.',
    ],
  },
  forge: {
    kicker: 'Engineering brief · Forge Series',
    title: 'One grid, three lids, three metals',
    lead: 'Five-ply steel, copper and cast iron, all sized to a shared 20 / 24 / 28 / 32 cm grid measured at the inner rim.',
    paragraphs: [
      { heading: 'The grid.', body: 'Standardising diameters lets three universal lids sit flush across frying pans, saucepans, sauté pans, stockpots, kadhais, rondeaux and cocottes — fewer lids to make, fewer to store.' },
      { heading: 'The metals.', body: 'Five-ply steel is the everyday line. Copper answers the flame fastest, for sauces and caramel; cast iron holds a steady low heat for braises and bread. Choose by how you cook — the lids still fit.' },
      { heading: 'The handles.', body: 'Any pan 26 cm or wider becomes wrist-heavy when full, so the 28 cm frying pans, both sauté pans and the grill pans add a helper loop. Stockpots, rondeaux, cocottes, large kadhais and the 30 cm tawa take dual grips and go straight to the table.' },
    ],
    points: [
      'Base diameters align with standard induction coil zones: 14.5, 18 and 21 cm.',
      'Copper needs an induction interface disk; five-ply steel and cast iron are induction-native.',
      'Lids are measured inner-rim, so a 24 cm lid seats inside every 24 cm vessel.',
    ],
  },
};
