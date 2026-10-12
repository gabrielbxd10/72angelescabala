# Los 72 Ángeles de la Cábala — página de vendas

Site estático (sem build na Vercel). Os arquivos da raiz são os que vão ao ar:

- `index.html` — página principal (clone fiel do site), já otimizada
- `versao-melhorada.html` — versão redesenhada, já otimizada
- `assets/` — as 22 imagens originais, em qualidade máxima (nunca recomprimidas)
- `vercel.json` — regras de cache

## Editando a página

Edite os arquivos legíveis em `src/` e gere a versão otimizada:

```
npm i -D html-minifier-terser@7.2.0
node build.mjs
```

O `build.mjs` só minifica HTML/CSS/JS, embute o CSS no `<head>` e adiciona
conexões antecipadas para Meta e UTMify. Não muda design, textos, imagens nem scripts.

## Trocando uma imagem

As imagens ficam em cache por 1 ano no navegador do visitante. Para trocar uma
imagem, salve o arquivo novo com **outro nome** (ex.: `sample-01-v2.webp`) e
atualize o nome em `src/index.html`; se mantiver o mesmo nome, quem já visitou
continua vendo a antiga.

## Rastreamento

Checkout: Hotmart. Meta Pixel (1791405689657118) com PageView e InitiateCheckout no botão de compra. UTMify (pixel + repasse de UTMs).

Na Vercel, use o preset "Other" e deixe o comando de build vazio.
