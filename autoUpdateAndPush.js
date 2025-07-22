const { exec } = require("child_process");
const path = require("path");

const updateScriptPath = path.join(__dirname, "updateNovelMeta.js");
const repoUrl = "https://MigueruYoutube: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@github.com/MigueruYoutube/ReignRpgs.git";

function runCommand(command, successMessage = "") {
  return new Promise((resolve, reject) => {
    exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Erro ao executar: ${command}\n${stderr}`);
        return reject(error);
      }
      if (stdout.trim()) console.log(stdout);
      if (successMessage) console.log(successMessage);
      resolve();
    });
  });
}

async function main() {
  console.log("🧠 Executando updateNovelMeta.js...");
  await runCommand(`node ${updateScriptPath}`, "✅ Metadados atualizados com sucesso!");

  console.log("⏳ Aguardando 5 segundos para estabilizar mudanças...");
  await new Promise((res) => setTimeout(res, 5000));

  console.log("📡 Preparando push para GitHub...");
  await runCommand(`git pull ${repoUrl}`, "🔃 Pull realizado.");
  await runCommand(`git add .`);
  await runCommand(`git diff --quiet || git commit -m "Atualização automática com metadados"`, "✅ Commit realizado.");
  await runCommand(`git push ${repoUrl}`, "🚀 Push enviado para o GitHub!");
}

main().catch((err) => {
  console.error("❌ Algo deu errado:", err.message);
});