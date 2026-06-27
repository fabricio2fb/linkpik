"use client";

import { Landmark, WalletCards } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function HowItWorksSplitMockup() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [freeRate, setFreeRate] = useState(0);
  const [proRate, setProRate] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisible(true);
    }, { threshold: 0.35 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let frame = 0;
    const interval = window.setInterval(() => {
      frame += 1;
      setFreeRate(Math.min(10, frame));
      setProRate(Math.min(5, Math.ceil(frame / 2)));
      if (frame >= 10) window.clearInterval(interval);
    }, 70);
    return () => window.clearInterval(interval);
  }, [visible]);

  return (
    <div ref={ref} className="min-w-0 rounded-[28px] border border-white/[0.08] bg-[#101010] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.38)] transition hover:-translate-y-1 hover:border-[#22C55E]/30">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/34">Venda aprovada</p>
          <h3 className="mt-1 font-heading text-2xl font-black text-white">R$ 100,00</h3>
        </div>
        <span className="rounded-full bg-[#22C55E]/12 px-3 py-1 text-[10px] font-black uppercase text-[#22C55E]">split automático</span>
      </div>

      <div className="mt-7 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="flex h-5 w-full">
          <div className={`bg-[#22C55E] transition-all duration-700 ${visible ? "w-[90%]" : "w-0"}`} />
          <div className={`bg-[#FF4D6D] transition-all delay-150 duration-700 ${visible ? "w-[10%]" : "w-0"}`} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#22C55E]/20 bg-[#22C55E]/10 p-4">
          <WalletCards className="text-[#22C55E]" size={22} />
          <p className="mt-3 text-sm font-black text-white">Seu recebimento</p>
          <p className="mt-1 font-heading text-3xl font-black text-[#22C55E]">90%</p>
          <p className="mt-2 text-xs leading-5 text-white/46">Vai direto para a conta configurada no gateway.</p>
        </div>
        <div className="rounded-2xl border border-[#FF4D6D]/20 bg-[#FF4D6D]/10 p-4">
          <Landmark className="text-[#FF4D6D]" size={22} />
          <p className="mt-3 text-sm font-black text-white">Taxa Pikbio</p>
          <p className="mt-1 font-heading text-3xl font-black text-[#FF4D6D]">{freeRate}%</p>
          <p className="mt-2 text-xs leading-5 text-white/46">No Pro, a taxa cai para {proRate}% por venda.</p>
        </div>
      </div>
    </div>
  );
}
