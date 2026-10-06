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

async function inspectPrices() {
  for (const url of urls) {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    const prices = [];
    const priceBlocks = html.match(/class="[^"]*price[^"]*"[\s\S]{1,500}?<\/p>/gi) || [];
    for (const b of priceBlocks) {
      prices.push(b.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    }
    const gtmMatch = html.match(/"price":\s*"?([\d.]+)"?/);
    const woocMatch = html.match(/"price_cents":\s*(\d+)/);
    const wcPriceMatch = [...html.matchAll(/woocommerce-Price-amount amount[^>]*>([\s\S]*?)<\/span>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim());

    console.log('--- URL:', url.split('/').filter(Boolean).pop());
    console.log('Price blocks:', prices.slice(0, 3));
    console.log('WC Amounts:', wcPriceMatch);
    if (gtmMatch) console.log('GTM price:', gtmMatch[1]);
  }
}

inspectPrices();
