import { execFileSync } from "node:child_process";

const runGitConfig = (key, value) => {
  execFileSync("git", ["config", key, value], {
    stdio: "inherit",
  });
};

runGitConfig("commit.template", ".gitmessage.txt");
runGitConfig("core.hooksPath", ".githooks");

process.stdout.write("Template de commit e hooks locais configurados com sucesso.\n");
