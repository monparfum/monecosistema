import fs from 'node:fs';

const urls = [
  "https://experienciamon.com.br/produto/curso-marketing-olfativo-cheiro-emocao-comportamento/",
  "https://experienciamon.com.br/produto/curso-velas-perfumadas-online/",
  "https://experienciamon.com.br/produto/baunilhas-na-perfumaria-da-fava-a-formula/",
  "https://experienciamon.com.br/produto/perfumaria-aspectos-legais-regulatorios/",
  "https://experienciamon.com.br/produto/curso-diluicao-perfumaria-aspectos-praticos/",
  "https://experienciamon.com.br/produto/curso-madeiras-na-perfumaria-criacao-de-acordes-e-composicoes/",
  "https://experienciamon.com.br/produto/kit-sensorial-curiosidades-da-perfumaria/",
  "https://experienciamon.com.br/produto/kit-sensorial-delicias-do-gourmand/"
];

async function parseUrl(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
  const html = await res.text();
  
  // Extract schema ld+json
  const schemaMatches = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  let productSchema = null;
  for (const m of schemaMatches) {
    try {
      const data = JSON.parse(m[1]);
      const graph = data['@graph'] || [data];
      const prod = graph.find(item => item['@type'] === 'Product' || (Array.isArray(item['@type']) && item['@type'].includes('Product')));
      if (prod) productSchema = prod;
    } catch {}
  }

  // Extract price regex if not in schema
  const priceMatch = html.match(/<ins>.*?<bdi>.*?([\d.,]+).*?<\/bdi>.*?<\/ins>/i) || html.match(/class="[^"]*price[^"]*".*?<bdi>.*?([\d.,]+).*?<\/bdi>/i) || html.match(/<bdi><span class="woocommerce-Price-currencySymbol">&#82;?\$?<\/span>&nbsp;?([\d.,]+)<\/bdi>/i);
  
  // Extract regular price (del)
  const regularPriceMatch = html.match(/<del>.*?<bdi>.*?([\d.,]+).*?<\/bdi>.*?<\/del>/i);

  // Extract title
  const titleMatch = html.match(/<h1[^>]*class="[^"]*product_title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i) || html.match(/<title>([\s\S]*?)<\/title>/i);

  // Extract main image
  const imgMatch = html.match(/property="og:image" content="([^"]+)"/i) || html.match(/class="wp-post-image"[^>]*src="([^"]+)"/i);

  // Extract short description / full description
  const shortDescMatch = html.match(/<div class="woocommerce-product-details__short-description">([\s\S]*?)<\/div>/i);
  const descTabMatch = html.match(/id="tab-description"[^>]*>([\s\S]*?)<\/div>/i);

  // Strip html tags
  const clean = (s) => s ? s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';

  return {
    url,
    title: clean(titleMatch ? titleMatch[1] : ''),
    priceSchema: productSchema?.offers?.price || null,
    lowPrice: productSchema?.offers?.lowPrice || null,
    highPrice: productSchema?.offers?.highPrice || null,
    priceHtml: priceMatch ? priceMatch[1] : null,
    regularPriceHtml: regularPriceMatch ? regularPriceMatch[1] : null,
    schemaDescription: productSchema?.description || null,
    shortDescription: clean(shortDescMatch ? shortDescMatch[1] : ''),
    description: clean(descTabMatch ? descTabMatch[1] : ''),
    image: imgMatch ? imgMatch[1] : productSchema?.image || null
  };
}

async function run() {
  const results = [];
  for (const url of urls) {
    try {
      console.log('Fetching', url);
      const data = await parseUrl(url);
      results.push(data);
    } catch (e) {
      console.error('Error fetching', url, e.message);
    }
  }
  fs.writeFileSync('scripts/extracted_products.json', JSON.stringify(results, null, 2));
  console.log('Saved to scripts/extracted_products.json');
}

run();
