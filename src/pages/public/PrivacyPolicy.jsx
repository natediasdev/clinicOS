import { Link } from "react-router-dom"

export default function PrivacyPolicy() {
  return (
    <div style={s.page}>
      <div style={s.container}>
        <Link to="/" style={s.back}>← Voltar</Link>

        <h1 style={s.h1}>Política de Privacidade</h1>
        <p style={s.updated}>Última atualização: março de 2026</p>

        <p style={s.lead}>
          A <strong>ClinicOS</strong> ("nós", "nosso") tem compromisso com a privacidade e a proteção
          dos seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
        </p>

        <Section title="1. Quem somos">
          <p>ClinicOS é um software de gestão para clínicas de saúde, com sede em Japeri/RJ, Brasil.</p>
          <p>Encarregado de Dados (DPO): <a href="mailto:nathanzzred@gmail.com" style={s.link}>nathanzzred@gmail.com</a></p>
        </Section>

        <Section title="2. Quais dados coletamos">
          <p>Coletamos apenas os dados necessários para o funcionamento do sistema:</p>
          <ul style={s.ul}>
            <li><strong>Dados da clínica:</strong> nome, telefone, e-mail de contato.</li>
            <li><strong>Dados dos usuários:</strong> nome, e-mail e senha (criptografada).</li>
            <li><strong>Dados dos pacientes:</strong> nome, telefone, e-mail — inseridos pelos próprios operadores da clínica.</li>
            <li><strong>Dados de uso:</strong> agendamentos, registros de atividade no sistema.</li>
          </ul>
        </Section>

        <Section title="3. Como usamos seus dados">
          <ul style={s.ul}>
            <li>Prover e manter o serviço ClinicOS.</li>
            <li>Autenticar usuários e garantir a segurança das contas.</li>
            <li>Enviar notificações relacionadas ao serviço (confirmações, lembretes).</li>
            <li>Melhorar o produto com base em métricas de uso agregadas e anônimas.</li>
          </ul>
          <p>Não vendemos, alugamos ou compartilhamos seus dados com terceiros para fins de marketing.</p>
        </Section>

        <Section title="4. Base legal para o tratamento">
          <ul style={s.ul}>
            <li><strong>Execução de contrato:</strong> para prover o serviço contratado.</li>
            <li><strong>Consentimento:</strong> para envio de comunicações opcionais.</li>
            <li><strong>Legítimo interesse:</strong> para segurança e melhoria do sistema.</li>
          </ul>
        </Section>

        <Section title="5. Armazenamento e segurança">
          <p>
            Os dados são armazenados em servidores seguros da <strong>Supabase</strong> (infraestrutura AWS),
            com criptografia em trânsito (TLS) e em repouso. Aplicamos controles de acesso rigorosos
            por meio de Row Level Security (RLS).
          </p>
        </Section>

        <Section title="6. Por quanto tempo guardamos seus dados">
          <p>
            Mantemos seus dados enquanto sua conta estiver ativa. Após o encerramento,
            os dados são excluídos em até 90 dias, salvo obrigação legal de retenção.
          </p>
        </Section>

        <Section title="7. Seus direitos (LGPD Art. 18)">
          <p>Você tem direito a:</p>
          <ul style={s.ul}>
            <li>Confirmar a existência de tratamento dos seus dados.</li>
            <li>Acessar seus dados.</li>
            <li>Corrigir dados incompletos ou desatualizados.</li>
            <li>Solicitar a exclusão dos seus dados.</li>
            <li>Revogar o consentimento a qualquer momento.</li>
            <li>Portabilidade dos dados.</li>
          </ul>
          <p>Para exercer seus direitos, entre em contato: <a href="mailto:nathanzzred@gmail.com" style={s.link}>nathanzzred@gmail.com</a></p>
        </Section>

        <Section title="8. Cookies">
          <p>
            Usamos apenas cookies essenciais para autenticação e funcionamento do sistema.
            Não utilizamos cookies de rastreamento ou publicidade.
          </p>
        </Section>

        <Section title="9. Alterações nesta política">
          <p>
            Podemos atualizar esta política periodicamente. Notificaremos usuários sobre
            mudanças significativas por e-mail ou aviso no sistema.
          </p>
        </Section>

        <Section title="10. Contato">
          <p>
            Dúvidas sobre esta política? Entre em contato com nosso DPO:<br />
            <a href="mailto:nathanzzred@gmail.com" style={s.link}>nathanzzred@gmail.com</a>
          </p>
        </Section>

        <div style={s.footer}>
          <Link to="/terms" style={s.link}>Termos de Uso</Link>
          {" · "}
          <Link to="/" style={s.link}>Voltar ao início</Link>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9", marginBottom: 12 }}>{title}</h2>
      <div style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8 }}>{children}</div>
    </div>
  )
}

const s = {
  page: {
    minHeight: "100vh",
    background: "#0a1120",
    fontFamily: "'DM Sans','Segoe UI',sans-serif",
    padding: "48px 24px",
  },
  container: {
    maxWidth: 720,
    margin: "0 auto",
  },
  back: {
    color: "#475569",
    textDecoration: "none",
    fontSize: 14,
    display: "inline-block",
    marginBottom: 32,
  },
  h1: {
    fontSize: 36,
    fontWeight: 800,
    color: "#f8fafc",
    letterSpacing: "-0.5px",
    marginBottom: 8,
  },
  updated: {
    fontSize: 13,
    color: "#475569",
    marginBottom: 32,
  },
  lead: {
    fontSize: 16,
    color: "#94a3b8",
    lineHeight: 1.8,
    marginBottom: 40,
    padding: "16px 20px",
    background: "#0f172a",
    borderLeft: "3px solid #3b82f6",
    borderRadius: "0 8px 8px 0",
  },
  ul: {
    paddingLeft: 20,
    margin: "8px 0",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  link: {
    color: "#3b82f6",
    textDecoration: "none",
  },
  footer: {
    marginTop: 48,
    paddingTop: 24,
    borderTop: "1px solid #1e293b",
    fontSize: 13,
    color: "#475569",
    textAlign: "center",
  },
}
