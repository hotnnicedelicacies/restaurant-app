/**
 * Seed data — source of truth for the initial menu, categories, zones,
 * and settings. Loaded by `supabase/seed/seed.mjs`.
 *
 * Editable: yes, freely. The seed script is idempotent (upserts by slug),
 * so re-running picks up changes safely.
 */

export interface SeedCategory {
  slug: string;
  name: string;
  description?: string;
  displayOrder: number;
}

export interface SeedItem {
  slug: string;
  categorySlug: string;
  name: string;
  description: string;
  longDescription?: string;
  priceGbp: number;
  /** Filename relative to /assets/meals (e.g. `jollof-rice-with-protein-of-choice-and-plantain-1.png`). */
  imageFile: string;
  /** Optional extra gallery photos (same path convention). */
  galleryFiles?: string[];
  isAvailable?: boolean;
  isCodEligible?: boolean;
  isFeatured?: boolean;
  dietaryTags?: string[];
  allergenTags?: string[];
  badges?: string[];
  /** Customisation. See VariantsBlob/AddonsBlob in lib/supabase/types. */
  variants?: {
    groups: {
      name: string;
      isRequired: boolean;
      options: { label: string; priceDeltaGbp: number }[];
    }[];
  };
  addons?: {
    items: { label: string; description?: string; priceDeltaGbp: number }[];
  };
  displayOrder: number;
}

// ============================================================
// CATEGORIES
// ============================================================
export const CATEGORIES: SeedCategory[] = [
  { slug: 'rice', name: 'Rice', displayOrder: 1, description: 'Steamed, fried, jollof, ofada.' },
  { slug: 'pasta', name: 'Pasta', displayOrder: 2, description: 'Italian classics & the house plantain lasagna.' },
  { slug: 'grill', name: 'Grill', displayOrder: 3, description: 'Fire-roasted fish, suya, suya burger.' },
  { slug: 'soup', name: 'Soup', displayOrder: 4, description: 'Edikaikong, efo riro, banga, oha, and more.' },
  { slug: 'swallow', name: 'Swallow', displayOrder: 5, description: 'Pounded yam, fufu, garri.' },
  { slug: 'sides', name: 'Sides', displayOrder: 6, description: 'Stews, moi moi, abacha, okpa.' },
  { slug: 'snacks', name: 'Snacks & Party', displayOrder: 7, description: 'Small chops, puff puff, meat pie.' },
  { slug: 'breakfast', name: 'Breakfast', displayOrder: 8, description: 'Akara & akamu, oatmeal.' },
];

// Shared variant + addon templates — reduce repetition below
const PROTEIN_CHOICE = {
  name: 'Protein choice',
  isRequired: true,
  options: [
    { label: 'Chicken', priceDeltaGbp: 0 },
    { label: 'Beef', priceDeltaGbp: 0 },
    { label: 'Fish', priceDeltaGbp: 2 },
  ],
};

const SIZE_CHOICE = {
  name: 'Size',
  isRequired: true,
  options: [
    { label: 'Regular', priceDeltaGbp: 0 },
    { label: 'Large', priceDeltaGbp: 4 },
  ],
};

const STANDARD_ADDONS = {
  items: [
    { label: 'Extra plantain', description: 'Two extra slices, fried golden', priceDeltaGbp: 2 },
    { label: 'Side of moi moi', description: 'House moi moi — soft, savoury bean pudding', priceDeltaGbp: 3 },
    { label: 'Boiled egg', description: 'A whole boiled egg, halved', priceDeltaGbp: 1.5 },
  ],
};

