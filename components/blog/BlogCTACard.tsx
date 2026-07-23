import Link from "next/link";
import { Zap } from "lucide-react";

export default function BlogCTACard() {
  return (
    <div className="rounded-[20px] bg-gradient-to-b from-[#FF4D6D] to-[#e6355a] p-6 text-center text-white">
      <div className="mx-auto grid size-12 place-items-center rounded-full bg-white/20">
        <Zap size={22} />
      </div>
      <h3 className="mt-4 font-heading text-lg font-black">Crie sua loja</h3>
      <p className="mt-2 text-sm leading-6 text-white/80">
        Monte sua loja virtual no Pikbio, configure seu checkout e comece a vender produtos digitais em minutos.
      </p>
      <Link
        href="/registro"
        className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-full bg-white px-5 text-sm font-black text-[#e6355a] transition hover:bg-white/90"
      >
        Comecar agora
      </Link>
    </div>
  );
}
