import React from "react";
import clsx from "clsx";

const PRESET_COLORS = [
  "#3C50E0", // Blue
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

interface ColorPickerProps {
  selectedColor?: string;
  onChange: (color: string) => void;
  label?: string;
}

const ColorPicker = ({ selectedColor, onChange, label = "Entity Color" }: ColorPickerProps) => {
  return (
    <div className="mb-6">
      <label className="mb-3 block text-sm font-semibold text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <div className="flex flex-wrap gap-3">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={clsx(
              "h-9 w-9 rounded-full border-2 transition-all duration-200 hover:scale-110",
              selectedColor === color
                ? "border-primary scale-110 ring-2 ring-primary/20 shadow-md"
                : "border-transparent"
            )}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
        {/* User can also pick a custom color */}
        <div className="relative group">
            <input
            type="color"
            value={selectedColor || "#3C50E0"}
            onChange={(e) => onChange(e.target.value)}
            className="h-9 w-9 cursor-pointer overflow-hidden rounded-full border-2 border-slate-200 bg-transparent transition-all hover:scale-110 dark:border-slate-700"
            title="Custom color"
            />
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        This color will be used for profile placeholders and company branding within the app.
      </p>
    </div>
  );
};

export default ColorPicker;
