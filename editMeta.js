const fs = require("fs");
const path = require("path");
const readline = require("readline");
const cheerio = require("cheerio");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const novelsPath = path.join(__dirname, "docs", "Novels");
const allNovelsPath = path.join(novelsPath, "AllNovels.json");

if (!fs.existsSync(allNovelsPath)) {
  console.error("❌ Arquivo AllNovels.json não encontrado.");
  process.exit(1);
}

function fakeHexColorFromName(name) {
  const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const color = `#${((hash * 1234567) & 0xffffff).toString(16).padStart(6, "0")}`;
  return color;
}

function showProgress(name, step, total) {
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write(`Editando ${name} [${step}/${total}]`);
}

rl.question("Quer fazer o que? (Remover metadados [1], Substituir/Adicionar metadados [2])\n> ", (resposta) => {
  const modo = resposta.trim();

  if (!["1", "2"].includes(modo)) {
    console.log("❌ Opção inválida. Use 1 ou 2.");
    rl.close();
    return;
  }

  const novels = JSON.parse(fs.readFileSync(allNovelsPath, "utf8"));

  novels.forEach((novel) => {
    const id = String(novel.id);
    const indexPath = path.join(novelsPath, id, "index.html");

    if (!fs.existsSync(indexPath)) {
      console.warn(`⚠️ index.html não encontrado para a novel ${id}`);
      return;
    }

    const coverUrl = novel.cover?.trim() || "";
    if (!/^https:\/\/(i\.imgur\.com|cdn\.discordapp\.com|opengraph\.).+\.(png|jpg|jpeg|webp)(\?.*)?$/.test(coverUrl)) {
      console.warn(`⚠️ Capa inválida para ${novel.name}: ${coverUrl}`);
      return;
    }

    let step = 0;
    const totalSteps = modo === "2" ? 6 : 5;
    const html = fs.readFileSync(indexPath, "utf8");
    const $ = cheerio.load(html);

    const updateAndPrint = () => {
      step++;
      showProgress(novel.name, step, totalSteps);
    };

    // Etapa 1: Remover comentários
    $('*').contents().each(function () {
      if (this.type === 'comment') $(this).remove();
    });
    updateAndPrint();

    // Etapa 2: Remover twitter:domain e twitter:url
    $('meta[property="twitter:domain"]').remove();
    $('meta[property="twitter:url"]').remove();
    updateAndPrint();

    // Etapa 3: Remover outros metadados
    $('meta[property^="og:"]').remove();
    $('meta[name="theme-color"]').remove();
    $('meta[name="description"]').remove();

    // Etapa 4: Remover metas twitter (name="twitter:*")
    $('meta').each(function () {
      const nameAttr = $(this).attr("name") || "";
      if (nameAttr.startsWith("twitter:")) $(this).remove();
    });
    updateAndPrint();

    // Etapa 5: Limpa title
    $('title').remove();
    updateAndPrint();

    // Etapa 6: Adiciona novos metadados (modo 2)
    if (modo === "2") {
      const sinopse = (novel.sinopse || "").trim();
      const sliceLength = 160;
      let truncated = sinopse.slice(0, sliceLength).trim();
      if (!/[.!?…]$/.test(truncated)) {
        truncated = truncated.replace(/\s+\S*$/, "") + "...";
      }

      const fakeHex = fakeHexColorFromName(novel.name);
      const metaTags = `
<title>${novel.name}</title>
<meta name="description" content="${truncated}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${novel.name}" />
<meta property="og:description" content="${truncated}" />
<meta property="og:image" content="${coverUrl}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${novel.name}" />
<meta name="twitter:description" content="${truncated}" />
<meta name="twitter:image" content="${coverUrl}" />
<meta name="theme-color" content="${fakeHex}" />`;

      $("head").prepend(metaTags);
      updateAndPrint();
    }

    // Etapa Final: Limpar linhas vazias demais
    let finalHtml = $.html().replace(/\n\s*\n\s*\n+/g, "\n\n");

    fs.writeFileSync(indexPath, finalHtml, "utf8");
    process.stdout.write("\n");
  });

  console.log("✅ Todos os arquivos foram finalizados com sucesso!");
  rl.close();
});