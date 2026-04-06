import { readFileSync } from "node:fs";

import { validatePrBody } from "./pr-rules.mjs";

const parseArgs = (argv) => {
  let githubEventPath = "";
  let bodyPath = "";

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--github-event") {
      githubEventPath = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (argument === "--body-file") {
      bodyPath = argv[index + 1] ?? "";
      index += 1;
    }
  }

  return { githubEventPath, bodyPath };
};

const cliOptions = parseArgs(process.argv.slice(2));

let body = "";

if (cliOptions.githubEventPath) {
  const event = JSON.parse(readFileSync(cliOptions.githubEventPath, "utf8"));
  body = event.pull_request?.body ?? "";
} else if (cliOptions.bodyPath) {
  body = readFileSync(cliOptions.bodyPath, "utf8");
} else {
  throw new Error("Informe --github-event <path> ou --body-file <path>.");
}

const errors = validatePrBody(body);

if (errors.length > 0) {
  process.stderr.write("Descricao de PR fora do template esperado.\n");

  for (const error of errors) {
    process.stderr.write(`- ${error}\n`);
  }

  process.exit(1);
}

process.stdout.write("Descricao de PR validada com sucesso.\n");
