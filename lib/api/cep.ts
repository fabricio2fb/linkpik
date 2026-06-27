import { ApiError } from "@/lib/api/errors";

export type ZipcodeAddress = {
  zipcode: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  country: "BR";
  provider: "viacep" | "brasilapi";
};

export type CepProvider = {
  name: "viacep" | "brasilapi";
  lookup: (cep: string) => Promise<ZipcodeAddress | null>;
};

const cache = new Map<string, { expiresAt: number; address: ZipcodeAddress }>();
const CACHE_TTL_MS = 1000 * 60 * 60;
const FETCH_TIMEOUT_MS = 3500;

export function normalizeCep(value: string) {
  return value.replace(/\D/g, "");
}

export function assertValidCep(value: string) {
  const cep = normalizeCep(value);
  if (!/^\d{8}$/.test(cep)) throw new ApiError(400, "CEP invalido");
  return cep;
}

async function fetchJsonWithTimeout(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export const viaCepProvider: CepProvider = {
  name: "viacep",
  async lookup(cep) {
    const payload = await fetchJsonWithTimeout(`https://viacep.com.br/ws/${cep}/json/`);
    if (!payload || payload.erro) return null;
    if (!payload.localidade || !payload.uf) return null;

    return {
      zipcode: cep,
      street: String(payload.logradouro ?? ""),
      neighborhood: String(payload.bairro ?? ""),
      city: String(payload.localidade),
      state: String(payload.uf),
      country: "BR",
      provider: "viacep",
    };
  },
};

export const brasilApiProvider: CepProvider = {
  name: "brasilapi",
  async lookup(cep) {
    const payload = await fetchJsonWithTimeout(`https://brasilapi.com.br/api/cep/v2/${cep}`);
    if (!payload || !payload.city || !payload.state) return null;

    return {
      zipcode: cep,
      street: String(payload.street ?? ""),
      neighborhood: String(payload.neighborhood ?? ""),
      city: String(payload.city),
      state: String(payload.state),
      country: "BR",
      provider: "brasilapi",
    };
  },
};

const providers: CepProvider[] = [viaCepProvider, brasilApiProvider];

export async function lookupCep(value: string) {
  const cep = assertValidCep(value);
  const cached = cache.get(cep);
  if (cached && cached.expiresAt > Date.now()) return cached.address;

  for (const provider of providers) {
    const address = await provider.lookup(cep);
    if (address) {
      cache.set(cep, { address, expiresAt: Date.now() + CACHE_TTL_MS });
      return address;
    }
  }

  throw new ApiError(404, "Nao conseguimos encontrar esse CEP. Preencha o endereco manualmente.");
}
