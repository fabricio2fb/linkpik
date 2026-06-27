"use client";

import { useState } from "react";
import { ArrowRight, Mail, MessageCircle, MapPin, Send } from "lucide-react";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

const contactMethods = [
  { icon: Mail, label: "E-mail", value: "suporte@pikbio.com.br", href: "mailto:suporte@pikbio.com.br" },
  { icon: MessageCircle, label: "WhatsApp", value: "(11) 99999-8888", href: "https://wa.me/5511999998888" },
  { icon: MapPin, label: "São Paulo, SP", value: "Brasil", href: "#" },
];

export default function ContatoPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <main className="site-light-landing min-h-screen bg-[#070707] text-[#111827]">
      <LandingNav />

      <section className="px-5 pt-40 pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#FF4D6D]">Contato</p>
            <h1 className="mt-4 font-heading text-4xl font-black tracking-[-0.055em] text-white md:text-5xl">
              Fale com a gente
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/52">
              Dúvidas, sugestões ou problemas? Escolha o canal mais fácil para você.
            </p>
          </div>

          <div className="mt-14 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
            <div className="space-y-5">
              {contactMethods.map((method) => (
                <a
                  key={method.label}
                  href={method.href}
                  target={method.href.startsWith("http") ? "_blank" : undefined}
                  rel={method.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="flex items-center gap-4 rounded-[28px] border border-white/[0.08] bg-[#0f0f0f]/90 p-5 transition hover:-translate-y-0.5 hover:border-white/20"
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#FF4D6D]/12 text-[#FF4D6D]">
                    <method.icon size={20} />
                  </span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-white/40">{method.label}</p>
                    <p className="mt-0.5 font-heading text-base font-black text-white">{method.value}</p>
                  </div>
                </a>
              ))}
            </div>

            <div className="rounded-[28px] border border-white/[0.08] bg-[#0f0f0f]/90 p-6 md:p-8">
              {sent ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="grid size-16 place-items-center rounded-full bg-[#22C55E]/15 text-[#22C55E]">
                    <Send size={28} />
                  </div>
                  <h3 className="mt-5 font-heading text-xl font-black text-white">Mensagem enviada!</h3>
                  <p className="mt-2 text-sm leading-6 text-white/52">Responderemos em até 2 dias úteis.</p>
                  <button
                    type="button"
                    onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                    className="mt-6 text-sm font-bold text-[#FF4D6D] transition hover:text-[#FF2D55]"
                  >
                    Enviar outra mensagem
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="text-[11px] font-black uppercase tracking-[0.14em] text-white/50">Nome</label>
                      <input
                        required
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Seu nome"
                        className="input-base mt-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 py-3 text-sm text-white placeholder-white/24 outline-none transition focus:border-[#FF4D6D]/50 focus:bg-white/[0.06]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-black uppercase tracking-[0.14em] text-white/50">E-mail</label>
                      <input
                        required
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="seu@email.com"
                        className="input-base mt-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 py-3 text-sm text-white placeholder-white/24 outline-none transition focus:border-[#FF4D6D]/50 focus:bg-white/[0.06]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-[0.14em] text-white/50">Assunto</label>
                    <select
                      required
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      className="input-base mt-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 py-3 text-sm text-white outline-none transition focus:border-[#FF4D6D]/50 focus:bg-white/[0.06]"
                    >
                      <option value="" disabled>Selecione um assunto</option>
                      <option value="suporte">Suporte técnico</option>
                      <option value="vendas">Dúvida sobre vendas</option>
                      <option value="financeiro">Financeiro</option>
                      <option value="sugestao">Sugestão</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-[0.14em] text-white/50">Mensagem</label>
                    <textarea
                      required
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Escreva sua mensagem..."
                      rows={5}
                      className="input-base mt-2 w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 py-3 text-sm text-white placeholder-white/24 outline-none transition focus:border-[#FF4D6D]/50 focus:bg-white/[0.06]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="group inline-flex h-12 w-full items-center justify-center rounded-full bg-[#FF4D6D] px-6 text-sm font-black text-white shadow-[0_20px_60px_rgba(255,77,109,0.25)] transition hover:-translate-y-0.5 hover:bg-[#FF2D55]"
                  >
                    Enviar mensagem
                    <ArrowRight className="ml-2 transition group-hover:translate-x-0.5" size={16} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
