/**
 * Reconciles the 11-SKU concept seed to a 25-SKU assortment.
 * Upserts extension rows by SKU in the Shopify and engineering CSVs so
 * taxonomy, descriptions, titles, and unweighed concept fields stay accurate.
 */
import {readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

const ROOT = join(import.meta.dir, '..');
const SHOPIFY = join(ROOT, 'data', 'maison-tavo-new-listings-shopify.csv');
const SPECS = join(ROOT, 'data', 'maison-tavo-new-listings-specs.csv');

type Extension = {
  title: string;
  handle: string;
  sku: string;
  lineup: 'Terre Clay' | 'Forge Hybrid' | 'Forge × Terre' | 'Kuro Strip';
  category: string;
  type: string;
  tags: string[];
  option: [string, string];
  price: number;
  summary: string;
  whyItExists: string;
  material: string;
  foodContact: string;
  use: string;
  care: string;
  risks: string;
  tests: string;
  intents: string;
  constraints: string;
  color: string;
  label1: 'Cookware' | 'Tableware & Pottery' | 'Care & Sets';
};

const extensions: Extension[] = [
  {
    title: 'Forge–Terre Compact Tagine',
    handle: 'forge-terre-tagine-28',
    sku: 'MT-HYB-TAG-28',
    lineup: 'Forge × Terre',
    category: 'Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware > Tagines',
    type: 'Tagine',
    tags: ['Forge × Terre', 'Tagine', 'Earthenware', 'Stainless Steel', 'Hospitality', 'Concept Spec'],
    option: ['Diameter', '28 cm'],
    price: 340,
    summary: 'A two-part braising tagine pairing an induction-ready clad stainless base with a high-fired earthenware condensation cone for four-person table service.',
    whyItExists: 'Traditional all-clay tagines crack easily on modern induction hobs. Separating the thermal base from the vapour-return cone preserves aromatic condensation while keeping hob contact predictable.',
    material: 'Clad 18/10 stainless cooking base + vented high-fired earthenware cone.',
    foodContact: '18/10 stainless steel contacts simmering food; glazed interior cone contacts condensing steam only after migration validation.',
    use: 'Slow braises, spiced reductions and tableside presentation for up to four guests.',
    care: 'Hand wash ceramic cone; stainless base targets commercial washing pending validation.',
    risks: 'Thermal shock on cone; steam vent velocity; rim seating tolerance; handle heat.',
    tests: 'Thermal cycling; steam condensation mapping; lid seating drop; induction flatness; glaze migration.',
    intents: 'tagine; slow cooking; clay slow-cooking; induction tagine; braising vessel',
    constraints: 'ceramic cone directly on hob; guaranteed dishwasher-safe cone',
    color: 'terracotta; silver',
    label1: 'Cookware',
  },
  {
    title: 'Forge–Terre Shared Tagine',
    handle: 'forge-terre-tagine-32',
    sku: 'MT-HYB-TAG-32',
    lineup: 'Forge × Terre',
    category: 'Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware > Tagines',
    type: 'Tagine',
    tags: ['Forge × Terre', 'Tagine', 'Earthenware', 'Stainless Steel', 'Hospitality', 'Concept Spec'],
    option: ['Diameter', '32 cm'],
    price: 395,
    summary: 'A wide shared-format braising tagine built for banquet and family-style service, combining a clad stainless base with a tall earthenware vapour cone.',
    whyItExists: 'Scales the decoupled metal-and-clay tagine architecture to shared feast portions without forcing staff to carry a fragile all-ceramic cooking base from stove to table.',
    material: 'Clad 18/10 stainless cooking base + wide high-fired earthenware cone.',
    foodContact: '18/10 stainless steel contacts food; interior cone glaze requires post-firing migration verification.',
    use: 'Shared slow-simmered centrepieces, whole-vegetable braises and hospitality table service.',
    care: 'Hand wash ceramic cone; never place cone directly on a burner.',
    risks: 'Thermal shock; loaded lifting ergonomics; steam venting; rim seating stability.',
    tests: 'Loaded lift ergonomics; thermal cycling; steam mapping; induction flatness; glaze migration.',
    intents: 'large tagine; slow cooking; clay slow-cooking; shared service; induction tagine',
    constraints: 'ceramic cone directly on hob; dishwasher-safe cone before testing',
    color: 'terracotta; silver',
    label1: 'Cookware',
  },
  {
    title: 'Forge Relay Compact Tava',
    handle: 'forge-relay-tava-26',
    sku: 'MT-FOR-TAV-26',
    lineup: 'Forge Hybrid',
    category: 'Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware > Griddles & Grill Pans',
    type: 'Tava',
    tags: ['Forge Hybrid', 'Tava', 'Carbon Steel', 'Bronze', 'Induction', 'Concept Spec'],
    option: ['Diameter', '26 cm'],
    price: 190,
    summary: 'A low-wall carbon-steel tava engineered for daily flatbreads, parathas and quick dry-roasting on single induction or gas burners.',
    whyItExists: 'Gives cooks fast, seasoning-capable carbon-steel heat response with a thermally isolated bronze handle bridge designed to stay manageable during rapid roti turnarounds.',
    material: 'Nitrided carbon-steel cooking plate + bronze-isolated stainless handle.',
    foodContact: 'Seasoned nitrided carbon steel contacts food; bronze bridge stays external to the cooking face.',
    use: 'Roti, chapati, paratha, uttapam and dry spice toasting on standard domestic hobs.',
    care: 'Hand wash warm without soaking; dry over low heat and wipe with seasoning oil.',
    risks: 'High-heat warping on undersized induction coils; seasoning wear; handle heat creep.',
    tests: 'Induction flatness cycling; surface thermal map; handle temperature rise; corrosion.',
    intents: 'tava; roti griddle; flatbread pan; induction griddle; high-heat searing',
    constraints: 'dishwasher safe; synthetic nonstick coating; prolonged acidic soaking',
    color: 'black; bronze',
    label1: 'Cookware',
  },
  {
    title: 'Forge Relay Wide Tava',
    handle: 'forge-relay-tava-30',
    sku: 'MT-FOR-TAV-30',
    lineup: 'Forge Hybrid',
    category: 'Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware > Griddles & Grill Pans',
    type: 'Tava',
    tags: ['Forge Hybrid', 'Tava', 'Carbon Steel', 'Bronze', 'Induction', 'Concept Spec'],
    option: ['Diameter', '30 cm'],
    price: 225,
    summary: 'An expanded carbon-steel tava with sweeping perimeter access for crisp dosas, rumali-style breads and two-item pass searing.',
    whyItExists: 'Extends the Relay griddle geometry for wider batter spreads while preserving flat hob contact and an isolated handle junction.',
    material: 'Heavy-gauge nitrided carbon-steel plate + bronze-isolated handle + helper tab.',
    foodContact: 'Seasoned nitrided carbon steel contacts food; bronze collar remains non-food-contact.',
    use: 'Crisp dosas, chillas, smash searing and wide flatbread service.',
    care: 'Hand wash warm; dry immediately on heat and condition lightly with seasoning oil.',
    risks: 'Edge-to-centre temperature delta on small coils; warping; helper-tab burn risk.',
    tests: 'Edge-to-centre thermal gradient; flatness cycling; dosa release trials; handle temperature.',
    intents: 'wide tava; dosa pan; roti griddle; smash searing; carbon steel griddle',
    constraints: 'dishwasher safe; synthetic nonstick coating; cold-water quench while hot',
    color: 'black; bronze',
    label1: 'Cookware',
  },
  {
    title: 'Forge Relay Kadai',
    handle: 'forge-relay-kadai-24',
    sku: 'MT-FOR-KAD-24',
    lineup: 'Forge Hybrid',
    category: 'Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware > Woks',
    type: 'Kadai',
    tags: ['Forge Hybrid', 'Kadai', 'Carbon Steel', 'Bronze', 'Induction', 'Concept Spec'],
    option: ['Diameter', '24 cm'],
    price: 275,
    summary: 'A flat-seated, deep-bellied carbon-steel kadai shaped for mustard-seed tempering, brisk reductions and small-batch frying across gas and induction.',
    whyItExists: 'Bridges traditional curved kadai tossing geometry with a calibrated flat induction foot and twin loop handles for balanced oven-to-table movement.',
    material: 'Spun nitrided carbon-steel vessel + twin bronze-isolated stainless loop handles.',
    foodContact: 'Nitrided carbon steel forms the entire interior cooking surface; external bronze collars do not contact food.',
    use: 'Tadka tempering, dry bhuna reductions, shallow-to-deep frying and wok-adjacent tossing.',
    care: 'Hand wash; dry thoroughly over heat and oil lightly; avoid long acidic simmers before patina matures.',
    risks: 'Hot-oil tip stability; loop handle heat transfer; early patina stripping under acidic sauces.',
    tests: 'Tip-angle stability; hot-oil thermal mapping; loop handle temperature; acid-cycle seasoning test.',
    intents: 'kadai; curry vessel; tadka pan; deep frying; induction wok',
    constraints: 'dishwasher safe; unattended deep frying; long acidic storage',
    color: 'black; bronze',
    label1: 'Cookware',
  },
  {
    title: 'Forge Relay Saucepot',
    handle: 'forge-relay-saucepot-20',
    sku: 'MT-FOR-SAU-20',
    lineup: 'Forge Hybrid',
    category: 'Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware > Saucepans',
    type: 'Saucepot',
    tags: ['Forge Hybrid', 'Saucepot', 'Stainless Steel', 'Bronze', 'Induction', 'Concept Spec'],
    option: ['Diameter', '20 cm'],
    price: 285,
    summary: 'An everyday clad stainless saucepot for dals, stocks, tamarind reductions and grains, paired with a removable external bronze thermal collar.',
    whyItExists: 'Acidic dals and tomato reductions punish bare carbon steel; switching the wet-cooking vessel to non-reactive stainless while keeping a removable bronze heat collar preserves the Relay system logic.',
    material: 'Fully-clad 18/10 stainless vessel + removable external cast-bronze thermal collar.',
    foodContact: 'Non-reactive 18/10 stainless steel contacts all liquids and acidic ingredients; bronze collar stays external.',
    use: 'Simmering dals, acidic sauces, grains, chai reductions and tableside hot-holding.',
    care: 'Remove bronze collar before washing; stainless pot targets dishwasher validation; hand wipe collar.',
    risks: 'Collar retention lock; moisture trapped under collar; pour-lip dribble.',
    tests: 'Boil-rate mapping; collar lock endurance; pour cleanliness; 500 wash cycles on stainless vessel.',
    intents: 'saucepot; dal pot; acidic sauce pan; grain pot; induction saucepan',
    constraints: 'washing with collar attached; removing collar while hot',
    color: 'silver; bronze',
    label1: 'Cookware',
  },
  {
    title: 'Rekhā Dinner Plate',
    handle: 'rekha-dinner-plate-28',
    sku: 'MT-TER-PLT-28',
    lineup: 'Terre Clay',
    category: 'Home & Garden > Kitchen & Dining > Tableware > Dinnerware > Plates',
    type: 'Dinner plate',
    tags: ['Terre Clay', 'Dinner Plate', 'Laser Marked', 'Ceramic', 'Hospitality', 'Concept Spec'],
    option: ['Diameter', '28 cm'],
    price: 68,
    summary: 'A low-rimmed stoneware main-course plate carrying a quiet laser-marked perimeter provenance band while keeping the central plating field calm and smooth.',
    whyItExists: 'Gives dining rooms durable, stack-considered stoneware with permanent batch and edition notation instead of printed backstamps or decals that wear away.',
    material: 'High-fired stoneware body + vitrified food-contact glaze + exterior/rim laser register.',
    foodContact: 'Unmarked vitrified centre glaze contacts plated food; laser register stays on the outer rim/underside until abrasion-tested.',
    use: 'Composed main courses, thali-adjacent contemporary plating and tasting-menu service.',
    care: 'Non-abrasive wash; commercial rack-washer durability pending coupon validation.',
    risks: 'Cutlery metal-marking on matte glazes; stacking foot abrasion; rim chipping.',
    tests: 'Lead/cadmium migration; cutlery mar test; 500 commercial rack washes; edge-chip impact.',
    intents: 'dinner plate; ceramic tableware; hospitality plate; laser-marked stoneware',
    constraints: 'oven broiler use; deep laser ablation on central knife-contact zone',
    color: 'terracotta; charcoal',
    label1: 'Tableware & Pottery',
  },
  {
    title: 'Rekhā Condiment Bowl Set',
    handle: 'rekha-condiment-bowl-set',
    sku: 'MT-TER-BWL-S03',
    lineup: 'Terre Clay',
    category: 'Home & Garden > Kitchen & Dining > Tableware > Dinnerware > Bowls',
    type: 'Bowl set',
    tags: ['Terre Clay', 'Bowl Set', 'Laser Marked', 'Ceramic', 'Hospitality', 'Concept Spec'],
    option: ['Set', '3 bowls (90 ml each)'],
    price: 92,
    summary: 'A trio of compact stoneware katori-scale bowls for chutneys, pickles, finishing salts and table condiments, marked with serialised exterior registers.',
    whyItExists: 'Brings traditional Indian condiment cadence to contemporary hospitality tables in a nested, glaze-protected stoneware format.',
    material: 'Three high-fired stoneware bowls + vitrified interior glaze + laser-marked exterior bands.',
    foodContact: 'Smooth vitrified interior glaze resists turmeric, chilli oil and tamarind staining pending coupon validation.',
    use: 'Chutneys, achar, raita, flaky salt and tableside spice accompaniments.',
    care: 'Non-abrasive wash; stack only when dry; commercial dishwasher status pending.',
    risks: 'Turmeric/acid staining on semi-matte glazes; nesting rim chips; mark contrast variation.',
    tests: '24-hour turmeric/tamarind stain test; glaze migration; nested stack abrasion; 500 wash cycles.',
    intents: 'condiment bowls; katori set; chutney bowls; ceramic set; hospitality tabletop',
    constraints: 'direct flame; commercial dishwasher claim before validation',
    color: 'terracotta; charcoal',
    label1: 'Tableware & Pottery',
  },
  {
    title: 'Rekhā Serving Bowl',
    handle: 'rekha-serving-bowl-26',
    sku: 'MT-TER-BWL-26',
    lineup: 'Terre Clay',
    category: 'Home & Garden > Kitchen & Dining > Tableware > Serveware > Serving Bowls',
    type: 'Serving bowl',
    tags: ['Terre Clay', 'Serving Bowl', 'Laser Marked', 'Ceramic', 'Hospitality', 'Concept Spec'],
    option: ['Diameter', '26 cm'],
    price: 125,
    summary: 'A generous stoneware shared bowl shaped for rice, salads, breads and family-style curries, grounded by a recessed foot and exterior contour notation.',
    whyItExists: 'Pairs with the Rekhā Serving Platter to complete deep and flat shared-service silhouettes on the table without competing visually with the dish.',
    material: 'High-fired stoneware vessel + smooth interior glaze + rotary laser-marked exterior band.',
    foodContact: 'Fully glazed interior bowl contacts hot and dressed dishes; exterior band remains outside food contact.',
    use: 'Shared rice, dressed greens, flatbread service and hot vegetable sides at the table.',
    care: 'Hand or gentle rack wash pending commercial cycle testing; never place on a burner.',
    risks: 'Thermal shock from boiling fills; loaded one-hand carry slip; rim chipping.',
    tests: 'Hot-fill thermal shock; glaze migration; loaded grip ergonomics; 500 wash cycles.',
    intents: 'serving bowl; shared bowl; ceramic serveware; hospitality tableware',
    constraints: 'stovetop or open-flame heating; unverified dishwasher guarantee',
    color: 'terracotta; charcoal',
    label1: 'Tableware & Pottery',
  },
  {
    title: 'Forge Seasoning Oil',
    handle: 'forge-seasoning-oil',
    sku: 'MT-FOR-OIL-250',
    lineup: 'Forge Hybrid',
    category: 'Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware Accessories',
    type: 'Cookware care oil',
    tags: ['Forge Hybrid', 'Care', 'Seasoning Oil', 'Cookware Accessory', 'Concept Spec'],
    option: ['Volume', '250 ml'],
    price: 28,
    summary: 'A refined, high-smoke-point plant oil formulation packaged in UV-shielding amber glass with a controlled-drop pourer for conditioning carbon-steel cookware.',
    whyItExists: 'Over-oiling is the most common cause of sticky carbon-steel seasoning; a dedicated micro-pour dispenser helps cooks apply thin, even maintenance films after washing.',
    material: 'Food-grade refined plant oil blend target + amber glass bottle + metered pour insert.',
    foodContact: 'Formulated strictly from food-contact-safe culinary oil stocks; requires allergen, oxidation and regulatory label review.',
    use: 'Post-wash rust protection and oven/stovetop seasoning maintenance on Forge carbon-steel surfaces.',
    care: 'Cap tightly after use and store away from heat and direct sunlight.',
    risks: 'Lipid rancidity over shelf life; allergen labelling omissions; oil leakage in transit.',
    tests: 'Accelerated oxidation shelf-life; smoke-point lab check; transit leak test; food-contact & allergen compliance.',
    intents: 'seasoning oil; carbon steel care; pan maintenance; rust prevention',
    constraints: 'culinary health claims; unverified smoke-point numbers; aerosol propellant',
    color: 'amber; black',
    label1: 'Care & Sets',
  },
  {
    title: 'Forge Care Ritual Kit',
    handle: 'forge-care-ritual-kit',
    sku: 'MT-FOR-KIT-C01',
    lineup: 'Forge Hybrid',
    category: 'Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware Accessories',
    type: 'Cookware care kit',
    tags: ['Forge Hybrid', 'Care Kit', 'Cookware Accessory', 'Set', 'Concept Spec'],
    option: ['Set', '4-piece kit'],
    price: 72,
    summary: 'A complete maintenance kit assembling seasoning oil, a stiff natural-fibre scrub brush, a lint-low cotton buffing cloth and a waterproof care protocol card.',
    whyItExists: 'Turns raw-metal cookware maintenance from guesswork into a repeatable three-minute post-cook ritual for home cooks and prep stations.',
    material: 'Seasoning oil bottle + untreated beech/tampico scrub brush + woven cotton cloth + printed care card.',
    foodContact: 'Oil and brush bristles touch food-contact pan surfaces and require food-safe material certification.',
    use: 'Warm-water deglaze scrubbing, dry buffing and thin-film conditioning of carbon-steel cookware.',
    care: 'Rinse brush and stand bristles-down to dry; launder oil-saturated cloths cool and line-dry flat away from heat.',
    risks: 'Oil-soaked cloth spontaneous heating if tumble-dried hot; bristle shedding; timber splitting.',
    tests: 'Bristle pull retention; wet-dry brush split cycling; spontaneous-heating warning prominence; transit drop.',
    intents: 'cookware care kit; seasoning kit; pan maintenance set; gift add-on',
    constraints: 'tumble-drying oil-soaked cloths; use on delicate mirror-polished silver or unsealed clay',
    color: 'amber; natural; black',
    label1: 'Care & Sets',
  },
  {
    title: 'Forge Relay Skillet Lid',
    handle: 'forge-relay-lid-26',
    sku: 'MT-FOR-LID-26',
    lineup: 'Forge Hybrid',
    category: 'Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware Accessories > Pot & Pan Lids',
    type: 'Replacement lid',
    tags: ['Forge Hybrid', 'Replacement Lid', 'Cookware Accessory', 'Concept Spec'],
    option: ['Compatibility', '26 cm vessels'],
    price: 64,
    summary: 'A stepped stainless-and-glass service lid sized for the Forge Relay Dual-Mass Skillet and Compact Tava to trap steam for finishing, melting and covered simmering.',
    whyItExists: 'Sold separately so kitchens buy only the covers their stations need, and can replace a damaged lid without discarding the underlying pan.',
    material: 'Tempered viewing glass target + 18/8 stainless step rim + bronze-isolated bridge handle.',
    foodContact: 'Glass underside and 18/8 stainless rim contact rising steam and condensate; bronze accent stays external.',
    use: 'Covered basting, steam-finishing greens or flatbreads, and splatter containment on 26 cm Forge vessels.',
    care: 'Cool before washing; hand wash recommended until thermal-cycle dishwasher validation completes.',
    risks: 'Tempered glass thermal shock; rim-step fit mismatch across production batches; hot bridge handle.',
    tests: 'Thermal-shock quench test; impact fragmentation; go/no-go rim gauge; handle temperature.',
    intents: 'skillet lid; 26 cm lid; replacement lid; cookware cover',
    constraints: 'universal fit across non-Maison Tavo pans; broiler use before glass rating verification',
    color: 'clear; silver; bronze',
    label1: 'Care & Sets',
  },
  {
    title: 'Forge Relay Wide Tava Lid',
    handle: 'forge-relay-lid-30',
    sku: 'MT-FOR-LID-30',
    lineup: 'Forge Hybrid',
    category: 'Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware Accessories > Pot & Pan Lids',
    type: 'Replacement lid',
    tags: ['Forge Hybrid', 'Replacement Lid', 'Cookware Accessory', 'Concept Spec'],
    option: ['Compatibility', '30 cm vessels'],
    price: 72,
    summary: 'A wide domed cover engineered to clear tall ingredients on the Forge Relay Wide Tava during covered steaming, melting and pass holding.',
    whyItExists: 'Provides optional vapour capture on open 30 cm griddle surfaces while remaining an independently replaceable component.',
    material: 'Domed tempered glass target + 18/8 stainless step rim + bronze-isolated bridge handle.',
    foodContact: 'Glass dome and stainless rim contact steam; external bronze detail stays outside condensate path.',
    use: 'Steam-setting uttapam and eggs, covered finishing on the Wide Tava, and pass warm-holding.',
    care: 'Allow to cool before washing; hand wash until commercial dishwasher testing is complete.',
    risks: 'Glass impact breakage at wider span; condensate run-off onto hot griddle; handle heat.',
    tests: 'Span impact test; thermal shock; condensate drip path; rim tolerance check.',
    intents: 'wide lid; 30 cm lid; tava dome; replacement lid',
    constraints: 'universal pan compatibility; high-heat broiler exposure',
    color: 'clear; silver; bronze',
    label1: 'Care & Sets',
  },
  {
    title: 'Terre Bamboo Steamer',
    handle: 'terre-bamboo-steamer-24',
    sku: 'MT-TER-STM-24',
    lineup: 'Terre Clay',
    category: 'Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware Accessories > Steamer Baskets',
    type: 'Bamboo steamer',
    tags: ['Terre Clay', 'Bamboo Steamer', 'Cookware Accessory', 'Hospitality', 'Concept Spec'],
    option: ['Diameter', '24 cm (2 tiers)'],
    price: 88,
    summary: 'A two-tier woven bamboo steamer paired with a glazed stoneware adapter ring that seats cleanly over the Forge Relay Kadai without scorching the bamboo.',
    whyItExists: 'Raw bamboo rims char and warp when perched directly inside hot metal walls; a dedicated ceramic docking collar protects the basket and turns the Kadai into a multi-tier steamer.',
    material: 'Two untreated woven bamboo baskets + woven dome lid + high-fired glazed stoneware docking ring.',
    foodContact: 'Untreated food-contact bamboo slats and lead-free glazed ceramic ring; zero synthetic lacquers or glues in the steam path.',
    use: 'Idli-adjacent steamed cakes, dumplings, buns, delicate fish and table-presented stacked steaming.',
    care: 'Hand wash quickly in warm water without soaking; air-dry completely upright before storing.',
    risks: 'Mould growth if stored damp; bamboo splintering; ceramic ring thermal shock over dry boil.',
    tests: 'Humidity/mould dry-time test; splinter inspection; Kadai rim fit; boil-dry thermal shock; adhesive-free verification.',
    intents: 'bamboo steamer; dumpling steamer; kadai steamer; two-tier steamer',
    constraints: 'dishwasher use; soaking in water; direct burner contact without water vessel',
    color: 'natural; terracotta',
    label1: 'Care & Sets',
  },
];

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (quoted && c === '"' && text[i + 1] === '"') {
      field += '"';
      i++;
    } else if (c === '"') {
      quoted = !quoted;
    } else if (!quoted && c === ',') {
      row.push(field);
      field = '';
    } else if (!quoted && (c === '\n' || c === '\r')) {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const quote = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
const serialize = (row: string[]) => row.map(quote).join(',');

function upsertRows(path: string, records: Record<string, string>[], key: string): {added: number; updated: number} {
  const text = readFileSync(path, 'utf8').replace(/[\r\n]+$/, '');
  const rows = parseCsv(text);
  const header = rows[0]!.map((cell) => cell.replace(/^\uFEFF/, ''));
  const keyIndex = header.indexOf(key);
  if (keyIndex === -1) throw new Error(`Missing key column "${key}" in ${path}`);

  const byKey = new Map(records.map((r) => [r[key]!, r]));
  const seen = new Set<string>();
  let updated = 0;
  let added = 0;

  const nextRows = rows.slice(1).map((row) => {
    const k = row[keyIndex]!;
    const replacement = byKey.get(k);
    if (!replacement) return row;
    seen.add(k);
    updated++;
    return header.map((col) => replacement[col] ?? '');
  });

  for (const record of records) {
    const k = record[key]!;
    if (!seen.has(k)) {
      nextRows.push(header.map((col) => record[col] ?? ''));
      added++;
    }
  }

  writeFileSync(path, `${serialize(header)}\n${nextRows.map(serialize).join('\n')}\n`);
  return {added, updated};
}

const shopifyRows = extensions.map((p): Record<string, string> => ({
  Title: p.title,
  'URL handle': p.handle,
  Description: `<p>${p.summary}</p><h3>Why it exists</h3><p>${p.whyItExists}</p><h3>Service &amp; kitchen role</h3><p>${p.use}</p><p><strong>Concept-spec notice:</strong> Materials, dimensions, compatibility, food-contact migration and wash performance are unverified prototype targets. Physical unit weight and live stock remain unset until pilot fabrication.</p>`,
  Vendor: 'Maison Tavo',
  'Product category': p.category,
  Type: p.type,
  Tags: p.tags.join(', '),
  'Published on online store': 'FALSE',
  Status: 'draft',
  SKU: p.sku,
  'Option1 name': p.option[0],
  'Option1 value': p.option[1],
  Price: p.price.toFixed(2),
  'Compare-at price': '',
  'Cost per item': '',
  'Charge tax': 'TRUE',
  'Inventory tracker': 'shopify',
  'Inventory quantity': '0',
  'Continue selling when out of stock': 'DENY',
  'Weight value (grams)': '',
  'Weight unit for display': '',
  'Requires shipping': 'TRUE',
  'Fulfillment service': 'manual',
  'Product image URL': '',
  'Image position': '',
  'Image alt text': `${p.title} (${p.option[1]}) — production photography pending`,
  'Gift card': 'FALSE',
  'SEO title': `${p.title} | Maison Tavo`,
  'SEO description': p.summary,
  'Color (product.metafields.shopify.color-pattern)': p.color,
  'Google Shopping / Manufacturer part number (MPN)': p.sku,
  'Google Shopping / Ad group name': 'Maison Tavo Concept Catalogue',
  'Google Shopping / Ads labels': p.tags.slice(0, 3).join('; ').toLowerCase(),
  'Google Shopping / Condition': 'New',
  'Google Shopping / Custom product': 'TRUE',
  'Google Shopping / Custom label 0': p.lineup,
  'Google Shopping / Custom label 1': p.label1,
  'Google Shopping / Custom label 2': p.material.split(' + ')[0]!,
  'Google Shopping / Custom label 3': 'Prototype Alpha',
  'Google Shopping / Custom label 4': 'Draft',
}));

const specRows = extensions.map((p): Record<string, string> => ({
  SKU: p.sku,
  'URL handle': p.handle,
  Lineup: p.lineup,
  'Reference class': p.type.toLowerCase(),
  'Concept thesis': p.whyItExists,
  'Material architecture': p.material,
  'Food-contact strategy': p.foodContact,
  'Proposed fabrication route': 'Prototype each component separately; validate tolerances, thermal behaviour and food-contact surfaces before pilot assembly.',
  'Interaction / performance intent': p.use,
  'Care hypothesis': p.care,
  'Engineering risks': p.risks,
  'Required prototype tests': p.tests,
  'Agent intents': p.intents,
  'Negative constraints': p.constraints,
  'Benchmark logic': 'Fills a documented assortment gap while keeping brand range in collections and object identity in Shopify standard taxonomy. No benchmark performance is attributed.',
  'Claim status': 'CONCEPT_SPEC',
}));

const shopifyRes = upsertRows(SHOPIFY, shopifyRows, 'SKU');
const specsRes = upsertRows(SPECS, specRows, 'SKU');

const currentShopify = parseCsv(readFileSync(SHOPIFY, 'utf8'));
const shopifyHeader = currentShopify[0]!.map((cell) => cell.replace(/^\uFEFF/, ''));
const asObject = (row: string[]) =>
  Object.fromEntries(shopifyHeader.map((name, index) => [name, row[index] ?? '']));
const imageBriefHeader = [
  'SKU',
  'URL handle',
  'Title',
  'Lineup',
  'Category',
  'Asset status',
  'Hero shot brief',
  'Required delivery',
  'Approved image URL',
  'Alt text',
];
const imageBriefRows = currentShopify.slice(1).map(asObject).map((row) => [
  row.SKU,
  row['URL handle'],
  row.Title,
  row['Google Shopping / Custom label 0'],
  row['Google Shopping / Custom label 1'],
  row['Product image URL'] ? 'PLACEHOLDER_EXTERNAL — REPLACE BEFORE PUBLIC' : 'MISSING — PRODUCTION REQUIRED',
  `${row.Title} isolated three-quarter hero, warm alabaster sweep, soft north light, material junction and true surface texture clearly visible; no props obscuring the object.`,
  'Owned/licensed master; 4:5 portrait + 1:1 crop; 3200 px minimum long edge; Display-P3 or sRGB; AVIF/WebP derivatives; shadow and transparent-background cutout.',
  '',
  row['Image alt text'] || `${row.Title} product view`,
]);
writeFileSync(
  join(ROOT, 'data', 'maison-tavo-image-production-brief.csv'),
  `${serialize(imageBriefHeader)}\n${imageBriefRows.map(serialize).join('\n')}\n`,
);

console.log(
  `Catalog reconciliation: Shopify (+${shopifyRes.added} / ~${shopifyRes.updated}), specs (+${specsRes.added} / ~${specsRes.updated}), total ${currentShopify.length - 1} SKUs; image brief refreshed.`,
);
