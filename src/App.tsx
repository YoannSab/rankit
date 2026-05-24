import { CssBaseline, ThemeProvider } from "@mui/material"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { RankItProvider } from "./context/RankItContext"
import { CreateGame } from "./pages/CreateGame"
import { GameRoom } from "./pages/GameRoom"
import { JoinGame } from "./pages/JoinGame"
import { LandingPage } from "./pages/LandingPage"
import { theme } from "./theme"

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <RankItProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/create" element={<CreateGame />} />
            <Route path="/join" element={<JoinGame />} />
            <Route path="/game/:code" element={<GameRoom />} />
          </Routes>
        </RankItProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}