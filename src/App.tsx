import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  Heart,
  Menu,
  MessageCircle,
  Package,
  Search,
  ShoppingBag,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { auth, googleAuthProvider } from './lib/firebase';
import type {
  AuthUser,
  CartItem,
  CategoryType,
  Product,
  ProductColorVariant,
  StoreSettings,
} from './types';
import { apiRequest, buildWhatsAppUrl } from './utils/api';
import { resolveColorAppearance } from './utils/color';
import { Rack3DCarousel } from './components/Rack3DCarousel';
import { ProductCard3D } from './components/ProductCard3D';
import { ShoeRack3D } from './components/ShoeRack3D';
import { ProductDetailView } from './components/ProductDetailView';
import { CartDrawer } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { SearchModal } from './components/SearchModal';
import { CustomerAccountModal } from './components/CustomerAccountModal';

const CART_STORAGE_KEY = 'offhook_cart_v2';
const WISHLIST_STORAGE_KEY = 'bk_store_wishlist_v1';

const ADULT_CATEGORIES: Array<{ id: 'all' | CategoryType; label: string }> = [
  { id: 'all', label: 'All Clothing' },
  { id: 'tanks', label: 'Tanks' },
  { id: 'tees', label: 'Tees' },
  { id: 'hoodies', label: 'Hoodies' },
  { id: 'sweatshirts', label: 'Sweatshirts' },
  { id: 'jackets', label: 'Jackets' },
  { id: 'cargos', label: 'Cargos' },
  { id: 'shorts', label: 'Shorts' },
];

