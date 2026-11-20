import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Heart,
  Maximize2,
  MessageCircle,
  RotateCcw,
  RotateCw,
  ShoppingBag,
  Truck,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { Product, ProductColorVariant } from '../types';
import { CutoutImage } from './CutoutImage';
import { ProductLightbox } from './ProductLightbox';
import { resolveColorAppearance } from '../utils/color';

interface ProductDetailViewProps {
  product: Product;
  initialColorName?: string | null;
  brandName: string;
  whatsappDisplay: string;
  isWishlisted?: boolean;
  onToggleWishlist?: (product: Product) => void;
  onBack: () => void;
  onAddToCart: (product: Product, size: string, color?: ProductColorVariant | null) => void;
  onQuickWhatsApp: (product: Product, size: string, color?: ProductColorVariant | null) => void;
}

function normalizeAngleDeg(deg: number): number {
  let a = deg % 360;
  if (a > 180) a -= 360;
  if (a <= -180) a += 360;
  return a;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  initialColorName = null,
  brandName,
  whatsappDisplay,
  isWishlisted = false,
  onToggleWishlist,
  onBack,
  onAddToCart,
  onQuickWhatsApp,
}) => {
  const [view, setView] = useState<'front' | 'back'>('front');
  const [isZoomed, setIsZoomed] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isDraggingUI, setIsDraggingUI] = useState(false);
  const [selectedColorName, setSelectedColorName] = useState<string | null>(initialColorName);
  const [selectedSize, setSelectedSize] = useState<string>(
    product.sizes.includes('M') ? 'M' : product.sizes[0] || 'M'
  );
  const [added, setAdded] = useState(false);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const rotatorRef = useRef<HTMLDivElement | null>(null);
  const shadowRef = useRef<HTMLDivElement | null>(null);
  const glareRef = useRef<HTMLDivElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);

  const physicsRef = useRef({
    // Current interpolated angles
    curY: 0,
    curX: 0,
    curScale: 1,
    // Target base angles (driven by FRONT/BACK buttons or 360 drag)
    baseY: 0,
    baseX: 0,
    // Cursor hover offset angles
    hoverY: 0,
    hoverX: 0,
    // Glare coordinates (%)
    gx: 50,
    gy: 45,
    // Drag state & inertia
    isDragging: false,
    hasDragged: false,
    downX: 0,
    downY: 0,
    pointerId: null as number | null,
    lastX: 0,
    lastY: 0,
    velY: 0,
    velX: 0,
    zoomed: false,
    rafId: null as number | null,
  });

  const applyTransformDOM = useCallback(() => {
    const ph = physicsRef.current;
    if (rotatorRef.current) {
      rotatorRef.current.style.transform = `scale(${ph.curScale.toFixed(3)}) rotateX(${ph.curX.toFixed(
        2
      )}deg) rotateY(${ph.curY.toFixed(2)}deg)`;
    }

    if (shadowRef.current) {
      const rad = (ph.curY * Math.PI) / 180;
      const edgeFactor = Math.abs(Math.cos(rad)); // 1 flat front/back, 0 side-on
      const shiftX = Math.sin(rad) * -28;
      const scaleX = 0.52 + edgeFactor * 0.48;
      shadowRef.current.style.transform = `translateX(${shiftX.toFixed(
        1
      )}px) scaleX(${scaleX.toFixed(3)})`;
      shadowRef.current.style.opacity = (0.35 + edgeFactor * 0.45).toFixed(2);
    }

    if (glareRef.current) {
      glareRef.current.style.background = `radial-gradient(circle at ${ph.gx.toFixed(
        1
      )}% ${ph.gy.toFixed(1)}%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 58%)`;
    }

    if (backdropRef.current) {
      backdropRef.current.style.transform = `rotateX(${(ph.curX * 0.35).toFixed(
        2
      )}deg) rotateY(${(ph.curY * 0.14).toFixed(2)}deg)`;
    }

    // Sync active FRONT / BACK indicator automatically based on visible 3D side
    const normalized = Math.abs(normalizeAngleDeg(ph.curY));
    const side: 'front' | 'back' = normalized > 90 ? 'back' : 'front';
    setView((prev) => (prev !== side ? side : prev));
  }, []);

  const stopLoop = useCallback(() => {
    const ph = physicsRef.current;
    if (ph.rafId !== null) {
      cancelAnimationFrame(ph.rafId);
      ph.rafId = null;
    }
  }, []);

  const stepAnimation = useCallback(() => {
    const ph = physicsRef.current;

    // Apply rotational inertia after drag release
    if (!ph.isDragging && (Math.abs(ph.velY) > 0.05 || Math.abs(ph.velX) > 0.05)) {
      ph.baseY += ph.velY;
      ph.baseX = Math.max(-24, Math.min(24, ph.baseX + ph.velX));
      ph.velY *= 0.92;
      ph.velX *= 0.88;
      if (Math.abs(ph.velY) < 0.05) ph.velY = 0;
      if (Math.abs(ph.velX) < 0.05) ph.velX = 0;
    }

    const targetY = ph.baseY + ph.hoverY;
    const targetX = Math.max(-28, Math.min(28, ph.baseX + ph.hoverX));
    const targetScale = ph.zoomed ? 1.24 : 1;

    const dy = targetY - ph.curY;
    const dx = targetX - ph.curX;
    const ds = targetScale - ph.curScale;

    // Smooth responsive spring-follow interpolation
    const followSpeed = ph.isDragging ? 0.42 : 0.16;
    ph.curY += dy * followSpeed;
    ph.curX += dx * followSpeed;
    ph.curScale += ds * 0.18;

    applyTransformDOM();

    const settled =
      !ph.isDragging &&
      Math.abs(ph.velY) < 0.05 &&
      Math.abs(ph.velX) < 0.05 &&
      Math.abs(dy) < 0.04 &&
      Math.abs(dx) < 0.04 &&
      Math.abs(ds) < 0.002;

    if (settled) {
      ph.curY = targetY;
      ph.curX = targetX;
      ph.curScale = targetScale;
      applyTransformDOM();
      ph.rafId = null;
      return;
    }

    ph.rafId = requestAnimationFrame(stepAnimation);
  }, [applyTransformDOM]);

  const startLoop = useCallback(() => {
    const ph = physicsRef.current;
    if (ph.rafId === null) {
      ph.rafId = requestAnimationFrame(stepAnimation);
    }
  }, [stepAnimation]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setView('front');
    setIsZoomed(false);
    setLightboxOpen(false);
    setSelectedColorName(initialColorName);
    setSelectedSize(product.sizes.includes('M') ? 'M' : product.sizes[0] || 'M');

    const ph = physicsRef.current;
    ph.curY = 0;
    ph.curX = 0;
    ph.curScale = 1;
    ph.baseY = 0;
    ph.baseX = 0;
    ph.hoverY = 0;
    ph.hoverX = 0;
    ph.velY = 0;
    ph.velX = 0;
    ph.zoomed = false;
    applyTransformDOM();

    return () => stopLoop();
  }, [product, initialColorName, applyTransformDOM, stopLoop]);

  useEffect(() => {
    physicsRef.current.zoomed = isZoomed;
    startLoop();
  }, [isZoomed, startLoop]);

  const rotateToAngle = (targetDeg: number) => {
    const ph = physicsRef.current;
    // Pick nearest equivalent turn so spin takes the cleanest 3D arc
    const currentMod = normalizeAngleDeg(ph.baseY);
    let delta = targetDeg - currentMod;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    ph.baseY = ph.baseY + delta;
    ph.baseX = 0;
    ph.velY = 0;
    ph.velX = 0;
    startLoop();
  };

  const switchView = (next: 'front' | 'back') => {
    rotateToAngle(next === 'back' ? 180 : 0);
  };

  const handleFullSpin = () => {
    const ph = physicsRef.current;
    ph.baseY += 360;
    ph.baseX = 0;
    ph.velY = 0;
    ph.velX = 0;
    startLoop();
  };

  const handleReset3D = () => {
    const ph = physicsRef.current;
    ph.hoverY = 0;
    ph.hoverX = 0;
    ph.baseX = 0;
    ph.velY = 0;
    ph.velX = 0;
    rotateToAngle(0);
    setIsZoomed(false);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const ph = physicsRef.current;
    ph.isDragging = true;
    ph.hasDragged = false;
    ph.downX = e.clientX;
    ph.downY = e.clientY;
    ph.pointerId = e.pointerId;
    ph.lastX = e.clientX;
    ph.lastY = e.clientY;
    ph.velY = 0;
    ph.velX = 0;
    // Fold current hover angle into base so dragging starts smoothly without snapping
    ph.baseY += ph.hoverY;
    ph.baseX = Math.max(-24, Math.min(24, ph.baseX + ph.hoverX));
    ph.hoverY = 0;
    ph.hoverX = 0;
    setIsDraggingUI(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    startLoop();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const ph = physicsRef.current;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;

    ph.gx = Math.max(5, Math.min(95, nx * 100));
    ph.gy = Math.max(5, Math.min(95, ny * 100));

    if (ph.isDragging && e.pointerId === ph.pointerId) {
      if (!ph.hasDragged && Math.hypot(e.clientX - ph.downX, e.clientY - ph.downY) > 6) {
        ph.hasDragged = true;
      }
      const dx = e.clientX - ph.lastX;
      const dy = e.clientY - ph.lastY;
      ph.lastX = e.clientX;
      ph.lastY = e.clientY;

      const deltaRotY = dx * 0.72;
      const deltaRotX = -dy * 0.34;
      ph.baseY += deltaRotY;
      ph.baseX = Math.max(-24, Math.min(24, ph.baseX + deltaRotX));
      ph.velY = deltaRotY * 0.75;
      ph.velX = deltaRotX * 0.5;
      startLoop();
      return;
    }

    // Free cursor 3D rotation on hover (mouse)
    if (e.pointerType !== 'touch') {
      const centeredX = nx - 0.5; // -0.5 to 0.5
      const centeredY = ny - 0.5;
      ph.hoverY = centeredX * 68; // Smooth ±34deg natural 3D rotation with cursor
      ph.hoverX = -centeredY * 32; // Smooth ±16deg vertical pitch
      startLoop();
    }
  };

  const finishDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const ph = physicsRef.current;
    if (!ph.isDragging || e.pointerId !== ph.pointerId) return;
    const wasClick = !ph.hasDragged;
    ph.isDragging = false;
    ph.pointerId = null;
    setIsDraggingUI(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    startLoop();
    if (wasClick) {
      setLightboxOpen(true);
    }
  };

  const handlePointerLeave = () => {
    const ph = physicsRef.current;
    if (!ph.isDragging) {
      ph.hoverY = 0;
      ph.hoverX = 0;
      ph.gx = 50;
      ph.gy = 45;
      startLoop();
    }
  };

  const { colors, activeColor, frontImage: frontSrc, backImage: backSrc, tintHex } =
    resolveColorAppearance(product, selectedColorName);

  const handleAdd = () => {
    onAddToCart(product, selectedSize, activeColor);
    setAdded(true);
    setTimeout(() => setAdded(false), 950);
  };

  return (
    <motion.main
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-10 flex flex-col gap-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-black/10">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 font-display text-xs font-bold uppercase tracking-[0.1em] px-5 py-2.5 rounded-full border border-black/20 hover:bg-zinc-950 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          BACK TO {brandName}
        </button>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 font-display text-[11px] font-bold uppercase tracking-[0.08em] px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Truck className="w-3.5 h-3.5" />
            100% Free Home Delivery
          </span>
          <span className="font-mono-num text-xs text-zinc-500 uppercase tracking-[0.06em]">
            {product.audience === 'kids' ? 'KIDS' : 'ADULTS'} · {product.category}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
        {/* Interactive 360° Cursor-Rotated 3D Showcase Stage */}
        <div
          ref={stageRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
          onPointerLeave={handlePointerLeave}
          style={{ perspective: '1050px' }}
          className={`lg:col-span-7 relative min-h-[420px] sm:min-h-[540px] lg:min-h-[600px] rounded-3xl border border-black/10 bg-[radial-gradient(circle_at_50%_42%,#ffffff_0%,#efeff3_100%)] flex items-center justify-center p-6 sm:p-10 overflow-hidden select-none touch-pan-y ${
            isDraggingUI ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          {/* Specular Lighting Glare Layer */}
          <div
            ref={glareRef}
            className="pointer-events-none absolute inset-0 transition-opacity duration-200"
          />

          {/* 3D Railing / Shelf Depth Context */}
          <div
            ref={backdropRef}
            className="pointer-events-none absolute inset-0 flex flex-col justify-between p-8 sm:p-10 preserve-3d"
          >
            {product.category !== 'shoes' ? (
              <div className="rack-rail-3d w-full h-3 rounded-full opacity-90" />
            ) : (
              <div />
            )}

            {product.category === 'shoes' ? (
              <div className="shoe-shelf-plank-3d w-full h-3 rounded-full mb-1 opacity-90" />
            ) : (
              <div />
            )}
          </div>

          {/* Top Left Angle Status & 360 Controls */}
          <div
            className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <span className="font-display text-[10px] font-extrabold uppercase tracking-[0.12em] px-3 py-1.5 rounded-full bg-zinc-950 text-white shadow-sm">
              3D · {view === 'back' ? 'BACK VIEW' : 'FRONT VIEW'}
            </span>
            <button
              type="button"
              onClick={handleFullSpin}
              title="Spin 360°"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/95 border border-black/15 shadow-sm font-display text-[10px] font-bold uppercase tracking-[0.08em] hover:bg-zinc-950 hover:text-white transition-colors"
            >
              <RotateCw className="w-3 h-3" />
              360° SPIN
            </button>
            <button
              type="button"
              onClick={handleReset3D}
              title="Reset 3D Angle"
              className="w-8 h-8 rounded-full bg-white/95 border border-black/15 shadow-sm flex items-center justify-center text-zinc-700 hover:bg-zinc-950 hover:text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Top Right Zoom & Lightbox Controls */}
          <div
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute top-4 right-4 z-20 flex items-center gap-2"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsZoomed((z) => !z);
              }}
              aria-label={isZoomed ? 'Zoom out image' : 'Zoom in image'}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/95 border border-black/15 shadow-sm font-display text-[11px] font-bold uppercase tracking-[0.06em] hover:bg-zinc-950 hover:text-white transition-colors"
            >
              {isZoomed ? <ZoomOut className="w-3.5 h-3.5" /> : <ZoomIn className="w-3.5 h-3.5" />}
              {isZoomed ? 'RESET ZOOM' : 'ZOOM'}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxOpen(true);
              }}
              aria-label="Open high resolution lightbox"
              title="Open Lightbox"
              className="w-9 h-9 rounded-full bg-white/95 border border-black/15 shadow-sm flex items-center justify-center text-zinc-900 hover:bg-zinc-950 hover:text-white transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* True Double-Sided 3D Mesh Object (Front & Back Faces) */}
          <div
            ref={rotatorRef}
            className="relative w-full h-[340px] sm:h-[450px] lg:h-[500px] preserve-3d will-change-transform pointer-events-none"
          >
            {/* Front 3D Face */}
            <div
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'translateZ(2px)',
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <CutoutImage
                src={frontSrc}
                tintHex={tintHex}
                alt={`${product.name}${activeColor ? ` - ${activeColor.name}` : ''} front`}
                shadowClassName={product.category === 'shoes' ? 'cutout-shadow-shoe' : 'cutout-shadow'}
                className="w-full h-full max-h-[470px] sm:max-h-[500px] object-contain pointer-events-none select-none"
              />
            </div>

            {/* Back 3D Face (Rotated 180° in 3D space) */}
            <div
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg) translateZ(2px)',
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <CutoutImage
                src={backSrc}
                tintHex={tintHex}
                alt={`${product.name}${activeColor ? ` - ${activeColor.name}` : ''} back`}
                shadowClassName={product.category === 'shoes' ? 'cutout-shadow-shoe' : 'cutout-shadow'}
                className="w-full h-full max-h-[470px] sm:max-h-[500px] object-contain pointer-events-none select-none"
              />
            </div>
          </div>

          {/* Dynamic 3D Floor Shadow */}
          <div
            ref={shadowRef}
            className="pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2 w-[56%] h-7 rounded-full"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0) 72%)',
            }}
          />

          {/* Bottom Interactive Hint */}
          <span className="pointer-events-none absolute bottom-3.5 left-1/2 -translate-x-1/2 font-display text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500 whitespace-nowrap bg-white/80 backdrop-blur-xs px-3 py-1 rounded-full border border-black/5">
            CLICK FOR HIGH-RES LIGHTBOX · DRAG TO ROTATE 360°
          </span>
        </div>

        {/* Clear Product Details & Purchase Controls */}
        <div className="lg:col-span-5 flex flex-col justify-center gap-5 bg-zinc-50/70 border border-black/10 rounded-3xl p-6 sm:p-8">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <span className="font-display text-[11px] font-bold uppercase tracking-[0.12em] px-3 py-1 rounded-full bg-zinc-950 text-white">
                {product.audience === 'kids' ? 'KIDS (4–14Y)' : 'ADULTS'}
              </span>
              <span className="font-display text-[11px] font-bold uppercase tracking-[0.12em] px-3 py-1 rounded-full bg-white border border-black/15 text-zinc-700">
                {product.category}
              </span>
              <span className="font-mono-num text-[11px] font-bold text-emerald-700 px-2.5 py-1 rounded-full bg-emerald-100">
                {product.stockCount} In Stock
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight text-zinc-950 leading-tight">
              {product.name}
            </h1>
            <p className="font-mono-num text-2xl font-bold text-zinc-950 mt-3">
              ${product.priceUsd} <span className="text-zinc-400 font-normal">/</span> Rs{' '}
              {product.pricePkr}
            </p>
          </div>

          <div className="border-y border-black/10 py-4">
            <h2 className="font-display text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-400 mb-1.5">
              PRODUCT DETAILS
            </h2>
            <p className="text-sm sm:text-base text-zinc-700 leading-relaxed">{product.description}</p>
          </div>

          <div>
            <span className="font-display text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-500 block mb-2">
              VIEW ANGLE
            </span>
            <div className="inline-flex gap-2">
              <button
                type="button"
                onClick={() => switchView('front')}
                className={`font-display text-xs font-bold uppercase tracking-[0.08em] px-5 py-2.5 rounded-full transition-colors ${
                  view === 'front'
                    ? 'bg-zinc-950 text-white'
                    : 'bg-white border border-black/15 text-zinc-700 hover:border-zinc-950'
                }`}
              >
                FRONT
              </button>
              <button
                type="button"
                onClick={() => switchView('back')}
                className={`font-display text-xs font-bold uppercase tracking-[0.08em] px-5 py-2.5 rounded-full transition-colors ${
                  view === 'back'
                    ? 'bg-zinc-950 text-white'
                    : 'bg-white border border-black/15 text-zinc-700 hover:border-zinc-950'
                }`}
              >
                BACK
              </button>
            </div>
          </div>

          {colors.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-display text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-500">
                  COLOR: <strong className="text-zinc-950">{activeColor?.name}</strong>
                </span>
                <span className="font-mono-num text-[11px] text-zinc-400">
                  {colors.length} Colors
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                {colors.map((c) => {
                  const isActive = activeColor?.name === c.name;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setSelectedColorName(c.name)}
                      title={c.name}
                      aria-label={`Select color ${c.name}`}
                      className={`group flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border text-xs font-display font-bold transition-all ${
                        isActive
                          ? 'bg-zinc-950 border-zinc-950 text-white shadow-sm'
                          : 'bg-white border-black/15 text-zinc-800 hover:border-zinc-950'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full border ${
                          isActive ? 'border-white/50' : 'border-black/20'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                      <span className="text-[11px] uppercase tracking-[0.04em]">{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <span className="font-display text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-500 block mb-2">
              SELECT SIZE
            </span>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setSelectedSize(sz)}
                  className={`min-w-[48px] h-11 px-3.5 rounded-full border font-display text-xs font-bold transition-all ${
                    selectedSize === sz
                      ? 'bg-zinc-950 border-zinc-950 text-white shadow-sm'
                      : 'bg-white border-black/20 text-zinc-900 hover:border-zinc-950'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleAdd}
                className={`flex-1 h-13 rounded-full font-display text-xs sm:text-sm font-bold uppercase tracking-[0.1em] inline-flex items-center justify-center gap-2 transition-all shadow-md ${
                  added ? 'bg-emerald-600 text-white' : 'bg-zinc-950 text-white hover:bg-zinc-800'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                {added ? 'ADDED TO BAG' : 'ADD TO CART'}
              </button>

              {onToggleWishlist && (
                <button
                  type="button"
                  onClick={() => onToggleWishlist(product)}
                  aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                  title={isWishlisted ? 'Saved in Wishlist' : 'Save to Wishlist'}
                  className={`w-13 h-13 shrink-0 rounded-full border flex items-center justify-center transition-all shadow-sm ${
                    isWishlisted
                      ? 'border-rose-200 bg-rose-50 text-rose-600'
                      : 'border-black/20 bg-white text-zinc-800 hover:border-rose-300 hover:text-rose-600'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-600' : ''}`} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => onQuickWhatsApp(product, selectedSize, activeColor)}
              className="w-full h-13 rounded-full bg-[#16a34a] hover:bg-[#15803d] text-white font-display text-xs sm:text-sm font-bold uppercase tracking-[0.08em] inline-flex items-center justify-center gap-2 transition-colors shadow-md"
            >
              <MessageCircle className="w-4 h-4" />
              ORDER ON WHATSAPP ({whatsappDisplay})
            </button>
          </div>

          <div className="pt-2 text-xs text-zinc-500 flex flex-wrap gap-2">
            <span>{brandName} Verified Studio</span>
            <span>·</span>
            <span>100% Free Home Delivery</span>
            <span>·</span>
            <span>Cash On Delivery</span>
          </div>
        </div>
      </div>

      <ProductLightbox
        isOpen={lightboxOpen}
        productName={product.name}
        colorName={activeColor?.name}
        tintHex={tintHex}
        frontImage={frontSrc}
        backImage={backSrc}
        initialAngle={view}
        onClose={() => setLightboxOpen(false)}
      />
    </motion.main>
  );
};
