# Campanha Álbum de Figurinhas

> **Documento interno — Marketing & TI**
> Período: 01/06/2026 a 26/06/2026

---

## Visão geral

Cada funcionário recebe um **álbum digital** com uma figurinha representando cada colega. O objetivo é coletar todas as figurinhas e completar o álbum até o dia 26/06/2026. A campanha acontece em um **site exclusivo**, acessível de qualquer lugar fora da rede da empresa.

| Parâmetro | Valor |
|---|---|
| Período | 01/06/2026 a 26/06/2026 |
| Dias úteis | 20 (segunda a sexta) |
| Participantes | ~200 funcionários |
| Figurinhas no álbum | 1 por funcionário ativo |
| Figurinhas por pacote padrão | 14 |
| Cópias de cada figurinha no pool | 280 (14 × 20 dias) |

> **Conceito central:** cada funcionário ativo na campanha **é** uma figurinha. N participantes = N figurinhas no álbum de todos.

---

## Os 3 tipos de pacotinho

| Tipo | Figurinhas normais | Figurinha especial | Prêmio físico | Quando recebe |
|---|---|---|---|---|
| **Padrão** | 14 | ~10% de chance | — | Todo participante, todo dia útil |
| **Plus** | 15 | ~10% de chance | — | Ganhador de ação do dia |
| **Premium** | 15 | ~10% de chance | ✓ | Ganhador de ação especial do dia |

- A figurinha "a mais" do Plus e Premium é uma figurinha **normal** do álbum
- Cada participante recebe **no máximo 1 pacote por dia**
- Pacotes não abertos **acumulam** — é possível abrir vários no mesmo acesso

---

## Figurinhas especiais

- Pool **separado e aberto**: o marketing pode adicionar novas a qualquer momento
- Aparecem aleatoriamente em **qualquer tipo de pacote** (~1 a cada 10 pacotes)
- Têm **página própria** no álbum — não contam para a conclusão do álbum principal
- Entram normalmente no **sistema de trocas**
- Arte: criada pelo marketing → upload feito pelo TI

---

## Pool global — dimensionamento

```
14 stickers/dia × 20 dias = 280 stickers recebidos por pessoa
200 pessoas × 280 = 56.000 stickers totais distribuídos
56.000 ÷ 200 tipos = 280 cópias de cada sticker no pool global

Buffer anti-hoarding: 280 − 200 participantes = 80 cópias de folga por sticker
→ Mesmo que alguém acumule várias cópias, não trava o álbum dos demais
```

O sorteio é **aleatório** — duplicatas são esperadas e fazem parte do mecanismo de trocas.

---

## Rotina diária do marketing

1. Acompanhar ações e resultados do dia
2. Acessar o **back-office** no site da campanha
3. Ir em **Ações do dia** → selecionar a ação → buscar participante por nome ou matrícula
4. Marcar como ganhador e definir o tipo: **Plus** ou **Premium**
5. Para Premium: informar a descrição do prêmio físico (ex.: "Barra de chocolate Lacta 90g")
6. Confirmar **antes do horário de corte**

> ⚠️ Após o horário de corte, não é possível cadastrar ganhadores para aquele dia.
> O sistema gera os pacotes automaticamente à noite.
> **Cada participante pode ganhar no máximo 1 ação por dia** — o sistema bloqueia duplicidades.

---

## Prêmios físicos (pacote Premium)

| Etapa | Responsável |
|---|---|
| Definir e descrever o prêmio ao cadastrar a ação Premium | Marketing |
| Separar fisicamente o prêmio | Marketing |
| Entregar ao participante | Marketing |
| Confirmar entrega no back-office | Marketing |

O sistema notifica o participante sobre o prêmio no momento em que ele abre o pacotinho no site.

---

## Sistema de trocas

A negociação do "o que eu quero" acontece **pessoalmente** entre os colegas. O site apenas executa a troca combinada.

**Fluxo:**

1. Pessoa **A** escolhe qual figurinha quer ofertar (pode ser única ou duplicada)
2. A informa a **matrícula Farol** do colega (Pessoa B)
3. A confirma o envio da proposta
4. B recebe **notificação** no site com a oferta de A
5. B escolhe qual figurinha vai dar em troca e confirma
6. Troca executada — ambos os álbuns são atualizados

**Regras:**
- Sem limite de trocas por dia
- Todas as figurinhas entram (normais e especiais)
- Se A trocar a figurinha com outra pessoa antes de B responder, a proposta é **cancelada automaticamente** com notificação para B
- B pode recusar a proposta a qualquer momento

