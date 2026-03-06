// Fixed utility for NSE/Angel Broking instrument format
// Handles descriptions like "AXISBANK25NOV25DECFUT" properly

const MONTH_MAP: Map<string, number> = new Map([
  ["jan", 0], ["january", 0],
  ["feb", 1], ["february", 1],
  ["mar", 2], ["march", 2],
  ["apr", 3], ["april", 3],
  ["may", 4],
  ["jun", 5], ["june", 5],
  ["jul", 6], ["july", 6],
  ["aug", 7], ["august", 7],
  ["sep", 8], ["sept", 8], ["september", 8],
  ["oct", 9], ["october", 9],
  ["nov", 10], ["november", 10],
  ["dec", 11], ["december", 11],
]);

/**
 * Parse ALL expiry dates from text
 * Handles formats like:
 * - "AXISBANK25NOV25DECFUT" → ["25NOV25", "25DEC"]
 * - "19nov2025" → ["19nov2025"]
 * - "NOV25" → ["NOV25"]
 */
function extractAllExpiries(text: string): Array<{ raw: string; month: string; year: string; day?: string }> {
  if (!text) return [];

  const lower = text.toLowerCase();
  const expiries: Array<{ raw: string; month: string; year: string; day?: string }> = [];

  // Pattern 1: Day-Month-Year like "25NOV25", "19nov2025"
  // This catches: 25nov25, 19nov2025, 31dec25, etc.
  const dayMonthPattern = /(\d{1,2})(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)(\d{2,4})/gi;
  let match;
  
  while ((match = dayMonthPattern.exec(lower)) !== null) {
    expiries.push({
      raw: match[0],
      day: match[1],
      month: match[2],
      year: match[3].length === 2 ? match[3] : match[3].slice(-2),
    });
  }

  // Pattern 2: Month-Year only like "NOV25", "nov2025" (if not already matched)
  const monthYearPattern = /(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)(\d{2,4})(?!\d)/gi;
  while ((match = monthYearPattern.exec(lower)) !== null) {
    const raw = match[0];
    // Skip if already found in Pattern 1
    if (!expiries.some(e => e.raw === raw)) {
      expiries.push({
        raw: raw,
        month: match[1],
        year: match[2].length === 2 ? match[2] : match[2].slice(-2),
      });
    }
  }

  return expiries;
}

/**
 * Extract unique months from text
 */
function extractMonthsFromText(text: string): string[] {
  const expiries = extractAllExpiries(text);
  return [...new Set(expiries.map(e => e.month.toLowerCase()))];
}

/**
 * Levenshtein distance for fuzzy matching
 */
function levenshteinDistance(str1: string, str2: string): number {
  const track = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }

  return track[str2.length][str1.length];
}

/**
 * Fuzzy match score (0-1)
 */
function fuzzyMatchScore(haystack: string, needle: string): number {
  if (!needle || !haystack) return 0;
  if (haystack === needle) return 1;
  if (haystack.includes(needle)) return 0.95;

  const distance = levenshteinDistance(haystack, needle);
  const maxLen = Math.max(haystack.length, needle.length);
  return Math.max(0, 1 - distance / maxLen);
}

interface Instrument {
  name?: string;
  description?: string;
  displayName?: string;
  symbol?: string;
  exchangeSegment?: number;
  volume?: number;
  contractExpiration?: string;
  expiry?: string;
  [key: string]: any;
}

interface ScoringFactors {
  exactMatch: number;
  prefixMatch: number;
  substringMatch: number;
  monthBonus: number;
  expiryProximity: number;
  typeBonus: number;
  fuzzyMatch: number;
}

/**
 * Advanced scoring for instruments
 */
