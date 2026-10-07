// Turns catalogue color names ("heather gray", "navy blue") into swatch colors. Unknown names return null.
const COLOR_WORDS: [string, string][] = [
  ['heather gray', '#b4b7bd'],
  ['heather grey', '#b4b7bd'],
  ['charcoal', '#3c4048'],
  ['navy', '#1b2a52'],
  ['light blue', '#8fb8e8'],
  ['royal', '#2a5db0'],
  ['blue', '#2a5db0'],
  ['red', '#c0242e'],
  ['maroon', '#6d1f2f'],
  ['burgundy', '#6d1f2f'],
  ['white', '#ffffff'],
  ['black', '#111111'],
  ['gray', '#8a8f98'],
  ['grey', '#8a8f98'],
  ['silver', '#c3c7cc'],
  ['gold', '#d8b43a'],
  ['yellow', '#e6c42f'],
  ['orange', '#e07b2a'],
  ['green', '#2f7d4f'],
  ['purple', '#6a3f8f'],
  ['pink', '#e48ab0'],
  ['tan', '#c8b08a'],
  ['brown', '#7a5230'],
  ['cream', '#f3eee3'],
]

export function colorToCss(name: string): string | null {
  const n = name.toLowerCase()
  for (const [word, css] of COLOR_WORDS) if (n.includes(word)) return css
  return null
}
