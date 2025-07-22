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

  const coverUrl = novel.cover?.trim() || "";
  if (!/^https:\/\/i\.imgur\.com\/.+\.(png|jpg|jpeg|webp)$/.test(coverUrl)) {
    console.warn(`⚠️ Capa inválida ou não direta para a novel ${novel.name}: ${coverUrl}`);
    return;
  }

  const html = fs.readFileSync(indexPath, "utf8");
  const $ = cheerio.load(html);

  $('meta[property^="og:"]').remove();

  const sinopse = (novel.sinopse || "").trim();
  const sliceLength = 160;
  let truncated = sinopse.slice(0, sliceLength).trim();
  if (!/[.!?…]$/.test(truncated)) {
    truncated = truncated.replace(/\s+\S*$/, "") + "...";
  }

  const metaTags = `
    <!-- metadados OG básicos para preview com imagem grande -->
    <meta property="og:title" content="${novel.name}" />
    <meta property="og:description" content="${truncated}" />
    <meta property="og:image" content="${coverUrl}" />
  `;

  $("head").prepend(metaTags);
  fs.writeFileSync(indexPath, $.html(), "utf8");

  console.log(`✅ Preview visual gerado para a novel ${id} (${novel.name})`);
});