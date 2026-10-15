// Gera as páginas otimizadas (raiz) a partir dos arquivos legíveis em src/.
// Uso: npm i -D html-minifier-terser@7.2.0 && node build.mjs
// Não altera design, textos, imagens nem scripts: só minifica, embute o CSS
// e adiciona dicas de conexão antecipada para os domínios de rastreamento.
import { readFileSync, writeFileSync } from 'node:fs';
import { minify } from 'html-minifier-terser';

const opts = {
  collapseWhitespace: true,
  conservativeCollapse: true, // mantém um espaço onde havia espaço: o texto renderiza igual
  removeComments: true,
  minifyCSS: true,
  minifyJS: true,
  keepClosingSlash: true,
  removeAttributeQuotes: false,
  removeRedundantAttributes: false,
  removeScriptTypeAttributes: false,
};

const hints = [
  '<link rel="preconnect" href="https://connect.facebook.net">',
  '<link rel="dns-prefetch" href="https://www.facebook.com">',
  '<link rel="preconnect" href="https://cdn.utmify.com.br">',
].join('');

function addHints(html) {
  return html.replace(/(<meta charset="utf-8">)/i, `$1${hints}`);
}

// Página principal: o style.css passa a vir embutido no <head>,
// eliminando uma requisição que bloqueava a renderização.
{
  let html = readFileSync('src/index.html', 'utf8');
  const css = readFileSync('src/style.css', 'utf8');
  if (!html.includes('<link rel="stylesheet" href="style.css">')) throw new Error('link do style.css não encontrado');
  html = html.replace('<link rel="stylesheet" href="style.css">', () => `<style>${css}</style>`);
  html = addHints(html);
  writeFileSync('index.html', await minify(html, opts));
}

// Versão melhorada: mesma minificação e dicas de conexão.
{
  let html = readFileSync('src/versao-melhorada.html', 'utf8');
  html = addHints(html);
  writeFileSync('versao-melhorada.html', await minify(html, opts));
}

// Upsell 1: /upsell
{
  let html = readFileSync('src/upsell.html', 'utf8');
  html = addHints(html);
  writeFileSync('upsell/index.html', await minify(html, opts));
}

// Upsell 2: /upsell2 (reaproveita o CSS do upsell 1 para manter o mesmo visual)
{
  const base = readFileSync('src/upsell.html', 'utf8').match(/<style>([\s\S]*?)<\/style>/)[1];
  let html = readFileSync('src/upsell2.tpl.html', 'utf8');
  if (!html.includes('/*BASE_CSS*/')) throw new Error('marcador BASE_CSS não encontrado');
  html = html.replace('/*BASE_CSS*/', () => base);
  html = addHints(html);
  writeFileSync('upsell2/index.html', await minify(html, opts));
}

console.log('ok');
