import { useRef, useState } from "react"
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material"
import { alpha, useTheme } from "@mui/material/styles"
import { AnimatePresence, motion } from "framer-motion"
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera"
import CollectionsIcon from "@mui/icons-material/Collections"
import CloseIcon from "@mui/icons-material/Close"
import ReplayIcon from "@mui/icons-material/Replay"
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto"
import { PlayerAvatar } from "./PlayerAvatar"
import { CameraCapture } from "./CameraCapture"
import {
  fileToAvatarDataUrl,
  getStoredAvatar,
  saveStoredAvatar,
} from "../utils/avatar"

export interface AvatarPickerProps {
  /** Current avatar data URL (controlled) */
  value?: string
  /** Name used for the initials fallback */
  name: string
  onChange: (dataUrl: string | undefined) => void
}

export function AvatarPicker({ value, name, onChange }: AvatarPickerProps) {
  const theme = useTheme()
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cameraOpen, setCameraOpen] = useState(false)

  // Avatar saved from a previous game, offered for quick reuse.
  const [stored] = useState<string | null>(() => getStoredAvatar())
  const canReuse = !!stored && stored !== value

  const commit = (dataUrl: string) => {
    saveStoredAvatar(dataUrl)
    onChange(dataUrl)
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const dataUrl = await fileToAvatarDataUrl(file)
      commit(dataUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image impossible à charger.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: "center" }}>
        Ajoutez une photo — elle vous suivra pendant toute la partie ✨
      </Typography>

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          void handleFile(e.target.files?.[0])
          e.target.value = ""
        }}
      />

      <CameraCapture
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={commit}
      />

      {/* Big centered avatar */}
      <Stack sx={{ alignItems: "center", gap: 2 }}>
        <Box sx={{ position: "relative" }}>
          <motion.div
            key={value || "empty"}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 360, damping: 20 }}
          >
            {value ? (
              <PlayerAvatar player={{ name, avatar: value }} size={132} ringColor="secondary" />
            ) : (
              <Box
                onClick={() => galleryInputRef.current?.click()}
                sx={{
                  width: 132,
                  height: 132,
                  borderRadius: "50%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.5,
                  cursor: "pointer",
                  color: "text.secondary",
                  background: alpha(theme.palette.secondary.main, 0.08),
                  border: `2px dashed ${alpha(theme.palette.secondary.main, 0.4)}`,
                  transition: "all 0.2s",
                  "&:hover": {
                    borderColor: theme.palette.secondary.main,
                    color: theme.palette.secondary.main,
                    background: alpha(theme.palette.secondary.main, 0.14),
                  },
                }}
              >
                <AddAPhotoIcon sx={{ fontSize: 34 }} />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  Photo
                </Typography>
              </Box>
            )}
          </motion.div>

          {/* Loading overlay */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  background: alpha(theme.palette.background.default, 0.6),
                }}
              >
                <CircularProgress size={30} color="secondary" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Remove badge */}
          <AnimatePresence>
            {value && !loading && (
              <motion.button
                type="button"
                onClick={() => onChange(undefined)}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                whileTap={{ scale: 0.85 }}
                style={{
                  position: "absolute",
                  top: 2,
                  right: 2,
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: `2px solid ${theme.palette.background.paper}`,
                  background: theme.palette.error.main,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  padding: 0,
                }}
                aria-label="Retirer la photo"
              >
                <CloseIcon sx={{ fontSize: 18 }} />
              </motion.button>
            )}
          </AnimatePresence>
        </Box>

        {/* Actions */}
        <Stack direction="row" sx={{ gap: 1, width: "100%", maxWidth: 320 }}>
          <Button
            variant="outlined"
            startIcon={<PhotoCameraIcon />}
            onClick={() => setCameraOpen(true)}
            disabled={loading}
            sx={{ textTransform: "none", flex: 1, fontWeight: 600, borderRadius: 2 }}
          >
            Caméra
          </Button>
          <Button
            variant="outlined"
            startIcon={<CollectionsIcon />}
            onClick={() => galleryInputRef.current?.click()}
            disabled={loading}
            sx={{ textTransform: "none", flex: 1, fontWeight: 600, borderRadius: 2 }}
          >
            Galerie
          </Button>
        </Stack>

        <AnimatePresence>
          {canReuse && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Button
                variant="text"
                size="small"
                startIcon={
                  <Box
                    component="img"
                    src={stored!}
                    sx={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }}
                  />
                }
                endIcon={<ReplayIcon sx={{ fontSize: 16 }} />}
                onClick={() => onChange(stored!)}
                sx={{ textTransform: "none", fontWeight: 600, color: "secondary.main" }}
              >
                Réutiliser ma photo
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Typography variant="caption" color="error">
                {error}
              </Typography>
            </motion.div>
          )}
        </AnimatePresence>
      </Stack>
    </Box>
  )
}
