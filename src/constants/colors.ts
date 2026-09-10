export interface NoteColor {
  id: string;
  name: string;
  bg: string;
  border: string;
}

export const NOTE_COLORS: NoteColor[] = [
  { id: "default", name: "Secondary Gray", bg: "#212121", border: "transparent" },
  { id: "black", name: "Primary Black", bg: "#000000", border: "transparent" },
  { id: "charcoal", name: "Charcoal", bg: "#1a1a1a", border: "transparent" },
  { id: "graphite", name: "Graphite", bg: "#2a2a2a", border: "transparent" },
  { id: "slate", name: "Slate Gray", bg: "#303030", border: "transparent" },
  { id: "dark-zinc", name: "Dark Zinc", bg: "#171717", border: "transparent" },
  { id: "ash", name: "Deep Ash", bg: "#141414", border: "transparent" },
  { id: "stone", name: "Stone", bg: "#1f1f1f", border: "transparent" },
];
