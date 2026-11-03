import { Link } from "@tanstack/react-router";
import { Honeypot, useLeadForm, WhatsAppFloat } from "@/components/mon/ui";
import { lines, useSite, waLink } from "@/lib/site-content";

export function SiteFooter() {
  const news = useLeadForm("newsletter");
  const g = useSite("geral");
  const redes = [["Instagram", g.text("instagram")], ["YouTube", g.text("youtube")], ["TikTok", g.text("tiktok")]].filter(([, url]) => url);
  return (
    <>
      <footer className="mon m-footer">
        <div className="m-wrap">
          <Link to="/" aria-label="MON PARFUM — início" style={{ display: "inline-block", marginBottom: "2.5rem", padding: 0 }}>
            <img src="/logo-mon-branco.png" alt="MON Parfum" width={707} height={418} style={{ height: 56, width: "auto", display: "block" }} />
          </Link>
          <div className="m-fcols">
            <div>
              <h4>Formação</h4>
              <Link to="/cursos">Todos os cursos</Link>
              <Link to="/quiz">Quiz Olfativo</Link>
              <Link to="/mon-club">MON Club</Link>
            </div>
            <div>
              <h4>Produtos</h4>
              <Link to="/produtos">Todos os produtos</Link>
              <Link to="/experiencias">Kits MON</Link>
              <Link to="/atelier-prive">Atelier Privé</Link>
              <Link to="/corporativo">Corporativo</Link>
            </div>
            <div>
              <h4>Conteúdos</h4>
              <Link to="/noticias">Notícias</Link>
              <Link to="/blog">Blog</Link>
              <Link to="/conteudos">Perguntas frequentes</Link>
            </div>
            <div>
              <h4>Institucional</h4>
              <Link to="/sobre">Sobre a MON</Link>
              <Link to="/conteudos" hash="contato">Contato</Link>
              <Link to="/pedidos">Minha conta</Link>
            </div>
            <div className="m-news">
              <h4>{g.text("news_titulo")}</h4>
              <p>{g.text("news_texto")}</p>
              {news.sent ? (
                <p style={{ color: "#E0D8CE" }}>Pronto! Você vai receber nossos conteúdos.</p>
              ) : (
                <form onSubmit={(e) => news.submit(e, { origem: "rodape" })} style={{ position: "relative" }}>
                  <Honeypot />
                  <input type="email" name="email" required placeholder="Seu e-mail" aria-label="Seu e-mail" maxLength={200} />
                  <button className="m-btn sm brass" disabled={news.sending}>Quero receber</button>
                </form>
              )}
            </div>
          </div>
          <div className="m-nap">
            <b>{g.text("empresa")}</b><br />
            {g.text("endereco")} · {g.text("cidade")}<br />
            CNPJ: {g.text("cnpj")} · WhatsApp: <a href={waLink(g.text("whatsapp_numero"))} target="_blank" rel="noopener noreferrer">{g.text("whatsapp")}</a>
            {g.text("email") && <> · E-mail: <a href={`mailto:${g.text("email")}`}>{g.text("email")}</a></>}<br />
            {lines(g.text("horarios")).filter((h) => !/fechado/i.test(h)).join(" · ")}<br /><br />
            <Link to="/politicas/$doc" params={{ doc: "privacidade" }}>Política de Privacidade</Link> · <Link to="/politicas/$doc" params={{ doc: "termos" }}>Termos de Uso</Link> · <Link to="/politicas/$doc" params={{ doc: "trocas" }}>Trocas e Devoluções</Link> · <Link to="/politicas/$doc" params={{ doc: "entrega" }}>Política de Entrega</Link><br />
            {redes.length > 0 && <>{redes.map(([n, url], i) => <span key={n}>{i > 0 && " · "}<a href={url} target="_blank" rel="noopener noreferrer">{n}</a></span>)}<br /></>}
            <br />© {new Date().getFullYear()} {g.text("empresa")}. Todos os direitos reservados.
          </div>
        </div>
      </footer>
      <WhatsAppFloat />
    </>
  );
}
