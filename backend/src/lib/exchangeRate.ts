interface CachedRate {
  rate: number;
  timestamp: number;
}

const rateCache = new Map<string, CachedRate>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Fallback rates if external APIs fail
const FALLBACK_RATES: Record<string, number> = {
  "USD_KES": 129.50,
  "KES_USD": 0.00772,
  "EUR_KES": 140.20,
  "GBP_KES": 165.00,
};

export async function fetchExchangeRate(
  from: string,
  to: string,
  wiseToken?: string
): Promise<{ rate: number; provider: string }> {
  const fromUpper = from.toUpperCase();
  const toUpper = to.toUpperCase();

  if (fromUpper === toUpper) {
    return { rate: 1.0, provider: "identity" };
  }

  const cacheKey = `${fromUpper}_${toUpper}`;
  const now = Date.now();
  const cached = rateCache.get(cacheKey);

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return { rate: cached.rate, provider: "cache" };
  }

  // Try Wise if configured
  if (wiseToken) {
    try {
      const res = await fetch(`https://api.wise.com/v1/rates?source=${fromUpper}&target=${toUpper}`, {
        headers: { Authorization: `Bearer ${wiseToken}` },
      });
      if (res.ok) {
        const rates = await res.json() as Array<{ rate: number }>;
        if (rates?.length && rates[0].rate > 0) {
          rateCache.set(cacheKey, { rate: rates[0].rate, timestamp: now });
          return { rate: rates[0].rate, provider: "wise" };
        }
      }
    } catch {
      // Fall through to public exchange rate API
    }
  }

  // Try exchangerate-api
  try {
    const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromUpper}`);
    if (res.ok) {
      const data = await res.json() as { rates?: Record<string, number> };
      if (data.rates && typeof data.rates[toUpper] === "number" && data.rates[toUpper] > 0) {
        const rate = data.rates[toUpper];
        rateCache.set(cacheKey, { rate, timestamp: now });
        // Also populate reverse cache
        rateCache.set(`${toUpper}_${fromUpper}`, { rate: 1 / rate, timestamp: now });
        return { rate, provider: "exchangerate-api" };
      }
    }
  } catch {
    // Fallback if network fails
  }

  // If base was KES and target USD, or USD to KES, check fallback
  const fallback = FALLBACK_RATES[cacheKey] || (FALLBACK_RATES[`${toUpper}_${fromUpper}`] ? 1 / FALLBACK_RATES[`${toUpper}_${fromUpper}`] : 1);
  return { rate: fallback, provider: "fallback" };
}

export async function computeKesToUsd(
  kesAmount: number = 1000,
  wiseToken?: string
): Promise<{ kesAmount: number; usdAmount: number; rate: number; provider: string }> {
  const { rate, provider } = await fetchExchangeRate("KES", "USD", wiseToken);
  const usdAmount = Math.round(kesAmount * rate * 100) / 100;
  return {
    kesAmount,
    usdAmount,
    rate,
    provider,
  };
}
