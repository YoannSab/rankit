/**
 * Avatar helpers: turn a user-picked image file into a small, compressed
 * base64 data URL suitable for syncing through Firebase, plus simple
 * browser persistence so a player can reuse the same photo without
 * picking/taking it again.
 */

const STORAGE_KEY = "rankit_avatar"
const MAX_SIZE = 256 // px — final square avatar dimension
const JPEG_QUALITY = 0.82

/**
 * Read an image File, downscale it to a centered square (max {@link MAX_SIZE}px)
 * and return a compressed JPEG data URL.
 */
export async function fileToAvatarDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Le fichier sélectionné n'est pas une image.")
  }
  const dataUrl = await readFileAsDataUrl(file)
  return dataUrlToAvatarDataUrl(dataUrl)
}

/**
 * Downscale/crop any image data URL (e.g. a captured camera frame) into a
 * compact square JPEG avatar.
 */
export async function dataUrlToAvatarDataUrl(dataUrl: string): Promise<string> {
  const img = await loadImage(dataUrl)
  return processImage(img)
}

function processImage(img: HTMLImageElement): string {
  const size = Math.min(MAX_SIZE, img.width, img.height) || MAX_SIZE
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Impossible de traiter l'image.")

  // Center-crop to a square, then draw scaled to the canvas.
  const side = Math.min(img.width, img.height)
  const sx = (img.width - side) / 2
  const sy = (img.height - side) / 2
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size)

  return canvas.toDataURL("image/jpeg", JPEG_QUALITY)
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error("Lecture de l'image impossible."))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Image invalide."))
    img.src = src
  })
}

/** Persist the last used avatar so it can be reused on the next game. */
export function saveStoredAvatar(dataUrl: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, dataUrl)
  } catch {
    // Storage may be full or unavailable (private mode) — non-fatal.
  }
}

/** Retrieve the previously saved avatar, if any. */
export function getStoredAvatar(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

/** Forget the saved avatar. */
export function clearStoredAvatar(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
