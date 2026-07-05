// Standard Elo. K=32. Returns the new ratings for [winner, loser].
export function computeElo(winner: number, loser: number, k = 32): [number, number] {
  const expW = 1 / (1 + 10 ** ((loser - winner) / 400));
  const expL = 1 / (1 + 10 ** ((winner - loser) / 400));
  return [Math.round(winner + k * (1 - expW)), Math.round(loser + k * (0 - expL))];
}