function scoreInstrument(
  inst: Instrument,
  tokens: string[],
  query: string
): { score: number; factors: ScoringFactors; matchedMonths: string[] } {
  const name = (inst.name || "").toLowerCase();
  const desc = (inst.description || "").toLowerCase();
  const displayName = (inst.displayName || "").toLowerCase();
  const fullText = `${name} ${desc} ${displayName}`.toLowerCase();

  const factors: ScoringFactors = {
    exactMatch: 0,
    prefixMatch: 0,
    substringMatch: 0,
    monthBonus: 0,
    expiryProximity: 0,
    typeBonus: 0,
    fuzzyMatch: 0,
  };

  const matchedTokens = new Set<string>();

  // 1. TOKEN MATCHING - Name, Description, Display
  for (const token of tokens) {
    // Exact match on name
    if (name === token) {
      factors.exactMatch += 100;
      matchedTokens.add(token);
    }
    // Prefix match
    else if (name.startsWith(token)) {
      factors.prefixMatch += 50;
      matchedTokens.add(token);
    }
    // Substring in name or displayName
    else if (name.includes(token) || displayName.includes(token)) {
      factors.substringMatch += 30;
      matchedTokens.add(token);
    }
    // In description
    else if (desc.includes(token)) {
      factors.substringMatch += 20;
      matchedTokens.add(token);
    }
    // Fuzzy match
    else {
      const fuzzyScore = fuzzyMatchScore(name, token);
      if (fuzzyScore > 0.75) {
        factors.fuzzyMatch += Math.floor(fuzzyScore * 25);
        matchedTokens.add(token);
      }
    }
  }

  // 2. MONTH DETECTION - Most important for derivatives
  const textMonths = extractMonthsFromText(fullText);
  const queryMonths = extractMonthsFromText(query);
  const matchedMonths: string[] = [];

  if (queryMonths.length > 0) {
    for (const qMonth of queryMonths) {
      if (textMonths.includes(qMonth)) {
        factors.monthBonus += 50; // Strong boost for month match
        matchedMonths.push(qMonth);
        matchedTokens.add(qMonth);
      }
    }
  }

  // 3. EXPIRY PROXIMITY
  if (inst.expiry || inst.contractExpiration) {
    const expiryStr = (inst.expiry || inst.contractExpiration || "").toString();
    try {
      const expiryDate = new Date(expiryStr);
      const now = new Date();
      const daysToExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Prefer mid-range expiries (most liquid)
      if (daysToExpiry > 0 && daysToExpiry <= 7) {
        factors.expiryProximity = 60; // Weekly - most traded
      } else if (daysToExpiry > 7 && daysToExpiry <= 30) {
        factors.expiryProximity = 80; // Monthly - good liquidity
      } else if (daysToExpiry > 30 && daysToExpiry <= 90) {
        factors.expiryProximity = 40; // Quarterly
      } else if (daysToExpiry > 0) {
        factors.expiryProximity = 10; // Too far
      }
    } catch {
      /* ignore parsing errors */
    }
  }

  // 4. INSTRUMENT TYPE DETECTION
  const isFutureSearch = /fut|future/.test(query.toLowerCase());
  const isOptionSearch = /opt|option|ce|pe/.test(query.toLowerCase());

  if (isFutureSearch) {
    if (inst.exchangeSegment === 1 || desc.includes("fut")) {
      factors.typeBonus += 40; // Boost futures for futures search
    }
  }

  if (isOptionSearch) {
    if (inst.exchangeSegment === 3 || desc.includes("opt")) {
      factors.typeBonus += 40;
    }
  }

  const totalScore =
    factors.exactMatch +
    factors.prefixMatch +
    factors.substringMatch +
    factors.monthBonus +
    factors.expiryProximity +
    factors.typeBonus +
    factors.fuzzyMatch;

  return {
    score: Math.max(0, totalScore),
    factors,
    matchedMonths,
  };
}

/**
 * Filter instruments - relaxed filtering
 * Returns instruments that match query (at least partially)
 */
export function filterInstruments(list: Instrument[], query: string): Instrument[] {
  if (!query || query.trim() === "") return list;

  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  const queryMonths = extractMonthsFromText(query);

  // First pass: Strict - all tokens must be found somewhere
  let filtered = list.filter(inst => {
    const fullText = `${inst.name || ""} ${inst.description || ""} ${inst.displayName || ""}`.toLowerCase();
    const instMonths = extractMonthsFromText(fullText);

    // Check if all tokens are matched
    return tokens.every(token => {
      if (MONTH_MAP.has(token)) {
        // Month token - check if month exists in instrument
        return instMonths.includes(token);
      }
      // Regular token - check substrings
      return fullText.includes(token) || fuzzyMatchScore(fullText, token) > 0.75;
    });
  });

  // If too strict, relax: at least one non-month token must match
  if (filtered.length === 0 && tokens.length > 0) {
    const nonMonthTokens = tokens.filter(t => !MONTH_MAP.has(t));
    
    if (nonMonthTokens.length > 0) {
      filtered = list.filter(inst => {
        const fullText = `${inst.name || ""} ${inst.description || ""} ${inst.displayName || ""}`.toLowerCase();
        return nonMonthTokens.some(token =>
          fullText.includes(token) || fuzzyMatchScore(fullText, token) > 0.75
        );
      });
    } else {
      // Only month tokens - return instruments matching months
      filtered = list.filter(inst => {
        const fullText = `${inst.name || ""} ${inst.description || ""} ${inst.displayName || ""}`.toLowerCase();
        const instMonths = extractMonthsFromText(fullText);
        return queryMonths.some(m => instMonths.includes(m));
      });
    }
  }

  return filtered;
}

