export interface NoteColor {
  id: string;
  name: string;
  bg: string;
  border: string;
}

export const NOTE_COLORS: NoteColor[] = [
  { id: "default", name: "Charcoal Gray", bg: "#202124", border: "transparent" },
  { id: "slate", name: "Slate Gray", bg: "#28292d", border: "transparent" },
  { id: "ash", name: "Deep Ash", bg: "#1a1a1d", border: "transparent" },
  { id: "steel", name: "Steel Gray", bg: "#26282b", border: "transparent" },
  { id: "graphite", name: "Graphite", bg: "#2f3136", border: "transparent" },
  { id: "zinc", name: "Dark Zinc", bg: "#1f1f23", border: "transparent" },
  { id: "onyx", name: "Onyx", bg: "#141416", border: "transparent" },
  { id: "black", name: "True Black", bg: "#000000", border: "transparent" },
  { id: "stone", name: "Stone", bg: "#1c1917", border: "transparent" },
];
