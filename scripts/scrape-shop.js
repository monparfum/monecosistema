import fs from 'node:fs';

async function fetchShopPage(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
  const html = await res.text();
  
  // Find products in woocommerce loop
  const productRegex = /<li[^>]*class="[^"]*product[^"]*"[\s\S]*?<\/li>/gi;
  const matches = [...html.matchAll(productRegex)];
  
  const products = [];
  for (const m of matches) {
    const itemHtml = m[0];
    
    // Title & link
    const titleMatch = itemHtml.match(/<h[23][^>]*class="[^"]*woocommerce-loop-product__title[^"]*"[^>]*>([\s\S]*?)<\/h[23]>/i) || itemHtml.match(/<a[^>]*class="[^"]*woocommerce-LoopProduct-link[^"]*"[^>]*>[\s\S]*?<h[23][^>]*>([\s\S]*?)<\/h[23]>/i);
    const linkMatch = itemHtml.match(/<a[^>]*href="([^"]*\/produto\/[^"]*\/)"/i);
    
    // Image
    const imgMatch = itemHtml.match(/<img[^>]*src="([^"]+)"[^>]*>/i);
    
    // Badge / Label
    const badgeMatch = itemHtml.match(/<span[^>]*class="[^"]*onsale[^"]*"[^>]*>([\s\S]*?)<\/span>/i) || itemHtml.match(/<span[^>]*class="[^"]*label-[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
    
    // Prices
    const priceDel = itemHtml.match(/<del>[\s\S]*?<bdi>[\s\S]*?([\d.,]+)<\/bdi>[\s\S]*?<\/del>/i);
    const priceIns = itemHtml.match(/<ins>[\s\S]*?<bdi>[\s\S]*?([\d.,]+)<\/bdi>[\s\S]*?<\/ins>/i);
    const priceRegular = itemHtml.match(/<span[^>]*class="[^"]*price[^"]*"[\s\S]*?<bdi>[\s\S]*?([\d.,]+)<\/bdi>/i);

    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    const link = linkMatch ? linkMatch[1] : '';
    const img = imgMatch ? imgMatch[1] : '';
    const badge = badgeMatch ? badgeMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    
    const currentPrice = priceIns ? priceIns[1] : (priceRegular ? priceRegular[1] : '');
    const oldPrice = priceDel ? priceDel[1] : '';

    if (title) {
      products.push({ title, link, img, badge, currentPrice, oldPrice });
    }
  }
  return products;
}

async function run() {
  const page1 = await fetchShopPage('https://experienciamon.com.br/loja/');
  const page2 = await fetchShopPage('https://experienciamon.com.br/loja/page/2/');
  const all = [...page1, ...page2];
  fs.writeFileSync('scripts/loja_products.json', JSON.stringify(all, null, 2));
  console.log(`Found ${all.length} products total across shop pages.`);
}

run();