/**
 * Smart sort - combines scoring and ranking
 */
export function sortInstruments(
  list: Instrument[],
  query: string,
  options: { debugScores?: boolean } = {}
): Instrument[] {
  if (!query || query.trim() === "") return list;

  const { debugScores = false } = options;
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);

  const scored = list.map(inst => {
    const { score, factors, matchedMonths } = scoreInstrument(inst, tokens, query);
    return { inst, score, factors, matchedMonths };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  if (debugScores && scored.length > 0) {
    console.log(`\n🔍 Top matches for "${query}":`);
    scored.slice(0, 5).forEach(({ inst, score, factors, matchedMonths }) => {
      console.log(`\n  📊 ${inst.name || inst.displayName} (${inst.description})`);
      console.log(`     Score: ${score.toFixed(0)}`);
      console.log(`     Matched months: ${matchedMonths.join(", ") || "none"}`);
      console.log(`     Factors:`, {
        exact: factors.exactMatch,
        prefix: factors.prefixMatch,
        substring: factors.substringMatch,
        month: factors.monthBonus,
        expiry: factors.expiryProximity,
        type: factors.typeBonus,
        fuzzy: factors.fuzzyMatch,
      });
    });
  }

  return scored.map(s => s.inst);
}

/**
 * Main search function - filter then sort
 */
export function searchInstruments(
  list: Instrument[],
  query: string,
  options: {
    limit?: number;
    debugScores?: boolean;
  } = {}
): Instrument[] {
  const { limit = 50, debugScores = false } = options;

  if (!query || query.trim() === "") return list.slice(0, limit);

  // Step 1: Filter
  const filtered = filterInstruments(list, query);

  // Step 2: Sort
  const sorted = sortInstruments(filtered, query, { debugScores });

  // Step 3: Limit
  return sorted.slice(0, limit);
}

/**
 * Debug helper - show what months are detected in query
 */
export function debugQuery(query: string) {
  const months = extractMonthsFromText(query);
  const expiries = extractAllExpiries(query);
  console.log(`Query: "${query}"`);
  console.log(`  Months detected: ${months.join(", ") || "none"}`);
  console.log(`  Full expiries: ${expiries.map(e => e.raw).join(", ") || "none"}`);
  return { months, expiries };
}

// ============= EXAMPLE USAGE =============
/*
const instruments = [
  {
    name: "AXISBANK",
    description: "AXISBANK25NOV25DECFUT",
    displayName: "AXISBANK 25NOV30DEC SPD",
    exchangeSegment: 1,
    expiry: "2025-11-25T14:30:00",
    volume: 100000,
  },
  {
    name: "NIFTY 50",
    description: "NIFTY 50 Index",
    displayName: "NIFTY",
    exchangeSegment: 0,
    volume: 5000000,
  },
  {
    name: "NIFTY",
    description: "NIFTY25NOV25FUTSTK",
    displayName: "NIFTY NOV 25 FUT",
    exchangeSegment: 1,
    expiry: "2025-11-25T14:30:00",
    volume: 2000000,
  },
];

// Test searches
console.log("=== Search: 'axisbank nov' ===");
const results1 = searchInstruments(instruments, "axisbank nov", { debugScores: true });

console.log("\n=== Search: 'nifty nov' ===");
const results2 = searchInstruments(instruments, "nifty nov", { debugScores: true });

console.log("\n=== Search: 'nov' ===");
const results3 = searchInstruments(instruments, "nov", { debugScores: true });
*/