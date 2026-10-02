import { createFileRoute, notFound } from "@tanstack/react-router";
import { MonPage } from "@/components/mon/page";
import { loadSite, Rich, useSite } from "@/lib/site-content";

const CONTACT = { name: "MON PARFUM Experiência Olfativa", cnpj: "43.958.026/0001-50", address: "Shopping Trindade — Rua Lauro Linhares, 2123, sala 603, Torre B — Trindade", city: "Florianópolis/SC — CEP 88036-003", whatsapp: "(48) 98486-5885" };

// Textos-base: revisar com advogado/contador antes de publicar em produção.
const EMPRESA = `${CONTACT.name}, CNPJ ${CONTACT.cnpj}, com sede em ${CONTACT.address}, ${CONTACT.city}`;

const DOCS: Record<string, { titulo: string; secoes: [string, string[]][] }> = {
  privacidade: {
    titulo: "Política de Privacidade",
    secoes: [
      ["Quem somos", [`Este site é operado por ${EMPRESA}, controladora dos dados pessoais tratados aqui, nos termos da Lei Geral de Proteção de Dados (Lei 13.709/2018).`]],
      ["Quais dados coletamos", ["Dados de cadastro e compra: nome, e-mail, telefone, CPF e endereço de entrega.", "Dados de formulários: informações enviadas no quiz, nos pedidos de proposta corporativa, Atelier Privé, contato e newsletter.", "Dados de pagamento são processados diretamente pelos parceiros de pagamento (Mercado Pago e Stripe); não armazenamos números de cartão."]],
      ["Para que usamos", ["Processar pedidos, emitir documentos fiscais e enviar produtos.", "Liberar o acesso a cursos e conteúdos digitais na área do aluno.", "Responder solicitações e, com seu consentimento, enviar conteúdos sobre perfumaria.", "Cumprir obrigações legais e prevenir fraudes."]],
      ["Com quem compartilhamos", ["Meios de pagamento (Mercado Pago, Stripe), transportadoras e plataforma de fretes (Melhor Envio), provedor de e-mail transacional e a plataforma da área do aluno — somente o necessário para cada finalidade."]],
      ["Seus direitos", ["Você pode solicitar acesso, correção, portabilidade ou exclusão dos seus dados, e revogar consentimentos, pelo WhatsApp " + CONTACT.whatsapp + ". Dados exigidos por lei (por exemplo, fiscais) são mantidos pelo prazo legal."]],
      ["Segurança e retenção", ["Adotamos medidas técnicas para proteger seus dados e os mantemos apenas pelo tempo necessário às finalidades acima ou exigido por lei."]],
    ],
  },
  termos: {
    titulo: "Termos de Uso",
    secoes: [
      ["Aceite", [`Ao usar este site e comprar produtos de ${EMPRESA}, você concorda com estes termos.`]],
      ["Cadastro", ["Você é responsável pela veracidade dos dados informados e pela guarda da sua senha."]],
      ["Compras e preços", ["Preços e disponibilidade podem mudar sem aviso, valendo os exibidos no momento da compra. O pedido é confirmado após a aprovação do pagamento."]],
      ["Cursos e conteúdos digitais", ["O acesso é pessoal e intransferível, liberado na área do aluno no e-mail da compra. É proibido compartilhar, gravar ou redistribuir aulas e materiais.", "Os cursos MON são cursos livres, com certificado de conclusão emitido pela MON PARFUM; não se trata de curso credenciado pelo MEC."]],
      ["Propriedade intelectual", ["Textos, marcas, fórmulas, vídeos e materiais são de titularidade da MON PARFUM e não podem ser reproduzidos sem autorização."]],
      ["Contato", [`Dúvidas: WhatsApp ${CONTACT.whatsapp}.`]],
    ],
  },
  trocas: {
    titulo: "Trocas e Devoluções",
    secoes: [
      ["Direito de arrependimento", ["Compras feitas pela internet podem ser canceladas em até 7 (sete) dias corridos a contar do recebimento do produto ou da contratação, conforme o art. 49 do Código de Defesa do Consumidor, com reembolso integral do valor pago, inclusive o frete."]],
      ["Como solicitar", [`Fale com a MON pelo WhatsApp ${CONTACT.whatsapp} informando o número do pedido. Para produtos físicos, enviamos as instruções de devolução; o produto deve retornar sem sinais de uso e com a embalagem original.`]],
      ["Cursos e kits com acesso online", ["No cancelamento dentro do prazo legal, o acesso à área do aluno é encerrado e o kit físico deve ser devolvido."]],
      ["Produto com defeito", ["Produtos com defeito ou avaria no transporte são trocados ou reembolsados. Registre fotos do produto e da embalagem ao receber e fale com a MON em até 30 dias (produtos não duráveis) ou 90 dias (duráveis)."]],
      ["Reembolso", ["O estorno é feito pelo mesmo meio de pagamento. No cartão, o prazo de aparecer na fatura depende da administradora."]],
    ],
  },
  entrega: {
    titulo: "Política de Entrega",
    secoes: [
      ["Onde entregamos", ["Enviamos para todo o Brasil."]],
      ["Prazo e valor do frete", ["O valor e o prazo são calculados no checkout a partir do seu CEP, com as opções de transportadora disponíveis. O prazo começa a contar a partir da confirmação do pagamento e da postagem."]],
      ["Rastreamento", ["Quando o pedido é enviado, você recebe o código de rastreio por e-mail e pode acompanhar em Meus pedidos."]],
      ["Cursos", ["O kit do curso é enviado antes da primeira aula. As inscrições encerram com antecedência para garantir a entrega no prazo."]],
      ["Problemas na entrega", [`Endereço incorreto informado no pedido pode gerar novo frete. Em caso de atraso ou extravio, fale com a MON pelo WhatsApp ${CONTACT.whatsapp}.`]],
    ],
  },
};

export const Route = createFileRoute("/politicas/$doc")({
  loader: async ({ params, context }) => {
    const doc = DOCS[params.doc];
    if (!doc) throw notFound();
    await loadSite(context.queryClient, "politicas");
    return { doc };
  },
  head: ({ loaderData }) => ({ meta: loaderData ? [{ title: `${loaderData.doc.titulo} — MON PARFUM` }] : [] }),
  component: Politica,
});

function Politica() {
  const { doc } = Route.useLoaderData();
  const { doc: slug } = Route.useParams();
  const custom = useSite("politicas").text(slug);
  return (
    <MonPage>
      <div className="m-wrap">
        <section className="m-sec">
          <h1>{doc.titulo}</h1>
          {custom.trim() ? <div style={{ marginTop: "2rem" }}><Rich text={custom} /></div> : <div style={{ marginTop: "2rem" }}>
            {doc.secoes.map(([t, ps]) => (
              <div key={t} style={{ marginTop: "1.8rem" }}>
                <h3>{t}</h3>
                {ps.map((p) => <p key={p} style={{ marginTop: ".5rem" }}>{p}</p>)}
              </div>
            ))}
          </div>}
        </section>
      </div>
    </MonPage>
  );
}
