"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

type Props = {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  aspectRatio?: string;
  sizes?: string;
};

function generateSrcSet(baseSrc: string): string {
  if (!baseSrc || baseSrc.startsWith("/") && !baseSrc.startsWith("/uploads")) {
    return "";
  }
  // For external URLs or uploaded files, generate width variants
  const widths = [320, 480, 640, 768, 1024, 1280];
  return widths.map((w) => `${baseSrc}?w=${w} ${w}w`).join(", ");
}

export default function OptimizedImage({
  src,
  alt,
  className = "",
  containerClassName = "",
  aspectRatio = "1/1",
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
}: Props) {
  const [hasError, setHasError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    setCurrentSrc(src);
    setHasError(false);
    setLoaded(false);
  }, [src]);

  if (!currentSrc || hasError) {
    return (
      <div className={`relative flex items-center justify-center overflow-hidden rounded-2xl bg-surface-2 w-full ${containerClassName}`}>
        <svg className="h-12 w-12 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  const srcSet = generateSrcSet(currentSrc);

  return (
    <div
      className={`relative overflow-hidden ${containerClassName}`}
      style={{ aspectRatio }}
    >
      {/* Blur placeholder animation */}
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-surface-2 to-surface" />
      )}
      <Image
        src={currentSrc}
        alt={alt}
        unoptimized
        width={640}
        height={640}
        className={`transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"} ${className}`}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setHasError(true);
        }}
      />
    </div>
  );
}
