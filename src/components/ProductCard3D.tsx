import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, Eye, Heart } from 'lucide-react';
import type { Product, ProductColorVariant } from '../types';
import { CutoutImage } from './CutoutImage';
import { resolveColorAppearance } from '../utils/color';

interface ProductCard3DProps {
  product: Product;
  isWishlisted?: boolean;
  onToggleWishlist?: (product: Product) => void;
  onAddToCart: (product: Product, size: string, color?: ProductColorVariant | null) => void;
  onOpenProduct: (product: Product, colorName?: string) => void;
  index?: number;
}

export const ProductCard3D: React.FC<ProductCard3DProps> = ({
  product,
  isWishlisted = false,
  onToggleWishlist,
  onAddToCart,
  onOpenProduct,
  index = 0,
}) => {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const [showBack, setShowBack] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedColorName, setSelectedColorName] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>(
    product.sizes.includes('M') ? 'M' : product.sizes[0] || 'M'
  );
  const [justAdded, setJustAdded] = useState(false);

  const { colors, activeColor, frontImage, backImage, tintHex } = resolveColorAppearance(
    product,
    selectedColorName
  );
  const imgSrc = showBack ? backImage : frontImage;

  const handleSetView = (back: boolean) => {
    if (back === showBack) return;
    setIsSpinning(true);
    setTimeout(() => {
      setShowBack(back);
      setIsSpinning(false);
    }, 115);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    setTilt({
      rx: (0.5 - ny) * 14,
      ry: (nx - 0.5) * 16,
      gx: nx * 100,
      gy: ny * 100,
    });
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product, selectedSize, activeColor);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 900);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 28, rotateX: 8 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.25), ease: [0.16, 1, 0.3, 1] }}
      className="perspective-stage"
    >
      <div
        onPointerEnter={() => setIsHovered(true)}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => {
          setIsHovered(false);
          setTilt({ rx: 0, ry: 0, gx: 50, gy: 50 });
        }}
        onClick={() => onOpenProduct(product, activeColor?.name)}
        style={{
          transform: isHovered
            ? `rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg) translateY(-6px)`
            : 'rotateX(0deg) rotateY(0deg) translateY(0px)',
        }}
        className="group relative cursor-pointer rounded-2xl border border-black/10 bg-gradient-to-b from-white to-zinc-50 p-4 shadow-sm hover:shadow-2xl transition-all duration-200 ease-out preserve-3d flex flex-col justify-between h-full"
      >
        {/* Specular 3D Light Glare */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{
            background: `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0) 60%)`,
          }}
        />

        {/* Top Badges & 3D Flip Button */}
        <div className="relative z-10 flex items-center justify-between gap-2 mb-2">
          <span
            className={`font-display text-[10px] font-bold uppercase tracking-[0.12em] px-2.5 py-1 rounded-full ${
              product.audience === 'kids'
                ? 'bg-[#ff5500]/15 text-[#c2410c]'
                : 'bg-zinc-900/5 text-zinc-700'
            }`}
          >
            {product.audience === 'kids' ? 'KIDS' : 'ADULTS'} · {product.category}
          </span>

          <div className="flex items-center gap-1">
            <div className="inline-flex rounded-full border border-black/10 bg-zinc-100 p-0.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSetView(false);
                }}
                className={`px-2 py-0.5 rounded-full font-display text-[9px] font-bold uppercase tracking-[0.06em] transition-colors ${
                  !showBack ? 'bg-zinc-950 text-white' : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                FRONT
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSetView(true);
                }}
                className={`px-2 py-0.5 rounded-full font-display text-[9px] font-bold uppercase tracking-[0.06em] transition-colors ${
                  showBack ? 'bg-zinc-950 text-white' : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                BACK
              </button>
            </div>
            {onToggleWishlist && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleWishlist(product);
                }}
                aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
                title={isWishlisted ? 'Saved in Wishlist' : 'Save to Wishlist'}
                className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all active:scale-90 ${
                  isWishlisted
                    ? 'border-rose-200 bg-rose-50 text-rose-600'
                    : 'border-black/10 bg-white text-zinc-700 hover:border-rose-300 hover:text-rose-600'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-rose-600' : ''}`} />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenProduct(product, activeColor?.name);
              }}
              title="Open 3D View"
              className="w-7 h-7 rounded-full border border-black/10 bg-white flex items-center justify-center text-zinc-700 hover:bg-zinc-950 hover:text-white transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Floating 3D Garment Stage */}
        <div
          className="relative h-56 sm:h-64 flex items-center justify-center my-2 preserve-3d"
          style={{
            transform: isSpinning
              ? 'rotateY(86deg) scale(0.95)'
              : isHovered
                ? 'translateZ(34px) scale(1.04)'
                : 'translateZ(0px) scale(1)',
            transition: 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div className="rack-rail-3d absolute top-2 left-4 right-4 h-1.5 rounded-full opacity-50" />
          <CutoutImage
            src={imgSrc}
            tintHex={tintHex}
            alt={`${product.name}${activeColor ? ` - ${activeColor.name}` : ''} (${showBack ? 'back' : 'front'})`}
            className="w-full h-full max-h-56 object-contain pointer-events-none select-none transition-all duration-200"
          />
        </div>

        {/* Info & Quick Size + Add to Cart */}
        <div className="relative z-10 pt-3 border-t border-black/5 flex flex-col gap-2.5">
          <div>
            <h3 className="font-display text-sm sm:text-base font-extrabold uppercase tracking-[0.03em] text-zinc-950 line-clamp-1">
              {product.name}
            </h3>
            <div className="flex items-center justify-between mt-1">
              <p className="font-mono-num text-xs sm:text-sm font-semibold text-zinc-700">
                ${product.priceUsd} / Rs {product.pricePkr}
              </p>
              <span className="font-mono-num text-[11px] text-emerald-700 font-semibold">
                {product.stockCount} left
              </span>
            </div>
          </div>

          {/* Color Swatches */}
          {colors.length > 0 && (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {colors.slice(0, 6).map((c) => {
                  const isActive = activeColor?.name === c.name;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedColorName(c.name);
                      }}
                      title={c.name}
                      aria-label={`Select color ${c.name}`}
                      className={`w-4.5 h-4.5 rounded-full border transition-all ${
                        isActive
                          ? 'ring-2 ring-zinc-950 ring-offset-1 scale-110 border-black/30'
                          : 'border-black/20 hover:scale-110'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  );
                })}
              </div>
              {activeColor && (
                <span className="font-display text-[10px] font-bold uppercase tracking-[0.04em] text-zinc-500 truncate max-w-[92px]">
                  {activeColor.name}
                </span>
              )}
            </div>
          )}

          {/* Inline Sizes */}
          <div className="flex flex-wrap gap-1">
            {product.sizes.slice(0, 5).map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSize(sz);
                }}
                className={`px-2 py-1 rounded-full text-[10px] font-mono-num font-semibold border transition-colors ${
                  selectedSize === sz
                    ? 'bg-zinc-950 border-zinc-950 text-white'
                    : 'bg-white border-black/15 text-zinc-700 hover:border-zinc-950'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className={`w-full h-10 rounded-full font-display text-[11px] font-bold uppercase tracking-[0.08em] inline-flex items-center justify-center gap-1.5 transition-all ${
              justAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-950 text-white hover:bg-zinc-800'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            {justAdded ? 'ADDED TO BAG' : 'ADD TO CART'}
          </button>
        </div>
      </div>
    </motion.article>
  );
};
