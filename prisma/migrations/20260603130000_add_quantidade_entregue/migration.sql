-- AlterTable: adiciona coluna de controle de entrega por unidade
ALTER TABLE `album_itens` ADD COLUMN `quantidade_entregue` INT NOT NULL DEFAULT 0;

-- Backfill: itens já marcados como entregues pelo sistema anterior
-- (entregue_em preenchido = todas as unidades foram entregues de uma vez)
UPDATE `album_itens` SET `quantidade_entregue` = `quantidade` WHERE `entregue_em` IS NOT NULL;
