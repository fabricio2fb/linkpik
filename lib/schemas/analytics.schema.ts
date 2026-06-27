import { z } from "zod";

export const TrackEventSchema = z.object({
  event: z.enum(["store_view", "product_view", "checkout_start", "checkout_complete"]),
  username: z.string().regex(/^[a-z0-9._-]{3,30}$/),
  product_id: z.string().uuid().optional().nullable(),
}).strict();
