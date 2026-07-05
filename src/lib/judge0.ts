import type { Problem } from "../types";

const HOST = "judge0-ce.p.rapidapi.com";
const BASE = `https://${HOST}`;
const headers = {
  "content-type": "application/json",
  "X-RapidAPI-Key": import.meta.env.VITE_RAPIDAPI_KEY,
  "X-RapidAPI-Host": HOST,
};

interface RunResult {
  passed: boolean;
  detail: string;
}

// Run one test case synchronously (wait=true) and compare trimmed stdout.
async function runOne(
  source: string,
  langId: number,
  stdin: string,
  expected: string
): Promise<RunResult> {
  const res = await fetch(`${BASE}/submissions?base64_encoded=false&wait=true`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      source_code: source,
      language_id: langId,
      stdin,
      expected_output: expected,
    }),
  });
  const data = await res.json();
  const out = (data.stdout ?? "").trim();
  const passed = data.status?.id === 3 && out === expected.trim();
  return { passed, detail: data.status?.description ?? "Unknown" };
}

// Run ALL tests; short-circuit on first failure.
export async function runAllTests(
  problem: Problem,
  source: string
): Promise<{ allPassed: boolean; log: string }> {
  for (let i = 0; i < problem.tests.length; i++) {
    const t = problem.tests[i];
    const r = await runOne(source, problem.languageId, t.stdin, t.expected);
    if (!r.passed) return { allPassed: false, log: `Test ${i + 1} failed: ${r.detail}` };
  }
  return { allPassed: true, log: `All ${problem.tests.length} tests passed` };
}
