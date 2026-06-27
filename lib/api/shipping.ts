import { ApiError } from "./errors";

export type ShippingAddress = {
  zipcode: string;
  city?: string;
  state?: string;
};

export type ShippingQuoteInput = {
  originZipcode: string;
  destinationZipcode: string;
  weightGrams: number;
  widthCm: number;
  heightCm: number;
  lengthCm: number;
};

export type ShippingQuote = {
  id: string;
  method: string;
  carrier: string;
  priceCents: number;
  deadlineDays: number;
};

export type ShippingProvider = {
  calculate(input: ShippingQuoteInput): Promise<ShippingQuote[]>;
};

export type ShippingIntegrationProvider = "manual" | "melhor_envio";

export type ShippingIntegrationStatus = {
  provider: ShippingIntegrationProvider;
  enabled: boolean;
  connected: boolean;
};

export function normalizeZipcode(value: string) {
  return value.replace(/\D/g, "");
}

export function assertValidZipcode(value: string) {
  const normalized = normalizeZipcode(value);
  if (!/^\d{8}$/.test(normalized)) throw new ApiError(400, "CEP invalido");
  return normalized;
}

export async function calculateManualShipping(input: ShippingQuoteInput): Promise<ShippingQuote[]> {
  const origin = assertValidZipcode(input.originZipcode);
  const destination = assertValidZipcode(input.destinationZipcode);
  if (!origin || !destination) throw new ApiError(400, "CEP invalido");
  if (input.weightGrams <= 0 || input.widthCm <= 0 || input.heightCm <= 0 || input.lengthCm <= 0) {
    throw new ApiError(400, "Peso e dimensoes invalidos");
  }

  return [
    { id: "pac", method: "PAC", carrier: "Correios", priceCents: 2290, deadlineDays: 7 },
    { id: "sedex", method: "SEDEX", carrier: "Correios", priceCents: 3850, deadlineDays: 3 },
    { id: "jadlog", method: "Jadlog", carrier: "Jadlog", priceCents: 2640, deadlineDays: 5 },
  ];
}
