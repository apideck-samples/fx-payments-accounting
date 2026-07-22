// Currency + rate formatting shared across the walkthrough.

export function money(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Unknown ISO code — fall back to plain number + code.
    return `${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${currency}`;
  }
}

/** Rates can be tiny (JPY→EUR ≈ 0.0062) or large — show enough precision. */
export function rate(r: number): string {
  const digits = r < 0.1 ? 6 : r < 10 ? 4 : 2;
  return r.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function signedMoney(amount: number, currency: string): string {
  const sign = amount > 0 ? "+" : amount < 0 ? "−" : "";
  return `${sign}${money(Math.abs(amount), currency)}`;
}

export const FLAG: Record<string, string> = {
  EUR: "🇪🇺",
  USD: "🇺🇸",
  GBP: "🇬🇧",
  JPY: "🇯🇵",
  SGD: "🇸🇬",
  INR: "🇮🇳",
  AUD: "🇦🇺",
  CAD: "🇨🇦",
};