// ============================================================
// ITEMS
// ============================================================
export const ITEMS: SeedItem[] = [
  // --- Rice ---
  {
    slug: 'jollof-rice-with-protein-and-plantain',
    categorySlug: 'rice',
    name: 'Jollof Rice with Plantain',
    description:
      'Fragrant tomato-based jollof with your choice of chicken, beef or fish, alongside caramelised plantain.',
    longDescription:
      'Our jollof, made the way we make it at home — fragrant tomato-pepper base, par-boiled long-grain rice steamed slowly so the flavour reaches every grain. Plated with your choice of protein and a generous side of caramelised ripe plantain.',
    priceGbp: 10,
    imageFile: 'jollof-rice-with-protein-of-choice-and-plantain-1.png',
    galleryFiles: ['jollof-rice-with-protein-of-choice-and-plantain.jpeg'],
    isFeatured: true,
    badges: ['Signature'],
    dietaryTags: ['gluten-free', 'spicy'],
    variants: { groups: [PROTEIN_CHOICE, SIZE_CHOICE] },
    addons: STANDARD_ADDONS,
    displayOrder: 1,
  },
  {
    slug: 'ofada-rice-and-ayamase-sauce',
    categorySlug: 'rice',
    name: 'Ofada Rice & Ayamase Sauce',
    description:
      'Unpolished, locally-grown rice paired with a bold, smoky green pepper sauce — deeply flavourful.',
    priceGbp: 15,
    imageFile: 'ofada-rice-and-ayamase-sauce-1.png',
    dietaryTags: ['spicy'],
    displayOrder: 2,
  },
  {
    slug: 'fried-rice',
    categorySlug: 'rice',
    name: 'Fried Rice',
    description: 'Stir-fried rice loaded with colourful vegetables, prawns, and savoury seasoning.',
    priceGbp: 12,
    imageFile: 'fried-rice-1.png',
    allergenTags: ['contains seafood'],
    displayOrder: 3,
  },
  {
    slug: 'white-rice-and-stew',
    categorySlug: 'rice',
    name: 'White Rice & Stew',
    description: 'Fluffy steamed white rice paired with a hearty, slow-cooked tomato-based stew.',
    priceGbp: 12,
    imageFile: 'white-rice-and-stew.jpeg',
    variants: { groups: [PROTEIN_CHOICE] },
    displayOrder: 4,
  },

  // --- Pasta ---
  {
    slug: 'plantain-lasagna',
    categorySlug: 'pasta',
    name: 'Plantain Lasagna',
    description:
      'A house twist on classic lasagna — sweet ripe plantain in place of pasta, layered with seasoned mince and béchamel, baked golden.',
    priceGbp: 25,
    imageFile: 'plantain-lasagna.jpeg',
    isFeatured: true,
    badges: ['House signature'],
    allergenTags: ['contains dairy'],
    displayOrder: 1,
  },
  {
    slug: 'lasagna',
    categorySlug: 'pasta',
    name: 'Classic Lasagna',
    description: 'Oven-baked pasta layered with rich meat sauce, creamy béchamel, and golden melted cheese.',
    priceGbp: 20,
    imageFile: 'lasagna-1.png',
    allergenTags: ['contains dairy', 'contains gluten'],
    displayOrder: 2,
  },
  {
    slug: 'spaghetti-bolognaise',
    categorySlug: 'pasta',
    name: 'Spaghetti Bolognaise',
    description: 'Classic spaghetti topped with a rich, slow-cooked meat sauce and aromatic herbs.',
    priceGbp: 20,
    imageFile: 'spaghetti-bolognaise.jpeg',
    allergenTags: ['contains gluten'],
    displayOrder: 3,
  },

  // --- Grill ---
  {
    slug: 'roasted-tilapia-fish',
    categorySlug: 'grill',
    name: 'Roasted Tilapia Platter',
    description:
      'Whole tilapia marinated in peppers and spices, fire-roasted to a crispy finish, with seasoned sides.',
    priceGbp: 25,
    imageFile: 'roasted-tilapia-fish.jpeg',
    isFeatured: true,
    dietaryTags: ['spicy', 'pescatarian'],
    displayOrder: 1,
  },
  {
    slug: 'roasted-yam-and-plantain-with-tilapia',
    categorySlug: 'grill',
    name: 'Roasted Yam & Tilapia',
    description:
      'Fire-roasted yam and plantain served alongside seasoned grilled tilapia — a classic combination, bold flavour.',
    priceGbp: 30,
    imageFile: 'roasted-yam-and-plantain-with-tilapia-fish.jpeg',
    dietaryTags: ['pescatarian'],
    displayOrder: 2,
  },
  {
    slug: 'suya',
    categorySlug: 'grill',
    name: 'Suya Sticks',
    description: 'Smoky, peppery grilled beef skewers in a bold spice blend, with sliced onions and tomatoes.',
    priceGbp: 5,
    imageFile: 'suya.jpeg',
    isFeatured: true,
    dietaryTags: ['spicy', 'shareable'],
    displayOrder: 3,
  },
  {
    slug: 'suya-burger',
    categorySlug: 'grill',
    name: 'Suya Burger',
    description:
      'A bold fusion burger stacked with a spiced grilled beef patty, caramelised onions, fresh toppings, toasted bun.',
    priceGbp: 15,
    imageFile: 'suya-burger.jpeg',
    badges: ['Fusion'],
    dietaryTags: ['spicy'],
    allergenTags: ['contains gluten'],
    displayOrder: 4,
  },

  // --- Soup ---
  {
    slug: 'edikaikong',
    categorySlug: 'soup',
    name: 'Edikaikong',
    description:
      'Highly nutritious leafy green soup packed with ugu and waterleaf, loaded with seafood and assorted meat.',
    priceGbp: 15,
    imageFile: 'edikaikong-1.png',
    isFeatured: true,
    dietaryTags: ['high-protein'],
    allergenTags: ['contains seafood'],
    displayOrder: 1,
  },
  {
    slug: 'afang-soup',
    categorySlug: 'soup',
    name: 'Afang Soup',
    description:
      'A delicate, earthy soup made with afang leaves, waterleaf, and assorted proteins — layered, complex flavour.',
    priceGbp: 15,
    imageFile: 'afang-soup-1.png',
    dietaryTags: ['high-protein'],
    displayOrder: 2,
  },
  {
    slug: 'oha-soup',
    categorySlug: 'soup',
    name: 'Oha Soup',
    description:
      'Delicate, earthy soup with tender oha leaves and cocoyam thickener, rich with assorted meats.',
    priceGbp: 15,
    imageFile: 'oha-soup.jpeg',
    displayOrder: 3,
  },
  {
    slug: 'banga-soup',
    categorySlug: 'soup',
    name: 'Banga Soup',
    description: 'Thick, aromatic palm-nut soup slow-cooked with fresh fish and hand-picked spices.',
    priceGbp: 10,
    imageFile: 'banga-soup-1.png',
    dietaryTags: ['pescatarian'],
    displayOrder: 4,
  },
  {
    slug: 'efo-riro',
    categorySlug: 'soup',
    name: 'Efo Riro',
    description: 'A rich, hearty spinach stew loaded with assorted meats, smoked fish, and aromatic peppers.',
    priceGbp: 10,
    imageFile: 'efo-riro-1.png',
    dietaryTags: ['spicy'],
    displayOrder: 5,
  },
  {
    slug: 'okra-soup',
    categorySlug: 'soup',
    name: 'Okra Soup',
    description: 'Silky, draw okra soup cooked with assorted meat and seafood — warming, wholesome, full of depth.',
    priceGbp: 10,
    imageFile: 'okra-soup.jpeg',
    displayOrder: 6,
  },
  {
    slug: 'ofe-akwu',
    categorySlug: 'soup',
    name: 'Ofe Akwu',
    description: 'Rich, flavourful palm-nut soup simmered with assorted meat and crayfish — warming, deeply comforting.',
    priceGbp: 10,
    imageFile: 'ofe-akwu-1.png',
    displayOrder: 7,
  },
  {
    slug: 'ogbono',
    categorySlug: 'soup',
    name: 'Ogbono Soup',
    description: 'Draw soup made from ground ogbono seeds with a soy-enriched twist — thick, hearty, deeply satisfying.',
    priceGbp: 10,
    imageFile: 'ogbono-soy-1.png',
    displayOrder: 8,
  },

  // --- Swallow ---
  {
    slug: 'pounded-yam',
    categorySlug: 'swallow',
    name: 'Pounded Yam',
    description: 'Silky, smooth yam dough pounded to perfection — pair with any rich soup.',
    priceGbp: 7,
    imageFile: 'pounded-yam.jpeg',
    displayOrder: 1,
  },
  {
    slug: 'fufu',
    categorySlug: 'swallow',
    name: 'Fufu',
    description: 'Smooth, stretchy cassava dough — soft, satisfying, perfect with any hearty soup.',
    priceGbp: 8,
    imageFile: 'fufu-1.png',
    displayOrder: 2,
  },
  {
    slug: 'garri',
    categorySlug: 'swallow',
    name: 'Garri',
    description: 'Light cassava flakes served with cold water, sugar, groundnuts, and milk — a wholesome snack.',
    priceGbp: 5,
    imageFile: 'garri-1.png',
    displayOrder: 3,
  },

  // --- Sides ---
  {
    slug: 'abacha',
    categorySlug: 'sides',
    name: 'Special Abacha (African Salad)',
    description: 'Vibrant salad of shredded dried cassava, palm oil, garden eggs, fermented beans, and crayfish.',
    priceGbp: 15,
    imageFile: 'abacha-1.png',
    displayOrder: 1,
  },
  {
    slug: 'moi-moi',
    categorySlug: 'sides',
    name: 'Moi Moi',
    description: 'Steamed bean pudding made with blended black-eyed peas, peppers, onions, and a choice of fillings.',
    priceGbp: 3,
    imageFile: 'moi-moi-1.png',
    dietaryTags: ['vegetarian-option'],
    displayOrder: 2,
  },
  {
    slug: 'tomato-stew',
    categorySlug: 'sides',
    name: 'Tomato Stew',
    description: 'Classic tomato-based stew slow-cooked with blended peppers, onions, and your choice of protein.',
    priceGbp: 8,
    imageFile: 'tomato-stew.jpeg',
    variants: { groups: [PROTEIN_CHOICE] },
    displayOrder: 3,
  },
  {
    slug: 'okpa',
    categorySlug: 'sides',
    name: 'Okpa',
    description: 'Dense, satisfying Bambara nut pudding steamed to perfection — wholesome, filling, full of flavour.',
    priceGbp: 5,
    imageFile: 'okpa.jpeg',
    dietaryTags: ['vegetarian'],
    displayOrder: 4,
  },

  // --- Snacks & Party ---
  {
    slug: 'small-chops',
    categorySlug: 'snacks',
    name: 'Small Chops Platter',
    description: 'An assorted platter of bite-sized party favourites: puff-puff, samosa, spring rolls, and peppered chicken.',
    priceGbp: 25,
    imageFile: 'small-chops.jpeg',
    isFeatured: true,
    dietaryTags: ['shareable', 'party'],
    displayOrder: 1,
  },
  {
    slug: 'puff-puff',
    categorySlug: 'snacks',
    name: 'Puff Puff Platter',
    description: 'Soft, golden deep-fried dough balls — light, lightly sweetened, impossible to resist.',
    priceGbp: 10,
    imageFile: 'puff-puff.jpeg',
    dietaryTags: ['vegetarian', 'shareable'],
    displayOrder: 2,
  },
  {
    slug: 'meat-pie',
    categorySlug: 'snacks',
    name: 'Meat Pie',
    description: 'Flaky, golden pastry filled with seasoned minced meat, diced potatoes and carrots — a satisfying baked treat.',
    priceGbp: 2,
    imageFile: 'meat-pie-1.png',
    allergenTags: ['contains gluten'],
    displayOrder: 3,
  },

  // --- Breakfast ---
  {
    slug: 'akara-and-akamu',
    categorySlug: 'breakfast',
    name: 'Special Akara & Akamu',
    description: 'Crispy deep-fried bean cakes paired with smooth, warm fermented corn porridge — hearty, comforting.',
    priceGbp: 15,
    imageFile: 'akara-and-akamu-1.png',
    dietaryTags: ['vegetarian'],
    displayOrder: 1,
  },
  {
    slug: 'oatmeal',
    categorySlug: 'breakfast',
    name: 'Oatmeal',
    description: 'Creamy, slow-cooked oats served warm — a wholesome, filling way to start the day.',
    priceGbp: 5,
    imageFile: 'oatmeal-1.png',
    dietaryTags: ['vegetarian', 'vegan-option'],
    displayOrder: 2,
  },
];

