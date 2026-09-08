"use client";

import { createTheme } from "@mui/material/styles";

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#0F172A",
      paper: "#1E293B",
    },
    divider: "#334155",
    text: {
      primary: "#F8FAFC",
      secondary: "#94A3B8",
    },
    primary: {
      main: "#38BDF8", // Sky 400 accent for highlights
      contrastText: "#0F172A",
    },
    secondary: {
      main: "#818CF8", // Indigo 400
    },
    error: {
      main: "#F87171",
    },
    warning: {
      main: "#FBBF24",
    },
    info: {
      main: "#38BDF8",
    },
    success: {
      main: "#34D399",
    },
  },
  typography: {
    fontFamily: "var(--font-poppins), sans-serif",
    button: {
      textTransform: "none",
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#1E293B",
          borderColor: "#334155",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          fontWeight: 600,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#334155",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#64748B",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#38BDF8",
          },
        },
      },
    },
  },
});
