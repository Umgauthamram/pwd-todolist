"use client";

import React, { useState, useRef, useEffect } from "react";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { PaletteOutlined as PaletteOutlinedIcon, Check as CheckIcon } from "@mui/icons-material";
import { NOTE_COLORS, NoteColor, getNoteColor } from "@/constants/colors";

interface ColorPickerProps {
  currentColor: string;
  onChangeColor: (color: string) => void;
  size?: "small" | "medium";
  onOpenChange?: (isOpen: boolean) => void;
  iconColor?: string;
}

export default function ColorPicker({
  currentColor,
  onChangeColor,
  size = "small",
  onOpenChange,
  iconColor,
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeColor = getNoteColor(currentColor);

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (onOpenChange) {
      onOpenChange(nextState);
    }
  };

  const handleSelect = (colorBg: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChangeColor(colorBg);
    setIsOpen(false);
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        if (onOpenChange) {
          onOpenChange(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onOpenChange]);

  return (
    <div ref={containerRef} className="relative inline-flex items-center">
      <Tooltip title="Note color">
        <IconButton
          size={size}
          onClick={toggleOpen}
          className={
            iconColor
              ? "hover:opacity-80 transition-opacity"
              : "text-neutral-400 hover:text-white hover:bg-neutral-800"
          }
          style={iconColor ? { color: iconColor } : undefined}
          sx={{ padding: "4px" }}
        >
          <PaletteOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {/* Vertical Color Picker inside the respective note */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-full mb-2.5 left-0 z-50 flex flex-col items-center gap-1.5 p-2 bg-[#1c1c1e]/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/10 max-h-72 overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95 duration-150 select-none"
          style={{ width: "38px" }}
        >
          {NOTE_COLORS.map((c: NoteColor) => {
            const isSelected =
              activeColor.id === c.id ||
              currentColor.toLowerCase() === c.bg.toLowerCase();

            return (
              <Tooltip key={c.id} title={c.name} arrow placement="right">
                <button
                  type="button"
                  onClick={(e) => handleSelect(c.bg, e)}
                  aria-label={c.name}
                  style={{
                    backgroundColor: c.accent || c.bg,
                    border: c.border || "none",
                  }}
                  className={`w-6 h-6 shrink-0 rounded-full transition-all flex items-center justify-center cursor-pointer hover:scale-120 active:scale-95 shadow-sm ${
                    isSelected
                      ? "ring-2 ring-white scale-110"
                      : "hover:opacity-90"
                  }`}
                >
                  {isSelected && (
                    <CheckIcon
                      sx={{
                        fontSize: 12,
                        color: c.isLight && c.id === "white" ? "#000000" : "#ffffff",
                      }}
                    />
                  )}
                </button>
              </Tooltip>
            );
          })}
        </div>
      )}
    </div>
  );
}
