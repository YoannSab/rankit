import { createTheme } from "@mui/material"

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#7c3aed" },
    secondary: { main: "#06b6d4" },
    background: { default: "#0a0e1a", paper: "#111827" },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
  },
})
