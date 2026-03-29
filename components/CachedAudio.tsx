"use client";

import { useEffect, useRef, useState } from "react";
import { cacheAudioUrl, getAudioSrc } from "@/lib/audio-cache";

interface Props {
  src: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Drop-in replacement for <audio controls src={url} />.
 *
 * Flow:
 * - If already in Cache API → serve as blob URL (zero Cloudinary bandwidth)
 * - If not cached → use original URL (normal load), then cache AFTER audio loads
 *   so the cache fetch hits browser HTTP cache, not Cloudinary
 */
export function CachedAudio({ src, className, style }: Props) {
  const [audioSrc, setAudioSrc] = useState(src);
  const blobUrlRef = useRef<string | null>(null);
  const cachedRef = useRef(false);

  useEffect(() => {
    if (!src) return;
    let cancelled = false;

    getAudioSrc(src).then((blobUrl) => {
      if (cancelled) {
        if (blobUrl) URL.revokeObjectURL(blobUrl);
        return;
      }
      if (blobUrl) {
        blobUrlRef.current = blobUrl;
        cachedRef.current = true;
        setAudioSrc(blobUrl);
      }
      // else: keep original src, will cache on canplay
    });

    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [src]);

  const handleCanPlay = () => {
    // Audio is now fully in browser HTTP cache.
    // cacheAudioUrl fetches from HTTP cache (free) → stores in Cache API.
    if (!cachedRef.current) {
      cachedRef.current = true;
      cacheAudioUrl(src);
    }
  };

  return <audio controls src={audioSrc} className={className} style={style} onCanPlay={handleCanPlay} />;
}
