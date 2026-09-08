export interface NoteColor {
  id: string;
  name: string;
  bg: string;
  border: string;
}

export const NOTE_COLORS: NoteColor[] = [
  { id: "default", name: "Default (Slate)", bg: "#1E293B", border: "#334155" },
  { id: "red", name: "Coral Wine", bg: "#381E24", border: "#5C2B36" },
  { id: "orange", name: "Amber Ochre", bg: "#3D2817", border: "#5E3E23" },
  { id: "green", name: "Forest Olive", bg: "#1C3527", border: "#2E553F" },
  { id: "teal", name: "Dark Emerald", bg: "#153638", border: "#225659" },
  { id: "blue", name: "Deep Ocean", bg: "#162E46", border: "#244970" },
  { id: "indigo", name: "Midnight Navy", bg: "#1D2447", border: "#2E3B70" },
  { id: "purple", name: "Plum Dusk", bg: "#2B1D3D", border: "#4A3269" },
  { id: "charcoal", name: "Obsidian", bg: "#18202F", border: "#2C394F" },
];
