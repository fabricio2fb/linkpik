import { getCreatorContext } from "@/lib/api/physical-orders";
import { createSupabaseService } from "@/lib/api/supabase-service";

export async function getShippingSettings() {
  const creator = await getCreatorContext();
  const supabase = createSupabaseService();
  const { data: products, error } = await supabase
    .from("products")
    .select("origin_zipcode, preparation_days")
    .eq("creator_id", creator.creatorId)
    .or("product_kind.eq.physical,type.eq.fisico")
    .not("origin_zipcode", "is", null)
    .limit(10);

  if (error) throw error;
  const first = products?.[0];
  return {
    origin: {
      zipcode: first?.origin_zipcode ?? null,
      preparation_days: first?.preparation_days ?? 2,
      configured: Boolean(first?.origin_zipcode),
    },
    mode: {
      provider: "manual",
      enabled: true,
      connected: true,
    },
    services: [{ name: "Frete manual", active: true, provider: "manual" }],
    future_integrations: ["Melhor Envio em breve", "Calculo real de frete", "Geracao de etiquetas", "Rastreamento automatico"],
  };
}
