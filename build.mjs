// Gera as páginas otimizadas (raiz) a partir dos arquivos legíveis em src/.
// Uso: npm i -D html-minifier-terser@7.2.0 && node build.mjs
// Não altera design, textos, imagens nem scripts: só minifica, embute o CSS
// e adiciona dicas de conexão antecipada para os domínios de rastreamento.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
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


// Remove preços das páginas de oferta (a Hotmart mostra o valor convertido no widget)
function stripPrices(html, file) {
  html = html.replace(/<div class="anchor">[\s\S]*?<\/div>/g, '');
  html = html.replace(/<div class="price-box">[\s\S]*?<\/span>\s*<\/div>/g, '');
  const pairs = [
    [/<p>No\. Son US\$[\d,]+ en un único pago, sin mensualidades\.<\/p>/g, '<p>No. Es un único pago, sin mensualidades.</p>'],
    [/ POR US\$[\d,]+/g, ''],
    [/ por US\$[\d,]+/g, ''],
    [/US\$[\d,]+ en un único pago/g, 'Un único pago'],
    [/Porque es la última oportunidad de esta oferta: la misma biblioteca completa, con las 10 guías, por US\$[\d,]+\./g, 'Porque es la última oportunidad de esta oferta: la misma biblioteca completa, con las 10 guías, por un valor menor.'],
    [/Este es un precio exclusivo para quienes acaban de adquirir la guía, disponible solo en esta página\./g, 'Es una condición especial para quienes acaban de adquirir la guía, disponible solo en esta página.'],
    [/: 10 guías de profundización\.<\/title>/g, '</title>'],
    [/ 10 guías de profundización por US\$[\d,]+\./g, ' 10 guías de profundización.'],
    [/ 6 guías, 149 páginas, US\$[\d,]+\./g, ' 6 guías, 149 páginas.'],
  ];
  for (const [a, b] of pairs) html = html.replace(a, b);
  html = html.replace('<h3>Biblioteca de Profundización<br>de los 72 Ángeles</h3>', '<h3>Biblioteca de Profundización<br>de los 72 Ángeles</h3>');
  const left = html.match(/.{0,40}US\$[\d,]+.{0,20}/g);
  if (left) throw new Error(file + ': preço restante: ' + left.join(' | '));
  return html;
}

// Upsell 1: /upsell
{
  let html = readFileSync('src/upsell.html', 'utf8');
  html = addHints(html);
  writeFileSync('upsell/index.html', await minify(stripPrices(html, 'upsell'), opts));
}

// Upsell 2: /upsell2 (reaproveita o CSS do upsell 1 para manter o mesmo visual)
{
  const base = readFileSync('src/upsell.html', 'utf8').match(/<style>([\s\S]*?)<\/style>/)[1];
  let html = readFileSync('src/upsell2.tpl.html', 'utf8');
  if (!html.includes('/*BASE_CSS*/')) throw new Error('marcador BASE_CSS não encontrado');
  html = html.replace('/*BASE_CSS*/', () => base);
  html = addHints(html);
  writeFileSync('upsell2/index.html', await minify(stripPrices(html, 'upsell2'), opts));
}

