-- AlterTable: adiciona coluna de controle de entrega por unidade (IF NOT EXISTS = idempotente)
ALTER TABLE `album_itens` ADD COLUMN IF NOT EXISTS `quantidade_entregue` INT NOT NULL DEFAULT 0;
ALTER TABLE `album_itens` ADD COLUMN IF NOT EXISTS `entregue_em` DATETIME(3) NULL;
ALTER TABLE `album_itens` ADD COLUMN IF NOT EXISTS `entregue_by` VARCHAR(191) NULL;
