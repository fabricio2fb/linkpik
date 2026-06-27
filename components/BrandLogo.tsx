import Image from "next/image";
import Link from "next/link";
import { clsx } from "clsx";

type BrandLogoProps = {
  href?: string;
  compact?: boolean;
  className?: string;
  imageClassName?: string;
  textClassName?: string;
};

export default function BrandLogo({
  href = "/",
  compact = false,
  className,
  imageClassName,
  textClassName,
}: BrandLogoProps) {
  const content = (
    <>
      <Image
        src="/logo-pikbio.png"
        alt=""
        width={40}
        height={40}
        priority
        className={clsx("size-8 shrink-0 object-contain", imageClassName)}
      />
      {!compact && (
        <span className={clsx("font-heading text-xl font-black tracking-[-0.04em]", textClassName)}>
          Pikbio<span className="text-[#FF4D6D]">.</span>
        </span>
      )}
    </>
  );

  return (
    <Link href={href} className={clsx("inline-flex items-center gap-2", className)} aria-label="Pikbio">
      {content}
    </Link>
  );
}