// Downsells: mesmo produto do upsell, a US$7,90 (gerados a partir das páginas de upsell)
function rep(html, pairs, file) {
  for (const [a, b] of pairs) {
    if (!html.includes(a)) throw new Error(`${file}: trecho não encontrado: ${a.slice(0, 60)}`);
    html = html.split(a).join(b);
  }
  return html;
}
const DOWN_TOP = 'ESPERA: UNA ÚLTIMA OPORTUNIDAD';
mkdirSync('downsell1', { recursive: true });
mkdirSync('downsell2', { recursive: true });
{
  let html = readFileSync('src/upsell.html', 'utf8');
  html = rep(html, [
    ['<title>Biblioteca de Profundización · 10 guías de los 72 Ángeles</title>', '<title>Última oportunidad · Biblioteca de Profundización por US$7,90</title>'],
    ['OFERTA ÚNICA PARA QUIENES ACABAN DE ADQUIRIR LA GUÍA', DOWN_TOP],
    ['<h1>Ya tienes a los 72 Ángeles. Ahora entiende <em>de dónde viene cada uno</em> y lleva tu estudio mucho más lejos.</h1>', '<h1>Quizás no era el momento. Por eso te ofrecemos <em>la misma biblioteca completa</em> por casi la mitad.</h1>'],
    ['<div class="anchor"><s>US$24,90</s><strong>US$14,90</strong><span>Precio exclusivo de esta página</span></div>', '<div class="anchor"><s>OLDPRICE</s><strong>US$7,90</strong><span>Última oportunidad</span></div>'],
    ['SÍ, QUIERO AÑADIR LAS 10 GUÍAS', 'SÍ, QUIERO LAS 10 GUÍAS POR US$7,90'],
    ['OFERTA EXCLUSIVA DE ESTA PÁGINA', 'ÚLTIMA OPORTUNIDAD · LA MISMA BIBLIOTECA'],
    ['<s>De US$24,90</s>', '<s>De OLDPRICE</s>'],
    ['<small>US$</small>14,90', '<small>US$</small>7,90'],
    ['US$14,90', 'US$7,90'],
    ['src="assets/', 'src="../upsell/assets/'],
    ['href="assets/', 'href="../upsell/assets/'],
    ["'assets/'+f", "'../upsell/assets/'+f"],
  ], 'downsell1');
  html = html.split('OLDPRICE').join('US$14,90');
  writeFileSync('downsell1/index.html', await minify(addHints(stripPrices(html, 'downsell1')), opts));
}
{
  const base = readFileSync('src/upsell.html', 'utf8').match(/<style>([\s\S]*?)<\/style>/)[1];
  let html = readFileSync('src/upsell2.tpl.html', 'utf8').replace('/*BASE_CSS*/', () => base);
  html = rep(html, [
    ['<title>Kit de Práctica Angélica · 6 guías para vivir con los 72 Ángeles</title>', '<title>Última oportunidad · Kit de Práctica Angélica por US$7,90</title>'],
    ['UN ÚLTIMO PASO PARA COMPLETAR TU CAMINO', DOWN_TOP],
    ['<h1>Ya sabes quién es cada Ángel. Ahora <em>llévalo a tu vida</em>, un poco cada día.</h1>', '<h1>Quizás no era el momento. Por eso te ofrecemos <em>el mismo kit completo</em> por casi la mitad.</h1>'],
    ['<div class="anchor"><strong>US$14,90</strong><span>Solo en esta página</span></div>', '<div class="anchor"><s>OLDPRICE</s><strong>US$7,90</strong><span>Última oportunidad</span></div>'],
    ['SÍ, QUIERO EMPEZAR MI PRÁCTICA', 'SÍ, QUIERO EL KIT POR US$7,90'],
    ['OFERTA EXCLUSIVA DE ESTA PÁGINA', 'ÚLTIMA OPORTUNIDAD · EL MISMO KIT'],
    ['<div class="price"><small>US$</small>14,90</div>', '<s>De OLDPRICE</s><div class="price"><small>US$</small>7,90</div>'],
    ['Unos US$0,10 por página', 'Unos US$0,05 por página'],
    ['US$14,90', 'US$7,90'],
    ['src="assets/', 'src="../upsell2/assets/'],
    ['href="assets/', 'href="../upsell2/assets/'],
  ], 'downsell2');
  html = html.split('OLDPRICE').join('US$14,90');
  writeFileSync('downsell2/index.html', await minify(addHints(stripPrices(html, 'downsell2')), opts));
}

// Página de obrigado: /obrigado
mkdirSync('obrigado', { recursive: true });
{
  const base = readFileSync('src/upsell.html', 'utf8').match(/<style>([\s\S]*?)<\/style>/)[1];
  const html = readFileSync('src/obrigado.tpl.html', 'utf8').replace('/*BASE_CSS*/', () => base);
  writeFileSync('obrigado/index.html', await minify(addHints(html), opts));
}

console.log('ok');