// ============================================================
// DELIVERY ZONES (default seeds — admin can edit later)
// ============================================================
export const DELIVERY_ZONES = [
  {
    name: 'Middlesbrough Central',
    postcodes: ['TS1', 'TS2', 'TS3', 'TS4', 'TS5'],
    baseFeeGbp: 5,
    minOrderGbp: 10,
    prepTimeMin: 30,
    prepTimeMax: 45,
    isQuoted: false,
    allowsCod: true,
    isActive: true,
    displayOrder: 1,
  },
  {
    name: 'Stockton-on-Tees',
    postcodes: ['TS17', 'TS18', 'TS19', 'TS20'],
    baseFeeGbp: 6.5,
    minOrderGbp: 15,
    prepTimeMin: 40,
    prepTimeMax: 55,
    isQuoted: false,
    allowsCod: true,
    isActive: true,
    displayOrder: 2,
  },
  {
    name: 'Redcar',
    postcodes: ['TS10', 'TS11'],
    baseFeeGbp: 7,
    minOrderGbp: 15,
    prepTimeMin: 45,
    prepTimeMax: 60,
    isQuoted: false,
    allowsCod: false,
    isActive: true,
    displayOrder: 3,
  },
  {
    name: 'Thornaby',
    postcodes: ['TS17'],
    baseFeeGbp: 5.5,
    minOrderGbp: 12,
    prepTimeMin: 35,
    prepTimeMax: 50,
    isQuoted: false,
    allowsCod: true,
    isActive: true,
    displayOrder: 4,
  },
  {
    name: 'Billingham',
    postcodes: ['TS22', 'TS23'],
    baseFeeGbp: 6,
    minOrderGbp: 15,
    prepTimeMin: 45,
    prepTimeMax: 60,
    isQuoted: false,
    allowsCod: true,
    isActive: true,
    displayOrder: 5,
  },
];

