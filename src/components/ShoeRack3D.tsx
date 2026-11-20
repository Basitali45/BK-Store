import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, Heart, Pause, Play, RotateCw, ShoppingBag, Sparkles, X } from 'lucide-react';
import type { Product, ProductColorVariant } from '../types';
import { CutoutImage } from './CutoutImage';
import { resolveColorAppearance } from '../utils/color';

interface ShoeRack3DProps {
  shoes: Product[];
  wishlistIds?: number[];
  onToggleWishlist?: (product: Product) => void;
  onOpenProduct: (product: Product, colorName?: string) => void;
  onAddToCart: (product: Product, size: string, color?: ProductColorVariant | null) => void;
  onOrderWhatsApp: (product: Product, size: string, color?: ProductColorVariant | null) => void;
}

interface ShoeSlotCardProps {
  shoe: Product;
  index: number;
  isSelected: boolean;
  isWishlisted: boolean;
  selectedColorName?: string | null;
  onSelectColor: (colorName: string) => void;
  onToggleWishlist?: (product: Product) => void;
  onSelectOpen: (colorName?: string) => void;
  onQuickInspect: () => void;
}

const ShoeRackSlot: React.FC<ShoeSlotCardProps> = ({
  shoe,
  index,
  isSelected,
  isWishlisted,
  selectedColorName,
  onSelectColor,
  onToggleWishlist,
  onSelectOpen,
  onQuickInspect,
}) => {
  const [hovered, setHovered] = useState(false);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50 });
  const [showBack, setShowBack] = useState(false);
  const [flipping, setFlipping] = useState(false);

  const { colors, activeColor, frontImage, backImage, tintHex } = resolveColorAppearance(
    shoe,
    selectedColorName
  );
  const imgSrc = showBack ? backImage : frontImage;

  const toggleSide = (e: React.MouseEvent, nextBack: boolean) => {
    e.stopPropagation();
    if (nextBack === showBack) return;
    setFlipping(true);
    setTimeout(() => {
      setShowBack(nextBack);
      setFlipping(false);
    }, 115);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 22, rotateX: 10 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      onPointerEnter={() => setHovered(true)}
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width;
        const ny = (e.clientY - rect.top) / rect.height;
        setTilt({
          rx: (0.5 - ny) * 18,
          ry: (nx - 0.5) * 26,
          gx: nx * 100,
          gy: ny * 100,
        });
      }}
      onPointerLeave={() => {
        setHovered(false);
        setTilt({ rx: 0, ry: 0, gx: 50, gy: 50 });
      }}
      onClick={() => onSelectOpen(activeColor?.name)}
      style={{ perspective: '950px' }}
      className="group relative z-10 cursor-pointer flex flex-col items-center justify-end pt-3 pb-1 px-2 sm:px-3"
    >
      {/* Dynamic Studio Glare Pedestal Backing */}
      <div
        className={`relative w-full rounded-2xl border transition-all duration-200 p-3 sm:p-4 flex flex-col items-center preserve-3d ${
          isSelected
            ? 'border-[#ff5500] bg-white shadow-[0_18px_36px_rgba(255,85,0,0.16)]'
            : 'border-black/10 bg-white/75 group-hover:bg-white group-hover:border-black/25 group-hover:shadow-[0_20px_38px_rgba(0,0,0,0.14)]'
        }`}
        style={{
          transform: hovered
            ? `rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg) translateY(-10px) translateZ(18px)`
            : 'rotateX(4deg) rotateY(0deg) translateY(0px) translateZ(0px)',
          transition: 'transform 190ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 220ms ease',
        }}
      >
        {/* Spotlight Glare */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{
            background: `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 62%)`,
          }}
        />

        {/* Top Bar: Price, Heart Wishlist & Quick Front/Back Flip */}
        <div className="relative z-10 w-full flex items-center justify-between gap-1.5 mb-1">
          <div className="flex items-center gap-1">
            <span className="font-mono-num text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-zinc-950 text-white">
              ${shoe.priceUsd}
            </span>
            {onToggleWishlist && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleWishlist(shoe);
                }}
                aria-label={isWishlisted ? `Remove ${shoe.name} from wishlist` : `Save ${shoe.name} to wishlist`}
                className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                  isWishlisted
                    ? 'border-rose-200 bg-rose-50 text-rose-600'
                    : 'border-black/10 bg-white text-zinc-600 hover:text-rose-600'
                }`}
              >
                <Heart className={`w-3 h-3 ${isWishlisted ? 'fill-rose-600' : ''}`} />
              </button>
            )}
          </div>

          <div className="inline-flex rounded-full border border-black/10 bg-zinc-100 p-0.5">
            <button
              type="button"
              onClick={(e) => toggleSide(e, false)}
              className={`px-1.5 py-0.5 rounded-full font-display text-[9px] font-bold uppercase transition-colors ${
                !showBack ? 'bg-zinc-950 text-white' : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              FRONT
            </button>
            <button
              type="button"
              onClick={(e) => toggleSide(e, true)}
              className={`px-1.5 py-0.5 rounded-full font-display text-[9px] font-bold uppercase transition-colors ${
                showBack ? 'bg-zinc-950 text-white' : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              BACK
            </button>
          </div>
        </div>

        {/* Floating Animated 3D Sneaker */}
        <div
          className="relative w-full h-28 sm:h-40 flex items-center justify-center preserve-3d"
          style={{
            transform: flipping
              ? 'rotateY(88deg) scale(0.92)'
              : hovered
                ? 'translateZ(36px) scale(1.09) rotateZ(-3deg)'
                : 'translateZ(12px) scale(1)',
            transition: 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div
            className="w-full h-full flex items-center justify-center float-3d-idle"
            style={{ animationDelay: `${index * 0.55}s` }}
          >
            <CutoutImage
              src={imgSrc}
              tintHex={tintHex}
              alt={`${shoe.name}${activeColor ? ` - ${activeColor.name}` : ''} (${showBack ? 'back' : 'front'})`}
              shadowClassName="cutout-shadow-shoe"
              className="w-full max-w-[230px] h-28 sm:h-36 object-contain pointer-events-none select-none"
            />
          </div>
        </div>

        {/* Dynamic Shelf Contact Shadow */}
        <div
          className="w-3/4 h-2.5 rounded-full mt-1 transition-all duration-200 group-hover:w-2/3 group-hover:opacity-80"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0) 75%)',
          }}
        />

        {/* Podium Color Dots */}
        {colors.length > 0 && (
          <div className="relative z-10 w-full flex items-center justify-center gap-1.5 mt-1.5">
            {colors.slice(0, 6).map((c) => {
              const active = activeColor?.name === c.name;
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectColor(c.name);
                  }}
                  title={c.name}
                  aria-label={`Select color ${c.name}`}
                  className={`w-4 h-4 rounded-full border transition-all ${
                    active
                      ? 'ring-2 ring-zinc-950 ring-offset-1 scale-110 border-black/30'
                      : 'border-black/20 hover:scale-110'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              );
            })}
          </div>
        )}

        {/* Shoe Title + Quick Turntable Inspect */}
        <div className="relative z-10 w-full mt-2 flex items-center justify-between gap-2">
          <div className="text-left min-w-0">
            <p className="font-display text-xs sm:text-[13px] font-extrabold uppercase tracking-[0.04em] text-zinc-950 truncate">
              {shoe.name}
            </p>
            <p className="font-mono-num text-[10px] text-zinc-500">
              Rs {shoe.pricePkr} · {shoe.sizes[0]}–{shoe.sizes[shoe.sizes.length - 1]}
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickInspect();
            }}
            title="Inspect on 3D Rack Turntable"
            className="w-8 h-8 shrink-0 rounded-full border border-black/15 bg-white hover:bg-[#ff5500] hover:border-[#ff5500] hover:text-black flex items-center justify-center text-zinc-700 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export const ShoeRack3D: React.FC<ShoeRack3DProps> = ({
  shoes,
  wishlistIds = [],
  onToggleWishlist,
  onOpenProduct,
  onAddToCart,
  onOrderWhatsApp,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState('EU 42');
  const [selectedColorById, setSelectedColorById] = useState<Record<number, string>>({});
  const [turntableAngle, setTurntableAngle] = useState(0);
  const [autoSpin, setAutoSpin] = useState(true);
  const [pedestalPitch, setPedestalPitch] = useState(0);
  const [added, setAdded] = useState(false);

  const selectedShoe = shoes[selectedIdx] || shoes[0] || null;
  const spotlightAppearance = selectedShoe
    ? resolveColorAppearance(selectedShoe, selectedColorById[selectedShoe.id])
    : null;

  useEffect(() => {
    if (!selectedShoe) return;
    if (!selectedShoe.sizes.includes(selectedSize)) {
      setSelectedSize(
        selectedShoe.sizes.includes('EU 42') ? 'EU 42' : selectedShoe.sizes[0] || 'EU 42'
      );
    }
  }, [selectedShoe, selectedSize]);

  // Continuous smooth 360 turntable spin when drawer showcase is open
  useEffect(() => {
    if (!isOpen || !autoSpin) return;
    let rafId = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      setTurntableAngle((prev) => (prev + dt * 36) % 360);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isOpen, autoSpin]);

  if (shoes.length === 0) return null;

  const topShelf = shoes.slice(0, Math.ceil(shoes.length / 2));
  const bottomShelf = shoes.slice(Math.ceil(shoes.length / 2));

  const normalizedMod = ((turntableAngle % 360) + 360) % 360;
  const showingBackOnTurntable = normalizedMod > 90 && normalizedMod < 270;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedShoe) return;
    onAddToCart(selectedShoe, selectedSize, spotlightAppearance?.activeColor || null);
    setAdded(true);
    setTimeout(() => setAdded(false), 950);
  };

  return (
    <section
      id="footwear-section"
      className="w-full max-w-6xl mx-auto px-4 sm:px-8 pt-12 pb-6 border-t border-black/10"
    >
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 font-display text-[11px] font-bold uppercase tracking-[0.14em] px-3 py-1 rounded-full bg-zinc-950 text-white mb-2">
            <Sparkles className="w-3 h-3 text-[#ff5500]" />
            INTERACTIVE 3D FOOTWEAR CABINET
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-zinc-950">
            3D STEEL SHOE RACK
          </h2>
          <p className="font-display text-xs uppercase tracking-[0.09em] text-zinc-500 mt-1">
            {shoes.length} LIMITED PAIRS · HOVER TO TILT · CLICK ANY SHOE FOR 360° PAGE
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`font-display text-xs font-bold uppercase tracking-[0.08em] px-5 py-2.5 rounded-full border transition-all inline-flex items-center gap-2 ${
            isOpen
              ? 'bg-zinc-950 border-zinc-950 text-white shadow-md'
              : 'border-black/20 hover:bg-zinc-950 hover:text-white'
          }`}
        >
          <RotateCw className={`w-3.5 h-3.5 ${isOpen ? 'animate-spin' : ''}`} />
          {isOpen ? 'CLOSE 3D TURNTABLE' : 'OPEN 3D RACK TURNTABLE'}
        </button>
      </div>

      {/* 3D Illuminated Chrome Cabinet Shell */}
      <motion.div
        initial={{ opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-3xl border border-black/15 bg-gradient-to-b from-zinc-100 via-zinc-50 to-zinc-200/70 p-4 sm:p-7 perspective-stage shadow-[0_24px_60px_rgba(0,0,0,0.08)] overflow-hidden"
      >
        {/* Top Ambient Studio Light Strip */}
        <div
          aria-hidden="true"
          className="h-1.5 w-3/4 mx-auto mb-5 rounded-full bg-gradient-to-r from-transparent via-[#ff5500] to-transparent opacity-80 shadow-[0_0_18px_rgba(255,85,0,0.55)]"
        />

        {/* Chrome Tubular Vertical Rails */}
        <div className="relative border-x-[6px] border-zinc-400 rounded-xl px-2 sm:px-5 pt-2 pb-5 flex flex-col gap-6 preserve-3d bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.9),rgba(244,244,245,0.4))]">
          {[topShelf, bottomShelf].map((shelf, sIdx) => (
            <div
              key={sIdx}
              className="relative grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 items-end pb-7 pt-1"
            >
              {shelf.map((shoe, idxInShelf) => {
                const realIdx = shoes.findIndex((s) => s.id === shoe.id);
                const isSelected = isOpen && realIdx === selectedIdx;

                return (
                  <ShoeRackSlot
                    key={shoe.id}
                    shoe={shoe}
                    index={sIdx * 2 + idxInShelf}
                    isSelected={isSelected}
                    isWishlisted={wishlistIds.includes(shoe.id)}
                    selectedColorName={selectedColorById[shoe.id]}
                    onSelectColor={(colorName) =>
                      setSelectedColorById((prev) => ({ ...prev, [shoe.id]: colorName }))
                    }
                    onToggleWishlist={onToggleWishlist}
                    onSelectOpen={(colorName) => {
                      setSelectedIdx(realIdx);
                      onOpenProduct(shoe, colorName);
                    }}
                    onQuickInspect={() => {
                      setSelectedIdx(realIdx);
                      setIsOpen(true);
                      setAutoSpin(true);
                    }}
                  />
                );
              })}

              {/* Brushed Chrome Shelf Plank with Subtle LED Edge */}
              <div
                aria-hidden="true"
                className="shoe-shelf-plank-3d absolute -left-2 sm:-left-5 -right-2 sm:-right-5 bottom-1.5 h-3.5 rounded-sm pointer-events-none"
              >
                <div className="absolute inset-x-6 top-0 h-[1.5px] bg-white/90" />
              </div>
            </div>
          ))}
        </div>

        {/* Animated Hydraulic 3D Turntable Showcase Drawer */}
        <AnimatePresence>
          {isOpen && selectedShoe && (
            <motion.div
              initial={{ opacity: 0, height: 0, rotateX: -12 }}
              animate={{ opacity: 1, height: 'auto', rotateX: 0 }}
              exit={{ opacity: 0, height: 0, rotateX: -12 }}
              transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden origin-top"
            >
              <div className="mt-7 pt-7 border-t border-black/10 grid grid-cols-1 md:grid-cols-12 gap-7 items-center">
                {/* 360° Auto-Spin + Cursor Interactive Pedestal */}
                <div
                  onPointerMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const nx = (e.clientX - rect.left) / rect.width;
                    const ny = (e.clientY - rect.top) / rect.height;
                    if (!autoSpin) {
                      setTurntableAngle((nx - 0.5) * 360);
                    }
                    setPedestalPitch((0.5 - ny) * 16);
                  }}
                  onPointerLeave={() => setPedestalPitch(0)}
                  style={{ perspective: '1050px' }}
                  className="md:col-span-6 relative min-h-[290px] sm:min-h-[340px] rounded-2xl border border-black/10 bg-[radial-gradient(circle_at_50%_42%,#ffffff_0%,#e7e7ec_100%)] flex flex-col items-center justify-center p-6 overflow-hidden"
                >
                  {/* Top Bar Controls */}
                  <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between gap-2">
                    <div className="inline-flex rounded-full border border-black/15 bg-white/95 p-0.5 shadow-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setAutoSpin(false);
                          setTurntableAngle(0);
                        }}
                        className={`px-2.5 py-1 rounded-full font-display text-[10px] font-bold uppercase ${
                          !showingBackOnTurntable
                            ? 'bg-zinc-950 text-white'
                            : 'text-zinc-600 hover:text-zinc-950'
                        }`}
                      >
                        FRONT
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAutoSpin(false);
                          setTurntableAngle(180);
                        }}
                        className={`px-2.5 py-1 rounded-full font-display text-[10px] font-bold uppercase ${
                          showingBackOnTurntable
                            ? 'bg-zinc-950 text-white'
                            : 'text-zinc-600 hover:text-zinc-950'
                        }`}
                      >
                        BACK
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setAutoSpin((s) => !s)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/95 border border-black/15 shadow-xs font-display text-[10px] font-bold uppercase hover:bg-zinc-950 hover:text-white transition-colors"
                    >
                      {autoSpin ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      {autoSpin ? 'PAUSE 360°' : 'AUTO 360°'}
                    </button>
                  </div>

                  {/* Double-Sided Rotating 3D Sneaker Mesh */}
                  <div
                    onClick={() =>
                      onOpenProduct(selectedShoe, spotlightAppearance?.activeColor?.name)
                    }
                    style={{
                      transform: `rotateX(${pedestalPitch.toFixed(1)}deg) rotateY(${turntableAngle.toFixed(
                        1
                      )}deg)`,
                    }}
                    className="cursor-pointer relative w-full h-48 sm:h-56 preserve-3d transition-transform duration-75"
                  >
                    <div
                      style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'translateZ(2px)',
                      }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <CutoutImage
                        src={spotlightAppearance?.frontImage || selectedShoe.frontImage}
                        tintHex={spotlightAppearance?.tintHex}
                        alt={`${selectedShoe.name} front`}
                        shadowClassName="cutout-shadow-shoe"
                        className="w-full max-w-[320px] max-h-[205px] object-contain pointer-events-none"
                      />
                    </div>
                    <div
                      style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg) translateZ(2px)',
                      }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <CutoutImage
                        src={
                          spotlightAppearance?.backImage ||
                          selectedShoe.backImage ||
                          selectedShoe.frontImage
                        }
                        tintHex={spotlightAppearance?.tintHex}
                        alt={`${selectedShoe.name} back`}
                        shadowClassName="cutout-shadow-shoe"
                        className="w-full max-w-[320px] max-h-[205px] object-contain pointer-events-none"
                      />
                    </div>
                  </div>

                  {/* Spinning Turntable Disc Base */}
                  <div className="relative w-52 h-4 mt-2 rounded-full bg-gradient-to-b from-zinc-300 to-zinc-500 border border-black/15 shadow-md" />
                  <span className="mt-2 font-display text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500">
                    {autoSpin
                      ? 'LIVE 360° SHOWCASE · CLICK SHOE FOR FULL PAGE'
                      : 'MOVE CURSOR TO ROTATE · CLICK SHOE FOR FULL PAGE'}
                  </span>
                </div>

                {/* Turntable Controls & Direct Order */}
                <div className="md:col-span-6 flex flex-col gap-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-display text-[10px] font-bold uppercase tracking-[0.14em] text-[#c2410c]">
                        3D RACK SPOTLIGHT · 100% FREE HOME DELIVERY
                      </span>
                      <h3 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-zinc-950">
                        {selectedShoe.name}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      aria-label="Close shoe details"
                      className="w-9 h-9 rounded-full border border-black/10 flex items-center justify-center hover:bg-zinc-200 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quick Switch Shoes on Turntable */}
                  <div className="flex flex-wrap gap-1.5">
                    {shoes.map((s, idx) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedIdx(idx)}
                        className={`px-3 py-1 rounded-full font-display text-[10px] font-bold uppercase transition-colors ${
                          idx === selectedIdx
                            ? 'bg-zinc-950 text-white'
                            : 'bg-white border border-black/10 text-zinc-600 hover:border-zinc-950'
                        }`}
                      >
                        {s.name.split(' ')[0]} {s.name.split(' ')[1] || ''}
                      </button>
                    ))}
                  </div>

                  <p className="font-mono-num text-xl font-bold text-zinc-950">
                    ${selectedShoe.priceUsd} / Rs {selectedShoe.pricePkr}
                  </p>
                  <p className="text-sm text-zinc-600 leading-relaxed">{selectedShoe.description}</p>

                  {/* Colorways inside Turntable */}
                  {spotlightAppearance && spotlightAppearance.colors.length > 0 && (
                    <div>
                      <span className="font-display text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-500 block mb-1.5">
                        COLOR: <strong className="text-zinc-950">{spotlightAppearance.activeColor?.name}</strong>
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {spotlightAppearance.colors.map((c) => {
                          const isActive = spotlightAppearance.activeColor?.name === c.name;
                          return (
                            <button
                              key={c.name}
                              type="button"
                              onClick={() =>
                                setSelectedColorById((prev) => ({
                                  ...prev,
                                  [selectedShoe.id]: c.name,
                                }))
                              }
                              title={c.name}
                              aria-label={`Select color ${c.name}`}
                              className={`w-6 h-6 rounded-full border transition-all ${
                                isActive
                                  ? 'ring-2 ring-zinc-950 ring-offset-2 scale-110 border-black/30'
                                  : 'border-black/20 hover:scale-110'
                              }`}
                              style={{ backgroundColor: c.hex }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                    <span className="font-display text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-500 block mb-2">
                      SHOE SIZE
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {selectedShoe.sizes.map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setSelectedSize(sz)}
                          className={`min-w-[56px] h-10 px-3 rounded-full border font-mono-num text-xs font-semibold transition-all ${
                            selectedSize === sz
                              ? 'bg-zinc-950 border-zinc-950 text-white'
                              : 'bg-white border-black/20 text-zinc-900 hover:border-zinc-950'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={handleAdd}
                      className={`h-11 px-6 rounded-full font-display text-xs font-bold uppercase tracking-[0.1em] inline-flex items-center gap-2 transition-all ${
                        added ? 'bg-emerald-600 text-white' : 'bg-zinc-950 text-white hover:bg-zinc-800'
                      }`}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      {added ? 'ADDED TO BAG' : 'ADD TO CART'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onOrderWhatsApp(
                          selectedShoe,
                          selectedSize,
                          spotlightAppearance?.activeColor || null
                        )
                      }
                      className="h-11 px-5 rounded-full bg-[#16a34a] hover:bg-[#15803d] text-white font-display text-xs font-bold uppercase tracking-[0.08em] transition-colors"
                    >
                      WHATSAPP ORDER
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onOpenProduct(selectedShoe, spotlightAppearance?.activeColor?.name)
                      }
                      className="h-11 px-5 rounded-full border border-black/20 hover:bg-zinc-950 hover:text-white font-display text-xs font-bold uppercase tracking-[0.08em] inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      LARGE VIEW
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
};
