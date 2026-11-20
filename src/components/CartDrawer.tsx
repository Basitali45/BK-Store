import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Minus, Plus, Trash2, X } from 'lucide-react';
import type { CartItem } from '../types';
import { apiRequest, buildWhatsAppUrl } from '../utils/api';

interface CartDrawerProps {
  isOpen: boolean;
  brandName: string;
  items: CartItem[];
  whatsappNumber: string;
  whatsappDisplay: string;
  onClose: () => void;
  onUpdateQty: (idx: number, delta: number) => void;
  onRemoveItem: (idx: number) => void;
  onClearCart: () => void;
  onToast: (msg: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  brandName,
  items,
  whatsappNumber,
  whatsappDisplay,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onToast,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const totalCount = items.reduce((s, it) => s + it.qty, 0);
  const totalUsd = items.reduce((s, it) => s + it.priceUsd * it.qty, 0);
  const totalPkr = items.reduce((s, it) => s + it.pricePkr * it.qty, 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (items.length === 0) return;

    if (!name.trim() || !phone.trim() || !address.trim()) {
      setError('Please enter your Name, Phone, and Full Address.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest<{ order: { orderNumber: string } }>('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          customerName: name.trim(),
          customerPhone: phone.trim(),
          customerAddress: address.trim(),
          items,
          channel: 'whatsapp',
        }),
      });

      const lines = [
        `*NEW ${brandName.toUpperCase()} ORDER (${res.order.orderNumber})*`,
        `100% Free Home Delivery`,
        '',
        ...items.map(
          (it, idx) =>
            `${idx + 1}. ${it.name} [${it.audience.toUpperCase()}]${it.color ? ` (${it.color})` : ''} (Size: ${it.size}) x${it.qty} — $${it.priceUsd * it.qty} / Rs ${it.pricePkr * it.qty}`
        ),
        '',
        `*Total:* $${totalUsd} / Rs ${totalPkr}`,
        '',
        `*Customer Details:*`,
        `Name: ${name.trim()}`,
        `Phone: ${phone.trim()}`,
        `Address: ${address.trim()}`,
      ];

      const waUrl = buildWhatsAppUrl(whatsappNumber, lines.join('\n'));
      const anchor = document.createElement('a');
      anchor.href = waUrl;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      onToast(`Order ${res.order.orderNumber} saved & sent to WhatsApp!`);
      onClearCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to process order.');
    } finally {
      setSubmitting(false);
    }
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
            aria-label="Shopping Bag"
            className="fixed top-0 right-0 bottom-0 z-[60] w-full sm:w-[440px] bg-white shadow-2xl flex flex-col"
          >
            <div className="px-5 py-4 border-b border-black/10 flex items-center justify-between">
              <h2 className="font-display text-base font-extrabold uppercase tracking-[0.08em]">
                YOUR BAG ({totalCount})
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close cart"
                className="w-9 h-9 rounded-full border border-black/10 flex items-center justify-center hover:bg-zinc-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
              {items.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-500 py-14 gap-2">
                  <p className="font-display font-bold uppercase text-sm text-zinc-900">
                    Your Bag Is Empty
                  </p>
                  <p className="text-xs max-w-[240px]">
                    Add clothing or footwear from Adults, Kids, or the 3D Shoe Rack to checkout.
                  </p>
                </div>
              ) : (
                items.map((item, idx) => (
                  <div
                    key={`${item.productId}-${item.size}-${item.color || 'default'}`}
                    className="grid grid-cols-[68px_1fr_auto] gap-3.5 items-center pb-4 border-b border-black/10"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-[68px] h-[82px] object-contain bg-zinc-50 rounded-lg p-1"
                    />
                    <div>
                      <span className="font-display text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-400">
                        {item.audience.toUpperCase()} · {item.category.toUpperCase()}
                      </span>
                      <h4 className="font-display text-sm font-bold uppercase text-zinc-950">
                        {item.name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 mt-0.5">
                        <span>Size: {item.size}</span>
                        {item.color && (
                          <span className="inline-flex items-center gap-1">
                            <span>·</span>
                            {item.colorHex && (
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-black/20 inline-block"
                                style={{ backgroundColor: item.colorHex }}
                              />
                            )}
                            <span>{item.color}</span>
                          </span>
                        )}
                      </div>
                      <p className="font-mono-num text-xs font-semibold mt-1">
                        ${item.priceUsd * item.qty} / Rs {item.pricePkr * item.qty}
                      </p>

                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => onUpdateQty(idx, -1)}
                          aria-label="Decrease quantity"
                          className="w-7 h-7 rounded-full border border-black/20 flex items-center justify-center hover:bg-zinc-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono-num text-xs font-semibold min-w-[20px] text-center">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQty(idx, 1)}
                          aria-label="Increase quantity"
                          className="w-7 h-7 rounded-full border border-black/20 flex items-center justify-center hover:bg-zinc-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(idx)}
                      aria-label="Remove item"
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="px-5 py-4 border-t border-black/10 bg-zinc-50 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs font-display font-bold uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                  <span>DELIVERY</span>
                  <span>100% FREE HOME DELIVERY</span>
                </div>
                <div className="flex items-center justify-between font-display font-extrabold text-base uppercase">
                  <span>TOTAL</span>
                  <span className="font-mono-num">
                    ${totalUsd} / Rs {totalPkr}
                  </span>
                </div>

                <form onSubmit={handleCheckout} className="flex flex-col gap-2.5" noValidate>
                  <div>
                    <label className="font-display text-[11px] font-bold uppercase tracking-[0.08em] text-zinc-600 block mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your Name"
                      className="w-full px-3 py-2 rounded-lg border border-black/20 bg-white text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-display text-[11px] font-bold uppercase tracking-[0.08em] text-zinc-600 block mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="03XX XXXXXXX"
                      className="w-full px-3 py-2 rounded-lg border border-black/20 bg-white text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-display text-[11px] font-bold uppercase tracking-[0.08em] text-zinc-600 block mb-1">
                      Delivery Address
                    </label>
                    <textarea
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="House, Street, Area, City"
                      className="w-full px-3 py-2 rounded-lg border border-black/20 bg-white text-sm resize-none"
                      required
                    />
                  </div>

                  {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-12 rounded-full bg-[#16a34a] hover:bg-[#15803d] disabled:opacity-60 text-white font-display text-xs font-bold uppercase tracking-[0.08em] inline-flex items-center justify-center gap-2 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {submitting
                      ? 'SAVING ORDER...'
                      : `ORDER ON WHATSAPP (${whatsappDisplay})`}
                  </button>
                </form>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
