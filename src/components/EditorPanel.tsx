import Editor from "@monaco-editor/react";
import { useState } from "react";
import type { Problem } from "../types";

interface Props {
  problem: Problem;
  onChange: (code: string) => void;
  onSubmit: (code: string) => void;
  submitting: boolean;
  log: string;
}

export default function EditorPanel({ problem, onChange, onSubmit, submitting, log }: Props) {
  const [code, setCode] = useState(problem.starterCode);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line bg-white px-4 py-2">
        <span className="font-mono text-xs text-subtle">main.cpp</span>
        <button
          onClick={() => onSubmit(code)}
          disabled={submitting}
          className="rounded-md bg-ink px-4 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Running…" : "Submit"}
        </button>
      </div>

      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage="cpp"
          theme="vs"
          value={code}
          onChange={(v) => {
            const c = v ?? "";
            setCode(c);
            onChange(c);
          }}
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            padding: { top: 12 },
            scrollBeyondLastLine: false,
          }}
        />
      </div>

      {log && (
        <div className="border-t border-line bg-canvas px-4 py-2 font-mono text-xs text-ink/80">
          {log}
        </div>
      )}
    </div>
  );
}
