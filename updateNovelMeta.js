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

  const html = fs.readFileSync(indexPath, "utf8");
  const $ = cheerio.load(html);

  // Remove as meta tags OG antigas
  $('meta[property^="og:"]').remove();

  // Limitar sinopse entre 50% e 70% do texto original
  const sinopse = (novel.sinopse || "").trim();
  const minLength = Math.floor(sinopse.length * 0.5);
  const maxLength = Math.floor(sinopse.length * 0.7);
  const sliceLength = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;

  let truncated = sinopse.slice(0, sliceLength).trim();
  // Garante que termina com "..." se necessário
  if (!/[.!?…]$/.test(truncated)) {
    truncated += "...";
  }

  const metaTags = `
    <!-- metadados inseridos automaticamente -->
    <meta property="og:title" content="${novel.name}" />
    <meta property="og:description" content="${truncated}" />
    <meta property="og:image" content="${novel.cover}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="https://migueruyoutube.github.io/ReignRpgs/Novels/${id}/" />
  `;

  $("head").prepend(metaTags);

  fs.writeFileSync(indexPath, $.html(), "utf8");

  console.log(`✅ Metadados adicionados à novel ${id} bah!`);
});