---

## Entradas e saídas de funcionários

### Novo funcionário entra

1. Marketing cadastra o participante no sistema
2. Uma figurinha dele é criada e **adicionada ao álbum de todos**
3. Ele recebe um pacote de **nivelamento** para chegar no mesmo percentual de conclusão dos demais
4. A partir do dia seguinte, recebe pacotes normalmente

### Funcionário sai da empresa

1. Marketing marca o participante como inativo no sistema
2. A figurinha dele é **removida permanentemente** do álbum de todos
3. Quem já tinha a figurinha: ela **some** do álbum — não existe mais
4. A posição no álbum desaparece e o total de figurinhas diminui em 1
5. Trocas pendentes com esse participante são canceladas automaticamente

---

## A competição

- **Objetivo de todos:** completar o álbum até 26/06
- **Competição:** quem vencer mais ações recebe 1 figurinha extra por dia de ação → chega antes
- Ao completar o álbum, a data e hora são registradas → **ranking de conclusão** visível no site
- A premiação dos primeiros colocados fica a critério do marketing

---

## Gestão das figurinhas (imagens)

| Tarefa | Responsável |
|---|---|
| Criação da arte da figurinha de cada funcionário | Marketing |
| Upload da imagem no sistema | TI |
| Criação de figurinhas especiais (conceito e arte) | Marketing |
| Upload de figurinhas especiais | TI |
| Arte do funcionário que entra mid-campanha | Marketing providencia antes do cadastro |

---

## Resumo das responsabilidades do marketing

| Tarefa | Frequência |
|---|---|
| Cadastrar ganhadores de ações no back-office | Diário (até o horário de corte) |
| Confirmar entrega dos prêmios físicos | Conforme entregas |
| Cadastrar novos participantes | Quando houver entrada |
| Marcar participantes inativos (saída) | Quando houver saída |
| Criar figurinhas especiais e acionar TI para upload | A qualquer momento |
| Acompanhar ranking e conclusões | Diário |
| Comunicar premiação dos primeiros colocados | Ao final da campanha |

---

## Modelo de dados (referência para TI)

```
campanhas
  id, nome, slug, data_inicio, data_fim
  stickers_por_dia_padrao (14), stickers_por_dia_plus (15), stickers_por_dia_premium (15)
  chance_especial (0.10), horario_corte_acoes, status

participantes
  id, campanha_id, matricula (unique), nome, email, foto_url
  data_entrada, data_saida, status (ativo|inativo)
  album_completo_em (nullable), nivelamento_concluido

figurinhas
  id, campanha_id, participante_id (null = especial), tipo (padrao|especial)
  numero_ordem, nome, imagem_url, ativo, desativado_em

album_itens                        ← unique (participante_id, figurinha_id)
  id, participante_id, figurinha_id, quantidade, primeira_vez_em

pacotes
  id, campanha_id, participante_id, tipo (padrao|plus|premium)
  data_referencia, data_disponivel_em, aberto_em
  status (pendente|disponivel|aberto), is_nivelamento

pacote_figurinhas
  id, pacote_id, figurinha_id, revelada (false até abrir)

premios_fisicos                    ← somente pacotes premium
  id, pacote_id (unique), descricao, registrado_por
  notificado_em, entregue_em, observacoes

trocas
  id, campanha_id, solicitante_id, figurinha_ofertada_id
  destinatario_id, figurinha_recebida_id (null até B aceitar)
  status (pendente|aceita|recusada|cancelada_sem_figurinha|cancelada_pelo_solicitante)
  created_at, respondido_em

acoes_campanha
  id, campanha_id, nome, descricao, tipo_pacote_premio (plus|premium)
  data_acao, horario_corte, ativo

ganhadores_acao                    ← unique (acao_id, participante_id)
  id, acao_id, participante_id, registrado_por, data_registro, pacote_id
```

### Regras de integridade

| Evento | Ação no banco |
|---|---|
| Funcionário desligado | `figurinhas.ativo = false` + **DELETE** em `album_itens` para todos + cancela trocas pendentes |
| Novo participante | Cria `figurinhas` + gera pacote `is_nivelamento = true` |
| Abertura de pacote | `album_itens` upsert (quantidade +1 se já existe) + verifica conclusão do álbum |
| Troca aceita | Swap de `album_itens.quantidade` entre os dois participantes |
| Troca expirada | Trigger quando `album_itens.quantidade = 0` para a figurinha ofertada → cancela e notifica B |
