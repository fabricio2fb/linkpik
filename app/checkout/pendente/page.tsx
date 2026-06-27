import Link from "next/link";
import Card from "@/components/ui/Card";

export default function CheckoutPendingPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-page)] px-4 py-10 text-[var(--text-primary)]">
      <div className="mx-auto max-w-xl">
        <Card className="p-6 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#F59E0B]">Pagamento pendente</p>
          <h1 className="mt-3 font-heading text-3xl font-extrabold">Estamos aguardando a confirmacao</h1>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            Quando o pagamento for aprovado, enviaremos as instrucoes da compra para o email informado.
          </p>
          <Link href="/" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-[10px] bg-[#FF4D6D] px-5 text-sm font-bold text-white">
            Voltar
          </Link>
        </Card>
      </div>
    </main>
  );
}
