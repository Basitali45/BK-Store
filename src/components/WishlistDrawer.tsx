import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, Heart, ShoppingBag, Trash2, X } from 'lucide-react';
import type { Product, ProductColorVariant } from '../types';
import { CutoutImage } from './CutoutImage';
import { resolveColorAppearance } from '../utils/color';

interface WishlistDrawerProps {
  isOpen: boolean;
  items: Product[];
  onClose: () => void;
  onRemoveItem: (product: Product) => void;
  onClearAll: () => void;
  onAddToCart: (product: Product, size: string, color?: ProductColorVariant | null) => void;
  onOpenProduct: (product: Product, colorName?: string) => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  items,
  onClose,
  onRemoveItem,
  onClearAll,
  onAddToCart,
  onOpenProduct,
}) => {
  const [selectedSizes, setSelectedSizes] = useState<Record<number, string>>({});

  const getSizeFor = (prod: Product): string => {
    const chosen = selectedSizes[prod.id];
    if (chosen && prod.sizes.includes(chosen)) return chosen;
    return prod.sizes.includes('M') ? 'M' : prod.sizes[0] || 'M';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Saved Wishlist"
            className="fixed top-0 right-0 bottom-0 z-[60] w-full sm:w-[440px] bg-white shadow-2xl flex flex-col"
          >
            <div className="px-5 py-4 border-b border-black/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-600 fill-rose-600" />
                <h2 className="font-display text-base font-extrabold uppercase tracking-[0.08em]">
                  WISHLIST ({items.length})
                </h2>
              </div>

              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearAll}
                    className="font-display text-[10px] font-bold uppercase tracking-[0.08em] px-2.5 py-1 rounded-full border border-black/15 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                  >
                    CLEAR ALL
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close wishlist"
                  className="w-9 h-9 rounded-full border border-black/10 flex items-center justify-center hover:bg-zinc-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
              {items.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-500 py-14 gap-3">
                  <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-zinc-400" />
                  </div>
                  <p className="font-display font-bold uppercase text-sm text-zinc-900">
                    Your Wishlist Is Empty
                  </p>
                  <p className="text-xs max-w-[250px]">
                    Tap the heart icon on any shirt, hoodie, kids set, or shoe to save it here for later.
                  </p>
                </div>
              ) : (
                items.map((prod) => {
                  const chosenSize = getSizeFor(prod);
                  return (
                    <div
                      key={prod.id}
                      className="rounded-2xl border border-black/10 bg-zinc-50/70 p-3.5 flex flex-col gap-3"
                    >
                      <div className="grid grid-cols-[74px_1fr_auto] gap-3 items-center">
                        <button
                          type="button"
                          onClick={() => {
                            onOpenProduct(prod);
                            onClose();
                          }}
                          className="w-[74px] h-[86px] rounded-xl bg-white border border-black/5 p-1.5 flex items-center justify-center hover:scale-105 transition-transform"
                        >
                          <CutoutImage
                            src={prod.frontImage}
                            alt={prod.name}
                            shadowClassName={
                              prod.category === 'shoes' ? 'cutout-shadow-shoe' : 'cutout-shadow'
                            }
                            className="w-full h-full object-contain"
                          />
                        </button>

                        <div className="min-w-0">
                          <span className="font-display text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-400 block">
                            {prod.audience.toUpperCase()} · {prod.category.toUpperCase()}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              onOpenProduct(prod);
                              onClose();
                            }}
                            className="text-left font-display text-sm font-extrabold uppercase text-zinc-950 hover:text-[#ff5500] transition-colors truncate block w-full"
                          >
                            {prod.name}
                          </button>
                          <p className="font-mono-num text-xs font-semibold text-zinc-700 mt-0.5">
                            ${prod.priceUsd} / Rs {prod.pricePkr}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemoveItem(prod)}
                          aria-label={`Remove ${prod.name} from wishlist`}
                          title="Remove from wishlist"
                          className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-black/5">
                        <div className="flex flex-wrap gap-1">
                          {prod.sizes.slice(0, 5).map((sz) => (
                            <button
                              key={sz}
                              type="button"
                              onClick={() =>
                                setSelectedSizes((prev) => ({ ...prev, [prod.id]: sz }))
                              }
                              className={`px-2 py-0.5 rounded-full text-[10px] font-mono-num font-semibold border transition-colors ${
                                chosenSize === sz
                                  ? 'bg-zinc-950 border-zinc-950 text-white'
                                  : 'bg-white border-black/15 text-zinc-700 hover:border-zinc-950'
                              }`}
                            >
                              {sz}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              onOpenProduct(prod);
                              onClose();
                            }}
                            title="View 3D Details"
                            className="w-8 h-8 rounded-full border border-black/15 bg-white hover:bg-zinc-950 hover:text-white flex items-center justify-center transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onAddToCart(prod, chosenSize, resolveColorAppearance(prod).activeColor)}
                            className="h-8 px-3.5 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white font-display text-[10px] font-bold uppercase tracking-[0.08em] inline-flex items-center gap-1.5 transition-colors"
                          >
                            <ShoppingBag className="w-3 h-3" />
                            ADD TO BAG
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {items.length > 0 && (
              <div className="px-5 py-4 border-t border-black/10 bg-zinc-50 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    items.forEach((prod) =>
                      onAddToCart(prod, getSizeFor(prod), resolveColorAppearance(prod).activeColor)
                    );
                    onClose();
                  }}
                  className="w-full h-11 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white font-display text-xs font-bold uppercase tracking-[0.1em] inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <ShoppingBag className="w-4 h-4" />
                  ADD ALL ({items.length}) TO BAG
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
