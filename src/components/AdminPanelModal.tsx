import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart3,
  Box,
  CheckCircle2,
  ClipboardList,
  Lock,
  LogOut,
  MessageCircle,
  Plus,
  Settings,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import type {
  AdminOverview,
  AudienceType,
  AuthUser,
  CategoryType,
  OrderRecord,
  Product,
  ProductColorVariant,
} from '../types';
import { apiRequest, buildWhatsAppUrl } from '../utils/api';

interface AdminPanelModalProps {
  isOpen: boolean;
  authUser: AuthUser | null;
  onClose: () => void;
  onGoogleSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onRefreshUser: () => Promise<void>;
  onStorefrontSync: () => Promise<void>;
  onToast: (msg: string) => void;
}

type AdminTab = 'overview' | 'products' | 'orders' | 'settings';

const CATEGORIES: Array<{ value: CategoryType; label: string }> = [
  { value: 'tanks', label: 'Tanks' },
  { value: 'tees', label: 'T-Shirts' },
  { value: 'hoodies', label: 'Hoodies' },
  { value: 'sweatshirts', label: 'Sweatshirts' },
  { value: 'jackets', label: 'Jackets' },
  { value: 'cargos', label: 'Cargos & Pants' },
  { value: 'shorts', label: 'Shorts' },
  { value: 'tracksuits', label: 'Tracksuits' },
  { value: 'shoes', label: 'Footwear / Shoes' },
];

