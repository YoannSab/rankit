/** Generate a random alpha-numeric game code (5 chars, uppercase). */
export function generateGameCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // no O/0/I/1 to avoid confusion
  let code = ""
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}
