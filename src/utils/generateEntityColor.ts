const PRESET_COLORS = [
  "#3C50E0", // Blue (Primary)
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#6366F1", // Indigo
  "#14B8A6", // Teal
];

/**
 * Generate a good custom HSL color that avoids existing colors
 * @param excludeColors - Array of hex colors to avoid
 * @returns A hex color string that's aesthetically pleasing and unique
 */
function generateUniqueHSLColor(excludeColors: string[] = []): string {
  // Normalize excluded colors to lowercase for comparison
  const excludedSet = new Set(excludeColors.map((c) => c.toLowerCase()));

  // Target saturation and lightness ranges for good colors
  const saturation = 70; // High saturation for vibrant colors
  const lightness = 50;  // Medium lightness for good contrast

  // Generate hues distributed evenly across the spectrum
  // Aim to create visually distinct colors
  const hueStep = 360 / 24; // 24 possible hues (every 15 degrees)
  let attempts = 0;
  const maxAttempts = 50;

  while (attempts < maxAttempts) {
    // Start with a random hue, then try adjacent hues if needed
    const baseHue = Math.floor(Math.random() * 24);
    const hue = (baseHue * hueStep + Math.random() * hueStep * 0.5) % 360;

    // Convert HSL to hex
    const hex = hslToHex(hue, saturation, lightness);

    // Check if this color isn't in the excluded list
    if (!excludedSet.has(hex.toLowerCase())) {
      return hex;
    }

    attempts++;
  }

  // Fallback: return a random preset color if we can't generate a unique one
  return PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
}

/**
 * Convert HSL to hex color
 */
function hslToHex(h: number, s: number, l: number): string {
  const a = (s * Math.min(l, 100 - l)) / 100;
  
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    const val = Math.round(255 * color / 100);
    return val.toString(16).padStart(2, "0");
  };

  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

/**
 * Generate a random entity color from preset colors (fast path)
 * or generate a unique custom color if excludeColors is provided
 * @param excludeColors - Optional array of colors to avoid
 * @returns A hex color string
 */
export const generateEntityColor = (excludeColors?: string[]): string => {
  // If no exclude list provided, use random preset for backwards compatibility
  if (!excludeColors || excludeColors.length === 0) {
    const randomIndex = Math.floor(Math.random() * PRESET_COLORS.length);
    return PRESET_COLORS[randomIndex];
  }

  // If exclude list provided, generate a unique custom color
  return generateUniqueHSLColor(excludeColors);
};

export { PRESET_COLORS };
export default generateEntityColor;
