# 📘 Planejamento Empresarial — [Nome da Empresa a Definir] & Collêto (Produto)

> **Documento vivo / fonte da verdade.** Tudo que decidirmos sobre o produto, negócio e desenvolvimento mora aqui. Atualizar conforme as decisões evoluem.
>
> Última atualização: **2026-06-22** · Status: **Fase 0 — regras de negócio e escopo da agência definidos**

---

## 1. Visão geral (o novo escopo)

- Nossa **empresa principal** (nome a definir) atua como **prestadora de serviços e agência estratégica**, focada em gerenciar o **endomarketing corporativo** e o **engajamento contínuo** de outras empresas.
- Entramos em organizações que **não têm marketing ativo** ou que precisam de ideias novas, e assumimos a execução de **campanhas mensais e estratégicas**.
- Nesse cenário de prestação de serviço, o **Collêto não é a empresa inteira — é o produto-âncora**.
- O **Collêto** é um álbum de figurinhas **digital e gamificado** onde cada figurinha é uma **pessoa real do grupo**.
- Ele é a **ferramenta de entrada**: serve para "entrar" na empresa do cliente, **mapear o ambiente e o comportamento** dos funcionários e, em seguida, oferecer os **pacotes contínuos de serviços**.

---

## 2. Equipe & papéis

| Pessoa | Foco |
| :--- | :--- |
| **Raul** | Desenvolvimento do produto Collêto e ferramentas internas |
| **Rhuan** | Administração e gestão da agência |
| **Barbara** | Gestão de marketing e planejamento das campanhas mensais |
| **Vitor** | Design do Collêto e materiais das campanhas |
| **Vendedora** | Venda e atendimento (outbound ativo, prospecção B2B) — *fora da equipe principal* |

---

## 3. Produtos & monetização — estratégia "Land-and-Expand"

Operamos no modelo híbrido **Software + Serviço Agregado (SaaS + Agency)**. O **produto digital abre as portas (Land)** e o **serviço contínuo traz o alto faturamento e a recorrência (Expand)**.

### 🎯 Produto de entrada: o Collêto (SaaS / Land)

Produto digital autogerido, para gerar tração rápida e mapear a empresa.

| Nível | Preço (setup) | O que inclui |
| :--- | :--- | :--- |
| **Básico** | R$ 1.497 – R$ 2.500 | Álbum com logo, limite X de funcionários, temperatura *Low*, suporte por email |
| **Médio** | R$ 3.500 – R$ 5.000 | Identidade adaptada, temperatura *Medium/High*, figurinhas brilhantes, métricas ativas |
| **Completo** | R$ 7.000+ | QR Code premiado, integração SSO, foco em grandes corporações |

### 🚀 Core business: campanhas mensais estratégicas (Agency / Expand)

Serviço de prestação contínua de endomarketing. Para escalabilidade da equipe, usamos um **"cardápio pré-moldado"** (kits de onboarding, sazonais, metas).

| Plano | Preço | O que inclui |
| :--- | :--- | :--- |
| **Manutenção** | R$ 497 / mês | Painel do Collêto ativo para o RH usar *Boosts* como premiação contínua |
| **Agência** | R$ 2.500 – R$ 4.000 / mês | Criação, implementação e gestão de **1 campanha estratégica mensal** na empresa do cliente |

---

## 4. Os 3 níveis de acesso (papéis do software)

| Papel | O que faz no Collêto |
| :--- | :--- |
| **Usuário comum** | Acessa o álbum, abre pacotes, coleciona e troca figurinhas |
| **ADM da empresa (RH)** | Controla a própria campanha corporativa (ações, aprovações, métricas) |
| **Super ADM (nossa agência)** | Controla as empresas assinantes, ativa módulos e gerencia a infraestrutura |

---

## 5. Estado atual do desenvolvimento

- ✅ **Álbum funcionando** no protótipo: flip-book 3D, abertura de pacote, trocas, inventário, back-office.
- ✅ **Infraestrutura técnica definida:** Vercel (frontend) + Supabase (backend/auth).
- ⚠️ **É single-tenant** — cravado na campanha inicial. Precisa virar **multi-empresa**.
- 📄 Regras detalhadas do produto: ver `campanha-album-figurinhas.md`.

---

## 6. As 10 frentes (áreas) — tarefas prontas pro Trello

> `[ÉPICO]` = vira um quadro/seção próprio quando entrar em execução.

### 1. 🧭 Agência & Estratégia — *Raul + Rhuan*

- [x] Definir modelo SaaS + Agency (software para atrair, serviço para lucrar)
- [x] Definir os 3 níveis do produto Collêto (Básico / Médio / Completo)
- [x] Definir modelo de cobrança B2B (setup do álbum + MRR mensal de campanhas)
- [ ] Definir **NOME DA NOVA EMPRESA** principal (guarda-chuva do Collêto)
- [ ] Criar mecânicas de segurança B2B: **"Tombamento"** (offboarding de demitidos) e **"Melt"** (reciclagem de repetidas)

### 2. 💻 Dev — App do Álbum (cliente) — *Raul*

- [ ] **[ÉPICO] Multi-tenancy** — isolamento via wildcard subdomains (`*.colletofigurinhas.com.br`)
- [ ] Painel ADM: configurações globais, temperatura e disparos
- [ ] Painel ADM: upload de fotos sem depender de TI (Supabase Storage)
- [ ] Recuperação de senha e emails transacionais (Resend)

### 3. 🛠️ Dev — Nosso Sistema Interno da Agência — *Raul*

