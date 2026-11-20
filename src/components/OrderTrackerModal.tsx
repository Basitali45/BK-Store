import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Clock, MapPin, Package, PackageCheck, Search, Truck, X } from 'lucide-react';

interface OrderTrackerModalProps {
  isOpen: boolean;
  brandName: string;
  onClose: () => void;
}

type TrackerStage = 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered';

interface DummyTrackedOrder {
  orderId: string;
  status: TrackerStage;
  customerName: string;
  city: string;
  placedAt: string;
  estimatedDelivery: string;
  itemsSummary: string;
  totalLabel: string;
  trackingNote: string;
}

const DUMMY_ORDERS: DummyTrackedOrder[] = [
  {
    orderId: 'BK-1001',
    status: 'Delivered',
    customerName: 'Ahsan Ali',
    city: 'Lahore, PK',
    placedAt: 'Nov 16, 2026',
    estimatedDelivery: 'Delivered Nov 19, 2026',
    itemsSummary: 'Studio Fleece Hoodie (L) x1, Tactical Cargo Pant (M) x1',
    totalLabel: '$166 / Rs 15,798',
    trackingNote: 'Handed to recipient via 100% Free Home Delivery courier.',
  },
  {
    orderId: 'BK-1002',
    status: 'Shipped',
    customerName: 'Zainab Khan',
    city: 'Karachi, PK',
    placedAt: 'Nov 18, 2026',
    estimatedDelivery: 'Arriving Tomorrow',
    itemsSummary: 'Carbon Mesh Runner (EU 42) x1',
    totalLabel: '$95 / Rs 8,999',
    trackingNote: 'Dispatched from BK Store Hub and currently in transit to Karachi.',
  },
  {
    orderId: 'BK-1003',
    status: 'Confirmed',
    customerName: 'Bilal Ahmed',
    city: 'Islamabad, PK',
    placedAt: 'Nov 19, 2026',
    estimatedDelivery: 'Est. 2–3 Business Days',
    itemsSummary: 'Junior Box Hoodie (8-9Y) x1, Kids Arch Logo Tee (8-9Y) x2',
    totalLabel: '$112 / Rs 10,497',
    trackingNote: 'Order verified and being packed at studio dispatch.',
  },
  {
    orderId: 'BK-1004',
    status: 'Pending',
    customerName: 'Hamza Tariq',
    city: 'Rawalpindi, PK',
    placedAt: 'Nov 20, 2026',
    estimatedDelivery: 'Awaiting Confirmation',
    itemsSummary: 'Rack Team Tank (M) x1',
    totalLabel: '$38 / Rs 3,499',
    trackingNote: 'Order received. Team is confirming size & delivery details.',
  },
];

