import { execFileSync } from "node:child_process";

import { validateCommitMessage } from "./commit-rules.mjs";

const before = process.argv[2];
const after = process.argv[3];

const isZeroSha = (value) => /^0+$/.test(value ?? "");

const resolveRange = () => {
  if (after) {
    if (isZeroSha(before)) {
      return `${after}^..${after}`;
    }

    return `${before}..${after}`;
  }

  if (before) {
    return before;
  }

  throw new Error("Informe um range de commits para validar.");
};

const range = resolveRange();
const commitList = execFileSync(
  "git",
  ["rev-list", "--first-parent", "--reverse", range],
  {
    encoding: "utf8",
  },
)
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);

const errors = [];

for (const sha of commitList) {
  const message = execFileSync("git", ["show", "-s", "--format=%B", sha], {
    encoding: "utf8",
  });
  const messageErrors = validateCommitMessage(message);

  for (const error of messageErrors) {
    errors.push(`${sha.slice(0, 7)}: ${error}`);
  }
}

if (errors.length > 0) {
  process.stderr.write("Foram encontrados commits fora do template esperado.\n");

  for (const error of errors) {
    process.stderr.write(`- ${error}\n`);
  }

  process.exit(1);
}

process.stdout.write(`Commits validados com sucesso no range ${range}.\n`);
