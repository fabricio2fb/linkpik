import { sendNewSaleEmail, sendNotificationEmail } from "./mailer";
import { createSupabaseService } from "./supabase-service";
import { notifyCreatorPush } from "./web-push";

export type NotificationType = "new_sale" | "new_follower" | "plan_expiring" | "plan_expired" | "system";

export async function createNotification(params: {
  creatorId: string;
  type: NotificationType;
  title: string;
  body: string;
  sendEmail?: boolean;
  email?: string;
  buyerName?: string;
  productTitle?: string;
  productAmount?: number;
  isPhysical?: boolean;
}) {
  const supabase = createSupabaseService();
  const { data: settings } = await supabase
    .from("creator_settings")
    .select("notify_new_sale, notify_push_enabled")
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

  if (params.type === "new_sale" && settings?.notify_new_sale && params.buyerName && params.productTitle) {
    const { data: creator } = await supabase.from("creators").select("name, user_id, username").eq("id", params.creatorId).maybeSingle();
    if (creator?.user_id) {
      const { data: userData } = await supabase.auth.admin.getUserById(creator.user_id);
      const creatorEmail = userData.user?.email;
      if (creatorEmail) {
        await sendNewSaleEmail({
          to: creatorEmail,
          creatorName: creator.name || creator.username || "Criador",
          buyerName: params.buyerName,
          productTitle: params.productTitle,
          amount: params.productAmount ?? 0,
          currency: "BRL",
          storeUsername: creator.username ?? "",
          isPhysical: params.isPhysical ?? false,
        }).catch(() => undefined);
      }
    }
  }

  if (params.sendEmail && params.email) {
    await sendNotificationEmail({
      to: params.email,
      subject: params.title,
      body: params.body,
    }).catch(() => undefined);
  }
}
