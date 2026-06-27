"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

const faq = [
  { q: "Preciso ter CNPJ pra vender no Pikbio?", a: "Não. Você pode começar como pessoa física. Para operação recorrente e emissão fiscal, vale consultar um contador." },
  { q: "Tem taxa cobrada além da comissão por venda?", a: "No plano Free não há mensalidade. A Pikbio cobra comissão por venda: 10% no Free e 5% no Pro." },
  { q: "Como funciona o recebimento via PIX/Mercado Pago/Efí?", a: "O pagamento é processado pelo gateway conectado pelo criador. O split separa automaticamente a taxa da Pikbio e o valor do criador." },
  { q: "O comprador recebe confirmação automática da compra?", a: "Sim. Assim que o gateway confirma o pagamento por webhook, o pedido é atualizado e o acesso é liberado automaticamente." },
  { q: "Posso personalizar a pagina de cada produto?", a: "Sim. Cada produto pode ter uma pagina propria pelo construtor de secoes, sem precisar saber programacao." },
  { q: "Posso vender produto físico e digital na mesma loja?", a: "Sim. A loja aceita infoprodutos e produtos físicos, incluindo cálculo de frete e acompanhamento de pedido." },
  { q: "Os dados do comprador ficam visíveis para mim como criador?", a: "Sim. O painel mostra os dados necessários para gestão da venda, suporte e entrega do produto." },
];

export default function HowItWorksFAQ() {
  const [open, setOpen] = useState(0);

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/[0.07] bg-[#111]">
      {faq.map((item, index) => (
        <button key={item.q} type="button" onClick={() => setOpen(open === index ? -1 : index)} className="block w-full border-b border-white/[0.06] p-5 text-left last:border-b-0">
          <span className="flex items-center justify-between gap-4 font-heading text-base font-black text-white">
            {item.q}
            <ChevronDown className={`shrink-0 transition ${open === index ? "rotate-180 text-[#FF4D6D]" : "text-white/36"}`} size={18} />
          </span>
          <span className={`block overflow-hidden text-sm leading-7 text-white/50 transition-all duration-300 ${open === index ? "mt-3 max-h-48" : "max-h-0"}`}>
            {item.a}
          </span>
        </button>
      ))}
    </div>
  );
}
