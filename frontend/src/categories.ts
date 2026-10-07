// The catalogue has 22 inconsistent garment-type labels ("t-shirt", "short-sleeve T-shirt", ...).
// This groups them into a few clear categories for the product finder.
export function categoryOf(garmentType: string): string {
  const t = garmentType.toLowerCase()
  if (t.includes('hood')) return 'Hoodies'
  if (t.includes('quarter') || t.includes('1/4')) return 'Quarter-Zips'
  if (t.includes('jacket') || t.includes('fleece')) return 'Jackets & Fleece'
  if (t.includes('long-sleeve')) return 'Long-Sleeve Tees'
  // Whole words only: "sweatshirt" must not count as a T-shirt.
  if (/\bt-?shirt\b|\btee\b/.test(t)) return 'T-Shirts'
  if (t.includes('crew') || t.includes('mockneck') || t.includes('sweatshirt')) return 'Crewnecks & Sweatshirts'
  return 'Other'
}
