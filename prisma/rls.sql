-- Row-Level Security (RLS) — 2ª barreira de isolamento.
--
-- Por que: o app conecta via Prisma com o role `postgres` (BYPASSRLS), então
-- estas políticas NÃO afetam o app. Elas bloqueiam qualquer acesso pelos roles
-- públicos do Supabase (anon / authenticated, usados pela Data API/PostgREST).
-- Como a Data API está desligada, isto é defesa em profundidade.
--
-- ⚠️ RLS é gerenciada FORA do Prisma. Se uma tabela for recriada (drop/create),
-- reaplique este arquivo:  psql "$DIRECT_URL" -f prisma/rls.sql
-- (ou rode o equivalente). `prisma db push` aditivo preserva a RLS existente.

ALTER TABLE colleto_empresas                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE colleto_super_admins             ENABLE ROW LEVEL SECURITY;
ALTER TABLE colleto_participantes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE colleto_campanhas                ENABLE ROW LEVEL SECURITY;
ALTER TABLE colleto_figurinhas               ENABLE ROW LEVEL SECURITY;
ALTER TABLE colleto_album_itens              ENABLE ROW LEVEL SECURITY;
ALTER TABLE colleto_pacotes                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE colleto_pacote_figurinhas        ENABLE ROW LEVEL SECURITY;
ALTER TABLE colleto_premios_fisicos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE colleto_trocas                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE colleto_acoes_campanha           ENABLE ROW LEVEL SECURITY;
ALTER TABLE colleto_logs_distribuicao_manual ENABLE ROW LEVEL SECURITY;
ALTER TABLE colleto_ganhadores_acao          ENABLE ROW LEVEL SECURITY;
