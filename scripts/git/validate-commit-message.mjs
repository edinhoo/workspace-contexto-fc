import { readFileSync } from "node:fs";

import { validateCommitMessage } from "./commit-rules.mjs";

const commitMessagePath = process.argv[2];

if (!commitMessagePath) {
  throw new Error("Informe o caminho do arquivo da mensagem de commit.");
}

const commitMessage = readFileSync(commitMessagePath, "utf8");
const errors = validateCommitMessage(commitMessage);

if (errors.length > 0) {
  process.stderr.write("Mensagem de commit fora do template esperado.\n");

  for (const error of errors) {
    process.stderr.write(`- ${error}\n`);
  }

  process.stderr.write("\nTemplate esperado em .gitmessage.txt\n");
  process.exit(1);
}
