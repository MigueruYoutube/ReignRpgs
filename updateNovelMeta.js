const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const novelsPath = path.join(__dirname, "docs", "Novels");
const allNovelsPath = path.join(novelsPath, "AllNovels.json");

if (!fs.existsSync(allNovelsPath)) {
  console.error("❌ Arquivo AllNovels.json não encontrado.");
  process.exit(1);
}

const novels = JSON.parse(fs.readFileSync(allNovelsPath, "utf8"));

novels.forEach((novel) => {
  const id = String(novel.id);
  const indexPath = path.join(novelsPath, id, "index.html");

  if (!fs.existsSync(indexPath)) {
    console.warn(`⚠️ index.html não encontrado para a novel ${id}`);
    return;
  }

  // Verifica se o cover é uma URL direta de imagem
  const coverUrl = novel.cover?.trim() || "";
  if (!/^https:\/\/i\.imgur\.com\/.+\.(png|jpg|jpeg|gif|webp)$/.test(coverUrl)) {
    console.warn(`⚠️ Capa inválida ou não direta para a novel ${novel.name}: ${coverUrl}`);
    return;
  }

  const html = fs.readFileSync(indexPath, "utf8");
  const $ = cheerio.load(html);

  // Remove as meta tags OG antigas
  $('meta[property^="og:"]').remove();

  // Limitar sinopse com corte fixo e limpo
  const sinopse = (novel.sinopse || "").trim();
  const sliceLength = 160;
  let truncated = sinopse.slice(0, sliceLength).trim();

  // Evita terminar no meio de uma palavra e adiciona "..." se necessário
  if (!/[.!?…]$/.test(truncated)) {
    truncated = truncated.replace(/\s+\S*$/, "") + "...";
  }

  const metaTags = `
    <!-- metadados inseridos automaticamente -->
    <meta property="og:title" content="${novel.name}" />
    <meta property="og:description" content="${truncated}" />
    <meta property="og:image" content="${coverUrl}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="https://migueruyoutube.github.io/ReignRpgs/Novels/${id}/" />
  `;

  $("head").prepend(metaTags);

  fs.writeFileSync(indexPath, $.html(), "utf8");

  console.log(`✅ Metadados adicionados à novel ${id} (${novel.name})`);
});