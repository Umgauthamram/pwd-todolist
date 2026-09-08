export interface NoteColor {
  id: string;
  name: string;
  bg: string;
  border: string;
}

export const NOTE_COLORS: NoteColor[] = [
  { id: "default", name: "Dark Neutral", bg: "#0e0e10", border: "#27272a" },
  { id: "black", name: "True Black", bg: "#000000", border: "#27272a" },
  { id: "charcoal", name: "Charcoal", bg: "#18181b", border: "#3f3f46" },
  { id: "graphite", name: "Graphite", bg: "#1f1f23", border: "#3f3f46" },
  { id: "deep-ash", name: "Deep Ash", bg: "#141416", border: "#2e2e34" },
  { id: "steel", name: "Dark Steel", bg: "#222226", border: "#44444c" },
  { id: "onyx", name: "Onyx", bg: "#121212", border: "#2a2a2a" },
  { id: "stone", name: "Stone", bg: "#1c1917", border: "#3f3f46" },
  { id: "night", name: "Night", bg: "#111113", border: "#2c2c34" },
];
