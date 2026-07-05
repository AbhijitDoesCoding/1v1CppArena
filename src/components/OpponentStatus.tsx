import type { Match } from "../types";

export default function OpponentStatus({ match, meUid }: { match: Match; meUid: string }) {
  const players = Object.values(match.players);
  const me = players.find((p) => p.uid === meUid);
  const opp = players.find((p) => p.uid !== meUid);
  const bar = (v: number) => Math.min(100, (v / 400) * 100); // ~400 chars = full

  return (
    <div className="border-t border-line bg-white p-4">
      <h3 className="text-xs font-medium uppercase tracking-wide text-subtle">Live Status</h3>
      <div className="mt-3 space-y-3">
        {[me, opp].map((p, i) =>
          p ? (
            <div key={p.uid}>
              <div className="flex justify-between text-xs">
                <span className="font-medium">{i === 0 ? "You" : p.displayName}</span>
                <span className="text-subtle">
                  {p.finished ? "✓ Solved" : `${p.progress} chars`}
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-line">
                <div
                  className={`h-1.5 rounded-full ${i === 0 ? "bg-ink" : "bg-subtle"}`}
                  style={{
                    width: `${p.finished ? 100 : bar(p.progress)}%`,
                    transition: "width .3s",
                  }}
                />
              </div>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}