// ============================================================
// SETTINGS (key-value store)
// ============================================================
export const SETTINGS: { key: string; value: unknown }[] = [
  {
    key: 'business_hours',
    value: {
      opening_days: ['Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      opening_time: '12:00',
      closing_time: '20:00',
      same_day_cutoff: '10:00',
      closed_override_message: '',
    },
  },
  {
    key: 'contact',
    value: {
      business_name: 'Hot N Nice Delicacies',
      phone: '+44 7776 320068',
      whatsapp: '447776320068',
      email: 'hotnnicedelicacies@gmail.com',
      business_address: 'Hot N Nice Delicacies · Middlesbrough, North Yorkshire, UK',
      instagram_url: 'https://instagram.com/hotnnicedelicacies',
      facebook_url: 'https://facebook.com/hotnnicedelicacies',
      tiktok_url: '',
    },
  },
  {
    key: 'hygiene',
    value: {
      rating: 5,
      rating_label: 'Very Good',
      authority: 'Food Standards Agency',
      verify_url: 'https://ratings.food.gov.uk/business/1913815/hot-n-nice-delicacies',
      inspected_on: null,
    },
  },
  {
    key: 'flags',
    value: {
      pickup_enabled: false,
      cod_enabled_globally: true,
      accept_new_orders: true,
      show_kitchen_story_section: true,
    },
  },
  {
    key: 'payment',
    value: {
      statement_descriptor: 'HOT N NICE MIDDLEBRO',
      cod_collection_message: 'Cash received from customer',
    },
  },
];
