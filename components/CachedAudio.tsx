"use client";

import { useEffect, useRef, useState } from "react";
import { cacheAudioUrl, getAudioSrc, recacheAudioUrl } from "@/lib/audio-cache";

interface Props extends React.AudioHTMLAttributes<HTMLAudioElement> {
  src: string;
  initialTime?: number;
}

export function CachedAudio({ src, initialTime, className, style, onCanPlay, onError, onLoadedMetadata, ...rest }: Props) {
  const [audioSrc, setAudioSrc] = useState(src);
  const blobUrlRef = useRef<string | null>(null);
  const cachedRef = useRef(false);
  const errorCountRef = useRef(0);
  const isRecachingRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const initialTimeSetRef = useRef(false);

  // Resolve blob URL from cache on mount / src change
  useEffect(() => {
    if (!src) return;
    let cancelled = false;

    // Reset error tracking on new src
    errorCountRef.current = 0;
    isRecachingRef.current = false;
    initialTimeSetRef.current = false;

    getAudioSrc(src).then((blobUrl) => {
      if (cancelled) {
        if (blobUrl) URL.revokeObjectURL(blobUrl);
        return;
      }
      if (blobUrl) {
        // Revoke old blob only when replacement is ready (avoids gap)
        if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = blobUrl;
        cachedRef.current = true;
        initialTimeSetRef.current = false;
        setAudioSrc(blobUrl);
      } else {
        initialTimeSetRef.current = false;
        setAudioSrc(src);
      }
    });

    return () => {
      cancelled = true;
      // Do NOT revoke here — audio element may still be loading this URL.
      // Revocation happens when a replacement is ready or on unmount.
    };
  }, [src]);

  // Revoke blob URL only on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  const handleCanPlay = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    if (!cachedRef.current) {
      cachedRef.current = true;
      cacheAudioUrl(src);
    }
    if (onCanPlay) onCanPlay(e);
  };

  const handleError = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    if (onError) onError(e);

    // Use e.currentTarget.src (actual URL the element tried) — not blobUrlRef
    const failedSrc = (e.currentTarget as HTMLAudioElement).src;
    if (!failedSrc.startsWith("blob:") || isRecachingRef.current) return;

    errorCountRef.current += 1;

    if (errorCountRef.current < 3) {
      // Blob URL was likely revoked — try creating a fresh one from cache
      getAudioSrc(src).then((freshBlob) => {
        if (freshBlob) {
          if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
          blobUrlRef.current = freshBlob;
          setAudioSrc(freshBlob);
        } else {
          // Cache miss — fall back to original URL
          blobUrlRef.current = null;
          cachedRef.current = false;
          setAudioSrc(src);
        }
      });
      return;
    }

    // 3+ failures — cache is stale/corrupt: delete and re-fetch from network
    isRecachingRef.current = true;
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setAudioSrc(src); // fall back to original while recaching

    recacheAudioUrl(src).then((newBlobUrl) => {
      isRecachingRef.current = false;
      errorCountRef.current = 0;
      if (newBlobUrl) {
        blobUrlRef.current = newBlobUrl;
        initialTimeSetRef.current = false;
        setAudioSrc(newBlobUrl);
      }
    });
  };

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    if (initialTime !== undefined && initialTime > 0 && audioRef.current && !initialTimeSetRef.current) {
      audioRef.current.currentTime = initialTime;
      initialTimeSetRef.current = true;
    }
    if (onLoadedMetadata) onLoadedMetadata(e);
  };

  return (
    <audio
      ref={audioRef}
      controls
      src={audioSrc}
      className={className}
      style={style}
      onCanPlay={handleCanPlay}
      onError={handleError}
      onLoadedMetadata={handleLoadedMetadata}
      {...rest}
    />
  );
}