const COLOR_PRESETS: Array<{ name: string; hex: string }> = [
  { name: 'Obsidian Black', hex: '#17171a' },
  { name: 'Chalk White', hex: '#ebe8e0' },
  { name: 'Forest Olive', hex: '#4b5c42' },
  { name: 'Crimson', hex: '#9b2c2c' },
  { name: 'Cobalt Navy', hex: '#1e3a8a' },
  { name: 'Sand Cream', hex: '#d6cbb8' },
  { name: 'Burnt Orange', hex: '#d9531e' },
  { name: 'Charcoal', hex: '#3f3f46' },
];

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  authUser,
  onClose,
  onGoogleSignIn,
  onSignOut,
  onRefreshUser,
  onStorefrontSync,
  onToast,
}) => {
  const [tab, setTab] = useState<AdminTab>('overview');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  // Product Filter & Add Form State
  const [prodFilter, setProdFilter] = useState<'all' | 'adults' | 'kids' | 'shoes'>('all');
  const [newName, setNewName] = useState('');
  const [newAudience, setNewAudience] = useState<AudienceType>('adults');
  const [newCategory, setNewCategory] = useState<CategoryType>('hoodies');
  const [newPriceUsd, setNewPriceUsd] = useState('55');
  const [newPricePkr, setNewPricePkr] = useState('4999');
  const [newStock, setNewStock] = useState('7');
  const [newDesc, setNewDesc] = useState('');
  const [newFrontImg, setNewFrontImg] = useState('');
  const [newBackImg, setNewBackImg] = useState('');
  const [newColors, setNewColors] = useState<ProductColorVariant[]>([]);
  const [customColorName, setCustomColorName] = useState('');
  const [customColorHex, setCustomColorHex] = useState('#17171a');
  const [addingProduct, setAddingProduct] = useState(false);

  // Orders Filter
  const [orderFilter, setOrderFilter] = useState<string>('all');

  // Store Settings Form
  const [brandName, setBrandName] = useState('BK Store');
  const [topAnnouncement, setTopAnnouncement] = useState(
    'All things under the 1 Roof with 100% Free Home delivery'
  );
  const [waDisplay, setWaDisplay] = useState('03705776869');
  const [tickerText, setTickerText] = useState('');
  const [newAdminPin, setNewAdminPin] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  const loadOverview = useCallback(async () => {
    if (!authUser || authUser.role !== 'admin') return;
    setLoading(true);
    setLoadError('');
    try {
      const data = await apiRequest<AdminOverview>('/api/admin/overview', { requireAuth: true });
      setOverview(data);
      setBrandName(data.settings.brandName || 'BK Store');
      setTopAnnouncement(
        data.settings.topAnnouncement || 'All things under the 1 Roof with 100% Free Home delivery'
      );
      setWaDisplay(data.settings.whatsappDisplay || '03705776869');
      setTickerText(data.settings.tickerText || '');
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Unable to load admin data.');
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    if (isOpen && authUser?.role === 'admin') {
      loadOverview();
    }
  }, [isOpen, authUser, loadOverview]);

  const handleUnlockAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    setUnlocking(true);
    try {
      await apiRequest('/api/admin/unlock', {
        method: 'POST',
        requireAuth: true,
        body: JSON.stringify({ pin: pinInput }),
      });
      setPinInput('');
      await onRefreshUser();
      onToast('Admin access granted');
    } catch (err) {
      setPinError(err instanceof Error ? err.message : 'Wrong Admin PIN.');
    } finally {
      setUnlocking(false);
    }
  };

  const handleFrontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await readFileAsBase64(file);
    setNewFrontImg(base64);
  };

  const handleBackUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await readFileAsBase64(file);
    setNewBackImg(base64);
  };

  const handleAddPresetColor = (preset: { name: string; hex: string }) => {
    setNewColors((prev) => {
      if (prev.length >= 6) {
        onToast('Maximum 6 colors per product');
        return prev;
      }
      if (prev.some((c) => c.name.toLowerCase() === preset.name.toLowerCase())) {
        return prev;
      }
      return [...prev, { ...preset, isDefault: prev.length === 0 }];
    });
  };

  const handleAddCustomColor = () => {
    const trimmed = customColorName.trim();
    if (!trimmed) {
      onToast('Enter a color name first');
      return;
    }
    setNewColors((prev) => {
      if (prev.length >= 6) {
        onToast('Maximum 6 colors per product');
        return prev;
      }
      if (prev.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
        onToast('Color already added');
        return prev;
      }
      return [...prev, { name: trimmed, hex: customColorHex, isDefault: prev.length === 0 }];
    });
    setCustomColorName('');
  };

  const handleRemoveNewColor = (name: string) => {
    setNewColors((prev) => {
      const next = prev.filter((c) => c.name !== name);
      if (next.length > 0 && !next.some((c) => c.isDefault)) {
        next[0] = { ...next[0], isDefault: true };
      }
      return next;
    });
  };

  const handleColorImageUpload = async (idx: number, file?: File | null) => {
    if (!file) return;
    const base64 = await readFileAsBase64(file);
    setNewColors((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, frontImage: base64 } : c))
    );
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newFrontImg) {
      onToast('Product name and front image are required');
      return;
    }
    setAddingProduct(true);
    try {
      const sizes =
        newCategory === 'shoes'
          ? ['EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44']
          : newAudience === 'kids'
            ? ['4-5Y', '6-7Y', '8-9Y', '10-12Y', '13-14Y']
            : ['S', 'M', 'L', 'XL'];

      await apiRequest('/api/admin/products', {
        method: 'POST',
        requireAuth: true,
        body: JSON.stringify({
          name: newName.trim(),
          audience: newAudience,
          category: newCategory,
          priceUsd: Number(newPriceUsd) || 45,
          pricePkr: Number(newPricePkr) || 3999,
          stockCount: Number(newStock) || 7,
          description:
            newDesc.trim() || `OFFHOOK ${newAudience} ${newCategory} studio limited drop.`,
          frontImage: newFrontImg,
          backImage: newBackImg || newFrontImg,
          sizes,
          colors: newColors,
        }),
      });

      setNewName('');
      setNewDesc('');
      setNewFrontImg('');
      setNewBackImg('');
      setNewColors([]);
      setCustomColorName('');
      onToast('New product published to store');
      await Promise.all([loadOverview(), onStorefrontSync()]);
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Failed to create product');
    } finally {
      setAddingProduct(false);
    }
  };

  const handleAdjustStock = async (prod: Product, delta: number) => {
    const nextStock = Math.max(0, prod.stockCount + delta);
    try {
      await apiRequest(`/api/admin/products/${prod.id}`, {
        method: 'PATCH',
        requireAuth: true,
        body: JSON.stringify({ stockCount: nextStock }),
      });
      await Promise.all([loadOverview(), onStorefrontSync()]);
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Failed to update stock');
    }
  };

  const handleToggleActive = async (prod: Product) => {
    try {
      await apiRequest(`/api/admin/products/${prod.id}`, {
        method: 'PATCH',
        requireAuth: true,
        body: JSON.stringify({ isActive: !prod.isActive }),
      });
      await Promise.all([loadOverview(), onStorefrontSync()]);
      onToast(prod.isActive ? 'Product hidden from storefront' : 'Product activated');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    try {
      await apiRequest(`/api/admin/products/${id}`, {
        method: 'DELETE',
        requireAuth: true,
      });
      await Promise.all([loadOverview(), onStorefrontSync()]);
      onToast('Product deleted');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Failed to delete product');
    }
  };

  const handleOrderStatusChange = async (orderId: number, status: OrderRecord['status']) => {
    try {
      await apiRequest(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        requireAuth: true,
        body: JSON.stringify({ status }),
      });
      await loadOverview();
      onToast(`Order updated to ${status}`);
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Failed to update order');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await apiRequest('/api/admin/settings', {
        method: 'PATCH',
        requireAuth: true,
        body: JSON.stringify({
          brandName,
          topAnnouncement,
          whatsappDisplay: waDisplay,
          tickerText,
          ...(newAdminPin.trim().length >= 4 ? { adminPin: newAdminPin.trim() } : {}),
        }),
      });
      setNewAdminPin('');
      await Promise.all([loadOverview(), onStorefrontSync()]);
      onToast('Store settings saved to PostgreSQL');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const list = overview?.products || [];
    if (prodFilter === 'all') return list;
    if (prodFilter === 'shoes') return list.filter((p) => p.category === 'shoes');
    return list.filter((p) => p.audience === prodFilter && p.category !== 'shoes');
  }, [overview, prodFilter]);

  const filteredOrders = useMemo(() => {
    const list = overview?.orders || [];
    if (orderFilter === 'all') return list;
    return list.filter((o) => o.status === orderFilter);
  }, [overview, orderFilter]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[80] bg-black/55 backdrop-blur-xs flex items-center justify-center p-2 sm:p-5"
        >
          <motion.div
            initial={{ scale: 0.96, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-6xl max-h-[92vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-black/10"
          >
            {/* Header */}
            <div className="px-5 sm:px-7 py-4 border-b border-black/10 flex items-center justify-between bg-zinc-950 text-white">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-[#ff5500]" />
                <div>
                  <h2 className="font-display text-sm sm:text-base font-extrabold uppercase tracking-[0.1em]">
                    {brandName} E-COMMERCE ADMIN
                  </h2>
                  {authUser && (
                    <p className="text-[11px] text-zinc-400">
                      Signed in as {authUser.email} ({authUser.role.toUpperCase()})
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {authUser && (
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="inline-flex items-center gap-1.5 text-[11px] font-display font-bold uppercase tracking-[0.08em] px-3 py-1.5 rounded-full border border-white/20 hover:bg-white hover:text-zinc-950 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    LOGOUT
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close admin panel"
                  className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Auth Gate or Full Command Center */}
            {!authUser ? (
              <div className="p-10 text-center flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-zinc-100 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-zinc-900" />
                </div>
                <h3 className="font-display text-xl font-extrabold uppercase">
                  Sign In Required For Admin Access
                </h3>
                <p className="text-sm text-zinc-500 max-w-md">
                  Authenticate with your Google account to manage products, Adults & Kids sections, customer orders, and store settings.
                </p>
                <button
                  type="button"
                  onClick={onGoogleSignIn}
                  className="h-12 px-7 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white font-display text-xs font-bold uppercase tracking-[0.1em]"
                >
                  SIGN IN WITH GOOGLE
                </button>
              </div>
            ) : authUser.role !== 'admin' ? (
              <div className="p-10 max-w-md mx-auto w-full flex flex-col gap-4">
                <div className="text-center">
                  <h3 className="font-display text-lg font-extrabold uppercase">
                    Enter Store Admin PIN
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Signed in as {authUser.email}. Enter your store Admin PIN to unlock dashboard permissions (default: admin123).
                  </p>
                </div>
                <form onSubmit={handleUnlockAdmin} className="flex flex-col gap-3">
                  <input
                    type="password"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="Enter Admin PIN"
                    className="w-full px-4 py-3 rounded-xl border border-black/20 text-sm"
                    required
                  />
                  {pinError && <p className="text-xs font-semibold text-red-600">{pinError}</p>}
                  <button
                    type="submit"
                    disabled={unlocking}
                    className="h-11 rounded-full bg-zinc-950 text-white font-display text-xs font-bold uppercase tracking-[0.1em]"
                  >
                    {unlocking ? 'VERIFYING...' : 'UNLOCK ADMIN PANEL'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Admin Navigation Tabs */}
                <div className="px-5 sm:px-7 py-2.5 border-b border-black/10 bg-zinc-50 flex items-center gap-2 overflow-x-auto">
                  {[
                    { id: 'overview' as AdminTab, label: 'Overview', icon: BarChart3 },
                    { id: 'products' as AdminTab, label: 'Catalog & Add Items', icon: Box },
                    { id: 'orders' as AdminTab, label: 'Orders', icon: ClipboardList },
                    { id: 'settings' as AdminTab, label: 'Store Settings', icon: Settings },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setTab(item.id)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-display text-xs font-bold uppercase tracking-[0.08em] whitespace-nowrap transition-colors ${
                          tab === item.id
                            ? 'bg-zinc-950 text-white'
                            : 'text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-7">
                  {loading && !overview ? (
                    <p className="text-sm text-zinc-500 py-10 text-center">Loading admin database...</p>
                  ) : loadError ? (
                    <p className="text-sm text-red-600 py-10 text-center">{loadError}</p>
                  ) : (
                    overview && (
                      <>
                        {/* ================= OVERVIEW TAB ================= */}
                        {tab === 'overview' && (
                          <div className="flex flex-col gap-6">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                              <div className="p-4 rounded-xl border border-black/10 bg-zinc-50">
                                <span className="font-display text-[11px] font-bold uppercase tracking-[0.08em] text-zinc-500">
                                  Total Revenue
                                </span>
                                <p className="font-mono-num text-xl sm:text-2xl font-bold mt-1">
                                  Rs {overview.stats.totalRevenuePkr.toLocaleString()}
                                </p>
                                <p className="font-mono-num text-xs text-zinc-500">
                                  ${overview.stats.totalRevenueUsd.toLocaleString()} USD
                                </p>
                              </div>

                              <div className="p-4 rounded-xl border border-black/10 bg-zinc-50">
                                <span className="font-display text-[11px] font-bold uppercase tracking-[0.08em] text-zinc-500">
                                  Orders Pipeline
                                </span>
                                <p className="font-mono-num text-xl sm:text-2xl font-bold mt-1">
                                  {overview.stats.totalOrders}
                                </p>
                                <p className="font-mono-num text-xs text-amber-700 font-semibold">
                                  {overview.stats.pendingOrders} pending confirmation
                                </p>
                              </div>

                              <div className="p-4 rounded-xl border border-black/10 bg-zinc-50">
                                <span className="font-display text-[11px] font-bold uppercase tracking-[0.08em] text-zinc-500">
                                  Adults (Bara) Clothing
                                </span>
                                <p className="font-mono-num text-xl sm:text-2xl font-bold mt-1">
                                  {overview.stats.adultsCount} SKUs
                                </p>
                                <p className="text-xs text-zinc-500">Tanks, Tees, Hoodies, Jackets, Cargos</p>
                              </div>

                              <div className="p-4 rounded-xl border border-black/10 bg-zinc-50">
                                <span className="font-display text-[11px] font-bold uppercase tracking-[0.08em] text-zinc-500">
                                  Kids & Footwear
                                </span>
                                <p className="font-mono-num text-xl sm:text-2xl font-bold mt-1">
                                  {overview.stats.kidsCount} Kids · {overview.stats.shoesCount} Shoes
                                </p>
                                <p className="text-xs text-zinc-500">Active across 3D Racks</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <div className="border border-black/10 rounded-xl p-5">
                                <h3 className="font-display text-xs font-extrabold uppercase tracking-[0.1em] mb-4">
                                  Recent Orders
                                </h3>
                                {overview.orders.length === 0 ? (
                                  <p className="text-sm text-zinc-500 py-6 text-center">
                                    No customer orders yet. Orders placed via WhatsApp checkout appear here automatically.
                                  </p>
                                ) : (
                                  <div className="flex flex-col gap-3">
                                    {overview.orders.slice(0, 5).map((ord) => (
                                      <div
                                        key={ord.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 border border-black/5"
                                      >
                                        <div>
                                          <p className="font-mono-num text-xs font-bold">{ord.orderNumber}</p>
                                          <p className="text-xs text-zinc-600">
                                            {ord.customerName} · {ord.customerPhone}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-mono-num text-xs font-bold">
                                            Rs {ord.totalPkr}
                                          </p>
                                          <span className="font-display text-[10px] font-bold uppercase text-zinc-500">
                                            {ord.status}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="border border-black/10 rounded-xl p-5">
                                <h3 className="font-display text-xs font-extrabold uppercase tracking-[0.1em] mb-4">
                                  Inventory Snapshot
                                </h3>
                                <div className="flex flex-col gap-2.5 max-h-[260px] overflow-y-auto pr-1">
                                  {overview.products.slice(0, 8).map((p) => (
                                    <div
                                      key={p.id}
                                      className="flex items-center justify-between text-xs py-1.5 border-b border-black/5"
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <img
                                          src={p.frontImage}
                                          alt={p.name}
                                          className="w-8 h-9 object-contain bg-zinc-50 rounded"
                                        />
                                        <div className="truncate">
                                          <p className="font-display font-bold uppercase truncate">
                                            {p.name}
                                          </p>
                                          <p className="text-[11px] text-zinc-500">
                                            {p.audience.toUpperCase()} · {p.category}
                                          </p>
                                        </div>
                                      </div>
                                      <span
                                        className={`font-mono-num font-bold px-2.5 py-1 rounded-full ${
                                          p.stockCount <= 2
                                            ? 'bg-red-50 text-red-700'
                                            : 'bg-emerald-50 text-emerald-700'
                                        }`}
                                      >
                                        {p.stockCount} left
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ================= PRODUCTS TAB ================= */}
                        {tab === 'products' && (
                          <div className="flex flex-col gap-7">
                            {/* Add Product Card */}
                            <form
                              onSubmit={handleCreateProduct}
                              className="p-5 rounded-xl border border-black/10 bg-zinc-50 flex flex-col gap-4"
                            >
                              <div className="flex items-center justify-between">
                                <h3 className="font-display text-sm font-extrabold uppercase tracking-[0.08em] flex items-center gap-2">
                                  <Plus className="w-4 h-4" />
                                  Add New Clothing or Footwear Item
                                </h3>
                                <span className="text-[11px] text-zinc-500">
                                  Saved directly to PostgreSQL
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <div>
                                  <label className="font-display text-[11px] font-bold uppercase text-zinc-600 block mb-1">
                                    Product Name
                                  </label>
                                  <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="e.g. URBAN TECH HOODIE"
                                    className="w-full px-3 py-2 rounded-lg border border-black/20 bg-white text-sm"
                                    required
                                  />
                                </div>

                                <div>
                                  <label className="font-display text-[11px] font-bold uppercase text-zinc-600 block mb-1">
                                    Section (Adults / Kids)
                                  </label>
                                  <select
                                    value={newAudience}
                                    onChange={(e) => setNewAudience(e.target.value as AudienceType)}
                                    className="w-full px-3 py-2 rounded-lg border border-black/20 bg-white text-sm"
                                  >
                                    <option value="adults">Adults (Bara — Men/Women)</option>
                                    <option value="kids">Kids (Junior 4–14Y)</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="font-display text-[11px] font-bold uppercase text-zinc-600 block mb-1">
                                    Category
                                  </label>
                                  <select
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value as CategoryType)}
                                    className="w-full px-3 py-2 rounded-lg border border-black/20 bg-white text-sm"
                                  >
                                    {CATEGORIES.map((c) => (
                                      <option key={c.value} value={c.value}>
                                        {c.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <label className="font-display text-[10px] font-bold uppercase text-zinc-600 block mb-1">
                                      USD ($)
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={newPriceUsd}
                                      onChange={(e) => setNewPriceUsd(e.target.value)}
                                      className="w-full px-2 py-2 rounded-lg border border-black/20 bg-white text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="font-display text-[10px] font-bold uppercase text-zinc-600 block mb-1">
                                      PKR (Rs)
                                    </label>
                                    <input
                                      type="number"
                                      min="100"
                                      value={newPricePkr}
                                      onChange={(e) => setNewPricePkr(e.target.value)}
                                      className="w-full px-2 py-2 rounded-lg border border-black/20 bg-white text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="font-display text-[10px] font-bold uppercase text-zinc-600 block mb-1">
                                      Stock
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={newStock}
                                      onChange={(e) => setNewStock(e.target.value)}
                                      className="w-full px-2 py-2 rounded-lg border border-black/20 bg-white text-sm"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div>
                                <label className="font-display text-[11px] font-bold uppercase text-zinc-600 block mb-1">
                                  Description
                                </label>
                                <input
                                  type="text"
                                  value={newDesc}
                                  onChange={(e) => setNewDesc(e.target.value)}
                                  placeholder="Fabric GSM, fit, and drop details..."
                                  className="w-full px-3 py-2 rounded-lg border border-black/20 bg-white text-sm"
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-black/10">
                                  <div className="flex-1">
                                    <label className="font-display text-[11px] font-bold uppercase text-zinc-600 block mb-1">
                                      FRONT Image Upload *
                                    </label>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={handleFrontUpload}
                                      className="text-xs w-full"
                                    />
                                  </div>
                                  {newFrontImg && (
                                    <img
                                      src={newFrontImg}
                                      alt="Front preview"
                                      className="w-14 h-16 object-contain rounded border border-black/10"
                                    />
                                  )}
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-black/10">
                                  <div className="flex-1">
                                    <label className="font-display text-[11px] font-bold uppercase text-zinc-600 block mb-1">
                                      BACK Image Upload (Optional)
                                    </label>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={handleBackUpload}
                                      className="text-xs w-full"
                                    />
                                  </div>
                                  {newBackImg && (
                                    <img
                                      src={newBackImg}
                                      alt="Back preview"
                                      className="w-14 h-16 object-contain rounded border border-black/10"
                                    />
                                  )}
                                </div>
                              </div>

                              {/* Multi-Color Variants Builder (2–6 Colors) */}
                              <div className="p-3.5 bg-white rounded-lg border border-black/10 flex flex-col gap-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <label className="font-display text-[11px] font-bold uppercase text-zinc-700">
                                    Color Variants ({newColors.length}/6) — Optional
                                  </label>
                                  <span className="text-[11px] text-zinc-500">
                                    Customers see selected colors live on storefront
                                  </span>
                                </div>

                                <div className="flex flex-wrap gap-1.5">
                                  {COLOR_PRESETS.map((preset) => {
                                    const already = newColors.some(
                                      (c) => c.name.toLowerCase() === preset.name.toLowerCase()
                                    );
                                    return (
                                      <button
                                        key={preset.name}
                                        type="button"
                                        disabled={already || newColors.length >= 6}
                                        onClick={() => handleAddPresetColor(preset)}
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-display font-semibold transition-colors ${
                                          already
                                            ? 'bg-zinc-950 text-white border-zinc-950 opacity-60 cursor-default'
                                            : 'bg-zinc-50 hover:bg-zinc-100 border-black/15 text-zinc-800'
                                        }`}
                                      >
                                        <span
                                          className="w-3 h-3 rounded-full border border-black/20"
                                          style={{ backgroundColor: preset.hex }}
                                        />
                                        + {preset.name}
                                      </button>
                                    );
                                  })}
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                  <input
                                    type="color"
                                    value={customColorHex}
                                    onChange={(e) => setCustomColorHex(e.target.value)}
                                    aria-label="Custom color picker"
                                    className="w-9 h-9 rounded-lg border border-black/15 cursor-pointer bg-white p-0.5"
                                  />
                                  <input
                                    type="text"
                                    value={customColorName}
                                    onChange={(e) => setCustomColorName(e.target.value)}
                                    placeholder="Custom color name (e.g. Royal Blue)"
                                    className="flex-1 min-w-[180px] px-3 py-2 rounded-lg border border-black/20 text-xs"
                                  />
                                  <button
                                    type="button"
                                    onClick={handleAddCustomColor}
                                    className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-display text-[11px] font-bold uppercase"
                                  >
                                    Add Color
                                  </button>
                                </div>

                                {newColors.length > 0 && (
                                  <div className="flex flex-wrap gap-2 pt-1">
                                    {newColors.map((c, idx) => (
                                      <div
                                        key={c.name}
                                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-black/10 bg-zinc-50 text-xs"
                                      >
                                        <span
                                          className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                                          style={{ backgroundColor: c.hex }}
                                        />
                                        <span className="font-display font-bold text-[11px] uppercase">
                                          {c.name}
                                          {c.isDefault ? ' (Default)' : ''}
                                        </span>
                                        <label className="cursor-pointer text-[10px] font-semibold underline text-zinc-600 hover:text-zinc-950">
                                          {c.frontImage ? 'Photo Set' : '+ Photo'}
                                          <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) =>
                                              handleColorImageUpload(idx, e.target.files?.[0])
                                            }
                                            className="hidden"
                                          />
                                        </label>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveNewColor(c.name)}
                                          aria-label={`Remove ${c.name}`}
                                          className="text-zinc-400 hover:text-red-600"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div>
                                <button
                                  type="submit"
                                  disabled={addingProduct}
                                  className="h-11 px-7 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white font-display text-xs font-bold uppercase tracking-[0.08em]"
                                >
                                  {addingProduct ? 'PUBLISHING...' : 'ADD PRODUCT TO STORE'}
                                </button>
                              </div>
                            </form>

                            {/* Product Inventory Table */}
                            <div>
                              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                                <h3 className="font-display text-sm font-extrabold uppercase tracking-[0.08em]">
                                  Inventory ({filteredProducts.length})
                                </h3>
                                <div className="flex flex-wrap gap-1.5">
                                  {(['all', 'adults', 'kids', 'shoes'] as const).map((f) => (
                                    <button
                                      key={f}
                                      type="button"
                                      onClick={() => setProdFilter(f)}
                                      className={`px-3 py-1.5 rounded-full font-display text-[11px] font-bold uppercase ${
                                        prodFilter === f
                                          ? 'bg-zinc-950 text-white'
                                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                                      }`}
                                    >
                                      {f}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {filteredProducts.map((prod) => (
                                  <div
                                    key={prod.id}
                                    className="flex items-center gap-3 p-3 rounded-xl border border-black/10 bg-white"
                                  >
                                    <img
                                      src={prod.frontImage}
                                      alt={prod.name}
                                      className="w-16 h-20 object-contain bg-zinc-50 rounded-lg p-1 shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <span className="font-display text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-400">
                                        {prod.audience.toUpperCase()} · {prod.category.toUpperCase()}
                                      </span>
                                      <h4 className="font-display text-sm font-extrabold uppercase truncate">
                                        {prod.name}
                                      </h4>
                                      <p className="font-mono-num text-xs text-zinc-600">
                                        ${prod.priceUsd} / Rs {prod.pricePkr}
                                      </p>
                                      {prod.colors && prod.colors.length > 0 && (
                                        <div className="flex items-center gap-1 mt-1">
                                          {prod.colors.slice(0, 6).map((c) => (
                                            <span
                                              key={c.name}
                                              title={c.name}
                                              className="w-3 h-3 rounded-full border border-black/20"
                                              style={{ backgroundColor: c.hex }}
                                            />
                                          ))}
                                          <span className="text-[10px] font-mono-num text-zinc-400 ml-1">
                                            {prod.colors.length} colors
                                          </span>
                                        </div>
                                      )}
                                      <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <div className="inline-flex items-center gap-1 border border-black/15 rounded-full px-2 py-0.5 text-xs font-mono-num">
                                          <button
                                            type="button"
                                            onClick={() => handleAdjustStock(prod, -1)}
                                            className="px-1 font-bold hover:text-red-600"
                                          >
                                            -
                                          </button>
                                          <span>Qty: {prod.stockCount}</span>
                                          <button
                                            type="button"
                                            onClick={() => handleAdjustStock(prod, 1)}
                                            className="px-1 font-bold hover:text-emerald-600"
                                          >
                                            +
                                          </button>
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() => handleToggleActive(prod)}
                                          className={`text-[10px] font-display font-bold uppercase px-2.5 py-1 rounded-full ${
                                            prod.isActive
                                              ? 'bg-emerald-100 text-emerald-800'
                                              : 'bg-zinc-200 text-zinc-600'
                                          }`}
                                        >
                                          {prod.isActive ? 'ACTIVE' : 'HIDDEN'}
                                        </button>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteProduct(prod.id)}
                                      className="p-2 text-red-600 hover:bg-red-50 rounded-full shrink-0"
                                      title="Delete product"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ================= ORDERS TAB ================= */}
                        {tab === 'orders' && (
                          <div className="flex flex-col gap-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <h3 className="font-display text-sm font-extrabold uppercase tracking-[0.08em]">
                                Customer Orders ({filteredOrders.length})
                              </h3>
                              <div className="flex flex-wrap gap-1.5">
                                {['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map(
                                  (st) => (
                                    <button
                                      key={st}
                                      type="button"
                                      onClick={() => setOrderFilter(st)}
                                      className={`px-3 py-1 rounded-full font-display text-[11px] font-bold uppercase ${
                                        orderFilter === st
                                          ? 'bg-zinc-950 text-white'
                                          : 'bg-zinc-100 text-zinc-600'
                                      }`}
                                    >
                                      {st}
                                    </button>
                                  )
                                )}
                              </div>
                            </div>

                            {filteredOrders.length === 0 ? (
                              <p className="text-sm text-zinc-500 py-12 text-center bg-zinc-50 rounded-xl">
                                No orders matching this filter.
                              </p>
                            ) : (
                              <div className="flex flex-col gap-3">
                                {filteredOrders.map((ord) => (
                                  <div
                                    key={ord.id}
                                    className="p-4 rounded-xl border border-black/10 bg-white flex flex-col gap-3"
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-black/5">
                                      <div>
                                        <span className="font-mono-num text-sm font-bold">
                                          {ord.orderNumber}
                                        </span>
                                        <span className="text-xs text-zinc-400 ml-2">
                                          {new Date(ord.createdAt).toLocaleString()}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <select
                                          value={ord.status}
                                          onChange={(e) =>
                                            handleOrderStatusChange(
                                              ord.id,
                                              e.target.value as OrderRecord['status']
                                            )
                                          }
                                          className="px-3 py-1.5 rounded-full border border-black/20 font-display text-xs font-bold uppercase bg-zinc-50"
                                        >
                                          <option value="pending">Pending</option>
                                          <option value="confirmed">Confirmed</option>
                                          <option value="shipped">Shipped</option>
                                          <option value="delivered">Delivered</option>
                                          <option value="cancelled">Cancelled</option>
                                        </select>

                                        <a
                                          href={buildWhatsAppUrl(
                                            ord.customerPhone,
                                            `Salam ${ord.customerName}, your OFFHOOK order ${ord.orderNumber} status is now: ${ord.status.toUpperCase()}.`
                                          )}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#16a34a] text-white font-display text-[11px] font-bold uppercase"
                                        >
                                          <MessageCircle className="w-3.5 h-3.5" />
                                          WHATSAPP
                                        </a>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                      <div>
                                        <p className="font-bold text-zinc-900">
                                          {ord.customerName} · {ord.customerPhone}
                                        </p>
                                        <p className="text-zinc-600 mt-0.5">{ord.customerAddress}</p>
                                      </div>
                                      <div className="sm:text-right">
                                        <p className="font-mono-num font-bold text-sm">
                                          Rs {ord.totalPkr} (${ord.totalUsd})
                                        </p>
                                        <p className="text-zinc-500">
                                          {ord.items
                                            .map(
                                              (i) =>
                                                `${i.name} (${i.color ? `${i.color} · ` : ''}${i.size}) x${i.qty}`
                                            )
                                            .join(' · ')}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* ================= SETTINGS TAB ================= */}
                        {tab === 'settings' && (
                          <form
                            onSubmit={handleSaveSettings}
                            className="max-w-lg flex flex-col gap-4"
                          >
                            <h3 className="font-display text-sm font-extrabold uppercase tracking-[0.08em]">
                              Storefront, Brand & Top Bar Configuration
                            </h3>

                            <div>
                              <label className="font-display text-[11px] font-bold uppercase text-zinc-600 block mb-1">
                                Brand Name (Header & Store Title)
                              </label>
                              <input
                                type="text"
                                value={brandName}
                                onChange={(e) => setBrandName(e.target.value)}
                                placeholder="BK Store"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-black/20 text-sm font-semibold"
                              />
                            </div>

                            <div>
                              <label className="font-display text-[11px] font-bold uppercase text-zinc-600 block mb-1">
                                Top Moving Nav Announcement Bar
                              </label>
                              <input
                                type="text"
                                value={topAnnouncement}
                                onChange={(e) => setTopAnnouncement(e.target.value)}
                                placeholder="All things under the 1 Roof with 100% Free Home delivery"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-black/20 text-sm"
                              />
                            </div>

                            <div>
                              <label className="font-display text-[11px] font-bold uppercase text-zinc-600 block mb-1">
                                Official WhatsApp Order Number
                              </label>
                              <input
                                type="text"
                                value={waDisplay}
                                onChange={(e) => setWaDisplay(e.target.value)}
                                placeholder="03705776869"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-black/20 text-sm font-mono-num"
                              />
                            </div>

                            <div>
                              <label className="font-display text-[11px] font-bold uppercase text-zinc-600 block mb-1">
                                Orange Marquee Ticker Text
                              </label>
                              <input
                                type="text"
                                value={tickerText}
                                onChange={(e) => setTickerText(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-black/20 text-sm"
                              />
                            </div>

                            <div>
                              <label className="font-display text-[11px] font-bold uppercase text-zinc-600 block mb-1">
                                Update Store Admin PIN (Optional)
                              </label>
                              <input
                                type="password"
                                value={newAdminPin}
                                onChange={(e) => setNewAdminPin(e.target.value)}
                                placeholder="Minimum 4 characters"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-black/20 text-sm"
                              />
                            </div>

                            <button
                              type="submit"
                              disabled={savingSettings}
                              className="h-11 px-7 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white font-display text-xs font-bold uppercase tracking-[0.08em] inline-flex items-center gap-2 w-fit"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              {savingSettings ? 'SAVING...' : 'SAVE SETTINGS'}
                            </button>
                          </form>
                        )}
                      </>
                    )
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