- [ ] **[ÉPICO] Back-office** — provisionar nova empresa cliente, gerar subdomínio e ligar campanhas
- [ ] Gestão de faturamento dos planos/serviços

### 4. ☁️ Infraestrutura & DevOps — *Raul*

- [x] Stack cravada: Next.js + Prisma + Supabase (PostgreSQL gerenciado)
- [x] Hospedagem serverless: Vercel
- [x] DNS e roteamento: wildcard subdomains

### 5. 🔒 Segurança — *Raul + Rhuan*

- [ ] Implementar **Row-Level Security (RLS)** no Supabase para isolar 100% as empresas clientes
- [ ] LGPD corporativa: gestão de dados sensíveis e anonimização

### 6. ⚖️ Jurídico

- [ ] Adequação do Termo de Consentimento de Uso de Imagem (1º login)
- [ ] Contratos de prestação de serviço contínuo (agência)

### 7. 📣 Marketing — *Barbara*

- [x] Foco inicial de Ads B2B: Goiânia e polos de saúde/corporativos (Meta Ads hiperlocalizado)
- [ ] Produção de "cases de sucesso" e provas sociais ("antes e depois" do clima)

### 8. 🎨 Design — *Vitor*

- [ ] Branding da nova marca da empresa matriz
- [ ] Portfólio/cardápio de "campanhas mensais estratégicas" para apresentar aos clientes

### 9. 💰 Comercial / Vendas — *Vendedora + Rhuan*

- [ ] Abordagem outbound: foco em diretores, RHs e CEOs via LinkedIn/telefone
- [ ] Pitch: "soluções estratégicas de engajamento" (vender a agência, usar o Collêto como ferramenta)

### 10. 🗂️ Admin / Operação interna — *Rhuan*

- [ ] Padronização de processos da agência e precificação de serviços paralelos

---

## 7. Roadmap por fases

| Fase | Foco | Frentes |
| :--- | :--- | :--- |
| **0 — Agora** | Travar fundamentos | Escopo de agência definido · naming a definir · arquitetura dev travada |
| **1 — Dev fundação** | Base técnica (produto) | Multi-tenancy (RLS Supabase) + domínios customizados (Vercel) |
| **2 — Automação** | Matar o suporte | Painel ADM do cliente + Tombamento de demitidos + relatórios |
| **3 — Escala** | Expansão | Agência operando campanhas mensais e tracionando MRR |

---

## 8. Decisões tomadas

| # | O que foi cravado | Data |
| :--- | :--- | :--- |
| **D1** | Posicionamento de mercado: somos uma **prestadora de serviços (agência)**. O Collêto é o produto tecnológico de entrada. | 2026-06-22 |
| **D2** | **Modelo híbrido B2B:** SaaS (venda do álbum) + Agency (serviço mensal de campanhas). | 2026-06-21 |
| **D3** | **Infraestrutura e segurança:** Vercel + Supabase (RLS p/ isolamento de tenants e wildcards). | 2026-06-22 |
| **D4** | **Tabela de preços B2B:** setup do álbum (R$ 1,5K a 7K) e MRR de campanhas mensais (R$ 2,5K a 4K). | 2026-06-22 |
| **D5** | **Onboarding de participantes:** suportar 3 métodos — cadastro manual, **importação por planilha (CSV/Excel)** e **API** para empresas com sistema próprio. | 2026-06-24 |

---

## 9. Decisões em aberto (a bater)

- [ ] Definir o **nome da empresa principal** (agência prestadora de serviços)
- [ ] Definir o **domínio do produto**: `empresa.colleto.com.br` (mesmo do marketing) vs `empresa.colletofigurinhas.com.br` — afeta `BASE_DOMAIN` e o wildcard no Vercel.

✅ Já entregue no produto: onboarding manual + **importação por planilha (CSV)** · **RLS** (`prisma/rls.sql`) · **aceite de termos** no 1º acesso · **temperatura** da campanha (Low/Medium/High) · **tombamento** (cancela trocas ao desligar) · **email via Resend** · **Ações do dia** (pacote bônus) · abas admin **Pacotes/Prêmios/Relatórios**.

> Execução técnica ainda pendente: **API de participantes** (onboarding D5, p/ empresas com sistema) · termos/contrato jurídicos **reais** (app tem modelo de exemplo) · finalizar deploy no Vercel (domínio wildcard + env vars, incl. `RESEND_API_KEY`) · mecânica **Melt** · enums · baseline de migrations · rate limit distribuído (Upstash) · CSP enforce. Detalhes em `SECURITY.md` e `MIGRACAO_SUPABASE.md`.

---

## 10. Glossário / conceitos

- **Land-and-Expand** — entrar na empresa vendendo o software autogerido (Collêto) para depois escalar vendendo os serviços caros da agência (campanhas mensais).
- **Temperatura da campanha** — nível de "aceleração" do sorteio de figurinhas no Collêto (Low, Medium, High).
- **Multi-tenancy e RLS** — estruturas de banco (Supabase) que garantem que nenhuma empresa cliente consiga vazar ou ver os dados de outra.
- **Wildcard Subdomains** — tecnologia (Vercel) para cada empresa ter sua própria URL (ex.: `cliente.colletofigurinhas.com.br`).
- **Tombamento / Anonimização** — remoção automática da foto/dados de funcionários desligados pelo RH para evitar problemas legais.
- **Melt** — reciclagem de figurinhas repetidas (mecânica de economia interna da campanha).
