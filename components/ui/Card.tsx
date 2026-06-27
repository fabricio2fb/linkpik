import { clsx } from "clsx";
import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export default function Card({ children, className, ...props }: CardProps) {
  return (
    <div className={clsx("card-base text-[var(--text-primary)]", className)} {...props}>
      {children}
    </div>
  );
}

