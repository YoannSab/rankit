import { useCallback, useEffect, useRef, useState } from "react"
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  IconButton,
  Stack,
  Typography,
} from "@mui/material"
import { alpha, useTheme } from "@mui/material/styles"
import { AnimatePresence, motion } from "framer-motion"
import CloseIcon from "@mui/icons-material/Close"
import CameraAltIcon from "@mui/icons-material/CameraAlt"
import ReplayIcon from "@mui/icons-material/Replay"
import CheckIcon from "@mui/icons-material/Check"
import CameraswitchIcon from "@mui/icons-material/Cameraswitch"
import { dataUrlToAvatarDataUrl } from "../utils/avatar"

export interface CameraCaptureProps {
  open: boolean
  onClose: () => void
  onCapture: (dataUrl: string) => void
}

type FacingMode = "user" | "environment"

export function CameraCapture({ open, onClose, onCapture }: CameraCaptureProps) {
  const theme = useTheme()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [facing, setFacing] = useState<FacingMode>("user")
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [snapshot, setSnapshot] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const startStream = useCallback(
    async (mode: FacingMode) => {
      setError(null)
      setReady(false)
      stopStream()
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: mode },
          audio: false,
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
        }
        setReady(true)
      } catch {
        setError(
          "Accès à la caméra impossible. Vérifiez les autorisations ou utilisez la galerie.",
        )
      }
    },
    [stopStream],
  )

  // Open / close lifecycle
  useEffect(() => {
    if (open) {
      setSnapshot(null)
      void startStream(facing)
    } else {
      stopStream()
      setSnapshot(null)
      setReady(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Cleanup on unmount
  useEffect(() => () => stopStream(), [stopStream])

  const handleSwitch = () => {
    const next: FacingMode = facing === "user" ? "environment" : "user"
    setFacing(next)
    void startStream(next)
  }

  const handleSnap = () => {
    const video = videoRef.current
    if (!video) return
    const w = video.videoWidth
    const h = video.videoHeight
    if (!w || !h) return
    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    if (facing === "user") {
      // Mirror selfie so it matches the live preview
      ctx.translate(w, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0, w, h)
    setSnapshot(canvas.toDataURL("image/jpeg", 0.92))
  }

  const handleConfirm = async () => {
    if (!snapshot) return
    setBusy(true)
    try {
      const avatar = await dataUrlToAvatarDataUrl(snapshot)
      onCapture(avatar)
      onClose()
    } catch {
      setError("Traitement de la photo impossible.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 4,
            overflow: "hidden",
            background: theme.palette.background.paper,
            backgroundImage: "none",
            border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
          },
        },
      }}
    >
      {/* Header */}
      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "space-between", px: 2, py: 1.5 }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Prendre une photo
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>

      {/* Viewport */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          aspectRatio: "1 / 1",
          background: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {/* Live video */}
        <Box
          component="video"
          ref={videoRef}
          playsInline
          muted
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: facing === "user" ? "scaleX(-1)" : "none",
            display: snapshot ? "none" : "block",
          }}
        />

        {/* Frozen snapshot preview */}
        <AnimatePresence>
          {snapshot && (
            <motion.img
              key="snap"
              src={snapshot}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          )}
        </AnimatePresence>

        {/* Loading */}
        {!ready && !error && !snapshot && (
          <CircularProgress color="secondary" />
        )}

        {/* Error */}
        {error && (
          <Box sx={{ px: 3, textAlign: "center" }}>
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          </Box>
        )}

        {/* Switch camera */}
        {ready && !snapshot && !error && (
          <IconButton
            onClick={handleSwitch}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              color: "#fff",
              background: alpha("#000", 0.4),
              "&:hover": { background: alpha("#000", 0.6) },
            }}
          >
            <CameraswitchIcon />
          </IconButton>
        )}
      </Box>

      {/* Controls */}
      <Box sx={{ p: 2 }}>
        {!snapshot ? (
          <Stack direction="row" sx={{ justifyContent: "center" }}>
            <IconButton
              onClick={handleSnap}
              disabled={!ready || !!error}
              sx={(t) => ({
                width: 68,
                height: 68,
                color: "#fff",
                background: `linear-gradient(135deg, ${t.palette.primary.main}, ${t.palette.secondary.main})`,
                boxShadow: `0 6px 20px ${alpha(t.palette.primary.main, 0.4)}`,
                "&:hover": { opacity: 0.92 },
                "&.Mui-disabled": { opacity: 0.4, color: "#fff" },
              })}
            >
              <CameraAltIcon sx={{ fontSize: 30 }} />
            </IconButton>
          </Stack>
        ) : (
          <Stack direction="row" sx={{ gap: 1.5 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ReplayIcon />}
              onClick={() => setSnapshot(null)}
              disabled={busy}
              sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
            >
              Reprendre
            </Button>
            <Button
              fullWidth
              variant="contained"
              startIcon={busy ? <CircularProgress size={18} color="inherit" /> : <CheckIcon />}
              onClick={handleConfirm}
              disabled={busy}
              sx={(t) => ({
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${t.palette.primary.main}, ${t.palette.secondary.main})`,
              })}
            >
              Utiliser
            </Button>
          </Stack>
        )}
      </Box>
    </Dialog>
  )
}
