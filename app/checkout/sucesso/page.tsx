import Link from "next/link";
import Card from "@/components/ui/Card";
import StoreTrackingScripts from "@/components/store/StoreTrackingScripts";
import CheckoutSuccessStatus from "@/components/tracking/CheckoutSuccessStatus";
import { createSupabaseService } from "@/lib/api/supabase-service";
import { formatPrice } from "@/lib/utils";

type CheckoutSuccessPageProps = {
  searchParams: Promise<{ order?: string }>;
};

export default async function CheckoutSuccessPage({ searchParams }: CheckoutSuccessPageProps) {
  const params = await searchParams;
  const orderId = params.order;
  const supabase = createSupabaseService();

  const { data: order } = orderId
    ? await supabase
        .from("orders")
        .select("id, creator_id, status, amount, currency, products(title), creators(username)")
        .eq("id", orderId)
        .maybeSingle()
    : { data: null };

  const creatorId = order?.creator_id ? String(order.creator_id) : "";
  const { data: settings } = creatorId
    ? await supabase
        .from("creator_settings")
        .select("meta_pixel_id, google_analytics_measurement_id, tiktok_pixel_id")
        .eq("creator_id", creatorId)
        .maybeSingle()
    : { data: null };

  const product = Array.isArray(order?.products) ? order?.products[0] : order?.products;
  const creator = Array.isArray(order?.creators) ? order?.creators[0] : order?.creators;
  const productTitle = product?.title ?? "Produto Pikbio";
  const amount = Number(order?.amount ?? 0);
  const currency = String(order?.currency ?? "BRL");

  return (
    <main className="min-h-screen bg-[var(--bg-page)] px-4 py-10 text-[var(--text-primary)]">
      <div className="mx-auto max-w-xl">
        {settings && <StoreTrackingScripts settings={settings} />}
        <Card className="p-6 text-center">
          <CheckoutSuccessStatus
            orderId={order?.id ?? null}
            initialStatus={order?.status ?? null}
            value={amount}
            currency={currency}
            productTitle={productTitle}
          />
          {order && (
            <div className="mt-5 rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 text-left text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-[var(--text-secondary)]">Produto</span>
                <strong>{productTitle}</strong>
              </div>
              <div className="mt-2 flex justify-between gap-4">
                <span className="text-[var(--text-secondary)]">Valor</span>
                <strong>{formatPrice(amount)}</strong>
              </div>
            </div>
          )}
          <Link
            href={creator?.username ? `/${creator.username}` : "/"}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-[10px] bg-[#FF4D6D] px-5 text-sm font-bold text-white"
          >
            Voltar para a loja
          </Link>
        </Card>
      </div>
    </main>
  );
}
