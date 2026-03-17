/**
 * Match uploaded image file names to products by:
 * 1. Exact: filename (without ext) equals product code
 * 2. SKU in title: product code appears anywhere in the filename
 * 3. Description: filename (normalized) matches or is contained in product description
 */

export type MatchType = "exact" | "sku_in_title" | "description" | "none";

export type ProductRecord = {
  id: string;
  code: string;
  description: string;
  [key: string]: unknown;
};

export type MatchResult = {
  type: MatchType;
  product: ProductRecord | null;
};

function stem(filename: string): string {
  return filename.replace(/\.[^.]+$/, "").trim();
}

function normalizeForCompare(s: string): string {
  return s
    .toLowerCase()
    .replace(/[-_.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Normalized stem for description matching (e.g. "blue-widget_1" -> "blue widget 1") */
function normalizedStem(filename: string): string {
  return normalizeForCompare(stem(filename));
}

/**
 * Match a single file name to the best product in the list.
 * Priority: exact > sku_in_title > description > none.
 */
export function matchFileToProduct(
  filename: string,
  products: ProductRecord[]
): MatchResult {
  const nameStem = stem(filename);
  const nameNorm = normalizedStem(filename);
  if (!nameStem) return { type: "none", product: null };

  const codeLower = nameStem.toLowerCase();

  // 1. Exact: filename (no ext) equals product code (case-insensitive)
  const exact = products.find((p) => p.code?.toLowerCase() === codeLower);
  if (exact) return { type: "exact", product: exact };

  // 2. SKU in title: product code appears in the filename (with word boundaries so "AB1" doesn't match "AB12")
  for (const p of products) {
    const code = (p.code ?? "").trim();
    if (!code) continue;
    const inFilename = nameStem.toLowerCase().includes(code.toLowerCase());
    if (inFilename) return { type: "sku_in_title", product: p };
  }

  // 3. Description: filename (normalized) is contained in description or vice versa
  for (const p of products) {
    const desc = (p.description ?? "").trim();
    if (!desc) continue;
    const descNorm = normalizeForCompare(desc);
    if (descNorm.length < 3) continue; // avoid tiny matches
    if (nameNorm.length < 3) continue;
    if (descNorm.includes(nameNorm) || nameNorm.includes(descNorm))
      return { type: "description", product: p };
    // Optional: token overlap (e.g. "Blue Widget" vs "widget blue photo")
    const descWords = new Set(descNorm.split(" ").filter(Boolean));
    const nameWords = nameNorm.split(" ").filter(Boolean);
    const overlap = nameWords.filter((w) => descWords.has(w)).length;
    if (overlap >= 2 && overlap >= nameWords.length / 2)
      return { type: "description", product: p };
  }

  return { type: "none", product: null };
}
