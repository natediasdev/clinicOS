import { Link } from "react-router-dom"

export default function TermsOfUse() {
  return (
    <div style={s.page}>
      <div style={s.container}>
        <Link to="/" style={s.back}>← Voltar</Link>

        <h1 style={s.h1}>Termos de Uso</h1>
        <p style={s.updated}>Última atualização: março de 2026</p>

        <p style={s.lead}>
          Ao acessar ou usar o <strong>ClinicOS</strong>, você concorda com estes Termos de Uso.
          Leia com atenção antes de utilizar o serviço.
        </p>

        <Section title="1. Aceitação dos termos">
          <p>
            O uso do ClinicOS implica a aceitação integral destes termos. Caso não concorde,
            não utilize o serviço.
          </p>
        </Section>

        <Section title="2. O serviço">
          <p>
            O ClinicOS é um software de gestão para clínicas de saúde, oferecido como serviço (SaaS),
            que inclui gerenciamento de pacientes, agendamentos, equipe e relatórios.
          </p>
          <p>
            O serviço é fornecido "como está" e podemos modificar, suspender ou encerrar
            funcionalidades a qualquer momento, com aviso prévio quando possível.
          </p>
        </Section>

        <Section title="3. Cadastro e conta">
          <p>
            Para usar o ClinicOS, é necessário criar uma conta com informações verdadeiras e atualizadas.
            Você é responsável pela segurança da sua senha e por todas as atividades realizadas na sua conta.
          </p>
          <p>
            Notifique-nos imediatamente em caso de uso não autorizado da sua conta:
            <a href="mailto:nathanzzred@gmail.com" style={s.link}> nathanzzred@gmail.com</a>
          </p>
        </Section>

        <Section title="4. Uso aceitável">
          <p>Você concorda em não usar o ClinicOS para:</p>
          <ul style={s.ul}>
            <li>Violar leis ou regulamentações aplicáveis.</li>
            <li>Inserir dados falsos ou fraudulentos.</li>
            <li>Tentar acessar dados de outras clínicas.</li>
            <li>Realizar engenharia reversa ou comprometer a segurança do sistema.</li>
            <li>Usar o serviço para fins ilegais ou prejudiciais a terceiros.</li>
          </ul>
        </Section>

        <Section title="5. Dados e privacidade">
          <p>
            Você é responsável pelos dados inseridos no sistema, incluindo dados de pacientes.
            Ao usar o ClinicOS, você declara ter a autorização adequada para tratar esses dados,
            em conformidade com a LGPD.
          </p>
          <p>
            Nossa <Link to="/privacy" style={s.link}>Política de Privacidade</Link> descreve
            como tratamos os dados pessoais.
          </p>
        </Section>

        <Section title="6. Planos e pagamento">
          <p>
            O ClinicOS oferece planos pagos com funcionalidades distintas. Os valores e condições
            são informados no momento da contratação. O não pagamento pode resultar na suspensão
            do acesso ao serviço.
          </p>
        </Section>

        <Section title="7. Propriedade intelectual">
          <p>
            O ClinicOS, incluindo seu código, design e marca, é propriedade exclusiva da ClinicOS.
            Nenhum direito de propriedade intelectual é transferido ao usuário pelo uso do serviço.
          </p>
        </Section>

        <Section title="8. Limitação de responsabilidade">
          <p>
            O ClinicOS não se responsabiliza por perdas de dados decorrentes de uso inadequado,
            falhas de conexão ou eventos fora do nosso controle. Recomendamos manter backups
            das informações críticas.
          </p>
        </Section>

        <Section title="9. Encerramento">
          <p>
            Você pode encerrar sua conta a qualquer momento. Podemos suspender ou encerrar
            contas que violem estes termos, com ou sem aviso prévio dependendo da gravidade.
          </p>
        </Section>

        <Section title="10. Alterações nos termos">
          <p>
            Podemos atualizar estes termos periodicamente. Notificaremos sobre mudanças
            significativas por e-mail ou aviso no sistema. O uso continuado após as alterações
            implica aceitação dos novos termos.
          </p>
        </Section>

        <Section title="11. Lei aplicável">
          <p>
            Estes termos são regidos pelas leis da República Federativa do Brasil.
            Fica eleito o foro da comarca de Japeri/RJ para dirimir quaisquer controvérsias.
          </p>
        </Section>

        <Section title="12. Contato">
          <p>
            Dúvidas sobre estes termos:<br />
            <a href="mailto:nathanzzred@gmail.com" style={s.link}>nathanzzred@gmail.com</a>
          </p>
        </Section>

        <div style={s.footer}>
          <Link to="/privacy" style={s.link}>Política de Privacidade</Link>
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
