import Link from "next/link";
import { Facebook, Instagram, Music2 } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <p className="font-heading text-sm font-black uppercase tracking-[0.16em] text-white/70">{title}</p>
      <div className="mt-4 grid gap-3">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="text-sm font-bold text-white/38 transition hover:text-white">
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function LandingFooter() {
  return (
    <footer className="bg-[#070707] px-5 pb-10 pt-4">
      <div className="mx-auto max-w-6xl rounded-[32px] border border-white/[0.08] bg-[#0f0f0f]/90 p-7 shadow-[0_34px_120px_rgba(0,0,0,0.62),0_0_80px_rgba(255,77,109,0.06)] backdrop-blur md:p-9">
        <div className="grid gap-8 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
          <div>
            <BrandLogo imageClassName="size-9" textClassName="text-2xl text-white" />
            <p className="mt-4 max-w-sm text-sm leading-7 text-white/44">Loja na bio para criadores brasileiros venderem produtos digitais com Mercado Pago, upsell e entrega automatica.</p>
            <div className="mt-5 flex gap-3 text-white/40">
              <Instagram size={18} />
              <Music2 size={18} />
              <Facebook size={18} />
            </div>
          </div>
          <div>
            <p className="font-heading text-sm font-black uppercase tracking-[0.16em] text-white/70">Plataforma</p>
            <div className="mt-4 grid gap-3">
              <Link href="/login" className="text-sm font-bold text-white/38 transition hover:text-white">Login</Link>
              <Link href="/blog" className="text-sm font-bold text-white/38 transition hover:text-white">Blog</Link>
              <Link href="/como-funciona" className="text-sm font-bold text-white/38 transition hover:text-white">Como funciona</Link>
              <Link href="/demo" className="text-sm font-bold text-white/38 transition hover:text-white">Loja de exemplo</Link>
            </div>
          </div>
          <FooterColumn title="Legal" links={[
            { label: "Termos", href: "/termos" },
            { label: "Privacidade", href: "/privacidade" },
            { label: "Solicitar dados", href: "/privacidade/solicitar" },
            { label: "Contato", href: "/contato" },
          ]} />
        </div>
      </div>
    </footer>
  );
}
