import { sendNotificationEmail } from "./mailer";
import { createSupabaseService } from "./supabase-service";
import { notifyCreatorPush } from "./web-push";

export type NotificationType = "new_sale" | "new_follower" | "plan_expiring" | "plan_expired" | "system";

async function buildSalesSummaryBody(creatorId: string, days: number) {
  const supabase = createSupabaseService();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("orders")
    .select("amount, platform_fee, creator_amount, status")
    .eq("creator_id", creatorId)
    .eq("status", "paid")
    .gte("paid_at", since);

  const orders = data ?? [];
  const gross = orders.reduce((sum, order) => sum + Number(order.amount ?? 0), 0);
  const fees = orders.reduce((sum, order) => sum + Number(order.platform_fee ?? 0), 0);
  const net = orders.reduce((sum, order) => sum + Number(order.creator_amount ?? 0), 0);
  const period = days === 1 ? "ultimas 24 horas" : "ultimos 7 dias";

  return [
    `Resumo das ${period}:`,
    `Vendas pagas: ${orders.length}`,
    `Receita bruta: R$ ${gross.toFixed(2)}`,
    `Taxa da plataforma: R$ ${fees.toFixed(2)}`,
    `Liquido estimado: R$ ${net.toFixed(2)}`,
  ].join("\n");
}

export async function createNotification(params: {
  creatorId: string;
  type: NotificationType;
  title: string;
  body: string;
  sendEmail?: boolean;
  email?: string;
}) {
  const supabase = createSupabaseService();
  const { data: settings } = await supabase
    .from("creator_settings")
    .select("notify_new_sale, notify_daily_summary, notify_weekly_summary, notify_push_enabled")
    .eq("creator_id", params.creatorId)
    .maybeSingle();

  if (params.type === "new_sale" && settings?.notify_new_sale === false) return;

  await supabase.from("notifications").insert({
    creator_id: params.creatorId,
    type: params.type,
    title: params.title,
    body: params.body,
  });

  if (settings?.notify_push_enabled) {
    await notifyCreatorPush(params.creatorId);
  }

  const shouldEmail = params.sendEmail || (params.type === "new_sale" && (settings?.notify_daily_summary || settings?.notify_weekly_summary));
  let email = params.email;
  if (shouldEmail && !email) {
    const { data: creator } = await supabase.from("creators").select("user_id").eq("id", params.creatorId).maybeSingle();
    if (creator?.user_id) {
      const { data: userData } = await supabase.auth.admin.getUserById(creator.user_id);
      email = userData.user?.email ?? undefined;
    }
  }

  if (params.type === "new_sale" && email && settings?.notify_daily_summary) {
    await sendNotificationEmail({
      to: email,
      subject: "Resumo diario Pikbio",
      body: await buildSalesSummaryBody(params.creatorId, 1),
    });
  }

  if (params.type === "new_sale" && email && settings?.notify_weekly_summary) {
    await sendNotificationEmail({
      to: email,
      subject: "Resumo semanal Pikbio",
      body: await buildSalesSummaryBody(params.creatorId, 7),
    });
  }

  if (params.sendEmail && email) {
    await sendNotificationEmail({
      to: email,
      subject: params.title,
      body: params.body,
    });
  }
}
