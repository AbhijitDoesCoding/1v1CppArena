import type { Problem } from "../types";

export const PROBLEMS: Problem[] = [
  {
    id: "two-sum-fast",
    title: "Sum of Two",
    difficulty: "Easy",
    statement:
      "Read two integers a and b from standard input (space-separated) and print their sum.",
    starterCode:
      "#include <iostream>\nusing namespace std;\nint main(){\n    long long a,b;\n    cin >> a >> b;\n    // your code here\n    return 0;\n}\n",
    tests: [
      { stdin: "2 3", expected: "5" },
      { stdin: "100 250", expected: "350" },
      { stdin: "-4 4", expected: "0" },
    ],
  },
];

export const getProblem = (id: string) =>
  PROBLEMS.find((p) => p.id === id) ?? PROBLEMS[0];
