import type { Problem } from "../types";

// Piston public execution API — free, no key, no signup, no credit card.
// https://github.com/engineer-man/piston
const PISTON = "https://emkc.org/api/v2/piston/execute";
const LANGUAGE = "c++";
const VERSION = "10.2.0";

interface RunResult {
  passed: boolean;
  detail: string;
}

// Run one test case: compile+run the source with the given stdin, compare stdout.
async function runOne(source: string, stdin: string, expected: string): Promise<RunResult> {
  const res = await fetch(PISTON, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      language: LANGUAGE,
      version: VERSION,
      files: [{ content: source }],
      stdin,
    }),
  });

  if (!res.ok) return { passed: false, detail: `Runner error (${res.status})` };
  const data = await res.json();

  if (data.compile && data.compile.code !== 0) {
    return { passed: false, detail: "Compilation error" };
  }
  const out = (data.run?.stdout ?? "").trim();
  if (data.run?.code !== 0 && !out) {
    return { passed: false, detail: data.run?.stderr?.trim() || "Runtime error" };
  }
  return { passed: out === expected.trim(), detail: out === expected.trim() ? "ok" : "Wrong answer" };
}

// Run ALL tests; short-circuit on first failure. Small gap between calls keeps
// us under Piston's public rate limit (~5 req/s).
export async function runAllTests(
  problem: Problem,
  source: string
): Promise<{ allPassed: boolean; log: string }> {
  for (let i = 0; i < problem.tests.length; i++) {
    const t = problem.tests[i];
    const r = await runOne(source, t.stdin, t.expected);
    if (!r.passed) return { allPassed: false, log: `Test ${i + 1} failed: ${r.detail}` };
    await new Promise((res) => setTimeout(res, 250));
  }
  return { allPassed: true, log: `All ${problem.tests.length} tests passed` };
}
