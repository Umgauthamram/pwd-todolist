export interface NoteColor {
  id: string;
  name: string;
  bg: string;
  accent: string;
  border?: string;
}

export const NOTE_COLORS: NoteColor[] = [
  {
    id: "default",
    name: "Default Gray",
    bg: "#212121",
    accent: "#404040",
    border: "transparent",
  },
  {
    id: "black",
    name: "Pure Black",
    bg: "#000000",
    accent: "#171717",
    border: "1px solid #383838",
  },
  {
    id: "red",
    name: "Ruby Red",
    bg: "#451919",
    accent: "#ef4444",
    border: "transparent",
  },
  {
    id: "orange",
    name: "Sunset Orange",
    bg: "#452410",
    accent: "#f97316",
    border: "transparent",
  },
  {
    id: "yellow",
    name: "Amber Gold",
    bg: "#3d320d",
    accent: "#eab308",
    border: "transparent",
  },
  {
    id: "green",
    name: "Emerald Green",
    bg: "#163820",
    accent: "#10b981",
    border: "transparent",
  },
  {
    id: "teal",
    name: "Aqua Teal",
    bg: "#113636",
    accent: "#06b6d4",
    border: "transparent",
  },
  {
    id: "blue",
    name: "Sapphire Blue",
    bg: "#152a45",
    accent: "#3b82f6",
    border: "transparent",
  },
  {
    id: "sonic",
    name: "Sonic Pride",
    bg: "#2b164a",
    accent: "#9D5CFF", // Exact hex from user reference image
    border: "transparent",
  },
  {
    id: "violet",
    name: "Royal Violet",
    bg: "#361445",
    accent: "#a855f7",
    border: "transparent",
  },
  {
    id: "pink",
    name: "Rose Pink",
    bg: "#3f1429",
    accent: "#ec4899",
    border: "transparent",
  },
];
