import { z } from "zod";

export const ShipmentStatusSchema = z.enum([
  "awaiting_payment",
  "paid",
  "awaiting_preparation",
  "awaiting_label",
  "label_generated",
  "awaiting_postage",
  "posted",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "delivery_issue",
  "cancelled",
  "refunded",
]);

export const PublicTokenSchema = z.string().min(32).max(120).regex(/^[A-Za-z0-9_-]+$/);
export const UuidSchema = z.string().uuid();
export const ZipcodeSchema = z.preprocess(
  (value) => typeof value === "string" ? value.replace(/\D/g, "") : value,
  z.string().regex(/^\d{8}$/, "CEP invalido"),
);
export const ShortText = z.string().trim().max(200);
export const SafeText = z.string().trim().max(1000);

export const ShippingAddressSchema = z.object({
  buyer_phone: z.string().trim().max(30).optional().nullable(),
  zipcode: ZipcodeSchema,
  street: z.string().trim().min(1).max(160),
  number: z.string().trim().min(1).max(30),
  complement: z.string().trim().max(80).optional().nullable(),
  neighborhood: z.string().trim().min(1).max(100),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().length(2),
}).strict();

export const ShippingSelectionSchema = z.object({
  id: z.enum(["pac", "sedex", "jadlog"]),
}).strict();

export const ShippingQuoteSchema = z.object({
  product_id: UuidSchema,
  destination_zipcode: ZipcodeSchema,
}).strict();

export const CreatePhysicalProductSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional().default(""),
  price: z.number().positive().max(99999),
  sku: z.string().trim().regex(/^[A-Za-z0-9._-]*$/).max(80).optional().nullable(),
  stock_quantity: z.number().int().min(0).max(100000),
  stock_minimum: z.number().int().min(0).max(100000).default(0),
  track_inventory: z.boolean().default(true),
  allow_backorder: z.boolean().default(false),
  weight_grams: z.number().int().positive().max(30000),
  width_cm: z.number().positive().max(200),
  height_cm: z.number().positive().max(200),
  length_cm: z.number().positive().max(200),
  origin_zipcode: ZipcodeSchema,
  preparation_days: z.number().int().min(0).max(30).default(2),
  shipping_notes: z.string().trim().max(1000).optional().nullable(),
  cover_url: z.string().url().max(500).optional().nullable(),
  status: z.enum(["active", "draft", "hidden"]).default("active"),
}).strict();

export const UpdatePhysicalProductSchema = CreatePhysicalProductSchema.partial();

export const InventoryAdjustmentSchema = z.object({
  product_id: UuidSchema,
  quantity_delta: z.number().int().min(-10000).max(10000).refine((value) => value !== 0),
  reason: z.string().trim().min(1).max(500),
}).strict();

export const PhysicalOrdersQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  status: z.string().trim().max(40).optional(),
  search: z.string().trim().max(120).optional(),
}).strict();

export const UpdateShipmentStatusSchema = z.object({
  status: ShipmentStatusSchema,
  description: z.string().trim().max(500).optional(),
  location: z.string().trim().max(120).optional(),
}).strict();

export const TrackingUpdateSchema = z.object({
  tracking_code: z.string().trim().min(4).max(80).regex(/^[A-Za-z0-9._-]+$/),
  tracking_url: z.string().url().max(500).optional().nullable(),
  carrier: z.string().trim().max(80).optional().nullable(),
}).strict();

export function isAllowedShipmentTransition(current: string, next: string) {
  const transitions: Record<string, string[]> = {
    awaiting_payment: ["paid", "cancelled", "refunded"],
    paid: ["awaiting_preparation", "awaiting_label", "cancelled", "refunded"],
    awaiting_preparation: ["awaiting_label", "label_generated", "cancelled"],
    awaiting_label: ["label_generated", "cancelled"],
    label_generated: ["awaiting_postage", "posted", "cancelled"],
    awaiting_postage: ["posted", "cancelled"],
    posted: ["in_transit", "delivery_issue"],
    in_transit: ["out_for_delivery", "delivered", "delivery_issue"],
    out_for_delivery: ["delivered", "delivery_issue"],
    delivered: [],
    delivery_issue: ["in_transit", "out_for_delivery", "delivered", "cancelled"],
    cancelled: [],
    refunded: [],
  };
  return transitions[current]?.includes(next) ?? false;
}
