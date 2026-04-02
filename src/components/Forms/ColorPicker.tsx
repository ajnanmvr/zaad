import React, { useState } from "react";
import clsx from "clsx";
import { FiRefreshCcw } from "react-icons/fi";

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
  allowAutoAssign?: boolean;
}

const ColorPicker = ({ 
  selectedColor, 
  onChange, 
  label = "Entity Color",
  allowAutoAssign = true 
}: ColorPickerProps) => {
  const [isAutoAssign, setIsAutoAssign] = useState(!selectedColor && allowAutoAssign);

  const handleAutoAssign = () => {
    setIsAutoAssign(true);
    onChange(""); // Empty string signals backend to auto-assign
  };

  const handleColorSelect = (color: string) => {
    setIsAutoAssign(false);
    onChange(color);
  };

  const handleCustomColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsAutoAssign(false);
    onChange(e.target.value);
  };

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>
        {allowAutoAssign && (
          <button
            type="button"
            onClick={handleAutoAssign}
            className={clsx(
              "inline-flex items-center gap-2 px-3 py-1 rounded-md border transition-all duration-200",
              "text-xs font-medium",
              isAutoAssign
                ? "border-primary bg-primary/10 text-primary"
                : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-500"
            )}
          >
            <FiRefreshCcw className="text-sm" />
            Auto-Pick
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => handleColorSelect(color)}
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
            onChange={handleCustomColor}
            className="h-9 w-9 cursor-pointer overflow-hidden rounded-full border-2 border-slate-200 bg-transparent transition-all hover:scale-110 dark:border-slate-700"
            title="Custom color"
          />
        </div>
      </div>

      <div className="mt-2">
        {isAutoAssign && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            System will choose a unique color at the time of creation
          </p>
        )}
        {selectedColor && !isAutoAssign && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Selected color will be used for profile avatars and branding
          </p>
        )}
        {!selectedColor && !isAutoAssign && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            This color will be used for profile avatars and branding within the app
          </p>
        )}
      </div>
    </div>
  );
};

export default ColorPicker;
