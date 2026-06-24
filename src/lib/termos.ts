// ⚠️ MODELO DE EXEMPLO — não é aconselhamento jurídico.
// Revisar e adaptar com o jurídico antes de usar em produção.

export const TERMOS_VERSAO = '1.0-exemplo'

export const TERMOS_TITULO = 'Termos de Uso e Política de Privacidade'

export const TERMOS_AVISO =
  'Modelo de exemplo, sujeito a revisão jurídica. Ao continuar, você declara que leu e concorda integralmente com os termos abaixo.'

export type SecaoTermo = { titulo: string; paragrafos: string[] }

export const TERMOS_SECOES: SecaoTermo[] = [
  {
    titulo: '1. Aceitação dos Termos',
    paragrafos: [
      'Estes Termos de Uso e Política de Privacidade ("Termos") regulam o acesso e a utilização da plataforma de álbum de figurinhas gamificado ("Plataforma"), oferecida pela Collêto ("nós") à empresa contratante e aos seus participantes ("você").',
      'Ao realizar o primeiro acesso, criar conta ou utilizar a Plataforma, você confirma que leu, compreendeu e concorda com estes Termos. Caso não concorde, não utilize a Plataforma.',
    ],
  },
  {
    titulo: '2. O que é a Plataforma',
    paragrafos: [
      'A Plataforma é uma campanha de engajamento na qual cada participante é representado por uma figurinha (imagem) dentro de um álbum digital. Os participantes recebem pacotes, abrem figurinhas, colecionam, trocam repetidas e buscam completar o álbum.',
      'A campanha é configurada e operada pela empresa contratante (por meio de seu administrador), que define participantes, figurinhas, períodos e regras de distribuição.',
    ],
  },
  {
    titulo: '3. Cadastro, Conta e Acesso',
    paragrafos: [
      'O acesso é individual e vinculado a uma matrícula/identificador fornecido pela empresa. Você é responsável por manter a confidencialidade da sua senha e por todas as atividades realizadas em sua conta.',
      'Você se compromete a fornecer informações verdadeiras e a comunicar imediatamente qualquer uso não autorizado da sua conta.',
    ],
  },
  {
    titulo: '4. Uso de Imagem e Dados Pessoais (LGPD)',
    paragrafos: [
      'A Plataforma trata dados pessoais (como nome, matrícula, e-mail e fotografia) com a finalidade exclusiva de operar a campanha de engajamento, em conformidade com a Lei nº 13.709/2018 (LGPD).',
      'O participante autoriza o uso da sua imagem (foto) na forma de figurinha dentro da campanha, restrita ao ambiente da Plataforma e ao grupo da própria empresa, pelo período de duração da campanha.',
      'Os dados não são vendidos a terceiros. O tratamento se dá com base no legítimo interesse e/ou consentimento, conforme aplicável, e nas instruções da empresa contratante, que atua como controladora dos dados dos seus participantes.',
      'Você pode, a qualquer momento, solicitar acesso, correção ou exclusão dos seus dados pelos canais disponibilizados na Plataforma e pela empresa.',
    ],
  },
  {
    titulo: '5. Responsabilidades do Participante',
    paragrafos: [
      'Utilizar a Plataforma de forma ética, respeitosa e de acordo com a finalidade da campanha.',
      'Não capturar, reproduzir, distribuir ou divulgar fora da Plataforma as imagens de colegas (incluindo prints), sem autorização expressa.',
      'Não tentar burlar mecânicas, automatizar acessos ou explorar falhas do sistema.',
    ],
  },
  {
    titulo: '6. Responsabilidades da Empresa e do Administrador',
    paragrafos: [
      'O administrador da empresa declara ter obtido as autorizações necessárias dos participantes para o uso de suas imagens e dados na campanha, sendo responsável pela base legal aplicável.',
      'O administrador é responsável pela correta configuração da campanha, pelo cadastro e descadastro de participantes e pelo uso adequado das ferramentas administrativas.',
      'A empresa é a controladora dos dados pessoais dos seus participantes; a Collêto atua como operadora, tratando os dados conforme as instruções da empresa e estes Termos.',
    ],
  },
  {
    titulo: '7. Conduta Proibida',
    paragrafos: [
      'É vedado usar a Plataforma para fins ilícitos, ofensivos, discriminatórios ou que violem direitos de terceiros.',
      'É proibido tentar acessar áreas, dados ou contas de outras empresas ou participantes sem autorização.',
    ],
  },
  {
    titulo: '8. Propriedade Intelectual',
    paragrafos: [
      'A Plataforma, sua marca, código, layout e funcionalidades são de titularidade da Collêto e protegidos por lei. O uso da Plataforma não transfere quaisquer direitos de propriedade intelectual.',
    ],
  },
  {
    titulo: '9. Segurança da Informação',
    paragrafos: [
      'Adotamos medidas técnicas e organizacionais para proteger os dados, incluindo controle de acesso, isolamento por empresa e criptografia em trânsito.',
      'Nenhum sistema é totalmente imune a incidentes. Em caso de incidente de segurança relevante, agiremos conforme a legislação aplicável.',
    ],
  },
  {
    titulo: '10. Encerramento, Inatividade e Exclusão',
    paragrafos: [
      'Em caso de desligamento do participante da empresa, sua figurinha e seus dados pessoais poderão ser removidos ou anonimizados da campanha.',
      'Ao término da campanha, os dados poderão ser excluídos ou anonimizados, ressalvadas as hipóteses de guarda exigidas por lei.',
    ],
  },
  {
    titulo: '11. Limitação de Responsabilidade',
    paragrafos: [
      'A Plataforma é fornecida "no estado em que se encontra". Na máxima extensão permitida em lei, não nos responsabilizamos por indisponibilidades temporárias, perdas de dados decorrentes de uso indevido ou por danos indiretos.',
    ],
  },
  {
    titulo: '12. Alterações nestes Termos',
    paragrafos: [
      'Podemos atualizar estes Termos a qualquer momento. Alterações relevantes poderão exigir novo aceite. A versão vigente estará sempre disponível na Plataforma.',
    ],
  },
  {
    titulo: '13. Lei Aplicável e Foro',
    paragrafos: [
      'Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca da sede da empresa contratante para dirimir eventuais controvérsias, salvo disposição legal em contrário.',
    ],
  },
  {
    titulo: '14. Contato',
    paragrafos: [
      'Dúvidas sobre estes Termos ou sobre o tratamento de dados podem ser encaminhadas ao administrador da sua empresa ou aos canais de suporte indicados na Plataforma.',
    ],
  },
]
