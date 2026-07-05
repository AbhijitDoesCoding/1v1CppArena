import type { Problem } from "../types";

export default function ProblemPanel({ problem }: { problem: Problem }) {
  return (
    <div className="h-full overflow-y-auto border-r border-line bg-white p-6">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold tracking-tight">{problem.title}</h2>
        <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-subtle">
          {problem.difficulty}
        </span>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-ink/80">{problem.statement}</p>

      <h3 className="mt-6 text-xs font-medium uppercase tracking-wide text-subtle">Examples</h3>
      <div className="mt-2 space-y-2">
        {problem.tests.slice(0, 2).map((t, i) => (
          <div key={i} className="rounded-lg border border-line bg-canvas p-3 font-mono text-xs">
            <div>
              <span className="text-subtle">in </span>
              {t.stdin}
            </div>
            <div>
              <span className="text-subtle">out</span> {t.expected}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
