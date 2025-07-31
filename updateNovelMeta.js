const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const novelsPath = path.join(__dirname, "docs", "Novels");
const allNovelsPath = path.join(novelsPath, "AllNovels.json");

if (!fs.existsSync(allNovelsPath)) {
  console.error("❌ Arquivo AllNovels.json não encontrado.");
  process.exit(1);
}

// Gera uma cor fake
function fakeHexColorFromName(name) {
  const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const color = `#${((hash * 1234567) & 0xffffff).toString(16).padStart(6, "0")}`;
  return color;
}

function updateProgress(name, step, total) {
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write(`✏️ Editando ${name} [${step}/${total}]`);
}

const novels = JSON.parse(fs.readFileSync(allNovelsPath, "utf8"));
let completed = 0;

novels.forEach((novel, idx) => {
  const id = String(novel.id);
  const indexPath = path.join(novelsPath, id, "index.html");

  if (!fs.existsSync(indexPath)) {
    console.warn(`⚠️ index.html não encontrado para a novel ${id}`);
    return;
  }

  const coverUrl = novel.cover?.trim() || "";
  if (!/^https:\/\/(i\.imgur\.com|cdn\.discordapp\.com|opengraph\.).+\.(png|jpg|jpeg|webp)(\?.*)?$/.test(coverUrl)) {
    console.warn(`⚠️ Capa inválida ou não direta para ${novel.name}: ${coverUrl}`);
    return;
  }

  let step = 0;
  const totalSteps = 6;
  updateProgress(novel.name, step, totalSteps);

  const html = fs.readFileSync(indexPath, "utf8");
  const $ = cheerio.load(html);

  // Etapa 1: Remover comentários
  $('*').contents().each(function () {
    if (this.type === 'comment') {
      $(this).remove();
    }
  });
  updateProgress(novel.name, ++step, totalSteps);

  // Etapa 2: Remover metadados twitter:domain e twitter:url
  $('meta[property="twitter:domain"]').remove();
  $('meta[property="twitter:url"]').remove();
  updateProgress(novel.name, ++step, totalSteps);

  // Etapa 3: Remover og, title, theme-color, description, metas twitter:name
  $('meta[property^="og:"]').remove();
  $('meta[name="description"]').remove();
  $('meta[name="theme-color"]').remove();
  $('title').remove();
  $('meta').each(function () {
    const nameAttr = $(this).attr("name") || "";
    if (nameAttr.startsWith("twitter:")) {
      $(this).remove();
    }
  });
  updateProgress(novel.name, ++step, totalSteps);

  // Etapa 4: Gerar nova sinopse
  const sinopse = (novel.sinopse || "").trim();
  const sliceLength = 160;
  let truncated = sinopse.slice(0, sliceLength).trim();
  if (!/[.!?…]$/.test(truncated)) {
    truncated = truncated.replace(/\s+\S*$/, "") + "...";
  }
  updateProgress(novel.name, ++step, totalSteps);

  // Etapa 5: Gerar novas metatags
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
  updateProgress(novel.name, ++step, totalSteps);

  // Etapa 6: Limpeza de linhas vazias
  let finalHtml = $.html().replace(/\n\s*\n\s*\n+/g, '\n\n');
  fs.writeFileSync(indexPath, finalHtml, "utf8");

  // ✅ Mostrar status final da novel
  process.stdout.write(`\n✅ Finalizado ${novel.name} (${id})\n`);
  completed++;

  // 🟢 Se for a última novel
  if (completed === novels.length) {
    console.log("✅ Todos os arquivos foram finalizados com sucesso!");
  }
});