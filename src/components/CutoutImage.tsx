import React from 'react';
import { useCutoutImage } from '../utils/cutout';

interface CutoutImageProps {
  src: string;
  alt: string;
  tintHex?: string | null;
  className?: string;
  shadowClassName?: string;
  draggable?: boolean;
}

export const CutoutImage: React.FC<CutoutImageProps> = ({
  src,
  alt,
  tintHex = null,
  className = '',
  shadowClassName = 'cutout-shadow',
  draggable = false,
}) => {
  const { src: cleanSrc, isCutout } = useCutoutImage(src, tintHex);

  return (
    <img
      src={cleanSrc}
      alt={alt}
      draggable={draggable}
      referrerPolicy="no-referrer"
      className={`${className} ${isCutout ? `mix-blend-normal ${shadowClassName}` : 'mix-blend-multiply'}`}
    />
  );
};
