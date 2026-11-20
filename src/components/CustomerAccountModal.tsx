import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, Package, UserCheck, X } from 'lucide-react';
import type { AuthUser, OrderRecord } from '../types';
import { apiRequest } from '../utils/api';

interface CustomerAccountModalProps {
  isOpen: boolean;
  brandName: string;
  authUser: AuthUser | null;
  onClose: () => void;
  onGoogleSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
}

export const CustomerAccountModal: React.FC<CustomerAccountModalProps> = ({
  isOpen,
  brandName,
  authUser,
  onClose,
  onGoogleSignIn,
  onSignOut,
}) => {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !authUser) return;
    setLoading(true);
    apiRequest<{ orders: OrderRecord[] }>('/api/orders/mine', { requireAuth: true })
      .then((res) => setOrders(res.orders || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [isOpen, authUser]);

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
            className="w-full max-w-xl max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-black/10 flex items-center justify-between">
              <h2 className="font-display text-base font-extrabold uppercase tracking-[0.08em]">
                ACCOUNT & ORDERS
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
              {!authUser ? (
                <div className="text-center py-8 flex flex-col items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-zinc-700" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-extrabold uppercase">
                      Sign In To Your Account
                    </h3>
                    <p className="text-sm text-zinc-500 mt-1 max-w-sm">
                      Track your {brandName} clothing & footwear orders across devices with Google Sign-In.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onGoogleSignIn}
                    className="h-11 px-6 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white font-display text-xs font-bold uppercase tracking-[0.08em]"
                  >
                    CONTINUE WITH GOOGLE
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-zinc-50 border border-black/10">
                    <div>
                      <p className="font-display text-sm font-bold uppercase text-zinc-950">
                        {authUser.displayName || 'OFFHOOK Member'}
                      </p>
                      <p className="text-xs text-zinc-500">{authUser.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={onSignOut}
                      className="inline-flex items-center gap-1.5 text-xs font-display font-bold uppercase px-3.5 py-2 rounded-full border border-black/20 hover:bg-zinc-950 hover:text-white transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      SIGN OUT
                    </button>
                  </div>

                  <div>
                    <h3 className="font-display text-xs font-bold uppercase tracking-[0.1em] text-zinc-500 mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      YOUR RECENT ORDERS
                    </h3>

                    {loading ? (
                      <p className="text-sm text-zinc-500">Loading order history...</p>
                    ) : orders.length === 0 ? (
                      <p className="text-sm text-zinc-500 py-6 text-center bg-zinc-50 rounded-xl">
                        No orders placed under this account yet.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {orders.map((ord) => (
                          <div
                            key={ord.id}
                            className="p-4 rounded-xl border border-black/10 flex flex-col gap-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono-num text-xs font-bold">
                                {ord.orderNumber}
                              </span>
                              <span className="font-display text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-800">
                                {ord.status}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-600">
                              {ord.items.map((it) => `${it.name} (${it.size}) x${it.qty}`).join(', ')}
                            </p>
                            <p className="font-mono-num text-xs font-semibold">
                              Total: ${ord.totalUsd} / Rs {ord.totalPkr}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
