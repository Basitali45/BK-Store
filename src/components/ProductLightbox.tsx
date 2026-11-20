import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';
import { CutoutImage } from './CutoutImage';

interface ProductLightboxProps {
  isOpen: boolean;
  productName: string;
  colorName?: string | null;
  tintHex?: string | null;
  frontImage: string;
  backImage: string;
  initialAngle: 'front' | 'back';
  onClose: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;

function clampScale(val: number): number {
  return Math.max(MIN_SCALE, Math.min(MAX_SCALE, val));
}

function getTouchDistance(t1: React.Touch, t2: React.Touch): number {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.hypot(dx, dy);
}

export const ProductLightbox: React.FC<ProductLightboxProps> = ({
  isOpen,
  productName,
  colorName = null,
  tintHex = null,
  frontImage,
  backImage,
  initialAngle,
  onClose,
}) => {
  const [angle, setAngle] = useState<'front' | 'back'>(initialAngle);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const gestureRef = useRef({
    pinchStartDist: 0,
    pinchStartScale: 1,
    panStartX: 0,
    panStartY: 0,
    originPanX: 0,
    originPanY: 0,
    isMouseDown: false,
  });

  useEffect(() => {
    if (isOpen) {
      setAngle(initialAngle);
      setScale(1);
      setPan({ x: 0, y: 0 });
    }
  }, [isOpen, initialAngle]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const resetZoom = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const stepZoom = useCallback((delta: number) => {
    setScale((prev) => {
      const next = clampScale(Number((prev + delta).toFixed(2)));
      if (next <= 1.02) {
        setPan({ x: 0, y: 0 });
        return 1;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!isOpen || !el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      stepZoom(e.deltaY < 0 ? 0.25 : -0.25);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [isOpen, stepZoom]);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const g = gestureRef.current;
    if (e.touches.length === 2) {
      g.pinchStartDist = getTouchDistance(e.touches[0], e.touches[1]);
      g.pinchStartScale = scale;
      setIsPanning(false);
    } else if (e.touches.length === 1 && scale > 1) {
      g.panStartX = e.touches[0].clientX;
      g.panStartY = e.touches[0].clientY;
      g.originPanX = pan.x;
      g.originPanY = pan.y;
      setIsPanning(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const g = gestureRef.current;
    if (e.touches.length === 2 && g.pinchStartDist > 0) {
      const dist = getTouchDistance(e.touches[0], e.touches[1]);
      const nextScale = clampScale((dist / g.pinchStartDist) * g.pinchStartScale);
      setScale(nextScale);
      if (nextScale <= 1.02) {
        setPan({ x: 0, y: 0 });
      }
    } else if (e.touches.length === 1 && scale > 1 && isPanning) {
      const dx = e.touches[0].clientX - g.panStartX;
      const dy = e.touches[0].clientY - g.panStartY;
      const maxOffset = (scale - 1) * 260;
      setPan({
        x: Math.max(-maxOffset, Math.min(maxOffset, g.originPanX + dx)),
        y: Math.max(-maxOffset, Math.min(maxOffset, g.originPanY + dy)),
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length < 2) {
      gestureRef.current.pinchStartDist = 0;
    }
    if (e.touches.length === 0) {
      setIsPanning(false);
      if (scale <= 1.03) {
        resetZoom();
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (scale <= 1) return;
    const g = gestureRef.current;
    g.isMouseDown = true;
    g.panStartX = e.clientX;
    g.panStartY = e.clientY;
    g.originPanX = pan.x;
    g.originPanY = pan.y;
    setIsPanning(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const g = gestureRef.current;
    if (!g.isMouseDown || scale <= 1) return;
    const dx = e.clientX - g.panStartX;
    const dy = e.clientY - g.panStartY;
    const maxOffset = (scale - 1) * 260;
    setPan({
      x: Math.max(-maxOffset, Math.min(maxOffset, g.originPanX + dx)),
      y: Math.max(-maxOffset, Math.min(maxOffset, g.originPanY + dy)),
    });
  };

  const handleMouseUp = () => {
    gestureRef.current.isMouseDown = false;
    setIsPanning(false);
  };

  const handleDoubleClick = () => {
    if (scale > 1.05) {
      resetZoom();
    } else {
      setScale(2.4);
    }
  };

  const activeSrc = angle === 'back' ? backImage : frontImage;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          role="dialog"
          aria-modal="true"
          aria-label={`${productName} high resolution lightbox`}
          className="fixed inset-0 z-[95] bg-zinc-950/95 backdrop-blur-md flex flex-col justify-between text-white select-none"
        >
          {/* Top Bar Controls */}
          <div className="px-4 sm:px-8 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="font-display text-[10px] font-bold uppercase tracking-[0.14em] text-[#ff5500] block">
                HIGH-RESOLUTION STUDIO VIEW{colorName ? ` · ${colorName.toUpperCase()}` : ''}
              </span>
              <h2 className="font-display text-sm sm:text-base font-extrabold uppercase tracking-[0.06em] truncate">
                {productName}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-full bg-white/10 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setAngle('front');
                    resetZoom();
                  }}
                  className={`px-3 py-1 rounded-full font-display text-[10px] font-bold uppercase transition-colors ${
                    angle === 'front' ? 'bg-white text-zinc-950' : 'text-zinc-300 hover:text-white'
                  }`}
                >
                  FRONT
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAngle('back');
                    resetZoom();
                  }}
                  className={`px-3 py-1 rounded-full font-display text-[10px] font-bold uppercase transition-colors ${
                    angle === 'back' ? 'bg-white text-zinc-950' : 'text-zinc-300 hover:text-white'
                  }`}
                >
                  BACK
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-1 rounded-full bg-white/10 px-2 py-1">
                <button
                  type="button"
                  onClick={() => stepZoom(-0.4)}
                  aria-label="Zoom out"
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/15"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono-num text-[11px] font-bold min-w-[44px] text-center">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => stepZoom(0.4)}
                  aria-label="Zoom in"
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/15"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                {scale > 1 && (
                  <button
                    type="button"
                    onClick={resetZoom}
                    aria-label="Reset zoom"
                    className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/15"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close lightbox"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white hover:text-zinc-950 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Pinch-to-Zoom & Pan Image Stage */}
          <div
            ref={viewportRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            className={`relative flex-1 flex items-center justify-center overflow-hidden touch-none p-4 sm:p-10 ${
              scale > 1 ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
            }`}
          >
            <div className="relative max-w-4xl w-full h-full flex items-center justify-center">
              <div
                style={{
                  transform: `translate3d(${pan.x.toFixed(1)}px, ${pan.y.toFixed(
                    1
                  )}px, 0) scale(${scale.toFixed(3)})`,
                  transition: isPanning ? 'none' : 'transform 140ms ease-out',
                }}
                className="rounded-3xl bg-white/98 p-6 sm:p-10 shadow-2xl max-h-full flex items-center justify-center overflow-hidden"
              >
                <CutoutImage
                  src={activeSrc}
                  tintHex={tintHex}
                  alt={`${productName} (${angle})`}
                  className="max-h-[68vh] w-auto max-w-full object-contain pointer-events-none select-none"
                />
              </div>
            </div>
          </div>

          {/* Bottom Controls & Thumbnails */}
          <div className="px-4 sm:px-8 py-3.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 bg-black/40">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setAngle('front');
                  resetZoom();
                }}
                className={`w-12 h-12 rounded-xl bg-white p-1 border-2 transition-all ${
                  angle === 'front' ? 'border-[#ff5500] scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <CutoutImage
                  src={frontImage}
                  tintHex={tintHex}
                  alt="Front thumbnail"
                  className="w-full h-full object-contain"
                />
              </button>
              <button
                type="button"
                onClick={() => {
                  setAngle('back');
                  resetZoom();
                }}
                className={`w-12 h-12 rounded-xl bg-white p-1 border-2 transition-all ${
                  angle === 'back' ? 'border-[#ff5500] scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <CutoutImage
                  src={backImage}
                  tintHex={tintHex}
                  alt="Back thumbnail"
                  className="w-full h-full object-contain"
                />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex sm:hidden items-center gap-1 rounded-full bg-white/10 px-2 py-1">
                <button
                  type="button"
                  onClick={() => stepZoom(-0.5)}
                  aria-label="Zoom out"
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono-num text-[11px] font-bold min-w-[40px] text-center">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => stepZoom(0.5)}
                  aria-label="Zoom in"
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="font-display text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">
                PINCH, SCROLL, OR DOUBLE-TAP TO ZOOM · DRAG TO PAN
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
