import { z } from "zod";

export const UpdateCreatorSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  avatar_url: z.string().url().optional().nullable(),
  cover_url: z.string().url().optional().nullable(),
  username: z.string().regex(/^[a-z0-9._-]{3,30}$/).optional(),
}).strict();

export const UpdateThemeSchema = z.object({
  theme: z.record(z.string(), z.unknown()).optional(),
}).strict();

export const UpdateSettingsSchema = z.object({
  notify_new_sale: z.boolean().optional(),
  notify_new_follower: z.boolean().optional(),
  notify_marketing: z.boolean().optional(),
  notify_pix_expired: z.boolean().optional(),
  notify_daily_summary: z.boolean().optional(),
  notify_weekly_summary: z.boolean().optional(),
  notify_product_news: z.boolean().optional(),
  notify_whatsapp_enabled: z.boolean().optional(),
  notify_whatsapp_number: z.string().max(30).optional().nullable(),
  notify_push_enabled: z.boolean().optional(),
  custom_domain: z.string().max(100).regex(/^[a-z0-9.-]+\.[a-z]{2,}$/).optional().nullable(),
  bank_name: z.string().max(80).optional().nullable(),
  bank_account_type: z.enum(["Corrente", "Poupanca"]).optional().nullable(),
  bank_agency: z.string().max(30).optional().nullable(),
  bank_account: z.string().max(40).optional().nullable(),
  bank_document: z.string().max(30).optional().nullable(),
  bank_holder: z.string().max(120).optional().nullable(),
  meta_pixel_id: z.string().max(80).optional().nullable(),
  meta_pixel_token: z.string().max(300).optional().nullable(),
  google_analytics_measurement_id: z.string().max(80).optional().nullable(),
  tiktok_pixel_id: z.string().max(80).optional().nullable(),
  tiktok_pixel_token: z.string().max(300).optional().nullable(),
  webhook_url: z.string().url().max(300).optional().nullable(),
  webhook_events: z.array(z.string().max(50)).max(20).optional(),
  webhook_secret: z.string().max(120).optional().nullable(),
  default_gateway: z.enum(["mercadopago", "efipay"]).optional(),
  default_payment_gateway: z.enum(["mercadopago", "efipay"]).optional().nullable(),
}).strict();