const KIDS_CATEGORIES: Array<{ id: 'all' | CategoryType; label: string }> = [
  { id: 'all', label: 'All Kids' },
  { id: 'hoodies', label: 'Hoodies' },
  { id: 'tees', label: 'Tees' },
  { id: 'tracksuits', label: 'Tracksuits' },
  { id: 'cargos', label: 'Cargos' },
  { id: 'jackets', label: 'Jackets' },
];

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<StoreSettings>({
    brandName: 'BK Store',
    topAnnouncement: 'All things under the 1 Roof with 100% Free Home delivery',
    whatsappNumber: '923705776869',
    whatsappDisplay: '03705776869',
    tickerText: '7 PIECES - NO RESTOCKS - NEW DROPS · 100% FREE HOME DELIVERY',
  });
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState('');

  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [wishlistIds, setWishlistIds] = useState<number[]>(() => {
    try {
      const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'number') : [];
    } catch {
      return [];
    }
  });

  // UI Navigation & Filters
  const [activePdpProduct, setActivePdpProduct] = useState<Product | null>(null);
  const [activePdpColor, setActivePdpColor] = useState<string | null>(null);
  const [availabilityProduct, setAvailabilityProduct] = useState<Product | null>(null);
  const [adultCategory, setAdultCategory] = useState<'all' | CategoryType>('all');
  const [kidsCategory, setKidsCategory] = useState<'all' | CategoryType>('all');

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [trackerOpen, setTrackerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? '' : prev));
    }, 2600);
  }, []);

  const loadStorefront = useCallback(async () => {
    try {
      setCatalogError('');
      const data = await apiRequest<{ products: Product[]; settings: StoreSettings }>(
        '/api/storefront'
      );
      setProducts(data.products || []);
      if (data.settings) setSettings(data.settings);
    } catch (err) {
      setCatalogError(err instanceof Error ? err.message : 'Unable to load storefront.');
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  const refreshAuthUser = useCallback(async () => {
    if (!auth.currentUser) {
      setAuthUser(null);
      return;
    }
    try {
      const res = await apiRequest<{ user: AuthUser }>('/api/auth/me', { requireAuth: true });
      setAuthUser(res.user);
    } catch {
      setAuthUser(null);
    }
  }, []);

  useEffect(() => {
    loadStorefront();
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setAuthUser(null);
        return;
      }
      await refreshAuthUser();
    });
    return () => unsub();
  }, [loadStorefront, refreshAuthUser]);

  useEffect(() => {
    document.title = `${settings.brandName} — ${settings.topAnnouncement}`;
  }, [settings.brandName, settings.topAnnouncement]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore storage quota
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistIds));
    } catch {
      // ignore storage quota
    }
  }, [wishlistIds]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleAuthProvider);
      await refreshAuthUser();
      showToast('Signed in with Google');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Sign-in cancelled');
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setAuthUser(null);
    showToast('Signed out');
  };

  // Catalog Segmentation
  const adultClothing = useMemo(
    () => products.filter((p) => p.audience === 'adults' && p.category !== 'shoes'),
    [products]
  );

  const filteredAdultClothing = useMemo(
    () =>
      adultCategory === 'all'
        ? adultClothing
        : adultClothing.filter((p) => p.category === adultCategory),
    [adultClothing, adultCategory]
  );

  const kidsClothing = useMemo(
    () => products.filter((p) => p.audience === 'kids' && p.category !== 'shoes'),
    [products]
  );

  const filteredKidsClothing = useMemo(
    () =>
      kidsCategory === 'all'
        ? kidsClothing
        : kidsClothing.filter((p) => p.category === kidsCategory),
    [kidsClothing, kidsCategory]
  );

  const footwearList = useMemo(
    () => products.filter((p) => p.category === 'shoes'),
    [products]
  );

  const wishlistProducts = useMemo(() => {
    const productMap = new Map(products.map((p) => [p.id, p]));
    return wishlistIds
      .map((id) => productMap.get(id))
      .filter((p): p is Product => Boolean(p));
  }, [products, wishlistIds]);

  const handleToggleWishlist = useCallback(
    (product: Product) => {
      setWishlistIds((prev) => {
        const exists = prev.includes(product.id);
        if (exists) {
          showToast(`${product.name} removed from wishlist`);
          return prev.filter((id) => id !== product.id);
        }
        showToast(`${product.name} saved to wishlist`);
        return [product.id, ...prev];
      });
    },
    [showToast]
  );

  const handleClearWishlist = useCallback(() => {
    setWishlistIds([]);
    showToast('Wishlist cleared');
  }, [showToast]);

  const openProductDetail = useCallback((product: Product, colorName?: string) => {
    setActivePdpProduct(product);
    setActivePdpColor(colorName ?? null);
  }, []);

  // Cart Actions
  const handleAddToCart = (
    product: Product,
    size: string,
    color?: ProductColorVariant | null
  ) => {
    const resolvedColor = color ?? resolveColorAppearance(product).activeColor;
    const colorName = resolvedColor?.name;
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) =>
          item.productId === product.id &&
          item.size === size &&
          (item.color || '') === (colorName || '')
      );
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = { ...next[existingIdx], qty: next[existingIdx].qty + 1 };
        return next;
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          audience: product.audience,
          category: product.category,
          size,
          color: colorName,
          colorHex: resolvedColor?.hex,
          qty: 1,
          priceUsd: product.priceUsd,
          pricePkr: product.pricePkr,
          image: resolvedColor?.frontImage || product.frontImage,
        },
      ];
    });
    showToast(
      `${product.name} (${colorName ? `${colorName} · ${size}` : size}) added to bag`
    );
  };

  const handleQuickWhatsAppOrder = (
    product: Product,
    size: string,
    color?: ProductColorVariant | null
  ) => {
    const resolvedColor = color ?? resolveColorAppearance(product).activeColor;
    const msg = [
      `*${settings.brandName.toUpperCase()} INSTANT ORDER*`,
      `Item: ${product.name}`,
      `Section: ${product.audience.toUpperCase()} (${product.category.toUpperCase()})`,
      ...(resolvedColor ? [`Color: ${resolvedColor.name}`] : []),
      `Size: ${size}`,
      `Price: $${product.priceUsd} / Rs ${product.pricePkr}`,
      `Delivery: 100% Free Home Delivery`,
      '',
      `Please confirm availability and delivery details.`,
    ].join('\n');
    const url = buildWhatsAppUrl(settings.whatsappNumber, msg);
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const scrollToSection = (id: string) => {
    setActivePdpProduct(null);
    setActivePdpColor(null);
    setMobileMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 40);
  };

  const totalBagCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="min-h-dvh flex flex-col justify-between bg-white text-zinc-950 overflow-x-hidden">
      {/* ==================== TOP RUNNING ANNOUNCEMENT BAR ==================== */}
      <div className="ticker-wrapper w-full h-9 bg-zinc-950 text-white border-b border-white/10 overflow-hidden flex items-center">
        <div className="ticker-animate flex w-max items-center">
          {Array.from({ length: 8 }).map((_, i) => (
            <span
              key={i}
              className="font-display text-[11px] sm:text-xs font-bold uppercase tracking-[0.14em] whitespace-nowrap px-8 inline-flex items-center gap-3"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff5500]" />
              {settings.brandName} · {settings.topAnnouncement}
            </span>
          ))}
        </div>
      </div>

      {/* ==================== STICKY TOP HEADER ==================== */}
      <header className="sticky top-0 z-40 h-16 bg-white/95 backdrop-blur-md border-b border-black/10 px-4 sm:px-8 lg:px-12 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((p) => !p)}
            aria-label="Toggle Menu"
            className="md:hidden w-10 h-10 rounded-full flex items-center justify-center hover:bg-zinc-100"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('hero-rack')}
            className="font-display font-black text-xl sm:text-2xl tracking-[-0.04em] uppercase text-zinc-950 whitespace-nowrap"
          >
            {settings.brandName}
          </button>
        </div>

        <nav className="hidden md:flex items-center justify-center gap-5 lg:gap-7" aria-label="Main">
          {[
            { label: 'SHOP', target: 'hero-rack' },
            { label: 'ADULTS', target: 'adults-section' },
            { label: 'KIDS', target: 'kids-section' },
            { label: 'FOOTWEAR', target: 'footwear-section' },
            { label: 'CONTACT', target: 'contact-section' },
          ].map((nav) => (
            <button
              key={nav.label}
              type="button"
              onClick={() => scrollToSection(nav.target)}
              className="font-display text-xs font-bold uppercase tracking-[0.11em] text-zinc-900 hover:text-[#ff5500] transition-colors py-2"
            >
              {nav.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setTrackerOpen(true)}
            className="font-display text-xs font-bold uppercase tracking-[0.11em] text-zinc-900 hover:text-[#ff5500] transition-colors py-2"
          >
            TRACK ORDER
          </button>
        </nav>

        <div className="flex items-center justify-end gap-1.5 sm:gap-2.5">
          <button
            type="button"
            onClick={() => setAdminOpen(true)}
            className="font-display text-[11px] font-bold uppercase tracking-[0.08em] px-3 py-1.5 rounded-full border border-black/25 hover:bg-zinc-950 hover:text-white transition-colors"
          >
            ADMIN
          </button>

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Search products"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:bg-zinc-100"
          >
            <Search className="w-[18px] h-[18px]" />
          </button>

          <button
            type="button"
            onClick={() => setAccountOpen(true)}
            aria-label="Customer Account"
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:bg-zinc-100 ${
              authUser ? 'text-emerald-700' : ''
            }`}
          >
            <User className="w-[18px] h-[18px]" />
          </button>

          <button
            type="button"
            onClick={() => setWishlistOpen(true)}
            aria-label="Open Wishlist"
            title="Wishlist"
            className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:bg-zinc-100 transition-colors"
          >
            <Heart
              className={`w-[18px] h-[18px] ${
                wishlistProducts.length > 0 ? 'text-rose-600 fill-rose-600' : 'text-zinc-900'
              }`}
            />
            {wishlistProducts.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 font-mono-num text-[10px] font-bold min-w-[17px] h-[17px] px-1 rounded-full bg-rose-600 text-white inline-flex items-center justify-center">
                {wishlistProducts.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label="Open Bag"
            className="h-9 sm:h-10 px-2.5 rounded-full inline-flex items-center gap-1.5 hover:bg-zinc-100"
          >
            <ShoppingBag className="w-[18px] h-[18px]" />
            <span className="font-mono-num text-xs font-bold min-w-[20px] h-5 px-1.5 rounded-full bg-zinc-950 text-white inline-flex items-center justify-center">
              {totalBagCount}
            </span>
          </button>
        </div>
      </header>

      {/* Mobile Nav Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="md:hidden sticky top-16 z-30 bg-white border-b border-black/10 px-5 py-3 flex flex-col gap-1 shadow-md"
          >
            {[
              { label: 'SHOP ALL RACK', target: 'hero-rack' },
              { label: 'ADULTS (BARA) COLLECTION', target: 'adults-section' },
              { label: 'KIDS (JUNIOR 4–14Y)', target: 'kids-section' },
              { label: '3D SHOE RACK', target: 'footwear-section' },
              { label: 'WHATSAPP CONTACT', target: 'contact-section' },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => scrollToSection(item.target)}
                className="text-left font-display text-xs font-bold uppercase tracking-[0.1em] py-2.5 border-b border-black/5"
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setTrackerOpen(true);
              }}
              className="text-left font-display text-xs font-bold uppercase tracking-[0.1em] py-2.5 border-b border-black/5 flex items-center justify-between"
            >
              <span>TRACK ORDER STATUS</span>
              <Package className="w-4 h-4 text-[#ff5500]" />
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setWishlistOpen(true);
              }}
              className="text-left font-display text-xs font-bold uppercase tracking-[0.1em] py-2.5 flex items-center justify-between text-rose-600"
            >
              <span>SAVED WISHLIST ({wishlistProducts.length})</span>
              <Heart className={`w-4 h-4 ${wishlistProducts.length > 0 ? 'fill-rose-600' : ''}`} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== MAIN CONTENT OR PDP ==================== */}
      {activePdpProduct ? (
        <ProductDetailView
          product={activePdpProduct}
          initialColorName={activePdpColor}
          brandName={settings.brandName}
          whatsappDisplay={settings.whatsappDisplay}
          isWishlisted={wishlistIds.includes(activePdpProduct.id)}
          onToggleWishlist={handleToggleWishlist}
          onBack={() => {
            setActivePdpProduct(null);
            setActivePdpColor(null);
          }}
          onAddToCart={handleAddToCart}
          onQuickWhatsApp={handleQuickWhatsAppOrder}
        />
      ) : (
        <main className="flex-1 flex flex-col">
          {catalogError && (
            <div className="max-w-3xl mx-auto mt-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm text-center">
              {catalogError}
            </div>
          )}

          {/* 1. HERO 3D SILVER CLOTHING RACK */}
          <section id="hero-rack" className="pt-4 pb-10">
            {loadingCatalog ? (
              <div className="py-28 text-center font-display text-xs uppercase tracking-[0.14em] text-zinc-400">
                Loading 3D Studio Rack...
              </div>
            ) : (
              <Rack3DCarousel
                products={adultClothing.length > 0 ? adultClothing : products}
                wishlistIds={wishlistIds}
                onToggleWishlist={handleToggleWishlist}
                onOpenProduct={openProductDetail}
                onAddToCart={handleAddToCart}
                onSeeAvailability={(p) => setAvailabilityProduct(p)}
              />
            )}
            <p className="text-center font-display text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400 mt-3">
              DRAG RACK TO SLIDE · CLICK CENTER PIECE FOR 3D DETAIL PAGE
            </p>
          </section>

          {/* 2. SEPARATE ADULTS (BARA) 3D ANIMATED SECTION */}
          <motion.section
            id="adults-section"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.08 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-12 border-t border-black/10"
          >
            <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
              <div>
                <span className="inline-block font-display text-[11px] font-bold uppercase tracking-[0.14em] px-3 py-1 rounded-full bg-zinc-950 text-white mb-2">
                  ADULTS · MEN & WOMEN
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-zinc-950">
                  ADULTS CLOTHING ARCHIVE
                </h2>
                <p className="font-display text-xs uppercase tracking-[0.09em] text-zinc-500 mt-1">
                  TANKS · TEES · HOODIES · SWEATSHIRTS · JACKETS · CARGOS · SHORTS
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {ADULT_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setAdultCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-full font-display text-[11px] font-bold uppercase tracking-[0.06em] transition-colors ${
                      adultCategory === cat.id
                        ? 'bg-zinc-950 text-white'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredAdultClothing.length === 0 ? (
              <p className="text-center text-sm text-zinc-500 py-12">
                No adult clothing items in this category yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {filteredAdultClothing.map((prod, idx) => (
                  <ProductCard3D
                    key={prod.id}
                    product={prod}
                    index={idx}
                    isWishlisted={wishlistIds.includes(prod.id)}
                    onToggleWishlist={handleToggleWishlist}
                    onAddToCart={handleAddToCart}
                    onOpenProduct={openProductDetail}
                  />
                ))}
              </div>
            )}
          </motion.section>

          {/* 3. SEPARATE KIDS (JUNIOR 4-14Y) 3D ANIMATED SECTION + DEDICATED 3D RACK */}
          <motion.section
            id="kids-section"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.08 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="w-full bg-gradient-to-b from-zinc-50 via-orange-50/35 to-white border-t border-black/10 py-14"
          >
            {/* Interactive 3D Kids Clothing Rack */}
            <Rack3DCarousel
              title="KIDS 3D CLOTHING RACK"
              subtitle="BOYS & GIRLS STREETWEAR (AGES 4–14Y) · HOODIES · TEES · TRACKSUITS · CARGOS · PUFFERS"
              badgeText="KIDS · JUNIOR EDITION"
              accentColor="orange"
              compact
              products={kidsClothing}
              wishlistIds={wishlistIds}
              onToggleWishlist={handleToggleWishlist}
              onOpenProduct={openProductDetail}
              onAddToCart={handleAddToCart}
              onSeeAvailability={(p) => setAvailabilityProduct(p)}
            />

            {/* Kids 3D Cards Grid */}
            <div className="w-full max-w-6xl mx-auto px-4 sm:px-8 mt-12">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <h3 className="font-display text-lg font-extrabold uppercase tracking-[0.06em]">
                  BROWSE KIDS BY CATEGORY
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {KIDS_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setKidsCategory(cat.id)}
                      className={`px-3.5 py-1.5 rounded-full font-display text-[11px] font-bold uppercase tracking-[0.06em] transition-colors ${
                        kidsCategory === cat.id
                          ? 'bg-[#ff5500] text-black'
                          : 'bg-white border border-black/10 text-zinc-600 hover:border-zinc-950'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredKidsClothing.length === 0 ? (
                <p className="text-center text-sm text-zinc-500 py-10">
                  No kids items match this category yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {filteredKidsClothing.map((prod, idx) => (
                    <ProductCard3D
                      key={prod.id}
                      product={prod}
                      index={idx}
                      isWishlisted={wishlistIds.includes(prod.id)}
                      onToggleWishlist={handleToggleWishlist}
                      onAddToCart={handleAddToCart}
                      onOpenProduct={openProductDetail}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.section>

          {/* 4. 3D STEEL FOOTWEAR SHOE RACK */}
          <ShoeRack3D
            shoes={footwearList}
            wishlistIds={wishlistIds}
            onToggleWishlist={handleToggleWishlist}
            onOpenProduct={openProductDetail}
            onAddToCart={handleAddToCart}
            onOrderWhatsApp={handleQuickWhatsAppOrder}
          />

          {/* 5. 3D WHATSAPP CONCIERGE & STUDIO CONTACT SECTION */}
          <motion.section
            id="contact-section"
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-12"
          >
            <div className="rounded-3xl bg-zinc-950 text-white p-7 sm:p-11 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl overflow-hidden relative">
              <div className="relative z-10 max-w-xl">
                <span className="inline-flex items-center gap-1.5 font-display text-[11px] font-bold uppercase tracking-[0.14em] px-3 py-1 rounded-full bg-[#ff5500] text-black mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  {settings.brandName} · 100% FREE HOME DELIVERY
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight">
                  NEED CUSTOM SIZING OR EXPRESS DELIVERY?
                </h2>
                <p className="text-sm text-zinc-300 mt-2 leading-relaxed">
                  Order Adults clothing, Kids sets, or Footwear directly on WhatsApp. {settings.topAnnouncement}.
                </p>
              </div>

              <div className="relative z-10 flex flex-wrap items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setTrackerOpen(true)}
                  className="h-13 px-6 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-display text-xs sm:text-sm font-bold uppercase tracking-[0.08em] inline-flex items-center gap-2 transition-colors"
                >
                  <Package className="w-4 h-4 text-[#ff5500]" />
                  TRACK ORDER
                </button>

                <a
                  href={buildWhatsAppUrl(
                    settings.whatsappNumber,
                    `Assalam o Alaikum ${settings.brandName}! I would like to inquire / place an order.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-13 px-7 rounded-full bg-[#16a34a] hover:bg-[#15803d] text-white font-display text-xs sm:text-sm font-bold uppercase tracking-[0.08em] inline-flex items-center gap-2.5 shadow-lg transition-transform hover:-translate-y-0.5"
                >
                  <MessageCircle className="w-5 h-5" />
                  WHATSAPP: {settings.whatsappDisplay}
                </a>
              </div>
            </div>
          </motion.section>
        </main>
      )}

      {/* ==================== ORANGE TICKER BAR ==================== */}
      <footer className="ticker-wrapper w-full h-10 bg-[#ff5500] text-zinc-950 border-t border-black/10 overflow-hidden flex items-center">
        <div className="ticker-animate flex w-max">
          {Array.from({ length: 8 }).map((_, i) => (
            <span
              key={i}
              className="font-display text-xs font-extrabold uppercase tracking-[0.14em] whitespace-nowrap px-7"
            >
              {settings.tickerText}
            </span>
          ))}
        </div>
      </footer>

      {/* ==================== FLOATING WHATSAPP LOGO BUTTON ==================== */}
      <a
        href={buildWhatsAppUrl(
          settings.whatsappNumber,
          `Assalam o Alaikum ${settings.brandName}! I want to order from your clothing & footwear store.`
        )}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Chat on WhatsApp ${settings.whatsappDisplay}`}
        title={`WhatsApp: ${settings.whatsappDisplay}`}
        className="fixed bottom-14 right-5 z-40 w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1ebe57] text-white shadow-[0_10px_28px_rgba(37,211,102,0.45)] flex items-center justify-center transition-transform duration-200 hover:scale-110 active:scale-95"
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 32 32"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M16.004 2.667C8.64 2.667 2.67 8.636 2.67 16c0 2.352.615 4.648 1.784 6.671L2.667 29.333l6.827-1.789A13.28 13.28 0 0 0 16.004 29.333C23.368 29.333 29.337 23.364 29.337 16S23.368 2.667 16.004 2.667Zm0 24.427a11.04 11.04 0 0 1-5.636-1.545l-.404-.24-4.051 1.062 1.081-3.949-.263-.419a11.028 11.028 0 0 1-1.693-5.903c0-6.112 4.972-11.084 11.084-11.084 6.111 0 11.083 4.972 11.083 11.084 0 6.111-4.972 11.094-11.201 11.094Zm6.077-8.303c-.333-.167-1.971-.973-2.276-1.084-.306-.111-.528-.167-.75.167-.222.333-.861 1.084-1.055 1.306-.195.222-.389.25-.722.083-.333-.167-1.407-.519-2.68-1.654-.991-.884-1.66-1.976-1.855-2.309-.194-.333-.021-.513.146-.679.15-.149.333-.389.5-.583.167-.195.222-.333.333-.556.111-.222.056-.417-.028-.583-.083-.167-.75-1.806-1.028-2.473-.271-.651-.546-.563-.75-.573-.194-.01-.417-.012-.639-.012a1.225 1.225 0 0 0-.889.417c-.305.333-1.167 1.14-1.167 2.779s1.195 3.224 1.362 3.446c.167.222 2.351 3.59 5.696 5.035.796.344 1.417.549 1.901.703.799.254 1.526.218 2.1.132.641-.096 1.971-.806 2.249-1.584.278-.778.278-1.445.195-1.584-.084-.139-.306-.222-.639-.389Z" />
        </svg>
      </a>

      {/* ==================== AVAILABILITY MODAL ==================== */}
      <AnimatePresence>
        {availabilityProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAvailabilityProduct(null)}
            className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <h3 className="font-display text-sm font-extrabold uppercase tracking-[0.08em]">
                  AVAILABILITY & SIZING
                </h3>
                <button
                  type="button"
                  onClick={() => setAvailabilityProduct(null)}
                  className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div>
                <span className="font-display text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">
                  {availabilityProduct.audience.toUpperCase()} · {availabilityProduct.category.toUpperCase()}
                </span>
                <h4 className="font-display text-xl font-black uppercase">
                  {availabilityProduct.name}
                </h4>
                <p className="font-mono-num text-sm font-semibold text-zinc-600 mt-1">
                  ${availabilityProduct.priceUsd} / Rs {availabilityProduct.pricePkr}
                </p>
                <p className="text-sm text-zinc-600 mt-2">{availabilityProduct.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {availabilityProduct.sizes.map((sz) => (
                  <div
                    key={sz}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-50 border border-black/10 text-xs"
                  >
                    <span className="font-display font-bold">{sz}</span>
                    <span className="font-mono-num text-emerald-700 font-semibold">In Stock</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== MODALS & DRAWERS ==================== */}
      <OrderTrackerModal
        isOpen={trackerOpen}
        brandName={settings.brandName}
        onClose={() => setTrackerOpen(false)}
      />

      <WishlistDrawer
        isOpen={wishlistOpen}
        items={wishlistProducts}
        onClose={() => setWishlistOpen(false)}
        onRemoveItem={handleToggleWishlist}
        onClearAll={handleClearWishlist}
        onAddToCart={handleAddToCart}
        onOpenProduct={openProductDetail}
      />

      <CartDrawer
        isOpen={cartOpen}
        brandName={settings.brandName}
        items={cart}
        whatsappNumber={settings.whatsappNumber}
        whatsappDisplay={settings.whatsappDisplay}
        onClose={() => setCartOpen(false)}
        onUpdateQty={(idx, delta) => {
          setCart((prev) =>
            prev
              .map((item, i) => (i === idx ? { ...item, qty: item.qty + delta } : item))
              .filter((item) => item.qty > 0)
          );
        }}
        onRemoveItem={(idx) => setCart((prev) => prev.filter((_, i) => i !== idx))}
        onClearCart={() => setCart([])}
        onToast={showToast}
      />

      <SearchModal
        isOpen={searchOpen}
        products={products}
        onClose={() => setSearchOpen(false)}
        onSelectProduct={(prod) => openProductDetail(prod)}
      />

      <CustomerAccountModal
        isOpen={accountOpen}
        brandName={settings.brandName}
        authUser={authUser}
        onClose={() => setAccountOpen(false)}
        onGoogleSignIn={handleGoogleSignIn}
        onSignOut={handleSignOut}
      />

      <AdminPanelModal
        isOpen={adminOpen}
        authUser={authUser}
        onClose={() => setAdminOpen(false)}
        onGoogleSignIn={handleGoogleSignIn}
        onSignOut={handleSignOut}
        onRefreshUser={refreshAuthUser}
        onStorefrontSync={loadStorefront}
        onToast={showToast}
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[90] px-5 py-2.5 rounded-full bg-zinc-950 text-white font-display text-xs font-bold uppercase tracking-[0.06em] shadow-xl whitespace-nowrap"
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
