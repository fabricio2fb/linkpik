import { z } from "zod";
import { ShippingAddressSchema } from "@/lib/schemas/physical.schema";

export const CreateOrderSchema = z.object({
  product_id: z.string().uuid(),
  upsell_id: z.string().uuid().optional().nullable(),
  buyer_email: z.string().email(),
  buyer_name: z.string().min(1).max(200),
  buyer_cpf: z.string().regex(/^\d{11}$/, "CPF deve ter 11 digitos sem pontuacao"),
  idempotency_key: z.string().uuid(),
  shipping_address: ShippingAddressSchema.optional(),
  shipping_option_id: z.enum(["pac", "sedex", "jadlog"]).optional(),
  payment_method_preference: z.enum(["pix", "boleto", "card"]).optional().default("pix"),
}).strict();
