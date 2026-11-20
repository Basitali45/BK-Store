import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ShoppingBag, Eye, Heart } from 'lucide-react';
import type { Product, ProductColorVariant } from '../types';
import { CutoutImage } from './CutoutImage';
import { resolveColorAppearance } from '../utils/color';

interface Rack3DCarouselProps {
  title?: string;
  subtitle?: string;
  badgeText?: string;
  products: Product[];
  wishlistIds?: number[];
  onToggleWishlist?: (product: Product) => void;
  accentColor?: 'black' | 'orange';
  onOpenProduct: (product: Product, colorName?: string) => void;
  onAddToCart: (product: Product, size: string, color?: ProductColorVariant | null) => void;
  onSeeAvailability?: (product: Product) => void;
  compact?: boolean;
}

function wrapIndex(idx: number, len: number): number {
  if (len <= 0) return 0;
  return ((idx % len) + len) % len;
}

function shortestSignedOffset(slotIdx: number, pos: number, len: number): number {
  if (len <= 1) return slotIdx - pos;
  let delta = (slotIdx - pos) % len;
  if (delta > len / 2) delta -= len;
  if (delta < -len / 2) delta += len;
  return delta;
}

export const Rack3DCarousel: React.FC<Rack3DCarouselProps> = ({
  title,
  subtitle,
  badgeText,
  products,
  wishlistIds = [],
  onToggleWishlist,
  accentColor = 'black',
  onOpenProduct,
  onAddToCart,
  onSeeAvailability,
  compact = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentView, setCurrentView] = useState<'front' | 'back'>('front');
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [selectedColorById, setSelectedColorById] = useState<Record<number, string>>({});
  const [isSpinning, setIsSpinning] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [isDraggingUI, setIsDraggingUI] = useState(false);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const slotRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const gliderRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const productsLenRef = useRef(products.length);

  const physicsRef = useRef({
    pos: 0,
    targetPos: 0,
    vel: 0,
    isDragging: false,
    hasDragged: false,
    pointerId: null as number | null,
    dragStartX: 0,
    dragStartPos: 0,
    lastPointerX: 0,
    lastPointerTime: 0,
    lastFrameTime: 0,
    rafId: null as number | null,
    hoveredIdx: null as number | null,
    hoverBrush: new Map<number, number>(),
  });

  // Sync selected size and safe index when products array changes (e.g. filter switch)
  useEffect(() => {
    productsLenRef.current = products.length;
    setCurrentIndex(0);
    setCurrentView('front');
    physicsRef.current.pos = 0;
    physicsRef.current.targetPos = 0;
    physicsRef.current.vel = 0;
    if (products[0]?.sizes?.length) {
      setSelectedSize(products[0].sizes.includes('M') ? 'M' : products[0].sizes[0]);
    }
  }, [products]);

  const activeProduct = products[wrapIndex(currentIndex, products.length)] || null;

  useEffect(() => {
    if (!activeProduct) return;
    if (!activeProduct.sizes.includes(selectedSize)) {
      setSelectedSize(activeProduct.sizes.includes('M') ? 'M' : activeProduct.sizes[0] || 'M');
    }
  }, [activeProduct, selectedSize]);

  const getSlotSpacing = useCallback(() => {
    const w = window.innerWidth;
    if (w <= 640) return compact ? 104 : 114;
    if (w <= 960) return compact ? 124 : 138;
    return compact ? 140 : 158;
  }, [compact]);

  const renderFrame = useCallback(() => {
    const len = products.length;
    if (len === 0) return;

    const ph = physicsRef.current;
    const spacing = getSlotSpacing();
    const absVel = Math.abs(ph.vel);

    const nearest = wrapIndex(Math.round(ph.pos), len);
    setCurrentIndex((prev) => (prev !== nearest ? nearest : prev));

    products.forEach((_, idx) => {
      const slotEl = slotRefs.current.get(idx);
      const gliderEl = gliderRefs.current.get(idx);
      if (!slotEl || !gliderEl) return;

      const d = shortestSignedOffset(idx, ph.pos, len);
      const absD = Math.abs(d);

      if (absD > 4.2) {
        slotEl.style.opacity = '0';
        slotEl.style.pointerEvents = 'none';
        slotEl.style.visibility = 'hidden';
        return;
      }
      slotEl.style.visibility = 'visible';

      const centerFocus = Math.max(0, 1 - Math.min(1, absD / 0.65));
      const sideFactor = Math.min(1, absD / 0.72);
      const signD = d === 0 ? 0 : d > 0 ? 1 : -1;

      const xOffset =
        d * spacing +
        (ph.hoveredIdx !== null && ph.hoveredIdx !== idx
          ? (idx > ph.hoveredIdx ? 1 : -1) * 14
          : 0);

      const scale = 1.0 - Math.min(0.18, absD * 0.085);
      const opacity = absD < 0.4 ? 1 : Math.max(0.28, 1 - (absD - 0.4) * 0.34);
      const blurPx = absD < 0.48 ? 0 : Math.min(2.6, (absD - 0.48) * 1.45);
      const zDepth = -Math.min(165, sideFactor * 95 + Math.max(0, absD - 1) * 28);
      const sideAngleY = -signD * Math.min(54, sideFactor * 48 + Math.max(0, absD - 1) * 6);

      const brushSway = ph.hoverBrush.get(idx) || 0;
      const clampedVel = Math.max(-4.5, Math.min(4.5, ph.vel));
      const swingDeg = clampedVel * 4.2 + brushSway * 5.2;
      const tiltY = sideAngleY + clampedVel * 1.5 - brushSway * 6;

      slotEl.style.transform = `translate3d(${xOffset.toFixed(1)}px, 0px, ${zDepth.toFixed(1)}px) scale(${scale.toFixed(3)}) rotateY(${tiltY.toFixed(2)}deg) rotateZ(${swingDeg.toFixed(2)}deg)`;
      slotEl.style.opacity = opacity.toFixed(3);
      slotEl.style.filter = blurPx > 0.1 ? `blur(${blurPx.toFixed(2)}px)` : 'none';
      slotEl.style.zIndex = String(Math.round(45 - absD * 10));
      slotEl.style.pointerEvents = absD < 3.6 ? 'auto' : 'none';

      const isCenter = centerFocus > 0.5 && absVel < 0.4;
      slotEl.setAttribute('data-center', isCenter ? 'true' : 'false');
      gliderEl.style.transform = `translateX(${xOffset.toFixed(1)}px) translateX(-50%)`;
      gliderEl.style.opacity = String(Math.max(0.45, opacity));
    });
  }, [getSlotSpacing, products]);

  const stopPhysicsLoop = useCallback(() => {
    const ph = physicsRef.current;
    if (ph.rafId !== null) {
      cancelAnimationFrame(ph.rafId);
      ph.rafId = null;
    }
    ph.lastFrameTime = 0;
  }, []);

  const stepPhysics = useCallback(
    (now: number) => {
      const ph = physicsRef.current;
      const len = productsLenRef.current;
      if (len === 0) {
        stopPhysicsLoop();
        return;
      }

      if (!ph.lastFrameTime) ph.lastFrameTime = now;
      const dt = Math.min(0.032, (now - ph.lastFrameTime) / 1000);
      ph.lastFrameTime = now;

      let hoverBusy = false;
      ph.hoverBrush.forEach((val, key) => {
        if (ph.hoveredIdx !== key) {
          const nextVal = val * Math.exp(-8 * dt);
          if (Math.abs(nextVal) < 0.01) {
            ph.hoverBrush.delete(key);
          } else {
            ph.hoverBrush.set(key, nextVal);
            hoverBusy = true;
          }
        } else {
          hoverBusy = true;
        }
      });

      if (!ph.isDragging) {
        if (len <= 1) {
          ph.targetPos = 0;
        }
        const diff = ph.targetPos - ph.pos;
        const stiffness = 130;
        const damping = 18;
        const accel = diff * stiffness - ph.vel * damping;
        ph.vel += accel * dt;
        ph.pos += ph.vel * dt;

        if (Math.abs(diff) < 0.0015 && Math.abs(ph.vel) < 0.005) {
          ph.pos = ph.targetPos;
          ph.vel = 0;
          if (len > 1) {
            const wrapped = wrapIndex(Math.round(ph.pos), len);
            ph.pos = wrapped;
            ph.targetPos = wrapped;
          } else {
            ph.pos = 0;
            ph.targetPos = 0;
          }
          renderFrame();
          if (!hoverBusy) {
            stopPhysicsLoop();
            return;
          }
        }
      }

      renderFrame();
      ph.rafId = requestAnimationFrame(stepPhysics);
    },
    [renderFrame, stopPhysicsLoop]
  );

  const startPhysicsLoop = useCallback(() => {
    const ph = physicsRef.current;
    if (ph.rafId === null) {
      ph.lastFrameTime = performance.now();
      ph.rafId = requestAnimationFrame(stepPhysics);
    }
  }, [stepPhysics]);

  useEffect(() => {
    renderFrame();
    const onResize = () => renderFrame();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      stopPhysicsLoop();
    };
  }, [renderFrame, stopPhysicsLoop]);

  const slideRack = (step: number) => {
    if (products.length <= 1) return;
    const ph = physicsRef.current;
    const baseTarget = ph.isDragging ? Math.round(ph.pos) : ph.targetPos;
    ph.targetPos = baseTarget + step;
    ph.vel += step * 1.3;
    setCurrentView('front');
    startPhysicsLoop();
  };

  const focusSlot = (idx: number) => {
    if (products.length <= 1) return;
    const ph = physicsRef.current;
    const delta = shortestSignedOffset(idx, ph.pos, products.length);
    ph.targetPos = Math.round(ph.pos + delta);
    setCurrentView('front');
    startPhysicsLoop();
  };

  const handleToggleView = (view: 'front' | 'back') => {
    if (view === currentView || !activeProduct) return;
    setIsSpinning(true);
    setTimeout(() => {
      setCurrentView(view);
      setIsSpinning(false);
    }, 125);
  };

  const activeAppearance = activeProduct
    ? resolveColorAppearance(activeProduct, selectedColorById[activeProduct.id])
    : null;

  const handleAddClick = () => {
    if (!activeProduct) return;
    onAddToCart(activeProduct, selectedSize, activeAppearance?.activeColor || null);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 900);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (products.length === 0) return;

    const ph = physicsRef.current;
    ph.isDragging = true;
    ph.hasDragged = false;
    ph.pointerId = e.pointerId;
    ph.dragStartX = e.clientX;
    ph.dragStartPos = ph.pos;
    ph.lastPointerX = e.clientX;
    ph.lastPointerTime = performance.now();
    ph.vel = 0;

    setIsDraggingUI(true);
    startPhysicsLoop();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const ph = physicsRef.current;
    if (!ph.isDragging || e.pointerId !== ph.pointerId) return;

    const totalDx = e.clientX - ph.dragStartX;
    if (!ph.hasDragged && Math.abs(totalDx) > 5) {
      ph.hasDragged = true;
      if (viewportRef.current?.setPointerCapture) {
        try {
          viewportRef.current.setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }
    }

    const spacing = getSlotSpacing();
    const now = performance.now();
    const dt = Math.max(0.004, (now - ph.lastPointerTime) / 1000);
    const stepDx = e.clientX - ph.lastPointerX;

    if (products.length === 1) {
      ph.pos = Math.max(-0.22, Math.min(0.22, (-totalDx / spacing) * 0.45));
    } else {
      ph.pos = ph.dragStartPos - totalDx / spacing;
    }

    const instantVel = -(stepDx / spacing) / dt;
    ph.vel = ph.vel * 0.45 + instantVel * 0.55;
    ph.lastPointerX = e.clientX;
    ph.lastPointerTime = now;
    startPhysicsLoop();
  };

  const finishDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const ph = physicsRef.current;
    if (!ph.isDragging) return;
    if (e.pointerId !== ph.pointerId) return;

    ph.isDragging = false;
    setIsDraggingUI(false);
    if (viewportRef.current?.releasePointerCapture && ph.pointerId !== null) {
      try {
        viewportRef.current.releasePointerCapture(ph.pointerId);
      } catch {
        // ignore
      }
    }
    ph.pointerId = null;

    if (products.length <= 1) {
      ph.targetPos = 0;
    } else {
      const projected = ph.pos + Math.max(-0.65, Math.min(0.65, ph.vel * 0.16));
      ph.targetPos = Math.round(projected);
    }
    startPhysicsLoop();

    setTimeout(() => {
      ph.hasDragged = false;
    }, 40);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (products.length <= 1) return;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
    if (!delta) return;
    e.preventDefault();

    const ph = physicsRef.current;
    const spacing = getSlotSpacing();
    ph.pos += delta / spacing;
    ph.targetPos = ph.pos;
    ph.vel = (delta / spacing) * 8;
    startPhysicsLoop();
    setTimeout(() => {
      ph.targetPos = Math.round(ph.pos);
      startPhysicsLoop();
    }, 120);
  };

  if (products.length === 0) {
    return (
      <div className="py-20 text-center">
        <h3 className="font-display text-2xl font-extrabold uppercase tracking-tight">No Product</h3>
        <p className="mt-2 text-sm text-zinc-500">No items match this filter yet.</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      {(title || subtitle) && (
        <div className="w-full max-w-6xl px-4 sm:px-8 mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            {badgeText && (
              <span
                className={`inline-block font-display text-[11px] font-bold uppercase tracking-[0.14em] px-3 py-1 rounded-full mb-2 ${
                  accentColor === 'orange'
                    ? 'bg-[#ff5500] text-black'
                    : 'bg-zinc-950 text-white'
                }`}
              >
                {badgeText}
              </span>
            )}
            {title && (
              <h2 className="font-display text-xl sm:text-2xl font-black uppercase tracking-tight text-zinc-950">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="font-display text-xs uppercase tracking-[0.09em] text-zinc-500 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          <span className="font-mono-num text-xs text-zinc-500">
            {String(currentIndex + 1).padStart(2, '0')} / {String(products.length).padStart(2, '0')} ON RAIL
          </span>
        </div>
      )}

      {/* 3D Silver Clothing Rail Stage */}
      <div className="relative w-full pt-6 flex items-start justify-center perspective-stage overflow-hidden">
        {/* Horizontal Brushed Steel Rail */}
        <div
          className="rack-rail-3d absolute top-8 left-0 right-0 h-3 z-[6] pointer-events-none"
          aria-hidden="true"
        >
          <div className="rack-upright-3d absolute -top-2 left-0 w-3.5 h-7 rounded-sm" />
          <div className="rack-upright-3d absolute -top-2 right-0 w-3.5 h-7 rounded-sm" />
        </div>

        {/* Ground Shadow */}
        <div
          className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[min(860px,88vw)] h-6 pointer-events-none z-[1]"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.14) 0%, rgba(0, 0, 0, 0) 72%)',
          }}
        />

        {/* Prev Arrow */}
        {products.length > 1 && (
          <button
            type="button"
            onClick={() => slideRack(-1)}
            aria-label="Previous garment"
            className="absolute left-3 sm:left-10 lg:left-16 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white border border-black/10 shadow-lg flex items-center justify-center text-zinc-950 hover:scale-105 active:scale-95 transition-transform"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Drag Viewport */}
        <div
          ref={viewportRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
          onWheel={handleWheel}
          className={`relative w-full max-w-[1340px] ${
            compact ? 'h-[290px] sm:h-[340px]' : 'h-[310px] sm:h-[400px] lg:h-[445px]'
          } flex items-start justify-center select-none preserve-3d touch-pan-y ${
            isDraggingUI ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          {products.map((prod, idx) => {
            const isCenterItem = idx === currentIndex;
            const colorInfo = resolveColorAppearance(prod, selectedColorById[prod.id]);
            const imgSrc =
              isCenterItem && currentView === 'back' ? colorInfo.backImage : colorInfo.frontImage;

            return (
              <React.Fragment key={prod.id}>
                {/* Glider ring */}
                <div
                  ref={(el) => {
                    if (el) gliderRefs.current.set(idx, el);
                    else gliderRefs.current.delete(idx);
                  }}
                  className="hanger-glider-3d absolute top-[29px] left-1/2 w-[18px] h-[17px] rounded-[5px] border border-black/20 z-[12] pointer-events-none"
                >
                  <span className="absolute top-[3px] left-1/2 -translate-x-1/2 w-[6px] h-[9px] rounded-full bg-zinc-800" />
                </div>

                {/* Garment Slot */}
                <div
                  ref={(el) => {
                    if (el) slotRefs.current.set(idx, el);
                    else slotRefs.current.delete(idx);
                  }}
                  onPointerEnter={(e) => {
                    const ph = physicsRef.current;
                    if (ph.isDragging) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const nx = (e.clientX - rect.left) / rect.width - 0.5;
                    ph.hoveredIdx = idx;
                    ph.hoverBrush.set(idx, Math.max(-1, Math.min(1, nx * 2.2)));
                    startPhysicsLoop();
                  }}
                  onPointerMove={(e) => {
                    const ph = physicsRef.current;
                    if (ph.isDragging) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const nx = (e.clientX - rect.left) / rect.width - 0.5;
                    ph.hoverBrush.set(idx, Math.max(-1, Math.min(1, nx * 2.4)));
                    startPhysicsLoop();
                  }}
                  onPointerLeave={() => {
                    const ph = physicsRef.current;
                    if (ph.hoveredIdx === idx) ph.hoveredIdx = null;
                    startPhysicsLoop();
                  }}
                  onClick={() => {
                    if (physicsRef.current.hasDragged) return;
                    if (idx === currentIndex) {
                      onOpenProduct(prod, colorInfo.activeColor?.name);
                    } else {
                      focusSlot(idx);
                    }
                  }}
                  className={`group absolute top-0 left-1/2 ${
                    compact
                      ? 'w-[200px] sm:w-[250px] -ml-[100px] sm:-ml-[125px]'
                      : 'w-[215px] sm:w-[290px] lg:w-[340px] -ml-[107.5px] sm:-ml-[145px] lg:-ml-[170px]'
                  } h-full flex items-start justify-center origin-[50%_34px] preserve-3d will-change-transform`}
                >
                  <div
                    className={`relative w-full h-full flex items-start justify-center pt-0.5 origin-[50%_34px] transition-transform duration-200 ${
                      isCenterItem && isSpinning ? '[transform:rotateY(88deg)_scale(0.96)]' : ''
                    }`}
                  >
                    <CutoutImage
                      src={imgSrc}
                      tintHex={colorInfo.tintHex}
                      alt={`${prod.name}${colorInfo.activeColor ? ` - ${colorInfo.activeColor.name}` : ''}`}
                      className={`w-full h-full ${
                        compact ? 'max-h-[275px] sm:max-h-[325px]' : 'max-h-[295px] sm:max-h-[385px] lg:max-h-[430px]'
                      } object-contain object-top pointer-events-none select-none transition-opacity`}
                    />

                    {isCenterItem && (
                      <div className="opacity-0 group-hover:opacity-100 translate-y-1.5 group-hover:translate-y-0 transition-all duration-200 absolute bottom-3 left-1/2 -translate-x-1/2 bg-zinc-950/90 text-white font-display text-[11px] font-bold uppercase tracking-[0.1em] px-3.5 py-1.5 rounded-full whitespace-nowrap flex items-center gap-1.5 pointer-events-none z-20">
                        <Eye className="w-3.5 h-3.5" />
                        VIEW 3D DETAILS
                      </div>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Next Arrow */}
        {products.length > 1 && (
          <button
            type="button"
            onClick={() => slideRack(1)}
            aria-label="Next garment"
            className="absolute right-3 sm:right-10 lg:right-16 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white border border-black/10 shadow-lg flex items-center justify-center text-zinc-950 hover:scale-105 active:scale-95 transition-transform"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Purchase Controls Below Rack */}
      {activeProduct && (
        <div className="w-full max-w-md mx-auto px-5 mt-2 flex flex-col items-center text-center">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-display text-[10px] font-bold uppercase tracking-[0.14em] px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
              {activeProduct.audience === 'kids' ? 'KIDS' : 'ADULTS'} · {activeProduct.category}
            </span>
          </div>

          <h3 className="font-display text-2xl sm:text-[1.75rem] font-extrabold uppercase tracking-[0.04em] text-zinc-950 leading-tight">
            {activeProduct.name}
          </h3>
          <p className="font-mono-num text-sm sm:text-base font-semibold text-zinc-600 mt-1">
            ${activeProduct.priceUsd} / Rs {activeProduct.pricePkr}
          </p>

          {/* FRONT / BACK Toggle */}
          <div className="mt-3.5 inline-flex items-center gap-2" role="group" aria-label="Garment angle">
            <button
              type="button"
              onClick={() => handleToggleView('front')}
              className={`font-display text-[11px] font-bold uppercase tracking-[0.08em] px-4 py-2 rounded-full transition-colors ${
                currentView === 'front'
                  ? 'bg-zinc-950 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950'
              }`}
            >
              FRONT
            </button>
            <button
              type="button"
              onClick={() => handleToggleView('back')}
              className={`font-display text-[11px] font-bold uppercase tracking-[0.08em] px-4 py-2 rounded-full transition-colors ${
                currentView === 'back'
                  ? 'bg-zinc-950 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950'
              }`}
            >
              BACK
            </button>
          </div>

          {/* Color Swatches */}
          {activeAppearance && activeAppearance.colors.length > 0 && (
            <div className="mt-3.5 flex flex-col items-center gap-1.5">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="font-display text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-400 mr-0.5">
                  COLOR
                </span>
                {activeAppearance.colors.slice(0, 6).map((c) => {
                  const isActive = activeAppearance.activeColor?.name === c.name;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() =>
                        setSelectedColorById((prev) => ({
                          ...prev,
                          [activeProduct.id]: c.name,
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
              {activeAppearance.activeColor && (
                <span className="font-display text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-600">
                  {activeAppearance.activeColor.name}
                </span>
              )}
            </div>
          )}

          {/* Size Circles */}
          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
            <span className="font-display text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-400 mr-1">
              SIZE
            </span>
            {activeProduct.sizes.map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => setSelectedSize(sz)}
                className={`min-w-[42px] h-[42px] px-2.5 rounded-full border font-display text-xs font-bold transition-all ${
                  selectedSize === sz
                    ? 'bg-zinc-950 border-zinc-950 text-white shadow-sm'
                    : 'bg-white border-black/20 text-zinc-950 hover:border-zinc-950 hover:-translate-y-0.5'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>

          {/* ADD TO CART + WISHLIST HEART */}
          <div className="mt-4 w-full max-w-[320px] flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddClick}
              className={`flex-1 h-12 rounded-full font-display text-xs font-bold uppercase tracking-[0.1em] inline-flex items-center justify-center gap-2 transition-all active:scale-95 ${
                addedFeedback
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-950 text-white hover:bg-zinc-800 hover:-translate-y-0.5 shadow-md'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              {addedFeedback ? 'ADDED TO BAG' : 'ADD TO CART'}
            </button>
            {onToggleWishlist && (
              <button
                type="button"
                onClick={() => onToggleWishlist(activeProduct)}
                aria-label={
                  wishlistIds.includes(activeProduct.id)
                    ? `Remove ${activeProduct.name} from wishlist`
                    : `Save ${activeProduct.name} to wishlist`
                }
                title={wishlistIds.includes(activeProduct.id) ? 'Saved in Wishlist' : 'Save to Wishlist'}
                className={`w-12 h-12 shrink-0 rounded-full border flex items-center justify-center transition-all active:scale-95 ${
                  wishlistIds.includes(activeProduct.id)
                    ? 'border-rose-200 bg-rose-50 text-rose-600 shadow-sm'
                    : 'border-black/20 bg-white text-zinc-800 hover:border-rose-300 hover:text-rose-600'
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${wishlistIds.includes(activeProduct.id) ? 'fill-rose-600' : ''}`}
                />
              </button>
            )}
          </div>

          <div className="mt-3 flex items-center gap-4">
            {onSeeAvailability && (
              <button
                type="button"
                onClick={() => onSeeAvailability(activeProduct)}
                className="font-display text-[11px] font-bold uppercase tracking-[0.1em] underline underline-offset-4 text-zinc-900 hover:opacity-60"
              >
                SEE AVAILABILITY
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenProduct(activeProduct, activeAppearance?.activeColor?.name)}
              className="font-display text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-500 hover:text-zinc-950"
            >
              3D DETAIL PAGE →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