const STAGES: Array<{ key: TrackerStage; label: string; icon: React.FC<{ className?: string }> }> = [
  { key: 'Pending', label: 'Pending', icon: Clock },
  { key: 'Confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'Shipped', label: 'Shipped', icon: Truck },
  { key: 'Delivered', label: 'Delivered', icon: PackageCheck },
];

const STATUS_BADGE: Record<TrackerStage, string> = {
  Pending: 'bg-amber-100 text-amber-800 border-amber-200',
  Confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  Shipped: 'bg-orange-100 text-[#c2410c] border-orange-200',
  Delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  brandName,
  onClose,
}) => {
  const [orderInput, setOrderInput] = useState('BK-1002');
  const [submittedId, setSubmittedId] = useState('BK-1002');

  const matchedOrder = DUMMY_ORDERS.find(
    (o) => o.orderId.toLowerCase() === submittedId.trim().toLowerCase()
  );

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedId(orderInput.trim());
  };

  const selectSample = (id: string) => {
    setOrderInput(id);
    setSubmittedId(id);
  };

  const currentStageIndex = matchedOrder
    ? STAGES.findIndex((s) => s.key === matchedOrder.status)
    : -1;

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
            initial={{ scale: 0.96, y: 14 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 14 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Order Status Tracker"
            className="w-full max-w-xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-black/10 flex items-center justify-between bg-zinc-950 text-white">
              <div className="flex items-center gap-2.5">
                <Package className="w-5 h-5 text-[#ff5500]" />
                <div>
                  <h2 className="font-display text-base font-extrabold uppercase tracking-[0.08em]">
                    TRACK YOUR ORDER
                  </h2>
                  <p className="text-[11px] text-zinc-400">
                    {brandName} · 100% Free Home Delivery
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close tracker"
                className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex flex-col gap-5">
              <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={orderInput}
                    onChange={(e) => setOrderInput(e.target.value)}
                    placeholder="Enter Order ID (e.g. BK-1001)"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-black/20 text-sm font-mono-num uppercase"
                  />
                </div>
                <button
                  type="submit"
                  className="h-11 sm:h-auto px-6 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-display text-xs font-bold uppercase tracking-[0.08em] shrink-0 transition-colors"
                >
                  CHECK STATUS
                </button>
              </form>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-display text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-400 mr-1">
                  SAMPLE IDs:
                </span>
                {DUMMY_ORDERS.map((sample) => (
                  <button
                    key={sample.orderId}
                    type="button"
                    onClick={() => selectSample(sample.orderId)}
                    className={`px-2.5 py-1 rounded-full font-mono-num text-[11px] font-semibold border transition-colors ${
                      submittedId.toUpperCase() === sample.orderId
                        ? 'bg-zinc-950 border-zinc-950 text-white'
                        : 'bg-zinc-50 border-black/10 text-zinc-700 hover:border-zinc-950'
                    }`}
                  >
                    {sample.orderId} ({sample.status})
                  </button>
                ))}
              </div>

              {!submittedId ? (
                <div className="text-center py-8 text-sm text-zinc-500">
                  Enter an order ID above to check live delivery progress.
                </div>
              ) : !matchedOrder ? (
                <div className="rounded-2xl border border-red-200 bg-red-50/70 p-5 text-center">
                  <p className="font-display text-sm font-extrabold uppercase text-red-800">
                    Order "{submittedId.toUpperCase()}" Not Found
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Try one of the sample IDs above (BK-1001, BK-1002, BK-1003, or BK-1004).
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-black/10 bg-zinc-50/80 p-5 flex flex-col gap-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-black/10">
                    <div>
                      <span className="font-display text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-400">
                        ORDER ID
                      </span>
                      <h3 className="font-mono-num text-xl font-bold text-zinc-950">
                        {matchedOrder.orderId}
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Placed {matchedOrder.placedAt} · {matchedOrder.customerName}
                      </p>
                    </div>

                    <span
                      className={`font-display text-xs font-extrabold uppercase tracking-[0.08em] px-3.5 py-1.5 rounded-full border ${
                        STATUS_BADGE[matchedOrder.status]
                      }`}
                    >
                      {matchedOrder.status}
                    </span>
                  </div>

                  {/* 4-Stage Progress Stepper */}
                  <div className="grid grid-cols-4 gap-2">
                    {STAGES.map((stage, idx) => {
                      const Icon = stage.icon;
                      const reached = idx <= currentStageIndex;
                      const isCurrent = idx === currentStageIndex;
                      return (
                        <div key={stage.key} className="flex flex-col items-center text-center gap-1.5">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-colors ${
                              isCurrent
                                ? 'bg-[#ff5500] border-[#ff5500] text-black shadow-sm'
                                : reached
                                  ? 'bg-zinc-950 border-zinc-950 text-white'
                                  : 'bg-white border-black/15 text-zinc-400'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <span
                            className={`font-display text-[10px] font-bold uppercase tracking-[0.06em] ${
                              reached ? 'text-zinc-950' : 'text-zinc-400'
                            }`}
                          >
                            {stage.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="rounded-xl bg-white border border-black/10 p-4 flex flex-col gap-2 text-xs">
                    <div className="flex items-start gap-2 text-zinc-700">
                      <MapPin className="w-4 h-4 text-[#ff5500] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-zinc-950">
                          {matchedOrder.city} · {matchedOrder.estimatedDelivery}
                        </p>
                        <p className="text-zinc-500 mt-0.5">{matchedOrder.trackingNote}</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-black/5 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-zinc-600">{matchedOrder.itemsSummary}</span>
                      <span className="font-mono-num font-bold text-zinc-950">
                        {matchedOrder.totalLabel}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
