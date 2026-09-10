export interface NoteColor {
  id: string;
  name: string;
  bg: string;
  text: string;
  accent: string;
  border?: string;
  isLight?: boolean;
}

export const NOTE_COLORS: NoteColor[] = [
  {
    id: "default",
    name: "Default Dark",
    bg: "#212121",
    text: "#ffffff",
    accent: "#404040",
    border: "transparent",
    isLight: false,
  },
  {
    id: "black",
    name: "Pure Black",
    bg: "#000000",
    text: "#ffffff",
    accent: "#171717",
    border: "1px solid #333333",
    isLight: false,
  },
  {
    id: "white",
    name: "Pure White",
    bg: "#ffffff",
    text: "#171717",
    accent: "#f5f5f5",
    border: "1px solid #e0e0e0",
    isLight: true,
  },
  {
    id: "sonic",
    name: "Sonic Pride",
    bg: "#faf5ff",
    text: "#7c3aed",
    accent: "#9D5CFF", // Exact hex from user reference image
    border: "1px solid #e9d5ff",
    isLight: true,
  },
  {
    id: "red",
    name: "Ruby Red",
    bg: "#fef2f2",
    text: "#dc2626",
    accent: "#ef4444",
    border: "1px solid #fecaca",
    isLight: true,
  },
  {
    id: "orange",
    name: "Sunset Orange",
    bg: "#fff7ed",
    text: "#ea580c",
    accent: "#f97316",
    border: "1px solid #fed7aa",
    isLight: true,
  },
  {
    id: "yellow",
    name: "Amber Gold",
    bg: "#fefce8",
    text: "#b45309",
    accent: "#eab308",
    border: "1px solid #fef08a",
    isLight: true,
  },
  {
    id: "green",
    name: "Emerald Green",
    bg: "#f0fdf4",
    text: "#059669",
    accent: "#10b981",
    border: "1px solid #bbf7d0",
    isLight: true,
  },
  {
    id: "teal",
    name: "Aqua Teal",
    bg: "#ecfeff",
    text: "#0891b2",
    accent: "#06b6d4",
    border: "1px solid #a5f3fc",
    isLight: true,
  },
  {
    id: "blue",
    name: "Sapphire Blue",
    bg: "#eff6ff",
    text: "#2563eb",
    accent: "#3b82f6",
    border: "1px solid #bfdbfe",
    isLight: true,
  },
  {
    id: "violet",
    name: "Royal Violet",
    bg: "#faf5ff",
    text: "#9333ea",
    accent: "#a855f7",
    border: "1px solid #e9d5ff",
    isLight: true,
  },
  {
    id: "pink",
    name: "Rose Pink",
    bg: "#fdf2f8",
    text: "#db2777",
    accent: "#ec4899",
    border: "1px solid #fbcfe8",
    isLight: true,
  },
];

export function getNoteColor(colorValue?: string): NoteColor {
  if (!colorValue) return NOTE_COLORS[0];
  const val = colorValue.toLowerCase().trim();

  // 1. Direct match on bg or id
  const directMatch = NOTE_COLORS.find(
    (c) => c.bg.toLowerCase() === val || c.id.toLowerCase() === val
  );
  if (directMatch) return directMatch;

  // 2. Legacy dark shades mapped to new whitish rainbow colors
  const legacyMap: Record<string, string> = {
    "#451919": "red",
    "#452410": "orange",
    "#3d320d": "yellow",
    "#163820": "green",
    "#113636": "teal",
    "#152a45": "blue",
    "#2b164a": "sonic",
    "#361445": "violet",
    "#3f1429": "pink",
    "#202124": "default",
    "#0e0e10": "default",
  };

  if (legacyMap[val]) {
    const legacyMatch = NOTE_COLORS.find((c) => c.id === legacyMap[val]);
    if (legacyMatch) return legacyMatch;
  }

  // 3. Match on accent color
  const accentMatch = NOTE_COLORS.find((c) => c.accent.toLowerCase() === val);
  if (accentMatch) return accentMatch;

  return NOTE_COLORS[0];
}
