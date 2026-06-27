"use client";

import { Box, FileText, Package, Tag } from "lucide-react";
import { useEffect, useState } from "react";

const steps = [
  { icon: Box, label: "Passo 1 de 4", title: "Tipo", text: "Escolha entre infoproduto ou produto físico." },
  { icon: FileText, label: "Passo 2 de 4", title: "Conteúdo", text: "Preencha nome, descrição, capa e itens incluídos." },
  { icon: Tag, label: "Passo 3 de 4", title: "Precificação", text: "Defina preço, preço original, upsell e oferta." },
  { icon: Package, label: "Passo 4 de 4", title: "Entrega", text: "Configure acesso digital ou dados de envio físico." },
];

export default function HowItWorksProductWizard() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => setActive((current) => (current + 1) % steps.length), 2600);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="min-w-0 rounded-[28px] border border-white/[0.08] bg-[#101010] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.38)] transition hover:-translate-y-1 hover:border-[#FF4D6D]/30">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/34">Novo produto</p>
          <h3 className="mt-1 font-heading text-lg font-black text-white">Wizard Pikbio</h3>
        </div>
        <span className="rounded-full bg-[#FF4D6D]/12 px-3 py-1 text-[10px] font-black uppercase text-[#FF8EA2]">
          {steps[active].label}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-2">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const selected = index === active;
          return (
            <button
              key={step.title}
              type="button"
              onClick={() => setActive(index)}
              className={`grid min-h-[74px] place-items-center rounded-2xl border text-center transition ${
                selected ? "border-[#FF4D6D] bg-[#FF4D6D]/14 text-white" : "border-white/[0.07] bg-white/[0.035] text-white/38 hover:text-white"
              }`}
            >
              <Icon size={18} />
              <span className="mt-2 text-[10px] font-black">{index + 1}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 rounded-2xl border border-white/[0.08] bg-black/30 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#FF4D6D]">{steps[active].label}</p>
        <h4 className="mt-2 break-words font-heading text-2xl font-black tracking-[-0.04em] text-white">{steps[active].title}</h4>
        <p className="mt-2 text-sm leading-6 text-white/52">{steps[active].text}</p>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full bg-[#FF4D6D] transition-all duration-500" style={{ width: `${((active + 1) / steps.length) * 100}%` }} />
      </div>
    </div>
  );
}
