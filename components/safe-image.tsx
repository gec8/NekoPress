"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { DEFAULT_ARTICLE_IMAGE } from "@/lib/images";

type SafeImageProps = ImageProps & { fallbackSrc?: string };

export function SafeImage({ src, alt, fallbackSrc = DEFAULT_ARTICLE_IMAGE, onError, ...props }: SafeImageProps) {
  const [failedSrc, setFailedSrc] = useState<ImageProps["src"] | null>(null);
  const currentSrc = !src || failedSrc === src ? fallbackSrc : src;

  return <Image {...props} src={currentSrc} alt={alt} onError={(event) => {
    if (currentSrc !== fallbackSrc) setFailedSrc(src);
    onError?.(event);
  }} />;
}
