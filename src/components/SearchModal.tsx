import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X } from 'lucide-react';
import type { Product } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  products: Product[];
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  products,
  onClose,
  onSelectProduct,
}) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.audience.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [products, query]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.96, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 12 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl max-h-[86vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-black/10 flex items-center justify-between">
              <h2 className="font-display text-base font-extrabold uppercase tracking-[0.08em]">
                SEARCH ARCHIVE
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full border border-black/10 flex items-center justify-center hover:bg-zinc-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex flex-col gap-5">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search hoodies, jackets, cargos, kids, shoes..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-black/20 text-sm"
                />
              </div>

              {filtered.length === 0 ? (
                <p className="text-center text-sm text-zinc-500 py-10">
                  No matching items found.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {filtered.map((prod) => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => {
                        onSelectProduct(prod);
                        onClose();
                      }}
                      className="text-left rounded-xl border border-black/10 p-3 hover:-translate-y-1 hover:shadow-md transition-all bg-white"
                    >
                      <img
                        src={prod.frontImage}
                        alt={prod.name}
                        className="w-full h-36 object-contain bg-zinc-50 rounded-lg p-2 mb-2"
                      />
                      <span className="font-display text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-400">
                        {prod.audience} · {prod.category}
                      </span>
                      <h4 className="font-display text-xs font-extrabold uppercase text-zinc-950 truncate">
                        {prod.name}
                      </h4>
                      <p className="font-mono-num text-xs text-zinc-600 mt-0.5">
                        ${prod.priceUsd} / Rs {prod.pricePkr}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
