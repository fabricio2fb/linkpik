import { createSupabaseService } from "./supabase-service";
import { sendNotificationEmail } from "./mailer";

export async function sendSummaries(days: number, settingField: "notify_daily_summary" | "notify_weekly_summary") {
  const supabase = createSupabaseService();

  const { data: creators } = await supabase
    .from("creator_settings")
    .select("creator_id")
    .eq(settingField, true);

  if (!creators?.length) return { sent: 0 };

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  let sent = 0;

  for (const row of creators) {
    try {
      const { data: orders } = await supabase
        .from("orders")
        .select("amount, platform_fee, creator_amount, status")
        .eq("creator_id", row.creator_id)
        .eq("status", "paid")
        .gte("paid_at", since);

      const allOrders = orders ?? [];
      const gross = allOrders.reduce((s, o) => s + Number(o.amount ?? 0), 0);
      const fees = allOrders.reduce((s, o) => s + Number(o.platform_fee ?? 0), 0);
      const net = allOrders.reduce((s, o) => s + Number(o.creator_amount ?? 0), 0);

      const periodLabel = days === 1 ? "diario" : "semanal";
      const salesCount = allOrders.length;
      const body = salesCount > 0
        ? [
            `Resumo ${periodLabel} do Pikbio`,
            "",
            `Vendas pagas: ${salesCount}`,
            `Receita bruta: R$ ${gross.toFixed(2)}`,
            `Taxa da plataforma: R$ ${fees.toFixed(2)}`,
            `Liquido estimado: R$ ${net.toFixed(2)}`,
          ].join("\n")
        : [
            `Resumo ${periodLabel} do Pikbio`,
            "",
            "Nenhuma venda no periodo.",
          ].join("\n");

      const { data: creator } = await supabase.from("creators").select("user_id").eq("id", row.creator_id).maybeSingle();
      if (!creator?.user_id) continue;

      const { data: userData } = await supabase.auth.admin.getUserById(creator.user_id);
      const email = userData.user?.email;
      if (!email) continue;

      await sendNotificationEmail({
        to: email,
        subject: `Resumo ${periodLabel} Pikbio`,
        body,
      });
      sent += 1;
    } catch {
      // continua para o proximo creator
    }
  }

  return { sent };
}
