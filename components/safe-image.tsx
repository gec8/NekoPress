"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { DEFAULT_ARTICLE_IMAGE, randomOnlineImage } from "@/lib/images";

type SafeImageProps = ImageProps & { fallbackSrc?: string };

export function SafeImage({ src, alt, fallbackSrc = DEFAULT_ARTICLE_IMAGE, onError, unoptimized, ...props }: SafeImageProps) {
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const sourceValue=typeof src==="string"?src:"";
  const onlineFallback=randomOnlineImage(alt||sourceValue||"nekopress");
  const preferredFallback=fallbackSrc===DEFAULT_ARTICLE_IMAGE?onlineFallback:fallbackSrc;
  let currentSrc:ImageProps["src"]=sourceValue&&!failedSources.includes(sourceValue)?src:preferredFallback;
  if(typeof currentSrc==="string"&&failedSources.includes(currentSrc))currentSrc=DEFAULT_ARTICLE_IMAGE;
  const isRemote=typeof currentSrc==="string"&&/^https:\/\//i.test(currentSrc);

  return <Image {...props} unoptimized={unoptimized??isRemote} src={currentSrc} alt={alt} onError={(event) => {
    if(typeof currentSrc==="string"&&currentSrc!==DEFAULT_ARTICLE_IMAGE)setFailedSources(values=>values.includes(currentSrc)?values:[...values,currentSrc]);
    onError?.(event);
  }} />;
}
