import type { Product, ProductColorVariant } from '../types';

export function resolveColorAppearance(
  product: Product,
  selectedColorName?: string | null
): {
  colors: ProductColorVariant[];
  activeColor: ProductColorVariant | null;
  frontImage: string;
  backImage: string;
  tintHex: string | null;
} {
  const colors = Array.isArray(product.colors) ? product.colors : [];
  if (colors.length === 0) {
    return {
      colors: [],
      activeColor: null,
      frontImage: product.frontImage,
      backImage: product.backImage || product.frontImage,
      tintHex: null,
    };
  }

  const activeColor =
    (selectedColorName
      ? colors.find((c) => c.name.toLowerCase() === selectedColorName.toLowerCase())
      : undefined) ||
    colors.find((c) => c.isDefault) ||
    colors[0];

  const hasCustomFront = Boolean(activeColor.frontImage);
  const frontImage = activeColor.frontImage || product.frontImage;
  const backImage =
    activeColor.backImage ||
    (hasCustomFront ? activeColor.frontImage! : product.backImage || product.frontImage);

  const tintHex = activeColor.isDefault || hasCustomFront ? null : activeColor.hex;

  return {
    colors,
    activeColor,
    frontImage,
    backImage,
    tintHex,
  };
}
