const ENTITY_COLORS = [
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

export const generateEntityColor = () => {
  const randomIndex = Math.floor(Math.random() * ENTITY_COLORS.length);
  return ENTITY_COLORS[randomIndex];
};

export default generateEntityColor;
