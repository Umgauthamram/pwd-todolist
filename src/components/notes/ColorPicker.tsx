"use client";

import React, { useState } from "react";
import Menu from "@mui/material/Menu";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { PaletteOutlined as PaletteOutlinedIcon, Check as CheckIcon } from "@mui/icons-material";
import { NOTE_COLORS, NoteColor } from "@/constants/colors";

interface ColorPickerProps {
  currentColor: string;
  onChangeColor: (color: string) => void;
  size?: "small" | "medium";
}

export default function ColorPicker({ currentColor, onChangeColor, size = "small" }: ColorPickerProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (colorBg: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChangeColor(colorBg);
    setAnchorEl(null);
  };

  return (
    <>
      <Tooltip title="Note color">
        <IconButton
          size={size}
          onClick={handleClick}
          className="text-neutral-400 hover:text-white hover:bg-neutral-800"
        >
          <PaletteOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: {
              backgroundColor: "#0e0e10",
              border: "1px solid #262626",
              borderRadius: "14px",
              padding: "6px",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.8)",
            },
          },
        }}
      >
        <div className="grid grid-cols-5 gap-1.5 p-1" onClick={(e) => e.stopPropagation()}>
          {NOTE_COLORS.map((c: NoteColor) => {
            const isSelected = currentColor.toLowerCase() === c.bg.toLowerCase();
            return (
              <button
                key={c.id}
                type="button"
                onClick={(e) => handleSelect(c.bg, e)}
                title={c.name}
                style={{ backgroundColor: c.bg, borderColor: c.border }}
                className={`w-7 h-7 rounded-full border transition-transform flex items-center justify-center cursor-pointer hover:scale-115 ${
                  isSelected ? "ring-2 ring-white scale-105" : ""
                }`}
              >
                {isSelected && <CheckIcon sx={{ fontSize: 14, color: "#ffffff" }} />}
              </button>
            );
          })}
        </div>
      </Menu>
    </>
  );
}
