"use client";

import Image from "next/image";
import { Play, Video } from "lucide-react";
import { useMemo, useState } from "react";
import type { Creator } from "@/lib/types";

type PresentationVideoProps = {
  video: NonNullable<Creator["presentationVideo"]>;
  accentColor: string;
  previewOnly?: boolean;
};

function canUseOptimizedImage(src: string) {
  return src.startsWith("http://") || src.startsWith("https://");
}

export function getYoutubeId(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) return parsed.pathname.split("/").filter(Boolean)[0];
    if (parsed.pathname.startsWith("/shorts/")) return parsed.pathname.split("/").filter(Boolean)[1];
    if (parsed.hostname.includes("youtube.com")) return parsed.searchParams.get("v");
  } catch {
    return null;
  }
  return null;
}

export function isValidPresentationVideoUrl(url: string) {
  return Boolean(getYoutubeId(url) || url.trim().toLowerCase().endsWith(".mp4"));
}

export default function PresentationVideo({
  video,
  accentColor,
  previewOnly = false,
}: PresentationVideoProps) {
  const [loaded, setLoaded] = useState(!video.showThumbnail);
  const youtubeId = useMemo(() => getYoutubeId(video.url), [video.url]);
  const isMp4 = video.url.trim().toLowerCase().endsWith(".mp4");
  const thumbnail =
    video.thumbnail ?? (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : undefined);

  if (!video.url) return null;

  return (
    <section className="px-1 pb-7">
      <div className="aspect-video w-full overflow-hidden rounded-2xl bg-[var(--bg-elevated)]">
        {previewOnly ? (
          <div className="grid size-full place-items-center text-[var(--text-secondary)]">
            <div className="text-center">
              <Video className="mx-auto" size={34} />
              <p className="mt-2 text-xs font-bold">Vídeo de apresentação</p>
            </div>
          </div>
        ) : !loaded && video.showThumbnail ? (
          <button
            type="button"
            onClick={() => setLoaded(true)}
            className="relative size-full overflow-hidden"
            aria-label="Reproduzir vídeo de apresentação"
          >
            {thumbnail ? (
              <Image src={thumbnail} alt="" fill sizes="(max-width: 768px) 100vw, 440px" className="object-contain" unoptimized={!canUseOptimizedImage(thumbnail)} />
            ) : (
              <div className="size-full bg-[var(--bg-elevated)]" />
            )}
            <span
              className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-white shadow-2xl"
              style={{ backgroundColor: accentColor }}
            >
              <Play size={28} fill="currentColor" />
            </span>
          </button>
        ) : youtubeId ? (
          <iframe
            className="size-full"
            src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&controls=1`}
            allow="autoplay; fullscreen"
            title="Vídeo de apresentação"
          />
        ) : isMp4 ? (
          <video className="size-full object-contain" src={video.url} controls />
        ) : (
          <div className="grid size-full place-items-center text-sm text-[var(--text-secondary)]">
            URL de vídeo inválida
          </div>
        )}
      </div>
      {video.caption && (
        <p className="mt-3 text-center text-sm text-[var(--text-secondary)]">{video.caption}</p>
      )}
    </section>
  );
}

