export function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(price);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/** Normalize a string for search: lowercase, remove accents and special chars */
export function normalizeSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

/** Levenshtein distance between two strings */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[m][n];
}

/** Fuzzy match: checks if query approximately matches text (typo tolerant) */
export function fuzzyMatch(query: string, text: string): number {
  const q = normalizeSearch(query);
  const t = normalizeSearch(text);

  // Exact substring match = best score
  if (t.includes(q)) return 1;

  // Check each word in text against query words
  const queryWords = q.split(/\s+/).filter(Boolean);
  const textWords = t.split(/\s+/).filter(Boolean);

  let totalScore = 0;

  for (const qw of queryWords) {
    let bestWordScore = 0;

    for (const tw of textWords) {
      // Exact word match
      if (tw === qw) {
        bestWordScore = 1;
        break;
      }
      // Starts with
      if (tw.startsWith(qw) || qw.startsWith(tw)) {
        bestWordScore = Math.max(bestWordScore, 0.8);
        continue;
      }
      // Levenshtein distance — allow ~30% of word length as tolerance
      const maxDist = Math.max(1, Math.floor(qw.length * 0.35));
      const dist = levenshtein(qw, tw.slice(0, qw.length + 2));
      if (dist <= maxDist) {
        bestWordScore = Math.max(bestWordScore, 0.6 * (1 - dist / (qw.length + 1)));
      }
    }

    totalScore += bestWordScore;
  }

  return queryWords.length > 0 ? totalScore / queryWords.length : 0;
}
