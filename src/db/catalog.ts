import { desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import {
  orders,
  products,
  storeSettings,
  type OrderItemRecord,
  type ProductColorVariant,
} from './schema.ts';

export const DEFAULT_BRAND_NAME = 'BK Store';
export const DEFAULT_TOP_ANNOUNCEMENT = 'All things under the 1 Roof with 100% Free Home delivery';
export const DEFAULT_WHATSAPP_WA = '923705776869';
export const DEFAULT_WHATSAPP_DISPLAY = '03705776869';
export const DEFAULT_TICKER_TEXT = '7 PIECES - NO RESTOCKS - NEW DROPS · 100% FREE HOME DELIVERY';

const ADULT_SIZES = ['S', 'M', 'L', 'XL'];
const KIDS_SIZES = ['4-5Y', '6-7Y', '8-9Y', '10-12Y', '13-14Y'];
const SHOE_SIZES = ['EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44'];

const DARK_GARMENT_COLORS: ProductColorVariant[] = [
  { name: 'Obsidian Black', hex: '#17171a', isDefault: true },
  { name: 'Forest Olive', hex: '#4b5c42' },
  { name: 'Crimson', hex: '#9b2c2c' },
  { name: 'Cobalt Navy', hex: '#1e3a8a' },
  { name: 'Sand Cream', hex: '#d6cbb8' },
  { name: 'Burnt Orange', hex: '#d9531e' },
];

const LIGHT_GARMENT_COLORS: ProductColorVariant[] = [
  { name: 'Heather Stone', hex: '#d8d2c7', isDefault: true },
  { name: 'Obsidian Black', hex: '#17171a' },
  { name: 'Sage Olive', hex: '#55684d' },
  { name: 'Midnight Navy', hex: '#1e3a8a' },
  { name: 'Terracotta', hex: '#c2410c' },
  { name: 'Charcoal', hex: '#3f3f46' },
];

const OLIVE_GARMENT_COLORS: ProductColorVariant[] = [
  { name: 'Olive Slate', hex: '#4e5a42', isDefault: true },
  { name: 'Obsidian Black', hex: '#17171a' },
  { name: 'Sand Khaki', hex: '#cbbba0' },
  { name: 'Cobalt Navy', hex: '#1e3a8a' },
  { name: 'Crimson', hex: '#991b1b' },
];

const DENIM_COLORS: ProductColorVariant[] = [
  { name: 'Indigo Wash', hex: '#243554', isDefault: true },
  { name: 'Washed Black', hex: '#1f2024' },
  { name: 'Vintage Olive', hex: '#4e5a42' },
  { name: 'Bone Cream', hex: '#e5dfd3' },
];

const SHOE_DARK_COLORS: ProductColorVariant[] = [
  { name: 'Matte Black', hex: '#17171a', isDefault: true },
  { name: 'Desert Sand', hex: '#c7b8a1' },
  { name: 'Crimson Red', hex: '#991b1b' },
  { name: 'Slate Blue', hex: '#2b4c7e' },
  { name: 'Olive Fog', hex: '#4f5d43' },
  { name: 'Chalk White', hex: '#ebe9e4' },
];

const SHOE_CHALK_COLORS: ProductColorVariant[] = [
  { name: 'Chalk White', hex: '#ebe8e0', isDefault: true },
  { name: 'Triple Black', hex: '#18181b' },
  { name: 'Burgundy', hex: '#7f1d1d' },
  { name: 'Cobalt Court', hex: '#1d4ed8' },
  { name: 'Sage Mint', hex: '#5f7a61' },
];

const ORANGE_MULE_COLORS: ProductColorVariant[] = [
  { name: 'Burnt Orange', hex: '#eb5e1d', isDefault: true },
  { name: 'Stealth Black', hex: '#18181b' },
  { name: 'Bone Cream', hex: '#e5dfd3' },
  { name: 'Olive Moss', hex: '#4b5c42' },
];

const SEED_PRODUCTS = [
  // ================= ADULTS CLOTHING =================
  {
    slug: 'rack-team-tank',
    name: 'RACK TEAM TANK',
    audience: 'adults',
    category: 'tanks',
    priceUsd: 38,
    pricePkr: 3499,
    description:
      '280GSM ribbed combed cotton athletic tank in matte black. Chest wordmark print & tonal woven back mark. Strictly 7 pieces produced.',
    frontImage: '/src/assets/images/rack_tank_front_1795170262729.jpg',
    backImage: '/src/assets/images/rack_tank_back_1795170262389.jpg',
    sizes: ADULT_SIZES,
    colors: DARK_GARMENT_COLORS,
    stockCount: 7,
    featured: true,
    isActive: true,
  },
  {
    slug: 'archive-box-tee',
    name: 'ARCHIVE BOX TEE',
    audience: 'adults',
    category: 'tees',
    priceUsd: 45,
    pricePkr: 4199,
    description:
      '310GSM enzyme-washed charcoal heavyweight jersey with dropped shoulders, thick ribbed collar, and oversized studio back print.',
    frontImage: '/src/assets/images/archive_tee_front_1795170261577.jpg',
    backImage: '/src/assets/images/archive_tee_back_1795170262714.jpg',
    sizes: ADULT_SIZES,
    colors: DARK_GARMENT_COLORS,
    stockCount: 7,
    featured: true,
    isActive: true,
  },
  {
    slug: 'studio-fleece-hoodie',
    name: 'STUDIO FLEECE HOODIE',
    audience: 'adults',
    category: 'hoodies',
    priceUsd: 88,
    pricePkr: 8499,
    description:
      '480GSM heavyweight French terry pullover hoodie in matte obsidian black with double-lined hood and minimal embroidered chest crest.',
    frontImage: '/src/assets/images/adult_hoodie_front_1795172535772.jpg',
    backImage: '/src/assets/images/adult_hoodie_back_1795173299616.jpg',
    sizes: ADULT_SIZES,
    colors: DARK_GARMENT_COLORS,
    stockCount: 7,
    featured: true,
    isActive: true,
  },
  {
    slug: 'apex-ma1-bomber-jacket',
    name: 'APEX MA-1 BOMBER JACKET',
    audience: 'adults',
    category: 'jackets',
    priceUsd: 135,
    pricePkr: 12499,
    description:
      'Water-repellent ballistic nylon flight bomber with brushed chrome two-way hardware, sleeve utility pocket, and quilted thermal lining.',
    frontImage: '/src/assets/images/adult_jacket_front_1795172535055.jpg',
    backImage: '/src/assets/images/adult_jacket_back_1795173298885.jpg',
    sizes: ADULT_SIZES,
    colors: DARK_GARMENT_COLORS,
    stockCount: 5,
    featured: true,
    isActive: true,
  },
  {
    slug: 'tactical-cargo-pant',
    name: 'TACTICAL CARGO PANT',
    audience: 'adults',
    category: 'cargos',
    priceUsd: 78,
    pricePkr: 7299,
    description:
      'Washed slate ripstop wide-leg cargo trousers engineered with pleated 3D bellow pockets and shock-cord ankle toggles.',
    frontImage: '/src/assets/images/adult_cargo_front_1795172535882.jpg',
    backImage: '/src/assets/images/adult_cargo_back_1795173299682.jpg',
    sizes: ADULT_SIZES,
    colors: OLIVE_GARMENT_COLORS,
    stockCount: 7,
    featured: true,
    isActive: true,
  },
  {
    slug: 'stone-crewneck-sweat',
    name: 'STONE CREWNECK SWEAT',
    audience: 'adults',
    category: 'sweatshirts',
    priceUsd: 72,
    pricePkr: 6799,
    description:
      '420GSM heather stone boxy crewneck sweatshirt with dropped sleeves, reverse-weave side gussets, and crisp chest embroidery.',
    frontImage: '/src/assets/images/adult_crewneck_front_1795172554111.jpg',
    backImage: '/src/assets/images/adult_crewneck_back_1795173299604.jpg',
    sizes: ADULT_SIZES,
    colors: LIGHT_GARMENT_COLORS,
    stockCount: 7,
    featured: true,
    isActive: true,
  },
  {
    slug: 'selvedge-denim-trucker',
    name: 'SELVEDGE DENIM TRUCKER',
    audience: 'adults',
    category: 'jackets',
    priceUsd: 128,
    pricePkr: 11999,
    description:
      '14oz vintage enzyme-washed dark indigo trucker jacket cut in a relaxed boxy block with matte black hardware.',
    frontImage: '/src/assets/images/adult_denim_front_1795172553895.jpg',
    backImage: '/src/assets/images/adult_denim_back_1795173299649.jpg',
    sizes: ADULT_SIZES,
    colors: DENIM_COLORS,
    stockCount: 6,
    featured: true,
    isActive: true,
  },
  {
    slug: 'mesh-studio-shorts',
    name: 'MESH STUDIO SHORTS',
    audience: 'adults',
    category: 'shorts',
    priceUsd: 42,
    pricePkr: 3899,
    description:
      'Double-layered breathable heavyweight mesh court shorts with natural cotton rope drawstring and zip side stash pockets.',
    frontImage: '/src/assets/images/adult_shorts_front_1795172535654.jpg',
    backImage: '/src/assets/images/adult_shorts_back_1795173298848.jpg',
    sizes: ADULT_SIZES,
    colors: DARK_GARMENT_COLORS,
    stockCount: 7,
    featured: false,
    isActive: true,
  },

  // ================= KIDS (JUNIOR) CLOTHING =================
  {
    slug: 'jr-stripe-zip-hoodie',
    name: 'JR. STRIPE ZIP HOODIE',
    audience: 'kids',
    category: 'hoodies',
    priceUsd: 52,
    pricePkr: 4799,
    description:
      'Soft-brushed charcoal fleece zip hoodie for kids with signature burnt-orange racing stripe down the sleeves and durable metal zipper.',
    frontImage: '/src/assets/images/kids_hoodie_front_1795172535085.jpg',
    backImage: '/src/assets/images/kids_hoodie_back_1795173299305.jpg',
    sizes: KIDS_SIZES,
    colors: DARK_GARMENT_COLORS,
    stockCount: 7,
    featured: true,
    isActive: true,
  },
  {
    slug: 'urban-trails-jr-tee',
    name: 'URBAN TRAILS JR. TEE',
    audience: 'kids',
    category: 'tees',
    priceUsd: 28,
    pricePkr: 2499,
    description:
      'Breathable 240GSM organic cream cotton boxy t-shirt for kids featuring bold street stencil chest artwork.',
    frontImage: '/src/assets/images/kids_tee_front_1795172535802.jpg',
    backImage: '/src/assets/images/kids_tee_back_1795173299203.jpg',
    sizes: KIDS_SIZES,
    colors: LIGHT_GARMENT_COLORS,
    stockCount: 7,
    featured: true,
    isActive: true,
  },
  {
    slug: 'jr-tracksuit-two-piece',
    name: 'JR. TRACKSUIT TWO-PIECE',
    audience: 'kids',
    category: 'tracksuits',
    priceUsd: 68,
    pricePkr: 6299,
    description:
      'Complete two-piece junior tracksuit set in jet black with contrast burnt-orange piping across crewneck sweatshirt and tapered joggers.',
    frontImage: '/src/assets/images/kids_tracksuit_front_1795172535867.jpg',
    backImage: '/src/assets/images/kids_tracksuit_back_1795173323781.jpg',
    sizes: KIDS_SIZES,
    colors: DARK_GARMENT_COLORS,
    stockCount: 7,
    featured: true,
    isActive: true,
  },
  {
    slug: 'jr-utility-cargo-joggers',
    name: 'JR. UTILITY CARGO JOGGERS',
    audience: 'kids',
    category: 'cargos',
    priceUsd: 44,
    pricePkr: 3999,
    description:
      'Durable olive-slate cotton twill kids cargo joggers with stretch comfort waistband, cuffed ankles, and snap-button thigh pockets.',
    frontImage: '/src/assets/images/kids_cargo_front_1795172554944.jpg',
    backImage: '/src/assets/images/kids_cargo_back_1795173323830.jpg',
    sizes: KIDS_SIZES,
    colors: OLIVE_GARMENT_COLORS,
    stockCount: 7,
    featured: true,
    isActive: true,
  },
  {
    slug: 'jr-quilted-puffer-jacket',
    name: 'JR. QUILTED PUFFER JACKET',
    audience: 'kids',
    category: 'jackets',
    priceUsd: 74,
    pricePkr: 6899,
    description:
      'Lightweight insulated kids puffer jacket in matte obsidian black with windproof stand collar and soft micro-fleece pockets.',
    frontImage: '/src/assets/images/kids_puffer_front_1795172556912.jpg',
    backImage: '/src/assets/images/kids_puffer_back_1795173323508.jpg',
    sizes: KIDS_SIZES,
    colors: DARK_GARMENT_COLORS,
    stockCount: 6,
    featured: true,
    isActive: true,
  },

  // ================= FOOTWEAR ARCHIVE =================
  {
    slug: 'stealth-runner-01',
    name: 'STEALTH RUNNER 01',
    audience: 'adults',
    category: 'shoes',
    priceUsd: 125,
    pricePkr: 11499,
    description:
      'Technical matte black mesh and suede runner with quick-draw toggle lacing, reflective heel pull, and dual-density sculpted shock sole.',
    frontImage: '/src/assets/images/shoe_runner_black_1795171483889.jpg',
    backImage: '/src/assets/images/shoe_runner_back_1795173323766.jpg',
    sizes: SHOE_SIZES,
    colors: SHOE_DARK_COLORS,
    stockCount: 7,
    featured: true,
    isActive: true,
  },
  {
    slug: 'chalk-court-low',
    name: 'CHALK COURT LOW',
    audience: 'adults',
    category: 'shoes',
    priceUsd: 110,
    pricePkr: 9999,
    description:
      'Full-grain chalk leather court silhouette contrasted with jet-black overlays, perforated toebox, and vintage stitched rubber cupsole.',
    frontImage: '/src/assets/images/shoe_court_white_1795171483760.jpg',
    backImage: '/src/assets/images/shoe_court_back_1795173324125.jpg',
    sizes: SHOE_SIZES,
    colors: SHOE_CHALK_COLORS,
    stockCount: 7,
    featured: true,
    isActive: true,
  },
  {
    slug: 'slate-utility-boot',
    name: 'SLATE UTILITY BOOT',
    audience: 'adults',
    category: 'shoes',
    priceUsd: 145,
    pricePkr: 13499,
    description:
      'Heavyweight weather-treated ballistic nylon and nubuck combat boot featuring metal speed hooks and aggressive deep-lugged outsole.',
    frontImage: '/src/assets/images/shoe_boot_slate_1795171483848.jpg',
    backImage: '/src/assets/images/shoe_boot_back_1795173323381.jpg',
    sizes: SHOE_SIZES,
    colors: SHOE_DARK_COLORS,
    stockCount: 5,
    featured: true,
    isActive: true,
  },
  {
    slug: 'aura-foam-slip',
    name: 'AURA FOAM SLIP',
    audience: 'kids',
    category: 'shoes',
    priceUsd: 78,
    pricePkr: 6999,
    description:
      'Architectural molded EVA foam chassis paired with a burnt-orange stretch neoprene collar for effortless slip-on comfort (Adults & Kids sizing).',
    frontImage: '/src/assets/images/shoe_mule_orange_1795171484225.jpg',
    backImage: '/src/assets/images/shoe_mule_back_1795173323570.jpg',
    sizes: ['EU 34', 'EU 36', 'EU 38', 'EU 40', 'EU 42'],
    colors: ORANGE_MULE_COLORS,
    stockCount: 7,
    featured: true,
    isActive: true,
  },
];

let seedPromise: Promise<void> | null = null;

export async function ensureSeeded() {
  if (!seedPromise) {
    seedPromise = (async () => {
      try {
        const existing = await db.select({ id: products.id }).from(products).limit(1);
        if (existing.length === 0) {
          await db.insert(products).values(SEED_PRODUCTS).onConflictDoNothing({ target: products.slug });
        }

        const defaultSettings = [
          { key: 'brand_name', value: DEFAULT_BRAND_NAME },
          { key: 'top_announcement', value: DEFAULT_TOP_ANNOUNCEMENT },
          { key: 'whatsapp_number', value: DEFAULT_WHATSAPP_WA },
          { key: 'whatsapp_display', value: DEFAULT_WHATSAPP_DISPLAY },
          { key: 'ticker_text', value: DEFAULT_TICKER_TEXT },
          { key: 'admin_pin', value: 'admin123' },
        ];
        for (const s of defaultSettings) {
          await db.insert(storeSettings).values(s).onConflictDoNothing({ target: storeSettings.key });
        }
      } catch (error) {
        seedPromise = null;
        console.error('Database seed failed:', error);
        throw new Error('Failed to initialize catalog data.', { cause: error });
      }
    })();
  }
  return seedPromise;
}

export async function getPublicStorefrontData() {
  try {
    await ensureSeeded();
    const allProducts = await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(products.id);
    const settingsRows = await db.select().from(storeSettings);
    const settingsMap = Object.fromEntries(settingsRows.map((r) => [r.key, r.value]));

    return {
      products: allProducts,
      settings: {
        brandName: settingsMap.brand_name || DEFAULT_BRAND_NAME,
        topAnnouncement: settingsMap.top_announcement || DEFAULT_TOP_ANNOUNCEMENT,
        whatsappNumber: settingsMap.whatsapp_number || DEFAULT_WHATSAPP_WA,
        whatsappDisplay: settingsMap.whatsapp_display || DEFAULT_WHATSAPP_DISPLAY,
        tickerText: settingsMap.ticker_text || DEFAULT_TICKER_TEXT,
      },
    };
  } catch (error) {
    console.error('Storefront query failed:', error);
    throw new Error('Unable to load storefront catalog.', { cause: error });
  }
}

export async function createOrderRecord(input: {
  userId?: number | null;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItemRecord[];
  totalUsd: number;
  totalPkr: number;
  channel?: string;
}) {
  try {
    await ensureSeeded();
    const orderNumber = `BK-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const inserted = await db
      .insert(orders)
      .values({
        orderNumber,
        userId: input.userId ?? null,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerAddress: input.customerAddress,
        items: input.items,
        totalUsd: input.totalUsd,
        totalPkr: input.totalPkr,
        status: 'pending',
        channel: input.channel || 'whatsapp',
      })
      .returning();
    return inserted[0];
  } catch (error) {
    console.error('Order insert failed:', error);
    throw new Error('Unable to place order. Please try again.', { cause: error });
  }
}

export async function getUserOrders(userId: number) {
  try {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  } catch (error) {
    console.error('User orders query failed:', error);
    throw new Error('Unable to load order history.', { cause: error });
  }
}

export async function getAdminOverviewData() {
  try {
    await ensureSeeded();
    const [allProducts, allOrders, settingsRows] = await Promise.all([
      db.select().from(products).orderBy(desc(products.id)),
      db.select().from(orders).orderBy(desc(orders.createdAt)),
      db.select().from(storeSettings),
    ]);
    const settingsMap = Object.fromEntries(settingsRows.map((r) => [r.key, r.value]));

    const totalRevenuePkr = allOrders
      .filter((o) => o.status !== 'cancelled')
      .reduce((acc, o) => acc + o.totalPkr, 0);
    const totalRevenueUsd = allOrders
      .filter((o) => o.status !== 'cancelled')
      .reduce((acc, o) => acc + o.totalUsd, 0);

    return {
      products: allProducts,
      orders: allOrders,
      settings: {
        brandName: settingsMap.brand_name || DEFAULT_BRAND_NAME,
        topAnnouncement: settingsMap.top_announcement || DEFAULT_TOP_ANNOUNCEMENT,
        whatsappNumber: settingsMap.whatsapp_number || DEFAULT_WHATSAPP_WA,
        whatsappDisplay: settingsMap.whatsapp_display || DEFAULT_WHATSAPP_DISPLAY,
        tickerText: settingsMap.ticker_text || DEFAULT_TICKER_TEXT,
      },
      stats: {
        totalProducts: allProducts.length,
        adultsCount: allProducts.filter((p) => p.audience === 'adults' && p.category !== 'shoes').length,
        kidsCount: allProducts.filter((p) => p.audience === 'kids' && p.category !== 'shoes').length,
        shoesCount: allProducts.filter((p) => p.category === 'shoes').length,
        totalOrders: allOrders.length,
        pendingOrders: allOrders.filter((o) => o.status === 'pending').length,
        totalRevenueUsd,
        totalRevenuePkr,
      },
    };
  } catch (error) {
    console.error('Admin overview query failed:', error);
    throw new Error('Unable to load admin dashboard data.', { cause: error });
  }
}

export async function createProductRecord(input: {
  name: string;
  audience: string;
  category: string;
  priceUsd: number;
  pricePkr: number;
  description: string;
  frontImage: string;
  backImage?: string | null;
  sizes: string[];
  colors?: ProductColorVariant[];
  stockCount: number;
}) {
  try {
    const baseSlug = input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const slug = `${baseSlug || 'drop'}-${Date.now().toString(36)}`;
    const inserted = await db
      .insert(products)
      .values({
        slug,
        name: input.name.toUpperCase(),
        audience: input.audience === 'kids' ? 'kids' : 'adults',
        category: input.category,
        priceUsd: input.priceUsd,
        pricePkr: input.pricePkr,
        description: input.description,
        frontImage: input.frontImage,
        backImage: input.backImage || input.frontImage,
        sizes: input.sizes,
        colors: input.colors && input.colors.length > 0 ? input.colors : [],
        stockCount: input.stockCount,
        featured: true,
        isActive: true,
      })
      .returning();
    return inserted[0];
  } catch (error) {
    console.error('Product creation failed:', error);
    throw new Error('Failed to create product.', { cause: error });
  }
}

export async function updateProductRecord(
  id: number,
  patch: Partial<{
    name: string;
    audience: string;
    category: string;
    priceUsd: number;
    pricePkr: number;
    description: string;
    stockCount: number;
    isActive: boolean;
    sizes: string[];
    colors: ProductColorVariant[];
  }>
) {
  try {
    const updated = await db
      .update(products)
      .set(patch)
      .where(eq(products.id, id))
      .returning();
    return updated[0] ?? null;
  } catch (error) {
    console.error('Product update failed:', error);
    throw new Error('Failed to update product.', { cause: error });
  }
}

export async function deleteProductRecord(id: number) {
  try {
    const deleted = await db.delete(products).where(eq(products.id, id)).returning();
    return deleted[0] ?? null;
  } catch (error) {
    console.error('Product delete failed:', error);
    throw new Error('Failed to delete product.', { cause: error });
  }
}

export async function updateOrderStatusRecord(id: number, status: string) {
  try {
    const updated = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return updated[0] ?? null;
  } catch (error) {
    console.error('Order status update failed:', error);
    throw new Error('Failed to update order status.', { cause: error });
  }
}

export async function getStoreSetting(key: string) {
  try {
    const rows = await db.select().from(storeSettings).where(eq(storeSettings.key, key)).limit(1);
    return rows[0]?.value ?? null;
  } catch (error) {
    console.error('Setting fetch failed:', error);
    throw new Error('Failed to read store setting.', { cause: error });
  }
}

export async function setStoreSetting(key: string, value: string) {
  try {
    await db
      .insert(storeSettings)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: storeSettings.key,
        set: { value, updatedAt: new Date() },
      });
  } catch (error) {
    console.error('Setting update failed:', error);
    throw new Error('Failed to update store setting.', { cause: error });
  }
}
