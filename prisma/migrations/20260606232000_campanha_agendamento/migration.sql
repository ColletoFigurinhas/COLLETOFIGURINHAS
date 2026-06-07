-- Campos de agendamento personalizável por empresa/campanha
ALTER TABLE `campanhas`
  ADD COLUMN `horario_inicio`      VARCHAR(5)   NOT NULL DEFAULT '08:00',
  ADD COLUMN `horario_fim`         VARCHAR(5)   NOT NULL DEFAULT '18:00',
  ADD COLUMN `frequencia_minutos`  INT          NOT NULL DEFAULT 1440,
  ADD COLUMN `dias_semana`         VARCHAR(25)  NOT NULL DEFAULT '[1,2,3,4,5]',
  ADD COLUMN `qtd_cartas_fds`      INT          NOT NULL DEFAULT 5,
  ADD COLUMN `ultima_distribuicao` DATETIME     NULL,
  ADD COLUMN `timezone`            VARCHAR(50)  NOT NULL DEFAULT 'America/Sao_Paulo';
