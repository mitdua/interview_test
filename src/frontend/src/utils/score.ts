export function scoreColor(score: number): string {
  if (score >= 8) return 'text-green-400 border-green-500/60'
  if (score >= 5) return 'text-yellow-400 border-yellow-500/60'
  return 'text-red-400 border-red-500/60'
}

export function scoreBg(score: number): string {
  if (score >= 8) return 'bg-green-950/40'
  if (score >= 5) return 'bg-yellow-950/40'
  return 'bg-red-950/40'
}
