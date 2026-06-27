import Link from "next/link";
import Card from "@/components/ui/Card";

export default function CheckoutErrorPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-page)] px-4 py-10 text-[var(--text-primary)]">
      <div className="mx-auto max-w-xl">
        <Card className="p-6 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-red-400">Pagamento nao aprovado</p>
          <h1 className="mt-3 font-heading text-3xl font-extrabold">Nao conseguimos confirmar sua compra</h1>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            Tente novamente pela loja ou escolha outra forma de pagamento no checkout.
          </p>
          <Link href="/" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-[10px] bg-[#FF4D6D] px-5 text-sm font-bold text-white">
            Voltar
          </Link>
        </Card>
      </div>
    </main>
  );
}
